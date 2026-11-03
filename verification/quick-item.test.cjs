// Fictional fixtures only; no downloads, screenshots or persistent browser profile.
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const entry = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const key = 'life-archive.saved-local-archive.v1';
(async () => {
  for (const channel of ['msedge', 'chrome']) {
    const browser = await chromium.launch({channel, headless: true});
    try {
      const context = await browser.newContext({viewport: {width: 1366, height: 1000}});
      const page = await context.newPage(), errors = [], network = [], prints = [];
      page.on('pageerror', e => errors.push(e.message));
      await context.route(/^https?:/, r => {network.push(r.request().url()); return r.abort();});
      await page.exposeFunction('captureQuickPrint', html => prints.push(html));
      await page.addInitScript(() => {window.print = () => window.captureQuickPrint(document.documentElement.outerHTML);});
      await page.goto(pathToFileURL(entry).href);
      await page.locator('[data-notice-accept]').click();
      const nav = m => page.locator(`.sidebar [data-view="${m}"]:visible`).click();
      const form = page.locator('#card-dialog'), quick = page.locator('#quick-start-dialog');
      const save = async () => {await page.locator('[data-save-local]').first().click(); return page.evaluate(k => JSON.parse(localStorage.getItem(k)).archive, key);};
      const openQuick = async () => {await nav('home'); await page.locator('[data-open-quick-start]').click();};
      const finishQuick = async () => {await quick.locator('[type="submit"]').click(); assert.equal(await quick.isVisible(), false);};
      assert.deepEqual(await page.locator('.starter-shortcut').evaluateAll(items => items.map(x => [x.dataset.shortcutModule, x.dataset.shortcutType || ''])), [['ifOneDay','contact'],['digitalWorld',''],['realWorld','valuableItem'],['peopleAndMatters','specialArrangement']]);
      const third = page.locator('.starter-shortcut').nth(2);
      assert.match(await third.innerText(), /记下一件重要物品/);
      await third.locator('i').click();
      assert.equal(await form.locator('[name="type"]').inputValue(), 'valuableItem');
      assert.equal(await form.locator('h2').innerText(), '我的现实世界');
      await form.locator('[data-close]').first().click();
      await openQuick(); await finishQuick();
      assert.equal((await save()).modules.realWorld.cards.length, 0);
      await openQuick();
      await quick.locator('[name="itemName"]').fill('虚构纪念相机');
      await quick.locator('[name="itemLocation"]').fill('虚构柜子第二层');
      await finishQuick();
      let archive = await save(), cards = archive.modules.realWorld.cards;
      assert.equal(cards.length, 1); assert.equal(cards[0].type, 'valuableItem');
      assert.deepEqual(cards[0].data, {itemName:'虚构纪念相机',storageLocation:'虚构柜子第二层',proofLocation:'',valuationHint:'',recipientHint:'',notes:'',responsibleExecutorContactId:null});
      // Same normalized name + location must not create a duplicate.
      await openQuick(); await quick.locator('[name="itemName"]').fill('  虚构纪念相机  '); await quick.locator('[name="itemLocation"]').fill('虚构柜子第二层'); await finishQuick();
      assert.equal((await save()).modules.realWorld.cards.length, 1);
      // A different quick-start section with section 03 empty adds no real-world card.
      await openQuick(); await quick.locator('[name="contactName"]').fill('虚构联系人'); await finishQuick();
      assert.equal((await save()).modules.realWorld.cards.length, 1);
      await nav('realWorld'); await page.locator('[data-add-card="realWorld"]').click();
      await form.locator('[name="type"]').selectOption('fileLocation');
      await form.locator('[name="title"]').fill('虚构文件位置卡');
      await form.locator('[name="fileCategory"]').fill('虚构资料');
      await form.locator('[name="physicalLocation"]').fill('虚构文件柜');
      for (const kind of ['fullArchive','executorGuide','archiveCard']) await form.locator(`[name="${kind}"]`).selectOption('include');
      await form.locator('[type="submit"]').click();
      archive = await save(); const file = archive.modules.realWorld.cards.find(c => c.type === 'fileLocation'); assert.ok(file);
      await page.locator(`[data-edit="${file.id}"]`).click();
      await form.locator('[name="physicalLocation"]').fill('虚构文件柜更新位置');
      await form.locator('[type="submit"]').click(); await save(); await page.reload();
      archive = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).archive, key);
      assert.equal(archive.modules.realWorld.cards.find(c => c.id === file.id).data.physicalLocation, '虚构文件柜更新位置');
      assert.equal(archive.modules.realWorld.cards.find(c => c.type === 'valuableItem').data.storageLocation, '虚构柜子第二层');
      for (const kind of ['full','executor','card']) {
        await page.locator('[data-open-print]').click();
        await page.locator('#print-dialog [data-print-risk-confirm]').check();
        const before = prints.length;
        await page.locator(`#print-dialog [data-print-kind="${kind}"]`).click();
        for (let n=0; prints.length===before && n<100; n++) await new Promise(r=>setTimeout(r,50));
        assert.equal(prints.length, before+1);
        assert.match(prints.at(-1), /虚构文件位置卡/); assert.match(prints.at(-1), /虚构文件柜更新位置/);
        await page.evaluate(()=>{for(const f of document.querySelectorAll('iframe'))f.contentWindow.dispatchEvent(new Event('afterprint'));});
      }
      assert.deepEqual(errors, []); assert.deepEqual(network, []);
      await context.close();
      console.log(`PASS ${channel}: shortcut 03; valuableItem fields/defaults; blank/other-only skipped; duplicate prevented; fileLocation create/edit/save/reload and all three print documents; other shortcut targets unchanged`);
    } finally {await browser.close();}
  }
})().catch(e=>{console.error(e); process.exitCode=1;});
