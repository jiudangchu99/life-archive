// All fixture data and test passwords are fictional; backups remain in memory.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=process.argv[2] ? path.dirname(path.resolve(process.argv[2])) : path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'app.js'),'utf8');
const initializer="  loadLocalArchive(); bind(); updateChrome(); renderModule('digitalWorld', true);";
const ctx={crypto:webcrypto,TextEncoder,TextDecoder,document:{querySelector:()=>({})}};
vm.runInNewContext(source.replace(initializer,'  globalThis.test={createArchive,cardTypes,policy};'),ctx);
const {createArchive,cardTypes,policy}=ctx.test;
const key='life-archive.saved-local-archive.v1';
function fixture(){
 const archive=JSON.parse(JSON.stringify(createArchive()));
 function add(module,type,values={}){const data={};for(const [name,,kind] of cardTypes[module][type][1])data[name]=kind==='contactMethods'?[{kind:'other',value:'旧联系线索',note:''}]:kind==='textList'?['旧职责']:['contactRef','executorRef','accountRef','petRef'].includes(kind)?null:kind==='date'?'2026-09-17':kind==='role'?'executor':kind==='decision'?'handover':kind==='priority'?'high':kind==='digitalAssetKind'?'wallet':'旧内容-'+name;Object.assign(data,values);const card={id:webcrypto.randomUUID(),type,title:'旧标题-'+type,status:'active',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),exportPolicy:{fullArchive:'summary',executorGuide:'include',archiveCard:'exclude'},data};archive.modules[module].cards.push(card);return card;}
 const contact=add('ifOneDay','contact',{displayName:'张三'}),ordinary=add('ifOneDay','contact',{displayName:'普通联系人'});
 const role=add('ifOneDay','roleAssignment',{contactCardId:contact.id}),primary=add('ifOneDay','roleAssignment',{role:'primaryContact',contactCardId:contact.id});
 const matrix=[];
 for(const module of Object.keys(cardTypes)){
  const types=Object.keys(cardTypes[module]).filter(t=>!['contact','roleAssignment'].includes(t));
  for(let i=0;i<types.length;i++){const type=types[i];const card=add(module,type,module==='ifOneDay'?{}:{responsibleExecutorContactId:contact.id});matrix.push({module,card,target:types[(i+1)%types.length]});}
 }
 const account=add('digitalWorld','socialAccount',{responsibleExecutorContactId:contact.id});
 const handling=add('ifOneDay','accountHandling',{targetCardId:account.id});
 const pet=add('peopleAndMatters','pet',{responsibleExecutorContactId:contact.id});
 const petPlan=add('ifOneDay','petFinalArrangement',{petCardId:pet.id});
 const legacy=add('digitalWorld','gameAccount',{contactCardId:ordinary.id});
 return {archive,matrix,contact,ordinary,role,primary,account,handling,pet,petPlan,legacy};
}
(async()=>{
for(const channel of ['msedge','chrome']){
 const browser=await chromium.launch({channel,headless:true});
 try{
  const data=fixture(),context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.evaluate(({key,archive})=>{localStorage.setItem(key,JSON.stringify({storageVersion:'1.0.0',savedAt:new Date().toISOString(),archive}));localStorage.setItem('life-archive.user-notice-seen.v1','yes')},{key,archive:data.archive});await page.reload();
  const form=page.locator('#card-dialog'),nav=m=>page.locator(`.nav-list [data-view="${m}"]`).click();
  const open=async(m,id)=>{await nav(m);await page.locator(`[data-edit="${id}"]`).click()};
  const close=()=>form.locator('[data-close]').first().click();
  const submit=async()=>{await form.locator('[type="submit"]').click();assert.equal(await form.isVisible(),false)};
  const persist=async()=>{await page.locator('[data-save-local]').first().click();return page.evaluate(k=>JSON.parse(localStorage.getItem(k)).archive,key)};
  const change=async(type,accept=true)=>{const dialogEvent=page.waitForEvent('dialog');const selecting=form.locator('[data-type-select]').selectOption(type);const d=await dialogEvent;assert.equal(d.type(),'confirm');assert.match(d.message(),/清空/);await(accept?d.accept():d.dismiss());await selecting;};
  const values=()=>form.locator('form').evaluate(e=>[...new FormData(e)].filter(([k])=>k!=='type'));
  const blank=async(module,type,executor)=>{assert.equal(await form.locator('[name="title"]').inputValue(),cardTypes[module][type][0]);for(const [name,,kind] of cardTypes[module][type][1]){const expected=name==='responsibleExecutorContactId'?(executor||''):kind==='decision'?'keep':kind==='priority'?'normal':kind==='digitalAssetKind'?'exchange':kind==='role'?'executor':'';assert.equal(await form.locator(`[name="${name}"]`).inputValue(),expected,module+'/'+type+'/'+name)}};
  // New card: pending inputs require confirmation; cancel keeps every value; accepting starts blank.
  await nav('digitalWorld');await page.locator('[data-add-card="digitalWorld"]').click();
  await form.locator('[name="platformName"]').fill('新社交平台');await form.locator('[name="accountName"]').fill('新账号');await form.locator('[name="notes"]').fill('新备注');
  const newInput=await values();await change('gameAccount',false);assert.equal(await form.locator('[data-type-select]').inputValue(),'socialAccount');assert.deepEqual(await values(),newInput);
  await change('gameAccount');await blank('digitalWorld','gameAccount');await close();
  // Create and formally save a real social card, then cancel/confirm two successive type changes.
  await page.locator('[data-add-card="digitalWorld"]').click();await form.locator('[name="title"]').fill('实际新增社交卡');
  for(const [name,,kind] of cardTypes.digitalWorld.socialAccount[1])if(name!=='responsibleExecutorContactId')await form.locator(`[name="${name}"]`).fill('待清空-'+name);
  await form.locator('[name="responsibleExecutorContactId"]').selectOption(data.contact.id);await form.locator('[name="fullArchive"]').selectOption('summary');await form.locator('[name="executorGuide"]').selectOption('include');await submit();
  let archive=await persist();const original=archive.modules.digitalWorld.cards.find(c=>c.title==='实际新增社交卡');
  await open('digitalWorld',original.id);const before=await values();await change('gameAccount',false);assert.deepEqual(await values(),before);
  await change('gameAccount');await blank('digitalWorld','gameAccount',data.contact.id);await close();
  await open('digitalWorld',original.id);assert.deepEqual(await values(),before,'Closing editor leaves original card intact');
  await change('gameAccount');await blank('digitalWorld','gameAccount',data.contact.id);await submit();archive=await persist();
  let changed=archive.modules.digitalWorld.cards.find(c=>c.id===original.id);assert.equal(changed.type,'gameAccount');assert.equal(changed.createdAt,original.createdAt);assert.deepEqual(changed.exportPolicy,original.exportPolicy);assert.equal(changed.data.responsibleExecutorContactId,data.contact.id);assert.equal(changed.data.notes,'');assert.equal('twoFactorLocation' in changed.data,false);
  await open('digitalWorld',original.id);await form.locator('[name="platformName"]').fill('游戏新输入');await form.locator('[name="notes"]').fill('游戏新备注');await change('emailOrCloudDrive');await blank('digitalWorld','emailOrCloudDrive',data.contact.id);await submit();
  // All 29 non-identity card types, across all four chapters. Default enum choices are kept; all business values are cleared.
  for(const {module,card,target} of data.matrix){await open(module,card.id);await change(target);await blank(module,target,module==='ifOneDay'?null:data.contact.id);for(const name of ['fullArchive','executorGuide','archiveCard'])assert.equal(await form.locator(`[name="${name}"]`).inputValue(),card.exportPolicy[name]);await submit();}
  archive=await persist();
  for(const {module,card,target} of data.matrix){const updated=archive.modules[module].cards.find(c=>c.id===card.id);assert.equal(updated.type,target);assert.equal(updated.createdAt,card.createdAt);assert.deepEqual(updated.exportPolicy,card.exportPolicy);assert.deepEqual(Object.keys(updated.data).sort(),Array.from(cardTypes[module][target][1],f=>f[0]).sort());assert.doesNotMatch(JSON.stringify(updated.data),/旧内容|旧职责|旧联系线索/);}
  // Switching away and back must not resurrect legacy fields or notes.
  await open('digitalWorld',data.legacy.id);assert.match(await form.innerText(),/旧存档安排已保留/);await change('emailOrCloudDrive');await change('gameAccount');await blank('digitalWorld','gameAccount');assert.doesNotMatch(await form.innerText(),/旧存档安排已保留/);await submit();archive=await persist();assert.equal('contactCardId' in archive.modules.digitalWorld.cards.find(c=>c.id===data.legacy.id).data,false);
  // Inbound account references allow compatible conversion but prevent incompatible types. Pet references block pet → plant.
  await open('digitalWorld',data.account.id);const referredValues=await values();await form.locator('[data-type-select]').selectOption('deviceInfo');assert.equal(await form.locator('[data-type-select]').inputValue(),'socialAccount');assert.deepEqual(await values(),referredValues);assert.match(await page.locator('#toast').innerText(),/先处理相关关联/);
  await change('gameAccount');await submit();
  await open('peopleAndMatters',data.pet.id);await form.locator('[data-type-select]').selectOption('plant');assert.equal(await form.locator('[data-type-select]').inputValue(),'pet');assert.match(await page.locator('#toast').innerText(),/先处理相关关联/);await close();
  for(const card of [data.contact,data.role]){await open('ifOneDay',card.id);assert.equal(await form.locator('[data-type-select]').isDisabled(),true);await close();}
  archive=await persist();assert.deepEqual(archive.modules.ifOneDay.cards.find(c=>c.id===data.contact.id),data.contact);assert.deepEqual(archive.modules.ifOneDay.cards.find(c=>c.id===data.role.id),data.role);assert.equal(archive.modules.ifOneDay.cards.find(c=>c.id===data.handling.id).data.targetCardId,data.account.id);
  await page.reload();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).archive,key),archive);
  // UI encrypted/plain .life round trips after the conversions; import does not persist until save.
  for(const encrypted of [true,false]){
   await page.locator('[data-backup-life]').click();const exp=page.locator('#export-dialog');await exp.locator(encrypted?'[data-encrypted-backup]':'[data-plain-backup]').click();
   if(encrypted){await exp.locator('[name="password"]').fill('切换验证');await exp.locator('[name="confirmation"]').fill('切换验证')}else await exp.locator('[data-plain-risk]').check();
   const waiting=page.waitForEvent('download');await exp.locator('[type="submit"]').click();const download=await waiting;const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);const file={name:download.suggestedFilename(),mimeType:'application/octet-stream',buffer:Buffer.concat(chunks)};
   const saved=await page.evaluate(k=>localStorage.getItem(k),key);await page.locator('[data-import-life]').click();await page.locator('#import-dialog [name="lifeFile"]').setInputFiles(file);if(encrypted)await page.locator('#import-dialog [name="password"]').fill('切换验证');await page.locator('#import-dialog [type="submit"]').click();await page.locator('#import-dialog').waitFor({state:'hidden'});assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);
   const restored=await persist();assert.deepEqual({...restored,exportedAt:null},{...archive,exportedAt:null});await page.reload();
  }
  assert.deepEqual(errors,[]);console.log(`PASS ${channel}: new/edit confirm+cancel; blank fields/notes/title; 29 non-identity types in four chapters; preserved ID/createdAt/executor/policies; switch-back legacy cleared; editor close rollback; reference guards; contact/role locks; save/reload; encrypted/plain .life round trips`);
 }finally{await browser.close()}
}
})().catch(e=>{console.error(e);process.exitCode=1});
