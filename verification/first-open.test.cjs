const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const entry=process.argv[2] || path.join(__dirname,'..','index.html');
(async()=>{
  for(const channel of ['msedge','chrome']){
    const browser=await chromium.launch({channel,headless:true});
    try{
      for(let user=1;user<=2;user++){
        const context=await browser.newContext({viewport:{width:1280,height:900}});
        const page=await context.newPage();const errors=[],network=[];
        page.on('pageerror',e=>errors.push(e.message));
        await context.route(/^https?:/,route=>{network.push(route.request().url());return route.abort()});
        await page.goto(pathToFileURL(path.resolve(entry)).href);
        const notice=page.locator('#user-notice-dialog');
        await page.locator('[data-notice-accept]').waitFor({state:'visible'});
        assert.equal(await notice.isVisible(),true);
        assert.match(await notice.innerText(),/使用人生存档前，请先知道这件最重要的事/);
        assert.deepEqual(await page.locator('.module-count').allTextContents(),['0 张卡片','0 张卡片','0 张卡片','0 张卡片']);
        assert.equal(await page.locator('.data-card').count(),0);
        assert.equal(await page.evaluate(()=>localStorage.getItem('life-archive.saved-local-archive.v1')),null);
        assert.equal(await page.evaluate(()=>localStorage.getItem('life-archive.user-notice-seen.v1')),null);
        await page.locator('[data-notice-accept]').click();
        assert.equal(await notice.isVisible(),false);
        assert.equal(await page.evaluate(()=>localStorage.getItem('life-archive.user-notice-seen.v1')),'yes');
        for(const module of ['digitalWorld','realWorld','peopleAndMatters','ifOneDay']){
          await page.locator(`.sidebar [data-view="${module}"]:visible`).click();
          assert.equal(await page.locator('.data-card').count(),0);
          assert.match(await page.locator('#workspace').innerText(),/从一张卡片开始/);
        }
        await page.reload();
        assert.equal(await notice.isVisible(),false);
        assert.deepEqual(await page.locator('.module-count').allTextContents(),['0 张卡片','0 张卡片','0 张卡片','0 张卡片']);
        assert.equal(await page.evaluate(()=>localStorage.getItem('life-archive.saved-local-archive.v1')),null);
        assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
        await context.close();
        console.log(`PASS ${channel} independent user ${user}: candidate entry starts empty in all four modules; first-use notice appears; acceptance is remembered; no archive automatically created; no JS errors/HTTP(S) requests observed`);
      }
    }finally{await browser.close()}
  }
})().catch(error=>{console.error(error);process.exitCode=1});
