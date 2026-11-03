// Fixtures are fictional; isolated browser contexts and memory-only backup buffers.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const entry=path.resolve(process.argv[2] || path.join(__dirname,'..','index.html'));assert.ok(fs.existsSync(entry));
const KEY='life-archive.saved-local-archive.v1';
const notice='保存 PDF 前请先检查打印预览。若出现本地文件路径、日期等附加信息，请关闭“页眉和页脚”；如果当前打印方式没有该选项，可尝试切换为“Microsoft Print to PDF”。';
const footer='需要完整资料时，请找到人生存档备份；如使用加密备份，请按事先安排的方式获取密码。';
(async()=>{
for(const channel of ['msedge','chrome']){
 const browser=await chromium.launch({channel,headless:true});
 try{
  const errors=[],network=[],prints=[];
  const context=await browser.newContext({viewport:{width:1366,height:1000},acceptDownloads:true});
  await context.route(/^https?:/,r=>{network.push(r.request().url());return r.abort()});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // Capture actual generated print document. Only the native dialog call is intercepted; production files are untouched.
  await page.exposeFunction('smokeCapturePrint',html=>prints.push(html));
  await page.addInitScript(()=>{window.print=()=>window.smokeCapturePrint(document.documentElement.outerHTML)});
  await page.goto(pathToFileURL(entry).href);
  assert.equal(await page.locator('#user-notice-dialog').isVisible(),true);
  await page.locator('[data-notice-accept]').click();
  assert.deepEqual(await page.locator('.module-count').allTextContents(),['0 张卡片','0 张卡片','0 张卡片','0 张卡片']);
  assert.equal(await page.locator('[data-owner-name]').innerText(),'未设置');
  const snapshot=()=>page.evaluate(k=>localStorage.getItem(k),KEY);
  const save=()=>page.locator('[data-save-local]').first().click();
  const nav=module=>page.locator(`.nav-list [data-view="${module}"]`).click();
  const form=page.locator('#card-dialog');
  const open=async(module,type,title)=>{await nav(module);await page.locator(`[data-add-card="${module}"]`).click();await form.locator('[data-type-select]').selectOption(type);await form.locator('[name="title"]').fill(title)};
  const submit=async()=>{await form.locator('[type="submit"]').click();assert.equal(await form.isVisible(),false)};
  const showAll=async()=>{for(const kind of ['fullArchive','executorGuide','archiveCard'])await form.locator(`[name="${kind}"]`).selectOption('include')};
  const setOwner=async value=>{await nav('home');await page.locator('[data-edit-owner]').click();await page.locator('#owner-dialog input').fill(value);await page.locator('#owner-dialog [type="submit"]').click()};
  // Unsaved card really disappears on refresh with native beforeunload warning.
  await open('digitalWorld','socialAccount','未保存临时卡');await form.locator('[name="platformName"]').fill('临时平台');await submit();
  assert.equal(await snapshot(),null);
  let warned=false;page.once('dialog',async d=>{assert.equal(d.type(),'beforeunload');warned=true;await d.accept()});await page.reload();assert.equal(warned,true);
  assert.deepEqual(await page.locator('.module-count').allTextContents(),['0 张卡片','0 张卡片','0 张卡片','0 张卡片']);
  for(const [title,who,role] of [['联系人A','张三','primaryContact'],['联系人B','李四','backupContact'],['联系人C','王五',null]]){
   await open('ifOneDay','contact',title);await form.locator('[name="displayName"]').fill(who);await form.locator('[name="contactMethods"]').fill('家中通讯录');if(role)await form.locator(`[name="${role}"]`).check();await showAll();await submit();
  }
  assert.equal(await page.locator('.data-card').count(),3);
  const ids={};
  for(const [who,title] of [['张三','执行人安排A'],['李四','执行人安排B']]){
   await open('ifOneDay','roleAssignment',title);assert.equal(await form.locator('select[name="role"]').count(),0);
   ids[who]=await form.locator('[name="contactCardId"] option').filter({hasText:who}).getAttribute('value');
   await form.locator('[name="contactCardId"]').selectOption(ids[who]);await form.locator('[name="responsibilities"]').fill('根据留下的说明处理');await showAll();await submit();
  }
  assert.equal(await page.locator('.data-card').count(),5);
  for(const [module,type,title,who,field,value] of [
   ['digitalWorld','gameAccount','数字事项','李四','platformName','Steam'],
   ['realWorld','bankOrPaymentAccount','现实事项','张三','institutionName','示例银行']]){
   await open(module,type,title);await form.locator(`[name="${field}"]`).fill(value);
   assert.deepEqual(await form.locator('[name="responsibleExecutorContactId"] option').allTextContents(),['暂不指定','张三','李四']);
   await form.locator('[name="responsibleExecutorContactId"]').selectOption(ids[who]);await showAll();await submit();
  }
  await setOwner('发布验收存档人');await save();const saved=await snapshot();await page.reload();assert.equal(await snapshot(),saved);
  assert.equal(await page.locator('[data-owner-name]').innerText(),'发布验收存档人');
  const archive=JSON.parse(saved).archive;
  assert.equal(archive.modules.ifOneDay.cards.filter(c=>c.type==='roleAssignment'&&c.data.role==='executor').length,2);
  assert.equal(archive.modules.digitalWorld.cards[0].data.responsibleExecutorContactId,ids['李四']);
  assert.equal(archive.modules.realWorld.cards[0].data.responsibleExecutorContactId,ids['张三']);
  for(const role of ['primaryContact','backupContact'])assert.equal(archive.modules.ifOneDay.cards.filter(c=>c.type==='roleAssignment'&&c.data.role===role).length,1);
  await setOwner('未保存改名');assert.equal(await snapshot(),saved);
  await page.locator('[data-backup-life]').click();await page.locator('#export-dialog [data-close]').click();assert.equal(await snapshot(),saved);
  page.once('dialog',async d=>{assert.equal(d.type(),'beforeunload');await d.accept()});await page.reload();assert.equal(await page.locator('[data-owner-name]').innerText(),'发布验收存档人');
  const backups=[];
  for(const encrypted of [true,false]){
   await page.locator('[data-backup-life]').click();
   const exportDialog=page.locator('#export-dialog');
   await exportDialog.locator(encrypted?'[data-encrypted-backup]':'[data-plain-backup]').click();
   if(encrypted){await exportDialog.locator('[name="password"]').fill('验收专用口令');await exportDialog.locator('[name="confirmation"]').fill('验收专用口令')}
   else {await exportDialog.locator('[type="submit"]').click();assert.equal(await exportDialog.isVisible(),true);await exportDialog.locator('[data-plain-risk]').check()}
   const downloading=page.waitForEvent('download');await exportDialog.locator('[type="submit"]').click();const download=await downloading;
   assert.match(download.suggestedFilename(),/人生存档_\d{4}-\d{2}-\d{2}_\d{4}\.life/);
   const chunks=[]; for await (const chunk of await download.createReadStream()) chunks.push(chunk); const file={name:download.suggestedFilename(),mimeType:'application/octet-stream',buffer:Buffer.concat(chunks)};
   const data=JSON.parse(file.buffer.toString('utf8'));
   if(encrypted){assert.equal(data.encryptionVersion,'aes-gcm-pbkdf2-v1');assert.equal(data.archive,undefined)}else{assert.equal(data.backupType,'unencrypted-v1');assert.equal(data.archive.ownerDisplayName,'发布验收存档人')}
   backups.push({file,encrypted});
  }
  // Every backup goes through the real import dialog in a separate browser context with a pre-existing saved snapshot.
  for(const {file,encrypted} of backups){
   const restoredContext=await browser.newContext();await restoredContext.route(/^https?:/,r=>{network.push(r.request().url());return r.abort()});
   const restored=await restoredContext.newPage();restored.on('pageerror',e=>errors.push(e.message));
   await restored.goto(pathToFileURL(entry).href);await restored.locator('[data-notice-accept]').click();
   await restored.locator('[data-edit-owner]').click();await restored.locator('#owner-dialog input').fill('原本机存档');await restored.locator('#owner-dialog [type="submit"]').click();await restored.locator('[data-save-local]').first().click();
   const original=await restored.evaluate(k=>localStorage.getItem(k),KEY);
   await restored.locator('[data-import-life]').click();await restored.locator('#import-dialog [name="lifeFile"]').setInputFiles(file);
   if(encrypted)await restored.locator('#import-dialog [name="password"]').fill('验收专用口令');
   await restored.locator('#import-dialog [type="submit"]').click();await restored.locator('#import-dialog').waitFor({state:'hidden'});
   assert.equal(await restored.locator('[data-owner-name]').innerText(),'发布验收存档人');
   assert.equal(await restored.evaluate(k=>localStorage.getItem(k),KEY),original,'Import must not overwrite saved snapshot');
   await restored.locator('[data-save-local]').first().click();await restored.reload();
   const roundtrip=JSON.parse(await restored.evaluate(k=>localStorage.getItem(k),KEY)).archive;
   assert.deepEqual({...roundtrip,exportedAt:null},{...archive,exportedAt:null});
   assert.equal(await restored.locator('[data-owner-name]').innerText(),'发布验收存档人');
   await restoredContext.close();
   console.log('PASS '+channel+' '+(encrypted?'encrypted':'plain')+': UI download → separate-context import → no local overwrite → save → reload; all fields/IDs/roles/owner identical');
  }
  for(const kind of ['full','executor','card']){
   await page.locator('[data-open-print]').click();const printDialog=page.locator('#print-dialog');
   assert.equal(await printDialog.locator('.guide-callout').innerText(),notice);assert.equal(await printDialog.locator('.guide-callout').isVisible(),true);
   if(kind==='full'){await printDialog.locator('[data-print-kind="full"]').click();assert.equal(await printDialog.isVisible(),true);}
   await printDialog.locator('[data-print-risk-confirm]').check();
   const before=prints.length;await printDialog.locator(`[data-print-kind="${kind}"]`).click();
   for(let retry=0;prints.length===before&&retry<100;retry++)await new Promise(resolve=>setTimeout(resolve,50));
   assert.equal(prints.length,before+1,'Print document captured');const html=prints.at(-1);
   assert.match(html,/存档人：发布验收存档人/);assert.doesNotMatch(html,/未命名人生存档|负责执行人（可选）|第一联系人设置|备用联系人设置/);
   assert.match(html,/第一联系人、执行人/);assert.match(html,/备用联系人、执行人/);
   for(const title of ['联系人A','联系人B','联系人C','执行人安排A','执行人安排B'])assert.equal(html.split('>'+title+'<').length-1,1);
   assert.match(html,/负责执行人/);if(kind==='card')assert.ok(html.includes(footer));
   const render=await context.newPage();await render.emulateMedia({media:'print'});await render.setContent(html);
   assert.equal(await render.locator('.print-header h1').innerText(),{full:'完整人生存档',executor:'执行人指南',card:'人生存档卡'}[kind]);
   assert.equal(await render.locator('.print-module').count(),kind==='card'?0:3,'Empty care module skipped');
   await render.close();
   await page.evaluate(()=>{for(const f of document.querySelectorAll('iframe'))f.contentWindow.dispatchEvent(new Event('afterprint'))});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  console.log('PASS '+channel+': final ZIP file:// open; first-use empty/notice; create/save/reload; no autosave; relationships; owner; three print documents/rendering; no duplicate internal roles; correct labels/footer/reminder; no JS errors or network');
  await context.close();
 }finally{await browser.close()}
}
})().catch(e=>{console.error(e);process.exitCode=1});
