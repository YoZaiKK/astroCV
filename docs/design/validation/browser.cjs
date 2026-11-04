// Uses an existing Playwright installation; adds no project dependencies.
// PLAYWRIGHT_PATH and BASE_URL can point to another installation/server.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/memoc/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://localhost:4321';
const out = __dirname;
const report = { date: new Date().toISOString(), browser: '', matrix: [], checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(report, null, 2));
const settle = page => page.waitForTimeout(300);
async function ready(page, route = '/') {
  await page.goto(base + route);
  await page.locator('mini-kanban .mk-task').first().waitFor();
  await page.locator('[data-play]:enabled').waitFor({ state: 'attached' });
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none; }' });
  await settle(page);
}
async function controls(page) {
  const menu = page.locator('.menu-button');
  if (await menu.isVisible() && await menu.getAttribute('aria-expanded') !== 'true') await menu.click();
}
async function themeState(page) {
  return page.evaluate(() => ({ theme: document.documentElement.dataset.theme, mode: document.documentElement.dataset.themeMode, checked: document.querySelector('[data-theme-toggle]').getAttribute('aria-checked'), auto: document.querySelector('[data-theme-auto]').checked }));
}
async function expectTheme(page, theme, mode = theme) {
  assert.deepEqual(await themeState(page), { theme, mode, checked: String(theme === 'dark'), auto: mode === 'system' });
}
async function layout(page) {
  return page.evaluate(() => {
    const visible = el => el.getBoundingClientRect().width && el.getBoundingClientRect().height && getComputedStyle(el).visibility !== 'hidden';
    const outside = [...document.querySelectorAll('body *')].filter(el => visible(el) && !el.closest('astro-dev-toolbar') && !el.classList.contains('sr-only') && !el.classList.contains('skip-link')).filter(el => {
      const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1;
    }).map(el => `${el.tagName}.${el.className}`).slice(0, 12);
    const clock = document.querySelector('.analog-clock').getBoundingClientRect();
    const clippedHeadings = [...document.querySelectorAll('h1,h2,h3,h4')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent);
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, outside, h1: document.querySelectorAll('h1').length, clippedHeadings, clockRatio: clock.width / clock.height };
  });
}
async function contrast(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const parse = color => { ctx.clearRect(0,0,1,1); ctx.fillStyle = color; ctx.fillRect(0,0,1,1); return [...ctx.getImageData(0,0,1,1).data].map((c,i) => i === 3 ? c / 255 : c); };
    const over = (fg,bg) => [0,1,2].map(i => fg[i]*fg[3] + bg[i]*(1-fg[3])).concat(1);
    const luminance = rgb => rgb.slice(0,3).map(c => { c/=255; return c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4; }).reduce((a,c,i) => a + c * [0.2126,0.7152,0.0722][i],0);
    const ratio = (a,b) => { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
    const background = el => { const layers=[]; for(let node=el;node;node=node.parentElement) layers.push(parse(getComputedStyle(node).backgroundColor)); return layers.reverse().reduce((bg,fg)=>over(fg,bg),[255,255,255,1]); };
    const failures=[]; let count=0,min=100;
    for(const el of document.querySelectorAll('body *')) {
      if(el.closest('astro-dev-toolbar, svg, .sr-only, :disabled') || ![...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim())) continue;
      const style=getComputedStyle(el),rect=el.getBoundingClientRect();
      if(!rect.width || !rect.height || style.visibility==='hidden' || Number(style.opacity)<1) continue;
      const bg=background(el),fg=over(parse(style.color),bg),value=ratio(fg,bg);
      const large=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && Number(style.fontWeight)>=700);
      const required=large?3:4.5;
      count++; min=Math.min(min,value);
      if(value+0.01<required) failures.push({ element:el.tagName+'.'+el.className,text:el.textContent.trim().slice(0,75),ratio:+value.toFixed(2),required,color:style.color,background:bg });
    }
    const root=getComputedStyle(document.documentElement);
    const tokens=Object.fromEntries(['--color-ink','--color-muted','--color-accent','--color-accent-dark','--color-on-accent','--color-focus','--color-control-border','--color-danger','--color-success'].map(token=>[token,root.getPropertyValue(token).trim()]));
    const surfaces=['--color-surface','--color-panel','--color-selected'].map(token=>root.getPropertyValue(token).trim());
    const controls={};
    for(const token of ['--color-focus','--color-control-border','--color-danger','--color-success']) controls[token]=surfaces.map(bg=>+ratio(parse(tokens[token]),parse(bg)).toFixed(2));
    return { count,min:+min.toFixed(2),failures,tokens,controls,accentText:+ratio(parse(tokens['--color-on-accent']),parse(tokens['--color-accent'])).toFixed(2),hoverText:+ratio(parse(tokens['--color-on-accent']),parse(tokens['--color-accent-dark'])).toFixed(2) };
  });
}
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, pass:true, detail }); console.log('PASS',name); }
  catch(error) { report.checks.push({ name, pass:false, error:error.stack }); console.log('FAIL',name,error.message); }
  save();
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  report.browser = browser.version();
  try {
    for(const locale of ['en','es']) for(const theme of ['light','dark']) {
      const context=await browser.newContext({ colorScheme:theme });
      await context.addInitScript(theme=>{ if(!localStorage.getItem('theme')) localStorage.setItem('theme',theme); },theme);
      const page=await context.newPage();
      page.on('pageerror',e=>report.errors.push(e.message));
      await ready(page,locale==='es'?'/es/':'/');
      for(const width of [360,390,768,1024,1440]) {
        await page.setViewportSize({width,height:1000}); await settle(page);
        await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
        const data=await layout(page); report.matrix.push({locale,theme,...data});
        assert.equal(data.scrollWidth,width); assert.equal(data.outside.length,0); assert.equal(data.h1,1); assert.equal(data.clippedHeadings.length,0); assert.ok(Math.abs(data.clockRatio-1)<0.01);
        await controls(page);
        await page.locator('[role="combobox"]').click(); await settle(page);
        const open=await layout(page); assert.equal(open.scrollWidth,width); assert.equal(open.outside.length,0);
        if(width===390 || width===1440) await page.screenshot({path:path.join(out,`${locale}-${theme}-${width}-controls.png`)});
        await page.locator('[role="combobox"]').press('Escape');
        if(await page.locator('.menu-button').isVisible()) await page.locator('.menu-button').click();
        await page.evaluate(()=>document.activeElement?.blur());
        if(width===390 || width===1440) {
          await page.evaluate(()=>scrollTo({top:0,behavior:'instant'})); await settle(page);
          await page.screenshot({path:path.join(out,`${locale}-${theme}-${width}-full.png`),fullPage:true});
          await page.locator('#projects').screenshot({path:path.join(out,`${locale}-${theme}-${width}-lab.png`),style:'.site-header { position: static; } .skip-link { visibility: hidden; }'});
          for(const section of ['about','experience','skills','education','contact']) {
            await page.locator(`#${section}`).screenshot({path:path.join(out,`${locale}-${theme}-${width}-${section}.png`),style:'.site-header { position: static; } .skip-link { visibility: hidden; }'});
          }
        }
      }
      await check(`${locale}/${theme}: text and control contrast`,async()=> {
        const data=await contrast(page); fs.writeFileSync(path.join(out,`${locale}-${theme}-contrast.json`),JSON.stringify(data,null,2));
        assert.deepEqual(data.failures,[]); assert.ok(data.accentText>=4.5 && data.hoverText>=4.5);
        assert.ok(data.controls['--color-focus'].every(r=>r>=3)); assert.ok(data.controls['--color-control-border'].every(r=>r>=3));
        return data;
      });
      await check(`${locale}/${theme}: tooltips, hover and keyboard focus`,async()=> {
        for(const card of ['conways-life','world-clock','mini-kanban']) {
          const info=page.locator(`${card} .lab-card-action`).first();
          await info.focus();
          const style=await info.evaluate(el=>({tooltip:getComputedStyle(el,'::after').visibility,outline:getComputedStyle(el).outlineStyle}));
          assert.equal(style.tooltip,'visible'); assert.equal(style.outline,'solid');
          await info.hover(); assert.equal((await layout(page)).scrollWidth,1440);
        }
        return 'Focus outline and visible tooltip on all three widgets; no horizontal overflow.';
      });
      await check(`${locale}/${theme}: dropdown, hover and error contrast`,async()=> {
        await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
        await page.locator('[role="combobox"]').click();
        await page.locator('[role="combobox"]').press('End');
        assert.deepEqual((await contrast(page)).failures,[]);
        await page.locator('[role="combobox"]').press('Escape');
        for(const selector of ['.hero .button','.hero .button-secondary','.mk-button--primary','.mk-icon-button--danger']) {
          await page.locator(selector).first().hover();await settle(page);assert.deepEqual((await contrast(page)).failures,[]);
        }
        const input=page.locator('[name="title"]');await input.fill('   ');await page.locator('.mk-form button').click();
        assert.ok(await input.evaluate(el=>!el.validity.valid && getComputedStyle(el).borderStyle==='dashed'));
        assert.deepEqual((await contrast(page)).failures,[]);await input.fill('');
        return 'No text contrast failures in open/active dropdown, primary and secondary hover, delete hover and invalid input state.';
      });
      if(theme==='dark') await check(`${locale}: flat dark surfaces including floating dropdown and pseudo elements`,async()=> {
        const shadows=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>!el.closest('astro-dev-toolbar')).flatMap(el=>['','::before','::after'].filter(pseudo=>getComputedStyle(el,pseudo||null).boxShadow!=='none').map(pseudo=>el.tagName+'.'+el.className+pseudo)));
        assert.deepEqual(shadows,[]);return 'No computed box shadows on elements or pseudo elements.';
      });
      await check(`${locale}/${theme}: reduced motion`,async()=> {
        await page.emulateMedia({reducedMotion:'reduce'});
        const data=await page.evaluate(()=>({scroll:getComputedStyle(document.documentElement).scrollBehavior,duration:getComputedStyle(document.documentElement).getPropertyValue('--motion-duration').trim(),thumb:getComputedStyle(document.querySelector('.theme-switch-thumb')).transitionDuration}));
        assert.equal(data.scroll,'auto'); assert.equal(parseFloat(data.duration),0); assert.equal(data.thumb,'0s'); return data;
      });
      await check(`${locale}/${theme}: 200% layout reflow`,async()=> {
        // Browser zoom at 200% on a 1440px display yields a 720 CSS-pixel viewport.
        await page.setViewportSize({width:720,height:500}); const data=await layout(page);
        assert.equal(data.scrollWidth,720); assert.equal(data.clippedHeadings.length,0); await controls(page);
        assert.equal((await layout(page)).scrollWidth,720); return {...data,method:'720 CSS px: layout equivalent of 1440px at 200%; browser chrome zoom not automated'};
      });
      await check(`${locale}/${theme}: print`,async()=> {
        await page.emulateMedia({media:'print'});
        const data=await page.evaluate(()=>({background:getComputedStyle(document.documentElement).backgroundColor,ink:getComputedStyle(document.documentElement).color,headerPosition:getComputedStyle(document.querySelector('.site-header')).position,nav:getComputedStyle(document.querySelector('nav')).display}));
        assert.equal(data.background,'rgb(255, 255, 255)'); assert.equal(data.ink,'rgb(23, 32, 51)'); assert.equal(data.nav,'none');
        await page.pdf({path:path.join(out,`${locale}-${theme}-print.pdf`),format:'A4',printBackground:true}); return data;
      });
      await context.close(); save();
    }
    for(const locale of ['en','es']) await check(`${locale}: JavaScript disabled`,async()=> {
      const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844},colorScheme:'dark'});
      const page=await context.newPage(); await page.goto(base+(locale==='es'?'/es/':'/'));
      assert.equal(await page.locator('html').getAttribute('data-theme'),null);
      assert.equal(await page.locator('[data-theme-toggle]').isDisabled(),true);
      assert.equal(await page.locator('[data-email]').isDisabled(),true);
      assert.equal(await page.locator('.mk-form').isVisible(),false);
      assert.equal(await page.locator('.menu-button').isVisible(),false);
      assert.equal(await page.locator('.language-fallback a').count(),2);
      const data=await layout(page); assert.equal(data.scrollWidth,390); assert.deepEqual(data.outside,[]);
      await page.screenshot({path:path.join(out,`${locale}-no-js.png`),fullPage:true}); await context.close(); return data;
    });
  } finally { save(); await browser.close(); }
  if(report.checks.some(c=>!c.pass) || report.errors.length) process.exitCode=1;
})().catch(error=>{report.errors.push(error.stack);save();console.error(error);process.exitCode=1;});
