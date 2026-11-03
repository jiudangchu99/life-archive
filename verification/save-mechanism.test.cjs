const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const APP_PATH = path.join(__dirname, '..', 'app.js');
const INITIALIZER = "  loadLocalArchive(); bind(); updateChrome(); renderModule('digitalWorld', true);\n})();";
const TEST_HOOK = "  globalThis.__lifeTest = { state, createArchive, loadLocalArchive, saveLocalArchive, markChanged, completionChecks, createPlainLifeFile, createLifeFile, readLifeFile, policy, cardTypes, archiveCardSafeFields, archiveCardPrintHtml, hasSeenUserNotice, rememberUserNotice, applyQuickStart, openBackupDialog, openClearDialog, bind };\n})();";
const source = fs.readFileSync(APP_PATH, 'utf8').replace(INITIALIZER, TEST_HOOK);
assert.notEqual(source, fs.readFileSync(APP_PATH, 'utf8'), '无法安装测试钩子');

function domStub() {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      get innerHTML() { return this.html || ''; },
      set innerHTML(value) { this.html = value; for (const key of elements.keys()) if (key.startsWith(`${selector} `)) elements.delete(key); },
      hidden: false,
      dataset: {}, style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {},
      showModal() { this.open = true; }, close() { this.open = false; },
      querySelector(child) { return element(`${selector} ${child}`); },
      querySelectorAll(child) { return child === '[data-close]' ? [this.querySelector(child)] : []; }
    });
    return elements.get(selector);
  };
  const downloads = [];
  return { downloads, querySelector: element, querySelectorAll() { return []; }, addEventListener() {}, createElement() { return { click() { downloads.push(this.download); } }; } };
}

function runtime(storage) {
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const context = {
    Blob, FormData: class extends FormData { constructor(form) { super(); if (form) for (const [key, value] of Object.entries(form.testData || {})) this.set(key, value); } }, TextEncoder, TextDecoder, URL, console,
    crypto: webcrypto, localStorage, document: domStub(),
    setTimeout() { return 0; }, clearTimeout() {},
    btoa: text => Buffer.from(text, 'binary').toString('base64'),
    atob: text => Buffer.from(text, 'base64').toString('binary')
  };
  context.globalThis = context;
  const handlers = {};
  context.window = { scrollTo() {}, addEventListener(name, callback) { handlers[name] = callback; } };
  vm.runInNewContext(source, context, { filename: APP_PATH });
  Object.assign(context.__lifeTest, { document: context.document, handlers });
  return context.__lifeTest;
}

const SAVED_KEY = 'life-archive.saved-local-archive.v1';

