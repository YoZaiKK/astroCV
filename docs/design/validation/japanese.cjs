// npm run build && node docs/design/validation/run.cjs japanese.cjs
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/memoc/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://localhost:4321';
const report = { date:new Date().toISOString(), checks:[], matrix:[], errors:[] };
const dictionaries = Object.fromEntries(['en','es','ja'].map(locale=>[locale,require(`../../../src/data/${locale}.json`)]));
const output = path.join(__dirname,'japanese');
fs.mkdirSync(output,{recursive:true});
const route = locale => locale==='en'?'/':`/${locale}/`;
const save = () => fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
async function check(name,fn) {
  try { report.checks.push({name,pass:true,detail:await fn()});console.log('PASS',name); }
  catch(error) { report.checks.push({name,pass:false,error:error.stack});console.log('FAIL',name,error.message); }
  save();
}
async function ready(page,locale) {
  const response=await page.goto(base+route(locale));assert.equal(response.status(),200);
  await page.locator('[data-play]:enabled').waitFor({state:'attached'});
  await page.locator('mini-kanban .mk-task').first().waitFor();
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
}
async function menu(page) {
  const button=page.locator('.menu-button');
  if(await button.isVisible() && await button.getAttribute('aria-expanded')!=='true') await button.click();
}
async function closeMenu(page) {
  const button=page.locator('.menu-button');
  if(await button.isVisible() && await button.getAttribute('aria-expanded')==='true') await button.click();
}
async function select(page,locale) {
  await menu(page);const picker=page.locator('[role="combobox"]');
  await picker.press('Enter');await picker.press('Home');
  for(let index=0;index<['en','es','ja'].indexOf(locale);index++) await picker.press('ArrowDown');
  await Promise.all([page.waitForURL(url=>url.pathname===route(locale)&&url.hash==='#projects'),picker.press('Enter')]);
  await page.locator('mini-kanban .mk-task').first().waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),locale);
}
async function layout(page) {
  return page.evaluate(()=>({
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    h1:document.querySelectorAll('h1').length,
    clipped:[...document.querySelectorAll('h1,h2,h3,h4,button,.language-trigger')].filter(el=>el.getBoundingClientRect().width&&el.scrollWidth>el.clientWidth+2).map(el=>el.className+': '+el.textContent.trim().slice(0,60)),
    clockRatio:document.querySelector('.analog-clock').getBoundingClientRect().width/document.querySelector('.analog-clock').getBoundingClientRect().height,
  }));
}
(async()=>{
  const browser=await chromium.launch({channel:'chrome'});
  try {
    for(const locale of ['en','es','ja']) for(const theme of ['light','dark']) {
      const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:theme,permissions:['clipboard-read','clipboard-write'],storageState:{cookies:[],origins:[{origin:base,localStorage:[{name:'theme',value:theme}]}]}});
      const page=await context.newPage();page.on('pageerror',error=>report.errors.push({locale,theme,error:error.stack}));
      await ready(page,locale);const messages=dictionaries[locale];
      await check(`${locale}/${theme}: translated page, metadata, widgets and dates`,async()=>{
        assert.equal(await page.locator('html').getAttribute('lang'),locale);
        assert.equal(await page.locator('#about-title').textContent(),messages.about.title);
        assert.equal(await page.locator('#projects-title').textContent(),messages.lab.title);
        assert.equal(await page.locator('.life-header h3').textContent(),messages.lab.conway.title);
        assert.equal(await page.locator('[data-play-label]').textContent(),messages.lab.conway.play);
        assert.equal(await page.locator('.mk-title').textContent(),messages.lab.kanban.title);
        assert.equal(await page.locator('[data-task-id="sample-layout"] [data-task-title]').textContent(),messages.lab.kanban.samples.layout);
        assert.equal(await page.locator('[data-column="todo"] h4').textContent(),messages.lab.kanban.columns.todo);
        assert.equal(await page.locator('.clock-controls [data-timezone="Asia/Tokyo"]').textContent(),messages.clock.tokyo);
        assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),messages.meta.homeDescription);
        assert.ok((await page.title()).includes(messages.meta.homeTitle.split(' | ')[1]));
        const expectedDate=new Intl.DateTimeFormat(locale,{month:'short',year:'numeric'}).format(new Date('2024-09-01T00:00:00'));
        assert.ok((await page.locator('.experience-meta p').first().textContent()).startsWith(expectedDate));
        assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
      });
      await check(`${locale}/${theme}: responsive layout and three-option dropdown`,async()=>{
        for(const width of [360,390,768,1024,1440]) {
          await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
          const data=await layout(page);report.matrix.push({locale,theme,...data});
          assert.equal(data.scrollWidth,width);assert.equal(data.h1,1);assert.deepEqual(data.clipped,[]);assert.ok(Math.abs(data.clockRatio-1)<0.01);
          await menu(page);await page.locator('[role="combobox"]').press('Enter');
          assert.equal(await page.locator('[role="option"]').count(),3);
          assert.equal(await page.locator('[role="option"][aria-selected="true"]').getAttribute('data-locale'),locale);
          await page.locator('[role="combobox"]').press('End');assert.equal(await page.locator('[role="option"][data-active="true"]').getAttribute('data-locale'),'ja');
          assert.equal((await layout(page)).scrollWidth,width);await page.locator('[role="combobox"]').press('Escape');await closeMenu(page);
          await page.evaluate(()=>document.activeElement?.blur());
          if(locale==='ja' && [390,1440].includes(width)) {
            await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);
            await page.screenshot({path:path.join(output,`ja-${theme}-${width}-home.png`)});
            await page.locator('#projects').screenshot({path:path.join(output,`ja-${theme}-${width}-lab.png`),style:'.site-header{position:static}.skip-link{visibility:hidden}'});
          }
        }
      });
      await check(`${locale}/${theme}: Conway translated runtime, cells, simulation and resizing`,async()=>{
        await page.locator('[data-clear]').click();assert.equal(await page.locator('[data-pattern]').textContent(),messages.lab.conway.empty);
        await page.locator('[data-play]').click();assert.equal(await page.locator('[data-status]').textContent(),messages.lab.conway.emptyPlay);
        for(const column of [4,5,6]) await page.locator(`.life-cell[data-row="5"][data-column="${column}"]`).click();
        assert.equal(await page.locator('[data-pattern]').textContent(),messages.lab.conway.custom);
        await page.locator('[data-play]').click();await page.waitForFunction(()=>Number(document.querySelector('[data-generation]').textContent)>0);
        assert.equal(await page.locator('[data-play-label]').textContent(),messages.lab.conway.pause);
        assert.equal(await page.locator('[data-play]').getAttribute('aria-label'),messages.lab.conway.pauseLabel);
        await page.locator('[data-play]').click();assert.equal(await page.locator('[data-status]').textContent(),messages.lab.conway.paused);
        await page.locator('[data-size]').click();assert.equal(await page.locator('.life-cell').count(),900);
        assert.equal(await page.locator('.life-cell').first().getAttribute('aria-label'),messages.lab.conway.cellLabel.replace('{{row}}','1').replace('{{column}}','1'));
        assert.ok(!(await page.locator('[data-status]').textContent()).includes('{{'));
        await page.locator('[data-random]').click();await page.locator('[data-reset]').click();
      });
      await check(`${locale}/${theme}: Kanban Japanese input, errors, Undo, reset and persistence`,async()=>{
        const input=page.locator('[name="title"]');await input.fill('   ');await input.press('Enter');
        assert.equal(await input.evaluate(el=>el.validationMessage),messages.lab.kanban.validation.titleLength.replace('{{max}}','80'));
        const title='日本語の入力を確認';await input.fill(title);await input.press('Enter');
        const task=()=>page.locator('.mk-task').filter({hasText:title});assert.equal(await task().count(),1);
        assert.equal(await page.locator('[data-feedback]').textContent(),messages.lab.kanban.announcements.added.replace('{{title}}',title).replace('{{status}}',messages.lab.kanban.columns.todo));
        await task().locator('[data-action="right"]').press('Enter');assert.equal(await task().evaluate(el=>el.closest('[data-column]').dataset.column),'doing');
        await task().locator('[data-action="delete"]').click();assert.equal(await task().count(),0);
        await page.locator('[data-action="undo"]').click();assert.equal(await task().count(),1);
        await page.locator('[data-action="reset"]').click();assert.equal(await task().count(),0);
        await page.locator('[data-action="undo"]').click();assert.equal(await task().count(),1);
        await page.reload();await page.locator('.mk-task').first().waitFor();assert.equal(await task().count(),1);
      });
      await check(`${locale}/${theme}: city, draft, board and node identity survive theme switch`,async()=>{
        await page.locator('.clock-controls [data-timezone="Asia/Tokyo"]').click();await page.locator('[name="title"]').fill('未送信の入力');
        await page.evaluate(()=>{window.jpNodes=[...document.querySelectorAll('conways-life,.life-cell,world-clock,mini-kanban,.mk-task,[name="title"]')];window.jpDocument=document;});
        const before=await page.locator('.life-board').innerHTML();await menu(page);await page.locator('[data-theme-toggle]').click();
        assert.equal(await page.evaluate(()=>window.jpDocument===document&&window.jpNodes.every(node=>node.isConnected)),true);
        assert.equal(await page.locator('.life-board').innerHTML(),before);
        assert.equal(await page.locator('world-clock').getAttribute('data-timezone'),'Asia/Tokyo');
        assert.equal(await page.locator('[name="title"]').inputValue(),'未送信の入力');await closeMenu(page);
      });
      await check(`${locale}/${theme}: localized clipboard success and failure`,async()=>{
        await page.locator('[data-email]').click();await page.waitForFunction(()=>document.querySelector('.copy-status').textContent===document.querySelector('[data-email]').dataset.copySuccess);
        assert.equal(await page.locator('.copy-status').textContent(),messages.contact.emailCopied);
        await page.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('Simulated clipboard denial'));});
        await page.locator('[data-email]').click();await page.waitForFunction(()=>document.querySelector('.copy-status').textContent===document.querySelector('[data-email]').dataset.copyError);
        assert.equal(await page.locator('.copy-status').textContent(),messages.contact.copyError);
      });
      await context.close();
    }
    for(const width of [390,1440]) for(const mode of ['dark','system']) await check(`${width}/${mode}: keyboard EN → ES → JA → EN preserves anchor, theme and stored tasks`,async()=>{
      const context=await browser.newContext({viewport:{width,height:1000},colorScheme:'dark',storageState:{cookies:[],origins:[{origin:base,localStorage:[{name:'theme',value:mode}]}]}});
      const page=await context.newPage();await ready(page,'en');await page.locator('[name="title"]').fill('保存したタスク');await page.locator('.mk-form button').click();
      await page.evaluate(()=>{location.hash='projects';});
      for(const locale of ['es','ja','en']) {
        await select(page,locale);
        assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('data-theme-mode'),mode);
        assert.equal(await page.locator('.mk-task').filter({hasText:'保存したタスク'}).count(),1);
      }
      await context.close();
    });
    for(const width of [390,1440]) await check(`ja/${width}: no-JavaScript fallback and language links`,async()=>{
      const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:1000},colorScheme:'dark'});
      const page=await context.newPage();await page.goto(base+'/ja/');
      assert.equal(await page.locator('html').getAttribute('lang'),'ja');assert.equal(await page.locator('html').getAttribute('data-theme'),null);
      assert.equal(await page.locator('.language-fallback a').count(),3);
      assert.equal(await page.locator('.language-fallback a[lang="ja"]').getAttribute('href'),'/ja/');
      assert.equal(await page.locator('[data-play]').isDisabled(),true);assert.equal(await page.locator('[data-email]').isDisabled(),true);
      assert.equal((await layout(page)).scrollWidth,width);await context.close();
    });
  } finally {save();await browser.close();}
  if(report.checks.some(item=>!item.pass)||report.errors.length) process.exitCode=1;
})().catch(error=>{report.errors.push(error.stack);save();console.error(error);process.exitCode=1;});
