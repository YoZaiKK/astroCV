const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/memoc/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://localhost:4321';
const report = { date:new Date().toISOString(),checks:[],errors:[] };
const save=()=>fs.writeFileSync(path.join(__dirname,'interaction-results.json'),JSON.stringify(report,null,2));
async function check(name,fn) {
  try { const detail=await fn(); report.checks.push({name,pass:true,detail}); console.log('PASS',name); }
  catch(e) {report.checks.push({name,pass:false,error:e.stack});console.log('FAIL',name,e.message);}
  save();
}
async function menu(page) {
  const button=page.locator('.menu-button');
  if(await button.isVisible() && await button.getAttribute('aria-expanded')!=='true') await button.click();
}
async function ready(page,locale='en') {
  await page.goto(base+(locale==='es'?'/es/':'/'));
  await page.locator('mini-kanban .mk-task').first().waitFor();
  await page.locator('[data-play]:enabled').waitFor({state:'attached'});
  await page.addStyleTag({content:'astro-dev-toolbar { display:none; }'});
}
async function theme(page,expected,mode=expected) {
  assert.deepEqual(await page.evaluate(()=>({theme:document.documentElement.dataset.theme,mode:document.documentElement.dataset.themeMode,checked:document.querySelector('[data-theme-toggle]').getAttribute('aria-checked'),auto:document.querySelector('[data-theme-auto]').checked})),{theme:expected,mode,checked:String(expected==='dark'),auto:mode==='system'});
}
async function state(page) {
  return page.evaluate(()=>({
    cells:[...document.querySelectorAll('.life-cell')].map(el=>el.getAttribute('aria-pressed')).join(','),
    size:document.querySelector('[data-size]').textContent,generation:document.querySelector('[data-generation]').textContent,
    pattern:document.querySelector('[data-pattern]').textContent,playing:document.querySelector('[data-play]').getAttribute('aria-pressed'),
    city:document.querySelector('world-clock').dataset.timezone,
    tasks:[...document.querySelectorAll('.mk-task')].map(el=>({id:el.dataset.taskId,title:el.querySelector('[data-task-title]').textContent,status:el.closest('[data-column]').dataset.column})),
    draft:document.querySelector('[name="title"]').value,undoDisabled:document.querySelector('[data-action="undo"]').disabled,
    menu:document.querySelector('.menu-button').getAttribute('aria-expanded'),
  }));
}
const storage=(preference,extra=[])=>({cookies:[],origins:[{origin:base,localStorage:[...(preference===null?[]:[{name:'theme',value:preference}]),...extra]}]});
(async()=>{
  const browser=await chromium.launch({channel:'chrome'});
  try {
    for(const preference of [null,'invalid','light','dark','system']) for(const colorScheme of ['light','dark']) await check(`bootstrap ${preference}/${colorScheme}`,async()=>{
      const context=await browser.newContext({colorScheme,storageState:storage(preference),viewport:{width:1440,height:900}});
      const page=await context.newPage();await ready(page);
      const expected=preference==='system'?colorScheme:preference==='dark'?'dark':'light';
      await theme(page,expected,preference==='system'?'system':expected);
      assert.equal(await page.locator('[data-theme-toggle]').isEnabled(),true);await context.close();
    });
    await check('blocked storage: light fallback, manual/Auto controls and Kanban work',async()=>{
      const context=await browser.newContext({colorScheme:'dark',viewport:{width:1440,height:900}});
      await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked in isolated validation','SecurityError');}}));
      const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await ready(page);
      await theme(page,'light');await page.locator('[data-theme-toggle]').click();await theme(page,'dark');
      await page.locator('[data-theme-auto]').check();await theme(page,'dark','system');
      await page.emulateMedia({colorScheme:'light'});await page.waitForTimeout(100);await theme(page,'light','system');
      await page.locator('[name="title"]').fill('Storage fallback');await page.locator('.mk-form button').click();
      assert.equal(await page.locator('.mk-task').filter({hasText:'Storage fallback'}).count(),1);
      assert.match(await page.locator('[data-persistence]').textContent(),/unavailable/);
      await page.locator('[data-action="undo"]').click();assert.equal(await page.locator('.mk-task').filter({hasText:'Storage fallback'}).count(),0);
      await page.reload();await page.locator('[data-play]:enabled').waitFor({state:'attached'});await theme(page,'light');await context.close();
    });
    for(const locale of ['en','es']) for(const width of [390,1440]) {
      const context=await browser.newContext({colorScheme:'dark',storageState:storage('system'),viewport:{width,height:1000}});
      const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await ready(page,locale);
      const prefix=`${locale}/${width}`;
      await check(`${prefix}: Auto, switch click/keyboard, persistence and OS changes`,async()=>{
        await menu(page);await theme(page,'dark','system');
        const label=await page.locator('[data-theme-toggle]').getAttribute('aria-label');
        await page.locator('[data-theme-toggle]').click();await theme(page,'light');
        assert.equal(await page.evaluate(()=>localStorage.theme),'light');
        await page.emulateMedia({colorScheme:'light'});await page.waitForTimeout(100);await theme(page,'light');
        await page.locator('[data-theme-toggle]').focus();await page.keyboard.press('Space');await theme(page,'dark');
        assert.equal(await page.locator('[data-theme-toggle]').getAttribute('aria-label'),label);
        await page.emulateMedia({colorScheme:'dark'});await page.waitForTimeout(100);await theme(page,'dark');
        await page.locator('[data-theme-auto]').check();await theme(page,'dark','system');
        await page.emulateMedia({colorScheme:'light'});await page.waitForTimeout(100);await theme(page,'light','system');
        await page.locator('[data-theme-toggle]').press('Enter');await theme(page,'dark');
        await page.reload();await page.locator('[data-play]:enabled').waitFor({state:'attached'});await theme(page,'dark');
        return {stableAccessibleName:label};
      });
      await check(`${prefix}: Conway clear, keyboard editing, Play/Pause, Random, Reset and sizes`,async()=>{
        if(await page.locator('.menu-button').isVisible() && await page.locator('.menu-button').getAttribute('aria-expanded')==='true') await page.locator('.menu-button').click();
        await page.locator('[data-clear]').click();assert.equal(await page.locator('.life-cell[aria-pressed="true"]').count(),0);
        await page.locator('[data-play]').click();assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'false');
        const first=page.locator('.life-cell').first();await first.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
        assert.equal(await page.locator('.life-cell[data-row="0"][data-column="1"]').getAttribute('aria-pressed'),'true');
        await page.locator('[data-clear]').click();
        for(const column of [4,5,6]) await page.locator(`.life-cell[data-row="5"][data-column="${column}"]`).click();
        await page.locator('[data-play]').click();await page.waitForFunction(()=>Number(document.querySelector('[data-generation]').textContent)>0);
        await page.locator('[data-play]').click();assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'false');
        const before=await page.locator('[data-pattern]').textContent();await page.locator('[data-random]').click();assert.notEqual(await page.locator('[data-pattern]').textContent(),before);
        const pattern=await state(page);await page.locator('[data-clear]').click();await page.locator('[data-reset]').click();assert.equal((await state(page)).cells,pattern.cells);
        await page.locator('[data-size]').click();assert.equal(await page.locator('.life-cell').count(),900);
        await page.locator('[data-size]').click();assert.equal(await page.locator('.life-cell').count(),400);
      });
      await check(`${prefix}: clock cities, local timezone, time output and circular dial`,async()=>{
        for(const timezone of ['Asia/Tokyo','America/Mexico_City','local']) {
          await page.locator(`.clock-controls [data-timezone="${timezone}"]`).click();
          assert.equal(await page.locator(`.clock-controls [data-timezone="${timezone}"]`).getAttribute('aria-pressed'),'true');
          const data=await page.locator('world-clock').evaluate(el=>({timezone:el.dataset.timezone,output:el.querySelector('[data-time]').textContent,ratio:el.querySelector('.analog-clock').getBoundingClientRect().width/el.querySelector('.analog-clock').getBoundingClientRect().height,expected:new Intl.DateTimeFormat('en-GB',{timeZone:el.dataset.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date())}));
          assert.ok(data.output.startsWith(data.expected));assert.ok(Math.abs(data.ratio-1)<0.01);
          if(timezone!=='local') assert.equal(data.timezone,timezone);
        }
        await page.locator('.clock-controls [data-timezone="Asia/Tokyo"]').click();
      });
      const title='Validar tema — prueba';
      const task=()=>page.locator('.mk-task').filter({has:page.locator('[data-task-title]',{hasText:title})});
      await check(`${prefix}: Kanban validation, create, keyboard move/reorder, delete, Undo, reset, persistence`,async()=>{
        const input=page.locator('[name="title"]');await input.fill('   ');await page.locator('.mk-form button').click();
        assert.ok(await input.evaluate(el=>!el.validity.valid && !!el.validationMessage));
        await page.screenshot({path:path.join(__dirname,`${locale}-${width}-validation-error.png`)});
        await input.fill(title);await input.press('Enter');assert.equal(await task().count(),1);
        await task().locator('[data-action="right"]').focus();await page.keyboard.press('Enter');assert.equal(await task().evaluate(el=>el.closest('[data-column]').dataset.column),'doing');
        await task().locator('[data-action="left"]').focus();await page.keyboard.press('Space');assert.equal(await task().evaluate(el=>el.closest('[data-column]').dataset.column),'todo');
        await task().locator('[data-action="up"]').click();assert.equal(await page.locator('[data-list="todo"] .mk-task').first().getAttribute('data-task-id'),await task().getAttribute('data-task-id'));
        await task().locator('[data-action="down"]').click();assert.notEqual(await page.locator('[data-list="todo"] .mk-task').first().getAttribute('data-task-id'),await task().getAttribute('data-task-id'));
        await task().locator('[data-action="delete"]').click();assert.equal(await task().count(),0);
        await page.locator('[data-action="undo"]').click();assert.equal(await task().count(),1);
        await page.locator('[data-action="reset"]').click();assert.equal(await task().count(),0);
        await page.locator('[data-action="undo"]').click();assert.equal(await task().count(),1);
        const tasks=(await state(page)).tasks;await page.reload();await page.locator('.mk-task').first().waitFor();assert.deepEqual((await state(page)).tasks,tasks);
        // Create another history entry so Undo can be verified across theme switches.
        await input.fill('Historial conservado');await input.press('Enter');
      });
      await check(`${prefix}: theme changes preserve widget nodes, board, city, tasks, draft, Undo and open menu`,async()=>{
        await page.locator('[name="title"]').fill('Borrador sin enviar');await menu(page);
        await page.evaluate(()=>{window.validationNodes=[...document.querySelectorAll('conways-life, .life-cell, world-clock, mini-kanban, .mk-task, [name="title"], #primary-navigation')];window.validationDocument=document;});
        const before=await state(page);
        for(const key of ['click','Space','Enter','click']) {
          if(key==='click') await page.locator('[data-theme-toggle]').click();else await page.locator('[data-theme-toggle]').press(key);
          await page.waitForTimeout(300);
          assert.deepEqual(await state(page),before);
          assert.equal(await page.evaluate(()=>window.validationDocument===document && window.validationNodes.every(el=>el.isConnected) && window.validationNodes.every(el=>[...document.querySelectorAll('conways-life, .life-cell, world-clock, mini-kanban, .mk-task, [name="title"], #primary-navigation')].includes(el))),true);
        }
        await page.locator('[data-theme-auto]').check();
        for(const colorScheme of ['dark','light']) {
          await page.emulateMedia({colorScheme});await page.waitForTimeout(300);
          assert.deepEqual(await state(page),before);
          assert.equal(await page.evaluate(()=>window.validationDocument===document && window.validationNodes.every(el=>el.isConnected)),true);
        }
        if(await page.locator('.menu-button').isVisible()) await page.locator('.menu-button').click();
        await page.locator('[data-action="undo"]').click();assert.equal(await page.locator('.mk-task').filter({hasText:'Historial conservado'}).count(),0);
        return 'Identity retained for custom elements, all 400 cells, task nodes, input, navigation and Document; paused generation and every state field unchanged.';
      });
      await check(`${prefix}: running simulation survives theme change`,async()=>{
        await page.locator('[data-clear]').click();for(const column of [4,5,6]) await page.locator(`.life-cell[data-row="5"][data-column="${column}"]`).click();
        await page.locator('[data-play]').click();await page.waitForFunction(()=>Number(document.querySelector('[data-generation]').textContent)>0);
        const generation=Number(await page.locator('[data-generation]').textContent());await menu(page);await page.locator('[data-theme-toggle]').click();
        await page.waitForFunction(g=>Number(document.querySelector('[data-generation]').textContent)>g,generation);
        assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'true');
        if(await page.locator('.menu-button').isVisible()) await page.locator('.menu-button').click();await page.locator('[data-play]').click();
      });
      if(width===1440) await check(`${prefix}: real mouse drag/drop`,async()=>{
        const card=page.locator('[data-task-id="sample-layout"]');const list=page.locator('[data-list="done"]');
        await card.dragTo(list);assert.equal(await card.evaluate(el=>el.closest('[data-column]').dataset.column),'done');
        assert.equal(await page.locator('[data-dragging], [data-drop-active]').count(),0);
      });
      await check(`${prefix}: locale navigation preserves hash and manual/Auto mode`,async()=>{
        await page.evaluate(()=>{location.hash='projects';});await menu(page);
        // Start with a manual choice; the return trip separately checks Auto.
        await page.locator('[data-theme-toggle]').click();
        const initial=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,mode:document.documentElement.dataset.themeMode}));
        await page.locator('[role="combobox"]').press('Enter');await page.locator('[role="combobox"]').press('Home');
        if(locale==='en') await page.locator('[role="combobox"]').press('ArrowDown');
        await Promise.all([page.waitForURL(locale==='en'?'**/es/#projects':'**/#projects'),page.locator('[role="combobox"]').press('Enter')]);
        await page.locator('[data-play]:enabled').waitFor({state:'attached'});await theme(page,initial.theme,initial.mode);
        await menu(page);await page.locator('[data-theme-auto]').check();
        await page.locator('[role="combobox"]').press('Enter');await page.locator('[role="combobox"]').press('Home');
        if(locale==='es') await page.locator('[role="combobox"]').press('ArrowDown');
        await Promise.all([page.waitForURL(locale==='en'?'**/#projects':'**/es/#projects'),page.locator('[role="combobox"]').press('Enter')]);
        await page.locator('[data-play]:enabled').waitFor({state:'attached'});await theme(page,'light','system');
        assert.equal(new URL(page.url()).hash,'#projects');
      });
      await context.close();
    }
    for(const locale of ['en','es']) await check(`${locale}: anchors, real resume PDF, clipboard success and fallback`,async()=>{
      const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],viewport:{width:1440,height:1000}});
      const page=await context.newPage();await ready(page,locale);
      const brokenAnchors=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(el=>el.getAttribute('href').slice(1)).filter(id=>id&&!document.getElementById(id)));
      assert.deepEqual(brokenAnchors,[]);
      const href=await page.locator('a[download]').first().getAttribute('href');const response=await page.request.get(base+href);
      assert.equal(response.status(),200);assert.equal((await response.body()).subarray(0,4).toString(),'%PDF');
      const button=page.locator('[data-email]');await button.click();
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await button.getAttribute('data-email'));
      assert.equal(await page.locator('.copy-status').textContent(),await button.getAttribute('data-copy-success'));
      await page.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('Clipboard denied for validation'));});await button.click();
      await page.waitForFunction(()=>document.querySelector('.copy-status').textContent===document.querySelector('[data-email]').dataset.copyError);
      await context.close();
    });
    for(const locale of ['en','es']) for(const color of ['light','dark']) await check(`${locale}/${color}: touch Kanban and theme`,async()=>{
      const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844},storageState:storage(color)});
      const page=await context.newPage();await ready(page,locale);
      const card=page.locator('[data-task-id="sample-layout"]');await card.locator('[data-action="right"]').tap();assert.equal(await card.evaluate(el=>el.closest('[data-column]').dataset.column),'doing');
      await card.locator('[data-action="delete"]').tap();assert.equal(await card.count(),0);await page.locator('[data-action="undo"]').tap();assert.equal(await card.count(),1);
      await menu(page);await page.locator('[data-theme-toggle]').tap();await theme(page,color==='dark'?'light':'dark');
      assert.equal(await card.evaluate(el=>el.closest('[data-column]').dataset.column),'doing');await context.close();
    });
  } finally {save();await browser.close();}
  if(report.checks.some(c=>!c.pass)||report.errors.length) process.exitCode=1;
})().catch(e=>{report.errors.push(e.stack);save();console.error(e);process.exitCode=1;});