(async () => {
  const storage = new Map();

  // 1. 首次填写但不保存：内存变更不会写入 localStorage，重新运行恢复空白。
  let app = runtime(storage);
  assert.deepEqual(Array.from(app.completionChecks(), item => item.key), ['primaryContact', 'executor', 'digitalWorld', 'realWorld', 'formalArchive']);
  assert.equal(app.completionChecks().find(item => item.key === 'formalArchive').status, 'neutral');
  app.state.archive.archiveTitle = '未保存临时内容';
  app.markChanged();
  assert.equal(app.state.isDirty, true);
  assert.equal(storage.has(SAVED_KEY), false);
  app = runtime(storage);
  assert.equal(app.loadLocalArchive(), false);
  assert.equal(app.state.archive.archiveTitle, '');

  // 2. 主动保存：写入正式本机快照，重新运行可以恢复。
  app.state.archive.archiveTitle = '已保存版本一';
  app.markChanged();
  assert.equal(app.saveLocalArchive({ announce: false }), true);
  assert.equal(app.state.isDirty, false);
  assert.equal(storage.has(SAVED_KEY), true);
  assert.equal(app.completionChecks().find(item => item.key === 'formalArchive').done, true);
  assert.match(app.completionChecks().find(item => item.key === 'formalArchive').message, /已保存到当前电脑/);
  app = runtime(storage);
  assert.equal(app.loadLocalArchive(), true);
  assert.equal(app.state.archive.archiveTitle, '已保存版本一');

  // 7. 用户须知：首次为未读；确认后记住，且不影响正式人生存档内容。
  assert.equal(app.hasSeenUserNotice(), false);
  app.rememberUserNotice();
  assert.equal(app.hasSeenUserNotice(), true);
  const archiveAfterNotice = storage.get(SAVED_KEY);
  app = runtime(storage);
  assert.equal(app.hasSeenUserNotice(), true);
  assert.equal(storage.get(SAVED_KEY), archiveAfterNotice);

  // 8. 快速开始全部可选：空表单不建卡；部分填写可完成；重复提交不重复建卡。
  const quickApp = runtime(new Map());
  const emptyQuickForm = new FormData(); emptyQuickForm.set('specialType', 'none');
  assert.equal(quickApp.applyQuickStart(emptyQuickForm), 0);
  assert.equal(quickApp.state.isDirty, false);
  assert.equal(Object.values(quickApp.state.archive.modules).flatMap(module => module.cards).length, 0);
  const quickForm = new FormData();
  quickForm.set('contactName', '哥哥'); quickForm.set('contactMethod', '手机通讯录中的哥哥'); quickForm.set('alsoExecutor', 'yes');
  quickForm.set('platform1', 'Steam'); quickForm.set('account1', '常用账号'); quickForm.set('location1', '密码管理器');
  quickForm.set('itemName', '保险资料'); quickForm.set('itemLocation', '书房黑色文件夹');
  quickForm.set('specialType', 'pet'); quickForm.set('specialDetail', '豆豆');
  assert.equal(quickApp.applyQuickStart(quickForm), 5);
  const quickCardCount = Object.values(quickApp.state.archive.modules).flatMap(module => module.cards).length;
  assert.equal(quickApp.applyQuickStart(quickForm), 0);
  assert.equal(Object.values(quickApp.state.archive.modules).flatMap(module => module.cards).length, quickCardCount);

  // 6. 人生存档卡覆盖全部卡片类型，新卡默认不显示，且疑似真实密码不会输出。
  const configuredTypes = Object.values(app.cardTypes).flatMap(types => Object.keys(types));
  assert.deepEqual(Object.keys(app.archiveCardSafeFields).sort(), configuredTypes.sort());
  assert.equal(app.cardTypes.digitalWorld.digitalAsset[0], '数字资产');
  assert.equal(app.cardTypes.digitalWorld.exchangeAsset, undefined);
  assert.equal(app.cardTypes.digitalWorld.cryptoWallet, undefined);
  assert.equal(app.cardTypes.digitalWorld.nftAsset, undefined);
  for (const types of Object.values(app.cardTypes)) for (const [type, config] of Object.entries(types)) {
    const availableFields = new Set(config[1].map(field => field[0]));
    assert.equal(app.policy(type).archiveCard, 'exclude');
    assert.ok(app.archiveCardSafeFields[type].summary.every(field => availableFields.has(field)));
    assert.ok(app.archiveCardSafeFields[type].include.every(field => availableFields.has(field)));
  }
  app.state.archive.modules.digitalWorld.cards.push({
    id: webcrypto.randomUUID(), type: 'socialAccount', title: '测试账号', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active',
    exportPolicy: { fullArchive: 'include', executorGuide: 'summary', archiveCard: 'include' },
    data: { platformName: '测试平台', accountName: '账号线索', passwordLocation: 'Abc123!@', twoFactorLocation: '', recoveryMethod: '', handlingInstruction: '验证码为 778899', notes: '' }
  });
  app.state.archive.modules.digitalWorld.cards.push({
    id: webcrypto.randomUUID(), type: 'digitalAsset', title: '测试数字资产', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active',
    exportPolicy: { fullArchive: 'include', executorGuide: 'summary', archiveCard: 'include' },
    data: { assetKind: 'wallet', nameHint: '测试钱包', assetDescription: '有 USDT', accountOrAddressHint: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', materialLocation: '备用手机', accessHintLocation: '保险柜蓝色信封', handlingInstruction: '', contactCardId: null, notes: '' }
  });
  const archiveCardHtml = app.archiveCardPrintHtml();
  assert.match(archiveCardHtml, /测试平台/);
  assert.match(archiveCardHtml, /测试钱包/);
  assert.doesNotMatch(archiveCardHtml, /Abc123|778899/);
  assert.doesNotMatch(archiveCardHtml, /aaaaaaaaaaaaaaaa/);
  assert.doesNotMatch(source, /此卡片类型不支持进入人生存档卡/);

  // 3. 保存后再修改但不保存：重开恢复修改前的最后保存版本。
  app.state.archive.archiveTitle = '未保存版本二';
  app.markChanged();
  assert.equal(app.state.isDirty, true);
  assert.equal(app.completionChecks().find(item => item.key === 'formalArchive').done, false);
  assert.equal(app.completionChecks().find(item => item.key === 'formalArchive').status, 'warning');
  app = runtime(storage);
  assert.equal(app.loadLocalArchive(), true);
  assert.equal(app.state.archive.archiveTitle, '已保存版本一');

  // 4. 两种 .life 均能生成和读取；未加密格式明确标识，原加密流程可解密。
  const plain = app.createPlainLifeFile();
  assert.equal(plain.life.backupType, 'unencrypted-v1');
  const plainRead = await app.readLifeFile(new Blob([JSON.stringify(plain.life)]), '');
  assert.equal(plainRead.encrypted, false);
  assert.equal(plainRead.archive.archiveTitle, '已保存版本一');
  const encrypted = await app.createLifeFile('TestArchive#2026');
  assert.equal(encrypted.life.encryptionVersion, 'aes-gcm-pbkdf2-v1');
  const encryptedRead = await app.readLifeFile(new Blob([JSON.stringify(encrypted.life)]), 'TestArchive#2026');
  assert.equal(encryptedRead.encrypted, true);
  assert.equal(encryptedRead.archive.archiveTitle, '已保存版本一');

  // 10. 短密码、中文符号和超过旧上限的密码均可备份恢复，空格按原样处理。
  for (const password of ['1', '中文🔑！', ' 长密码'.repeat(50) + ' ']) {
    const backup = await app.createLifeFile(password);
    const restored = await app.readLifeFile(new Blob([JSON.stringify(backup.life)]), password);
    assert.equal(restored.archive.archiveTitle, '已保存版本一');
    await assert.rejects(app.readLifeFile(new Blob([JSON.stringify(backup.life)]), password + '错'), /无法解密/);
  }

  // 5. 导入只替换当前内存：模拟导入后，正式本机快照字节不变，重开仍恢复原版本。
  const storedBeforeImport = storage.get(SAVED_KEY);
  const importedArchive = plainRead.archive;
  importedArchive.archiveTitle = '仅导入到内存';
  app.state.archive = importedArchive;
  app.state.editingMode = 'importedTemporary';
  app.state.isDirty = true;
  assert.equal(storage.get(SAVED_KEY), storedBeforeImport);
  app = runtime(storage);
  assert.equal(app.loadLocalArchive(), true);
  assert.equal(app.state.archive.archiveTitle, '已保存版本一');

  // 11. 打开/取消备份不保存；包括已有快照、导入内存、密码表单和风险确认。
  for (const saved of [false, true]) {
    const backupStorage = new Map(); const backupApp = runtime(backupStorage);
    if (saved) { backupApp.state.archive.archiveTitle = '最后保存版本'; backupApp.saveLocalArchive({ announce: false }); }
    backupApp.rememberUserNotice(); backupApp.bind();
    const snapshot = backupStorage.get(SAVED_KEY);
    backupApp.state.archive.archiveTitle = '取消备份的临时修改'; backupApp.markChanged();
    backupApp.state.editingMode = 'importedTemporary';
    for (const choice of [null, '[data-encrypted-backup]', '[data-plain-backup]']) {
      backupApp.openBackupDialog(); const dialog = backupApp.document.querySelector('#export-dialog');
      if (choice) dialog.querySelector(choice).onclick();
      dialog.querySelector('[data-close]').onclick();
      assert.equal(backupStorage.get(SAVED_KEY), snapshot);
      assert.equal(backupApp.state.isDirty, true);
      assert.equal(backupApp.state.editingMode, 'importedTemporary');
      const event = { prevented: false, preventDefault() { this.prevented = true; } };
      backupApp.handlers.beforeunload(event); assert.equal(event.prevented, true);
    }
    const reopened = runtime(backupStorage); reopened.loadLocalArchive();
    assert.equal(reopened.state.archive.archiveTitle, saved ? '最后保存版本' : '');

    // 加密尚在计算时取消并重新打开，旧任务不得保存或下载。
    backupApp.openBackupDialog(); const dialog = backupApp.document.querySelector('#export-dialog');
    dialog.querySelector('[data-encrypted-backup]').onclick();
    const pendingForm = dialog.querySelector('form'); pendingForm.testData = { password: '1', confirmation: '1' };
    const pending = pendingForm.onsubmit({ currentTarget: pendingForm, preventDefault() {} });
    dialog.querySelector('[data-close]').onclick(); backupApp.openBackupDialog();
    await pending;
    assert.equal(backupStorage.get(SAVED_KEY), snapshot); assert.equal(backupApp.state.isDirty, true);
    assert.equal(backupApp.document.downloads.length, 0);
  }

  // 12. 两种方式仅在最终确认后保存；未确认风险/密码不一致均不保存。
  for (const encryptedMode of [false, true]) {
    const backupStorage = new Map(); const backupApp = runtime(backupStorage);
    backupApp.rememberUserNotice(); backupApp.bind();
    backupApp.state.archive.archiveTitle = '确认备份的内容'; backupApp.markChanged(); backupApp.openBackupDialog();
    const dialog = backupApp.document.querySelector('#export-dialog');
    dialog.querySelector(encryptedMode ? '[data-encrypted-backup]' : '[data-plain-backup]').onclick();
    const form = dialog.querySelector('form');
    form.testData = { password: '1', confirmation: '2' };
    await form.onsubmit({ currentTarget: form, preventDefault() {} });
    assert.equal(backupStorage.has(SAVED_KEY), false); assert.equal(backupApp.state.isDirty, true);
    form.testData.confirmation = '1'; dialog.querySelector('[data-plain-risk]').checked = true;
    await form.onsubmit({ currentTarget: form, preventDefault() {} });
    assert.equal(backupApp.state.isDirty, false); assert.equal(backupApp.document.downloads.length, 1);
    const event = { prevented: false, preventDefault() { this.prevented = true; } };
    backupApp.handlers.beforeunload(event); assert.equal(event.prevented, false);
    const reopened = runtime(backupStorage); assert.equal(reopened.loadLocalArchive(), true);
    assert.equal(reopened.state.archive.archiveTitle, '确认备份的内容');
  }

  // 13. 清空也只修改内存：取消不改动；确认后保留旧快照、保存时间和离开提醒。
  for (const saved of [false, true]) {
    const clearStorage = new Map(); const clearApp = runtime(clearStorage);
    const input = new FormData(); input.set('platform1', '清空流程测试账号');
    clearApp.applyQuickStart(input);
    if (saved) clearApp.saveLocalArchive({ announce: false });
    clearApp.rememberUserNotice(); clearApp.bind();
    const snapshot = clearStorage.get(SAVED_KEY);
    const saveState = JSON.stringify(clearApp.state.localSaveState);
    const beforeClear = JSON.stringify(clearApp.state);
    clearApp.openClearDialog(); let dialog = clearApp.document.querySelector('#clear-dialog');
    dialog.querySelector('[data-close]').onclick();
    assert.equal(JSON.stringify(clearApp.state), beforeClear);
    clearApp.openClearDialog(); dialog = clearApp.document.querySelector('#clear-dialog');
    dialog.querySelector('form').onsubmit({ preventDefault() {} });
    assert.equal(JSON.stringify(clearApp.state), beforeClear);
    dialog.querySelector('[data-clear-confirm]').checked = true;
    dialog.querySelector('form').onsubmit({ preventDefault() {} });
    assert.equal(Object.values(clearApp.state.archive.modules).flatMap(m => m.cards).length, 0);
    assert.equal(clearApp.state.isDirty, true);
    assert.equal(JSON.stringify(clearApp.state.localSaveState), saveState);
    assert.equal(clearStorage.get(SAVED_KEY), snapshot);
    assert.equal(clearApp.hasSeenUserNotice(), true);
    const leave = { prevented:false, preventDefault(){ this.prevented = true; } };
    clearApp.handlers.beforeunload(leave); assert.equal(leave.prevented, true);
    // 清空后只打开并取消备份，仍不提交清空结果。
    clearApp.openBackupDialog(); clearApp.document.querySelector('#export-dialog').querySelector('[data-close]').onclick();
    assert.equal(clearStorage.get(SAVED_KEY), snapshot); assert.equal(clearApp.state.isDirty, true);
    const reopened = runtime(clearStorage); reopened.loadLocalArchive();
    assert.equal(Object.values(reopened.state.archive.modules).flatMap(m => m.cards).length, saved ? 1 : 0);
    // 本机保存失败时，不能吞掉未保存提醒或改变旧快照。
    const originalSet = clearStorage.set;
    clearStorage.set = () => { throw new Error('Storage unavailable'); };
    assert.equal(clearApp.saveLocalArchive({announce:false}), false);
    assert.equal(clearApp.state.isDirty, true); assert.equal(clearStorage.get(SAVED_KEY), snapshot);
    clearStorage.set = originalSet;
    assert.equal(clearApp.saveLocalArchive({announce:false}), true);
    const savedBlank = runtime(clearStorage); assert.equal(savedBlank.loadLocalArchive(), true);
    assert.equal(Object.values(savedBlank.state.archive.modules).flatMap(m => m.cards).length, 0);
    assert.equal(clearApp.state.isDirty, false);
  }

  // 14. 清空后的两种备份，只有最终确认才保存空白版本。
  for (const encryptedMode of [false, true]) {
    const clearStorage = new Map(); const clearApp = runtime(clearStorage);
    const input = new FormData(); input.set('platform1', '需要恢复的旧卡片');
    clearApp.applyQuickStart(input); clearApp.saveLocalArchive({announce:false});
    clearApp.state.editingMode = 'importedTemporary';
    clearApp.openClearDialog(); const clearDialog = clearApp.document.querySelector('#clear-dialog');
    clearDialog.querySelector('[data-clear-confirm]').checked = true;
    clearDialog.querySelector('form').onsubmit({preventDefault(){}});
    clearApp.openBackupDialog(); const dialog = clearApp.document.querySelector('#export-dialog');
    dialog.querySelector(encryptedMode ? '[data-encrypted-backup]' : '[data-plain-backup]').onclick();
    const form = dialog.querySelector('form'); form.testData = {password:'1',confirmation:'1'};
    dialog.querySelector('[data-plain-risk]').checked = true;
    await form.onsubmit({currentTarget:form,preventDefault(){}});
    assert.equal(clearApp.state.isDirty, false); assert.equal(clearApp.document.downloads.length, 1);
    const reopened = runtime(clearStorage); assert.equal(reopened.loadLocalArchive(), true);
    assert.equal(Object.values(reopened.state.archive.modules).flatMap(m => m.cards).length, 0);
  }

  console.log('PASS 13 清空未保存保留旧快照及离开提醒，明确保存后才提交空白版本');
  console.log('PASS 14 清空后加密/未加密备份最终确认才保存空白版本');
  console.log('PASS 11 取消各阶段备份保留未保存状态、离开提醒和原快照');
  console.log('PASS 12 确认加密/未加密备份后才保存并下载');
  console.log('PASS 1 未保存关闭后为空');
  console.log('PASS 2 保存后重新打开可恢复');
  console.log('PASS 3 未保存修改不会覆盖最后保存版本');
  console.log('PASS 4 加密/未加密 .life 均可生成和读取');
  console.log('PASS 5 导入 .life 不自动覆盖本机正式存档');
  console.log('PASS 6 人生存档卡覆盖全部类型并过滤疑似真实凭据');
  console.log('PASS 7 用户须知首次显示状态可被单独记住');
  console.log('PASS 8 快速开始允许空表单、部分填写并避免重复');
  console.log('PASS 9 检查页固定五项并区分保存状态');
  console.log('PASS 10 不同长度和字符的密码均可备份恢复，错误密码仍被拒绝');
})().catch(error => { console.error(error); process.exitCode = 1; });
