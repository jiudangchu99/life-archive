/* 人生存档 V1：用户主动本机保存、.life 备份与本地打印导出。 */
(() => {
  'use strict';

  const LOCAL_ARCHIVE_KEY = 'life-archive.saved-local-archive.v1';
  const LEGACY_DRAFT_KEY = 'life-archive.local-cleartext-draft.v1';
  const USER_NOTICE_KEY = 'life-archive.user-notice-seen.v1';
  const FEEDBACK_EMAIL = 'renshengcundang@163.com';
  const moduleMeta = {
    digitalWorld: { title: '我的数字世界', description: '账号、数字资产、作品和设备都在这里整理。', icon: '◎' },
    realWorld: { title: '我的现实世界', description: '资料、物品、资产线索与重要文件。', icon: '◇' },
    peopleAndMatters: { title: '我在乎的人和事', description: '宠物、纪念、作品与特别安排。', icon: '♡' },
    ifOneDay: { title: '如果有一天', description: '联系人、执行人和交接事项。', icon: '✦' }
  };
  const referenceRules = {
    responsibleExecutorContactId: { module: 'ifOneDay', types: ['contact'] },
    contactCardId: { module: 'ifOneDay', types: ['contact'] },
    temporaryCarerContactCardId: { module: 'ifOneDay', types: ['contact'] },
    primaryCarerContactCardId: { module: 'ifOneDay', types: ['contact'] },
    responsibleContactCardId: { module: 'ifOneDay', types: ['contact'] },
    handoverContactCardId: { module: 'ifOneDay', types: ['contact'] },
    targetCardId: { module: 'digitalWorld', types: ['socialAccount', 'emailOrCloudDrive', 'gameAccount', 'subscription', 'digitalAsset'] },
    petCardId: { module: 'peopleAndMatters', types: ['pet'] }
  };

  const cardTypes = {
    digitalWorld: {
      socialAccount: ['社交账号', [['platformName', '平台名称'], ['accountName', '账号名称'], ['passwordLocation', '密码保存位置'], ['twoFactorLocation', '双重验证位置'], ['recoveryMethod', '恢复方式'], ['handlingInstruction', '处理建议', 'textarea'], ['notes', '备注', 'textarea']]],
      emailOrCloudDrive: ['邮箱与云盘', [['serviceName', '服务名称'], ['accountHint', '账号标识'], ['purpose', '用途'], ['importantContentHint', '重要内容提示'], ['passwordLocation', '密码保存位置'], ['recoveryMethod', '恢复方式'], ['handlingInstruction', '处理建议', 'textarea'], ['notes', '备注', 'textarea']]],
      gameAccount: ['游戏账号', [['platformName', '平台名称'], ['accountName', '账号名称'], ['assetHint', '资产说明'], ['passwordLocation', '密码保存位置'], ['handlingInstruction', '处理建议', 'textarea'], ['contactCardId', '负责执行人', 'contactRef'], ['notes', '备注', 'textarea']]],
      digitalAsset: ['数字资产', [['assetKind', '数字资产类型', 'digitalAssetKind'], ['nameHint', '平台、钱包或项目名称'], ['assetDescription', '资产说明', 'textarea'], ['accountOrAddressHint', '账号或公开地址提示'], ['materialLocation', '相关资料或设备位置'], ['accessHintLocation', '登录或恢复线索位置（不要填写密码、私钥或助记词）', 'passwordHintLocation'], ['handlingInstruction', '处理建议', 'textarea'], ['contactCardId', '负责执行人', 'contactRef'], ['notes', '备注', 'textarea']]],
      digitalWork: ['数字作品', [['workName', '作品名称'], ['storageLocation', '存放位置'], ['ownershipNote', '权属说明'], ['recipientHint', '希望交给的人'], ['preservationInstruction', '保留方式', 'textarea'], ['notes', '备注', 'textarea']]],
      deviceInfo: ['设备信息', [['deviceName', '设备名称'], ['deviceLocation', '设备位置'], ['importantDataLocation', '重要资料位置'], ['unlockHintLocation', '解锁提示位置'], ['handoverInstruction', '交接说明', 'textarea'], ['notes', '备注', 'textarea']]],
      subscription: ['会员订阅', [['serviceName', '服务名称'], ['renewalStatus', '续费状态'], ['paymentHint', '扣费方式线索'], ['cancellationMethod', '取消方式'], ['handlingInstruction', '处理建议', 'textarea'], ['contactCardId', '负责执行人', 'contactRef'], ['notes', '备注', 'textarea']]]
    },
    realWorld: {
      bankOrPaymentAccount: ['银行/支付账户', [['institutionName', '机构名称'], ['accountPurpose', '账户用途'], ['identifierHint', '账户标识提示'], ['documentLocation', '资料位置'], ['contactHint', '联系线索'], ['handlingInstruction', '处理方式', 'textarea'], ['notes', '备注', 'textarea']]],
      investment: ['投资资料', [['institutionName', '机构名称'], ['productName', '产品名称'], ['documentLocation', '资料位置'], ['contactHint', '联系线索'], ['dateHint', '日期提示'], ['handlingInstruction', '处理方式', 'textarea'], ['notes', '备注', 'textarea']]],
      insurance: ['保险资料', [['institutionName', '保险机构'], ['productName', '产品名称'], ['identifierHint', '保单标识提示'], ['documentLocation', '资料位置'], ['serviceContactHint', '服务线索'], ['handlingInstruction', '处理方式', 'textarea'], ['notes', '备注', 'textarea']]],
      loanOrDebt: ['借款与贷款', [['itemName', '事项名称'], ['relatedPartyHint', '相关方线索'], ['contractLocation', '合同位置'], ['repaymentMaterialLocation', '还款资料位置'], ['handlingInstruction', '处理方式', 'textarea'], ['notes', '备注', 'textarea']]],
      property: ['房产资料', [['assetName', '资产名称'], ['identifierHint', '识别提示'], ['documentLocation', '证件位置'], ['contractLocation', '合同位置'], ['handlingInstruction', '处理方式', 'textarea'], ['notes', '备注', 'textarea']]],
      vehicle: ['车辆资料', [['assetName', '车辆名称'], ['identifierHint', '识别提示'], ['documentLocation', '证件位置'], ['contractLocation', '合同位置'], ['handlingInstruction', '处理方式', 'textarea'], ['notes', '备注', 'textarea']]],
      contractOrDocument: ['合同与文件', [['documentName', '文件名称'], ['documentType', '文件类别'], ['physicalLocation', '原件位置'], ['digitalLocation', '电子副本位置'], ['validUntil', '有效期', 'date'], ['handoverContactCardId', '负责执行人', 'contactRef'], ['notes', '备注', 'textarea']]],
      identityDocument: ['证件', [['documentName', '证件名称'], ['documentType', '证件类别'], ['physicalLocation', '原件位置'], ['digitalLocation', '电子副本位置'], ['validUntil', '有效期', 'date'], ['handoverContactCardId', '负责执行人', 'contactRef'], ['notes', '备注', 'textarea']]],
      valuableItem: ['贵重物品', [['itemName', '物品名称'], ['storageLocation', '存放位置'], ['proofLocation', '购买凭证位置'], ['valuationHint', '估值参考'], ['recipientHint', '希望交给的人'], ['notes', '备注', 'textarea']]],
      fileLocation: ['文件存放位置', [['fileCategory', '文件类别'], ['physicalLocation', '实体位置'], ['digitalLocation', '电子位置'], ['responsibleContactCardId', '负责人', 'contactRef'], ['notes', '备注', 'textarea']]]
    },
    peopleAndMatters: {
      pet: ['宠物', [['name', '宠物名称'], ['species', '种类'], ['careRoutine', '日常习惯', 'textarea'], ['medicalRecordLocation', '医疗资料位置'], ['temporaryCarerContactCardId', '临时照护联系人', 'contactRef'], ['longTermArrangement', '长期安排', 'textarea'], ['suppliesLocation', '用品位置'], ['notes', '备注', 'textarea']]],
      plant: ['植物', [['name', '植物名称'], ['location', '所在位置'], ['careFrequency', '养护频率'], ['specialCareNote', '特殊注意事项', 'textarea'], ['recipientHint', '接手人'], ['notes', '备注', 'textarea']]],
      keepsake: ['纪念品', [['itemName', '物品名称'], ['meaning', '意义说明', 'textarea'], ['storageLocation', '存放位置'], ['recipientHint', '希望交给的人'], ['message', '附言', 'textarea'], ['notes', '备注', 'textarea']]],
      giftIntention: ['想赠予的人', [['recipientHint', '对象称呼'], ['itemOrMaterial', '赠予物品/资料'], ['handoverCondition', '交接条件'], ['contactSuggestion', '联系建议'], ['message', '留言', 'textarea'], ['notes', '备注', 'textarea']]],
      importantPhoto: ['重要照片', [['albumName', '相册名称'], ['primaryLocation', '主存放位置'], ['backupLocation', '备份位置'], ['preservationInstruction', '保留方式', 'textarea'], ['sharingRecipientHint', '共享对象'], ['notes', '备注', 'textarea']]],
      importantWork: ['重要作品', [['workName', '作品名称'], ['storageLocation', '存放位置'], ['ownershipNote', '权属说明'], ['preservationInstruction', '保留/发布方式', 'textarea'], ['responsibleContactCardId', '负责人', 'contactRef'], ['notes', '备注', 'textarea']]],
      specialArrangement: ['特殊安排', [['itemName', '事项名称'], ['background', '背景说明', 'textarea'], ['steps', '执行步骤', 'textarea'], ['materialLocation', '资料位置'], ['responsibleContactCardId', '负责人', 'contactRef'], ['notes', '备注', 'textarea']]]
    },
    ifOneDay: {
      contact: ['联系人', [['displayName', '姓名或称呼'], ['relationship', '与你的关系'], ['contactMethods', '联系方式', 'contactMethods'], ['notes', '备注', 'textarea']]],
      roleAssignment: ['执行人安排', [['role', '角色', 'role'], ['contactCardId', '关联联系人', 'contactRef'], ['responsibilities', '可协助事项 / 职责范围', 'textList'], ['notes', '备注', 'textarea']]],
      accountHandling: ['账号处理', [['serviceName', '账号/服务'], ['targetCardId', '关联账号卡片', 'accountRef'], ['decision', '处理决定', 'decision'], ['reason', '处理原因', 'textarea'], ['responsibleContactCardId', '负责人', 'contactRef'], ['instructionLocation', '操作提示位置'], ['notes', '备注', 'textarea']]],
      privacyCleanup: ['隐私清理', [['itemName', '清理事项'], ['materialLocation', '资料位置'], ['action', '处理动作', 'textarea'], ['responsibleContactCardId', '负责人', 'contactRef'], ['priority', '优先级', 'priority'], ['notes', '备注', 'textarea']]],
      petFinalArrangement: ['宠物最终安排', [['petCardId', '关联宠物', 'petRef'], ['primaryCarerContactCardId', '优先照护人', 'contactRef'], ['backupPlan', '备用方案', 'textarea'], ['materialLocation', '资料位置'], ['notes', '备注', 'textarea']]],
      finalMessage: ['最后留言', [['recipientHint', '留言对象'], ['message', '留言正文', 'textarea'], ['notes', '备注', 'textarea']]],
      archiveAccess: ['正式存档获取线索', [['archiveLocation', '正式 .life 存放位置/获取线索', 'textarea'], ['passwordHintLocation', '密码获取提示位置（不要填写真实密码）', 'passwordHintLocation']]]
    }
  };

  const taskModules = ['digitalWorld', 'realWorld', 'peopleAndMatters'];
  // 旧字段仅用于兼容读取与保留未确认的旧安排，不再作为新卡片输入项。
  const legacyResponsibilityNames = { gameAccount: 'contactCardId', digitalAsset: 'contactCardId', subscription: 'contactCardId', contractOrDocument: 'handoverContactCardId', identityDocument: 'handoverContactCardId', fileLocation: 'responsibleContactCardId', pet: 'temporaryCarerContactCardId', plant: 'recipientHint', importantWork: 'responsibleContactCardId', specialArrangement: 'responsibleContactCardId' };
  const legacyResponsibilityFields = {};
  // 事项本身的服务方、借贷相关方与赠予对象不是负责执行人，保留原数据字段。
  const outsideContactLabels = { bankOrPaymentAccount: ['contactHint', '机构联系线索'], investment: ['contactHint', '机构联系线索'], insurance: ['serviceContactHint', '保险服务联系线索'], loanOrDebt: ['relatedPartyHint', '借贷相关方线索'], giftIntention: ['contactSuggestion', '赠予对象联系建议'] };
  for (const module of taskModules) for (const [type, config] of Object.entries(cardTypes[module])) {
    const outsideContact = outsideContactLabels[type];
    if (outsideContact) config[1].find(field => field[0] === outsideContact[0])[1] = outsideContact[1];
    const legacyName = legacyResponsibilityNames[type];
    if (legacyName) legacyResponsibilityFields[type] = config[1].find(field => field[0] === legacyName);
    config[1] = config[1].filter(field => field[0] !== legacyName);
    config[1].push(['responsibleExecutorContactId', '负责执行人（可选）', 'executorRef']);
  }

  const ARCHIVE_CARD_SENSITIVE_TYPES = new Set(['socialAccount', 'emailOrCloudDrive', 'gameAccount', 'digitalAsset', 'deviceInfo', 'subscription', 'bankOrPaymentAccount', 'investment', 'insurance', 'loanOrDebt', 'property', 'vehicle', 'contractOrDocument', 'identityDocument', 'valuableItem', 'fileLocation', 'archiveAccess', 'accountHandling', 'privacyCleanup']);
  const now = () => new Date().toISOString();
  const lifeFilename = (date = new Date()) => { const pad = value => String(value).padStart(2, '0'); return `人生存档_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}.life`; };
  const uid = () => crypto.randomUUID();
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const utf8 = new TextEncoder();
  const utf8Decoder = new TextDecoder();
  const CANNOT_DECRYPT_MESSAGE = '无法解密该存档：密码不正确，或文件已损坏、被修改。';
  const KDF_PARAMETERS = { kdfVersion: 'pbkdf2-v1', hash: 'SHA-256', iterations: 600000, derivedKeyLength: 256 };
  const MAX_LIFE_BYTES = 2 * 1024 * 1024;
  const MAX_PAYLOAD_BYTES = 1024 * 1024;
  const MAX_CIPHERTEXT_BYTES = MAX_PAYLOAD_BYTES + 16;
  const bytesToBase64 = bytes => { let text = ''; for (const byte of bytes) text += String.fromCharCode(byte); return btoa(text); };
  const strictBase64Bytes = value => { if (typeof value !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return null; try { const binary = atob(value); const bytes = Uint8Array.from(binary, char => char.charCodeAt(0)); return bytesToBase64(bytes) === value ? bytes : null; } catch (_) { return null; } };
  const randomBytes = length => { const bytes = new Uint8Array(length); crypto.getRandomValues(bytes); return bytes; };
  const cryptoReady = () => Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const exactKeys = (value, keys) => Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
  const validUtc = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
  const emptyModule = () => ({ moduleVersion: '1.0.0', updatedAt: now(), cards: [] });
  const createArchive = () => ({ schemaVersion: '1.0.0', archiveId: uid(), archiveTitle: '', ownerDisplayName: '', createdAt: now(), updatedAt: now(), exportedAt: null, modules: { digitalWorld: emptyModule(), realWorld: emptyModule(), peopleAndMatters: emptyModule(), ifOneDay: emptyModule() } });

  const state = { archive: createArchive(), editingMode: 'memoryTemporary', isDirty: false, deleted: [], currentView: 'home', localSaveState: { hasSaved: false, lastSavedAt: null }, saveReminderShown: false, formalExportState: { hasExportedLife: false, lastExportedAt: null, safeDefaultFilename: '人生存档_YYYY-MM-DD_HHmm.life' } };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const workspace = $('#workspace');
  const toast = $('#toast');
  let activePrintFrame = null;
  let printReturnFocus = null;

  function allCards() { return Object.entries(state.archive.modules).flatMap(([module, data]) => data.cards.map(card => ({ module, card }))); }
  function contacts() { return state.archive.modules.ifOneDay.cards.filter(card => card.type === 'contact' && card.status === 'active'); }
  function executorContactIds(archive = state.archive) {
    const cards = archive.modules.ifOneDay.cards;
    const contactIds = new Set(cards.filter(card => card.type === 'contact' && card.status === 'active').map(card => card.id));
    return new Set(cards.filter(card => card.type === 'roleAssignment' && card.status === 'active' && card.data.role === 'executor' && contactIds.has(card.data.contactCardId)).map(card => card.data.contactCardId));
  }
  function executorContacts() { const ids = executorContactIds(); return contacts().filter(card => ids.has(card.id)); }
  function contactOptionLabel(card) {
    const name = card.data.displayName || card.title;
    const sameNames = contacts().filter(item => (item.data.displayName || item.title) === name);
    return sameNames.length > 1 ? `${name}（${card.data.relationship || '联系人'} · ${card.id}）` : name;
  }
  function normalizeRelationships(archive) {
    if (!isStructurallyUsableArchive(archive)) throw new Error('存档字段结构不受支持，原文件不会被修改。');
    const result = JSON.parse(JSON.stringify(archive)); const executors = executorContactIds(result);
    if (!Object.prototype.hasOwnProperty.call(result, 'ownerDisplayName')) result.ownerDisplayName = '';
    for (const module of taskModules) for (const card of result.modules[module].cards) {
      if (!Object.prototype.hasOwnProperty.call(card.data, 'responsibleExecutorContactId')) card.data.responsibleExecutorContactId = null;
      const legacy = legacyResponsibilityFields[card.type];
      if (!legacy || !Object.prototype.hasOwnProperty.call(card.data, legacy[0])) continue;
      const value = card.data[legacy[0]];
      if (!value) { delete card.data[legacy[0]]; continue; }
      if (legacy[2] === 'contactRef' && executors.has(value) && (!card.data.responsibleExecutorContactId || card.data.responsibleExecutorContactId === value)) {
        card.data.responsibleExecutorContactId = value; delete card.data[legacy[0]];
      }
    }
    return result;
  }
  function referencedOptions(kind, selected) {
    let list = [];
    if (kind === 'contactRef') list = contacts();
    if (kind === 'executorRef') list = executorContacts();
    if (kind === 'petRef') list = state.archive.modules.peopleAndMatters.cards.filter(card => card.type === 'pet' && card.status === 'active');
    if (kind === 'accountRef') list = state.archive.modules.digitalWorld.cards.filter(card => ['socialAccount', 'emailOrCloudDrive', 'gameAccount', 'subscription'].includes(card.type) && card.status === 'active');
    return `<option value="">${kind === 'executorRef' ? '暂不指定' : '暂不关联'}</option>${list.map(card => `<option value="${card.id}" ${card.id === selected ? 'selected' : ''}>${escapeHtml(card.type === 'contact' ? contactOptionLabel(card) : card.title)}</option>`).join('')}`;
  }
  function policy(type = '') {
    const executorSummary = ['socialAccount', 'emailOrCloudDrive', 'gameAccount', 'digitalAsset', 'digitalWork', 'deviceInfo', 'subscription', 'bankOrPaymentAccount', 'investment', 'insurance', 'loanOrDebt', 'property', 'vehicle', 'contractOrDocument', 'identityDocument', 'valuableItem', 'fileLocation', 'pet', 'plant', 'keepsake', 'giftIntention', 'importantPhoto', 'importantWork', 'specialArrangement'];
    const executorInclude = ['archiveAccess', 'contact', 'roleAssignment', 'accountHandling', 'privacyCleanup', 'petFinalArrangement'];
    return { fullArchive: 'include', executorGuide: executorInclude.includes(type) ? 'include' : executorSummary.includes(type) ? 'summary' : 'exclude', archiveCard: 'exclude' };
  }
  function isStructurallyUsableArchive(archive) {
    const allowedPolicies = ['include', 'summary', 'exclude'];
    const rootFields = ['schemaVersion', 'archiveId', 'archiveTitle', 'createdAt', 'updatedAt', 'exportedAt', 'modules'];
    if (archive && Object.prototype.hasOwnProperty.call(archive, 'ownerDisplayName')) {
      if (typeof archive.ownerDisplayName !== 'string') return false;
      rootFields.push('ownerDisplayName');
    }
    const moduleFields = ['moduleVersion', 'updatedAt', 'cards'];
    const cardFields = ['id', 'type', 'title', 'createdAt', 'updatedAt', 'status', 'exportPolicy', 'data'];
    const policyFields = ['fullArchive', 'executorGuide', 'archiveCard'];
    if (!exactKeys(archive, rootFields) || archive.schemaVersion !== '1.0.0' || !UUID_PATTERN.test(archive.archiveId) || typeof archive.archiveTitle !== 'string' || !validUtc(archive.createdAt) || !validUtc(archive.updatedAt) || !(archive.exportedAt === null || validUtc(archive.exportedAt)) || !exactKeys(archive.modules, Object.keys(moduleMeta))) return false;
    return Object.keys(moduleMeta).every(module => {
      const item = archive.modules[module];
      if (!exactKeys(item, moduleFields) || item.moduleVersion !== '1.0.0' || !validUtc(item.updatedAt) || !Array.isArray(item.cards)) return false;
      return item.cards.every(card => {
        if (!exactKeys(card, cardFields) || !UUID_PATTERN.test(card.id) || typeof card.title !== 'string' || !validUtc(card.createdAt) || !validUtc(card.updatedAt) || !['active', 'archived'].includes(card.status) || !cardTypes[module][card.type] || !exactKeys(card.exportPolicy, policyFields) || !policyFields.every(name => allowedPolicies.includes(card.exportPolicy[name]))) return false;
        const fields = [...cardTypes[module][card.type][1]];
        const legacy = taskModules.includes(module) && legacyResponsibilityFields[card.type];
        if (legacy) fields.push(legacy);
        const required = cardTypes[module][card.type][1].filter(([name]) => name !== 'responsibleExecutorContactId');
        if (!card.data || typeof card.data !== 'object' || Array.isArray(card.data) || required.some(([name]) => !(name in card.data)) || Object.keys(card.data).some(name => !fields.some(field => field[0] === name))) return false;
        return fields.every(([name, , kind]) => {
          if (!(name in card.data)) return true;
          const value = card.data[name];
          if (kind === 'contactRef' || kind === 'executorRef' || kind === 'petRef' || kind === 'accountRef') return value === null || typeof value === 'string';
          if (kind === 'date') return value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
          if (kind === 'contactMethods') return Array.isArray(value) && value.length <= 3 && value.every(method => exactKeys(method, ['kind', 'value', 'note']) && ['phone', 'email', 'other'].includes(method.kind) && typeof method.value === 'string' && typeof method.note === 'string');
          if (kind === 'textList') return Array.isArray(value) && value.every(item => typeof item === 'string');
          if (kind === 'role') return ['primaryContact', 'backupContact', 'executor'].includes(value);
          if (kind === 'decision') return ['keep', 'delete', 'handover'].includes(value);
          if (kind === 'priority') return ['normal', 'high'].includes(value);
          if (kind === 'digitalAssetKind') return ['exchange', 'wallet', 'nft', 'other'].includes(value);
          return typeof value === 'string';
        });
      });
    });
  }
  function saveLocalArchive({ announce = true } = {}) {
    const savedAt = now(); const record = { storageVersion: '1.0.0', savedAt, archive: state.archive };
    try {
      localStorage.setItem(LOCAL_ARCHIVE_KEY, JSON.stringify(record));
      state.localSaveState = { hasSaved: true, lastSavedAt: savedAt }; state.editingMode = 'localSaved'; state.isDirty = false; updateChrome();
      if (announce) showToast('人生存档已保存到当前电脑和当前浏览器，下次打开会自动恢复。');
      return true;
    } catch (_) { updateChrome(); showToast('浏览器无法保存人生存档。当前修改仍是未保存临时内容。'); return false; }
  }
  function loadLocalArchive() {
    try {
      const record = JSON.parse(localStorage.getItem(LOCAL_ARCHIVE_KEY) || 'null');
      if (exactKeys(record, ['storageVersion', 'savedAt', 'archive']) && record.storageVersion === '1.0.0' && validUtc(record.savedAt) && isStructurallyUsableArchive(record.archive)) {
        const archive = normalizeRelationships(record.archive);
        if (validateArchiveContent(archive)) return false;
        state.archive = archive; state.localSaveState = { hasSaved: true, lastSavedAt: record.savedAt }; state.editingMode = 'localSaved'; state.isDirty = false; return true;
      }
    } catch (_) { /* 无法读取的本机存档不影响打开初始空白状态。 */ }
    return false;
  }
  function meaningfulCardCount() { return allCards().filter(({ card }) => card.status === 'active' && Object.values(card.data).some(value => Array.isArray(value) ? value.length : typeof value === 'string' ? value.trim() : Boolean(value))).length; }
  function scheduleLocalSaveReminder() {
    if (state.localSaveState.hasSaved || state.saveReminderShown || meaningfulCardCount() < 2) return;
    state.saveReminderShown = true;
    setTimeout(() => { if (!state.localSaveState.hasSaved) showToast('你已经整理了一些有效内容。建议点击“保存人生存档”，保存到当前电脑和浏览器。'); }, 900);
  }
  function markChanged() { state.archive.updatedAt = now(); state.isDirty = true; scheduleLocalSaveReminder(); updateChrome(); }
  function updateChrome() {
    const ownerName = (state.archive.ownerDisplayName || '').trim();
    $('[data-owner-name]').textContent = ownerName || '未设置';
    $('[data-edit-owner]').textContent = ownerName ? '编辑' : '设置';
    const savedTime = state.localSaveState.lastSavedAt ? new Date(state.localSaveState.lastSavedAt).toLocaleString('zh-CN', { hour12: false }) : '';
    const label = state.isDirty ? state.editingMode === 'importedTemporary' ? '导入内容未保存' : '未保存临时内容' : state.localSaveState.hasSaved ? '本机已保存' : '未保存临时内容';
    const detail = state.isDirty ? state.localSaveState.hasSaved ? `上次保存于 ${savedTime}` : '刷新或关闭后将丢失' : state.localSaveState.hasSaved ? `保存于 ${savedTime}` : '尚未开始';
    $('.editing-state').innerHTML = `<span class="state-dot" aria-hidden="true"></span>${label} <span>· ${detail}</span>`;
    const checks = completionChecks(); const percent = Math.round(Object.keys(moduleMeta).reduce((total, module) => total + moduleProgress(module), 0) / Object.keys(moduleMeta).length);
    $('.progress-ring span').innerHTML = `${percent}<small>%</small>`;
    $('.progress-orbit').setAttribute('aria-label', `人生存档完成度 ${percent}%`);
    const checkStates = new Map(checks.map(item => [item.key, item.status]));
    $$('[data-home-check]').forEach(item => {
      const indicator = item.querySelector('span'); const status = checkStates.get(item.dataset.homeCheck) || 'neutral';
      indicator.className = status === 'done' ? 'done-check' : status === 'warning' ? 'warning-check' : 'empty-check'; indicator.textContent = status === 'done' ? '✓' : status === 'warning' ? '!' : '';
    });
    $$('.module-card').forEach(element => { const key = element.dataset.module; const count = state.archive.modules[key].cards.filter(card => card.status === 'active' && !(key === 'ifOneDay' && isInternalContactRole(card))).length; element.querySelector('.module-count').textContent = `${count} 张卡片`; element.querySelector('.module-footer strong').textContent = `${moduleProgress(key)}%`; element.querySelector('.tiny-progress span').style.width = `${moduleProgress(key)}%`; });
    if (state.currentView === 'check') renderCheck();
  }
  function moduleProgress(module) { const cards = state.archive.modules[module].cards.filter(card => card.status === 'active' && !(module === 'ifOneDay' && isInternalContactRole(card))); if (!cards.length) return 0; return Math.min(100, cards.filter(card => Object.values(card.data).some(value => Array.isArray(value) ? value.length : Boolean(value))).length * 25); }
  function completionChecks() {
    const someday = state.archive.modules.ifOneDay.cards.filter(card => card.status === 'active');
    const hasValidRole = role => someday.some(card => card.type === 'roleAssignment' && card.data.role === role && someday.some(contact => contact.id === card.data.contactCardId && contact.type === 'contact'));
    const primary = hasValidRole('primaryContact');
    const executor = hasValidRole('executor');
    const digitalCount = state.archive.modules.digitalWorld.cards.filter(card => card.status === 'active').length;
    const realCount = state.archive.modules.realWorld.cards.filter(card => card.status === 'active').length;
    const savedTime = state.localSaveState.lastSavedAt ? new Date(state.localSaveState.lastSavedAt).toLocaleString('zh-CN', { hour12: false }) : '';
    const saveStatus = state.isDirty ? 'warning' : state.localSaveState.hasSaved ? 'done' : 'neutral';
    const saveMessage = state.isDirty ? state.localSaveState.hasSaved ? `有修改尚未保存。上次保存时间：${savedTime}。` : '有修改尚未保存。可以点击“保存人生存档”。' : state.localSaveState.hasSaved ? `已保存到当前电脑。最近保存时间：${savedTime}。` : '当前内容尚未保存到本机。可以点击“保存人生存档”。';
    return [
      { key: 'primaryContact', label: '第一联系人', done: primary, status: primary ? 'done' : 'neutral', message: primary ? '已设置第一联系人。' : '尚未设置，可按自己的情况决定是否填写。' },
      { key: 'executor', label: '执行人安排', done: executor, status: executor ? 'done' : 'neutral', message: executor ? '已设置执行人。' : '尚未设置。如果希望以后有人按照你的安排处理事情，可以考虑设置。' },
      { key: 'digitalWorld', label: '我的数字世界', done: digitalCount > 0, status: digitalCount > 0 ? 'done' : 'neutral', message: digitalCount > 0 ? `已开始整理，共 ${digitalCount} 张卡片。` : '尚未开始整理。有需要时，可以记录重要账号、设备、作品等网络中的内容。' },
      { key: 'realWorld', label: '我的现实世界', done: realCount > 0, status: realCount > 0 ? 'done' : 'neutral', message: realCount > 0 ? `已开始整理，共 ${realCount} 张卡片。` : '尚未开始整理。有需要时，可以记录资产、证件、合同、重要物品和资料位置等现实中的内容。' },
      { key: 'formalArchive', label: '本机保存状态', done: saveStatus === 'done', status: saveStatus, message: saveMessage, canSave: saveStatus !== 'done' }
    ];
  }
  function showToast(message, undo) { toast.innerHTML = `${escapeHtml(message)}${undo ? '<button type="button" data-undo>撤销</button>' : ''}`; toast.classList.add('show'); if (undo) toast.querySelector('[data-undo]').onclick = undo; setTimeout(() => toast.classList.remove('show'), 5500); }
  function setView(view) {
    state.currentView = view;
    $$('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === view));
    const isHome = view === 'home'; $$('.home-section').forEach(section => section.hidden = !isHome);
    if (isHome) { workspace.hidden = false; renderModule('digitalWorld', true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (view === 'check') { renderCheck(); workspace.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else { renderModule(view); workspace.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  function renderModule(module, preview = false) {
    workspace.hidden = false;
    const meta = moduleMeta[module]; const cards = state.archive.modules[module].cards.filter(card => card.status === 'active' && !(module === 'ifOneDay' && card.type === 'roleAssignment' && ['primaryContact', 'backupContact'].includes(card.data.role)));
    workspace.innerHTML = `<div class="preview-heading"><div><p class="eyebrow">${preview ? '模块页预览' : '正在整理'}</p><h2>${meta.title}</h2><p>${meta.description}</p></div><button class="button button-primary" type="button" data-add-card="${module}">新增一张卡片</button></div>${cards.length ? `<div class="card-list">${cards.map(card => renderCard(module, card)).join('')}</div>` : `<div class="empty-state"><span class="empty-art" aria-hidden="true">${meta.icon}</span><h3>从一张卡片开始</h3><p>你可以随时补充内容。请只填写资料位置、恢复方式和处理线索，不要填写真实密码。</p><div class="tag-row">${Object.values(cardTypes[module]).slice(0, 4).map(type => `<span>${type[0]}</span>`).join('')}</div></div>`}`;
    workspace.querySelector('[data-add-card]').onclick = () => openCardDialog(module);
    workspace.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => openCardDialog(module, button.dataset.edit));
    workspace.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => deleteCard(module, button.dataset.delete));
  }
  function cardSummaryValue(name, kind, value) {
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) return '';
    if (Object.prototype.hasOwnProperty.call(referenceRules, name)) { const target = findCardById(value); return target?.card.data.displayName || target?.card.title || ''; }
    if (kind === 'contactMethods' && Array.isArray(value)) return value.map(item => item?.value || '').filter(Boolean).join('；');
    if (kind === 'textList' && Array.isArray(value)) return value.filter(item => typeof item === 'string' && item).join('、');
    if (Object.prototype.hasOwnProperty.call(enumLabels, value)) return enumLabels[value];
    return typeof value === 'string' ? value : '';
  }
  function cardTypeLabel(module, card) { return card.type === 'roleAssignment' && card.data.role !== 'executor' ? `${enumLabels[card.data.role]}设置` : cardTypes[module][card.type][0]; }
  function renderCard(module, card) { const roles = module === 'ifOneDay' && card.type === 'contact' ? ['primaryContact', 'backupContact', 'executor'].filter(role => state.archive.modules.ifOneDay.cards.some(item => item.status === 'active' && item.type === 'roleAssignment' && item.data.role === role && item.data.contactCardId === card.id)).map(role => enumLabels[role]) : []; const typeName = [cardTypeLabel(module, card), ...roles].join(' · '); const summary = cardTypes[module][card.type][1].map(([name, , kind]) => cardSummaryValue(name, kind, card.data[name])).filter(Boolean).slice(0, 2).map(escapeHtml).join(' · ') || '尚未补充内容'; return `<article class="data-card"><div><span class="data-type">${escapeHtml(typeName)}</span><h3>${escapeHtml(card.title)}</h3><p>${summary}</p></div><div class="card-actions"><button type="button" data-edit="${card.id}">编辑</button><button type="button" data-delete="${card.id}">删除</button></div></article>`; }
  function suspectedPlaintextCredentialCards() {
    const keywordPattern = /密码是|密码为|支付密码|登录密码|解锁密码|助记词|私钥|验证码是|验证码为|口令是|口令为|password\s*[:：=]/i;
    const containsRisk = value => {
      if (typeof value === 'string') return keywordPattern.test(value);
      if (Array.isArray(value)) return value.some(containsRisk);
      if (value && typeof value === 'object') return Object.values(value).some(containsRisk);
      return false;
    };
    return allCards().filter(({ card }) => card.status === 'active' && (containsRisk(card.title) || containsRisk(card.data))).map(({ card }) => card.title);
  }
  function renderCheck() {
    workspace.hidden = false; const checks = completionChecks(); const risks = [...new Set(suspectedPlaintextCredentialCards())];
    const riskResult = risks.length ? `<div class="credential-review warning"><strong>发现疑似明文敏感凭据</strong><p>请人工检查这些卡片：${risks.slice(0, 8).map(escapeHtml).join('、')}${risks.length > 8 ? `等 ${risks.length} 张` : ''}。建议只记录密码或密钥的保存位置。</p></div>` : '<div class="credential-review"><strong>未发现明显的敏感凭据关键词</strong><p>仍建议人工检查备注和长文本内容。</p></div>';
    const statusIcon = status => status === 'done' ? '✓' : status === 'warning' ? '!' : '•';
    workspace.innerHTML = `<div class="preview-heading"><div><p class="eyebrow">几个重要方向的当前状态</p><h2>检查我的存档</h2><p>这里不是必填清单，只是帮你看看几个重要方向目前整理到哪里。没有的内容可以不填，以后也可以随时补充。</p></div></div><div class="review-list">${checks.map(item => `<div class="review-item ${item.status}"><span>${statusIcon(item.status)}</span><div><strong>${item.label}</strong><p>${item.message}</p>${item.canSave ? '<button class="button button-quiet review-save-button" type="button" data-check-save>保存人生存档</button>' : ''}</div></div>`).join('')}</div><section class="credential-check" aria-label="疑似明文密码提醒"><h3>敏感凭据关键词提醒</h3>${riskResult}<p class="credential-disclaimer">这只是简单的本地关键词/规则提醒，不是完整安全检测，也不能保证识别所有密码、验证码、私钥或助记词。</p></section>`;
    workspace.querySelectorAll('[data-check-save]').forEach(button => button.onclick = () => saveLocalArchive());
  }
  function editableFieldValue(kind, value) {
    if (kind === 'contactMethods' && Array.isArray(value)) return value.map(item => item?.value || '').filter(Boolean).join('；');
    if (kind === 'textList' && Array.isArray(value)) return value.filter(item => typeof item === 'string').join('、');
    return value ?? '';
  }
  function fieldHtml(field, value) {
    const [name, label, kind = 'text'] = field; const safe = escapeHtml(editableFieldValue(kind, value));
    if (kind === 'textarea') return `<label>${label}<textarea name="${name}" maxlength="4000" autocomplete="off">${safe}</textarea></label>`;
    if (kind === 'date') return `<label>${label}<input name="${name}" type="date" value="${safe}" autocomplete="off"></label>`;
    if (kind === 'executorRef') return `<div><label>${label}<select name="${name}">${executorContacts().length ? referencedOptions(kind, value) : '<option value="">暂未设置执行人</option>'}</select></label><p class="form-note">选择以后主要负责处理这件事的人。${executorContacts().length ? '不指定也可以保存。' : '可前往“如果有一天”设置执行人；不指定也可以保存。'}</p></div>`;
    if (kind === 'contactRef' || kind === 'petRef' || kind === 'accountRef') return `<label>${label}<select name="${name}">${referencedOptions(kind, value)}</select></label>`;
    if (kind === 'role') return `<input name="role" type="hidden" value="${escapeHtml(value || 'executor')}"><p class="form-note">${value && value !== 'executor' ? `${escapeHtml(enumLabels[value])}身份请在对应的联系人卡片中查看和管理。` : '执行人从联系人中选择，可以设置多位。不同事项可以指定不同的负责执行人。'}${contacts().length ? '' : '<br>请先添加联系人，再设置执行人。<button class="text-button" type="button" data-add-contact-first>先添加联系人</button>'}</p>`;
    if (kind === 'decision') return `<label>${label}<select name="${name}"><option value="keep" ${value === 'keep' ? 'selected' : ''}>保留</option><option value="delete" ${value === 'delete' ? 'selected' : ''}>删除</option><option value="handover" ${value === 'handover' ? 'selected' : ''}>交接</option></select></label>`;
    if (kind === 'priority') return `<label>${label}<select name="${name}"><option value="normal" ${value === 'normal' ? 'selected' : ''}>一般</option><option value="high" ${value === 'high' ? 'selected' : ''}>优先</option></select></label>`;
    if (kind === 'digitalAssetKind') return `<label>${label}<select name="${name}"><option value="exchange" ${value === 'exchange' ? 'selected' : ''}>交易平台资产</option><option value="wallet" ${value === 'wallet' ? 'selected' : ''}>链上钱包</option><option value="nft" ${value === 'nft' ? 'selected' : ''}>NFT／链上藏品</option><option value="other" ${value === 'other' ? 'selected' : ''}>其他数字资产</option></select></label>`;
    if (kind === 'passwordHintLocation') return `<label>${label}<input name="${name}" maxlength="500" value="${safe}" placeholder="例如：保险箱内的密码提示卡（不要填写密码）" autocomplete="off"></label>`;
    if (kind === 'contactMethods') return `<label>${label}<input name="${name}" maxlength="250" value="${safe}" placeholder="例如：手机号或邮箱" autocomplete="off"></label>`;
    if (kind === 'textList') return `<label>${label}<input name="${name}" maxlength="500" value="${safe}" placeholder="用顿号或逗号分隔" autocomplete="off"></label>`;
    return `<label>${label}<input name="${name}" maxlength="500" value="${safe}" autocomplete="off"></label>`;
  }
  function findCardById(cardId) { return allCards().find(({ card }) => card.id === cardId); }
  function validateReferenceIntegrity(module, candidate) {
    for (const [field, rule] of Object.entries(referenceRules)) {
      const targetId = candidate.data[field];
      if (!targetId) continue;
      const target = findCardById(targetId);
      if (!target || target.module !== rule.module || target.card.status !== 'active' || !rule.types.includes(target.card.type)) {
        return `“${field}”关联的卡片已不存在、类型不匹配或不再有效。请重新选择。`;
      }
      if (field === 'responsibleExecutorContactId' && !executorContactIds().has(targetId)) return '负责执行人必须是已经设置为执行人的联系人，请重新选择或暂不指定。';
    }
    const inbound = candidate.id ? referencesTo(candidate.id) : [];
    for (const { module: sourceModule, card: sourceCard } of inbound) {
      const field = Object.keys(referenceRules).find(name => sourceCard.data[name] === candidate.id);
      const rule = referenceRules[field];
      if (!rule || module !== rule.module || candidate.status !== 'active' || !rule.types.includes(candidate.type)) {
        return `这张卡片正被“${sourceCard.title}”引用，不能修改为会破坏关联的类型。`;
      }
    }
    return '';
  }
  function hasDuplicateActiveRole(candidate) {
    if (candidate.type !== 'roleAssignment' || !candidate.data.role) return false;
    if (candidate.status !== 'active') return false;
    return state.archive.modules.ifOneDay.cards.some(card => card.id !== candidate.id && card.status === 'active' && card.type === 'roleAssignment' && card.data.role === candidate.data.role && (candidate.data.role !== 'executor' || card.data.contactCardId === candidate.data.contactCardId));
  }
  function executorRoleRemovalError(existing, replacement) {
    if (!existing || existing.status !== 'active' || existing.type !== 'roleAssignment' || existing.data.role !== 'executor') return '';
    const contactId = existing.data.contactCardId;
    if (!contactId) return ''; // 兼容旧版尚未关联联系人的空身份安排。
    if (replacement?.type === 'roleAssignment' && replacement.status === 'active' && replacement.data.role === 'executor' && replacement.data.contactCardId === contactId) return '';
    const references = allCards().filter(({ card }) => card.data.responsibleExecutorContactId === contactId);
    return references.length ? `该执行人仍负责 ${references.length} 张事项卡片（例如“${references[0].card.title}”）。请先更换这些卡片的负责执行人或设为“暂不指定”，再取消或更换执行人身份。` : '';
  }
  function validateArchiveContent(archive) {
    if (!isStructurallyUsableArchive(archive)) return '当前内容结构不完整，无法保存正式存档。';
    const ids = new Set();
    const indexed = new Map();
    for (const [module, container] of Object.entries(archive.modules)) {
      for (const card of container.cards) {
        if (ids.has(card.id)) return '发现重复卡片标识，无法保存正式存档。';
        ids.add(card.id); indexed.set(card.id, { module, card });
      }
    }
    const activeRoles = new Set();
    const executors = executorContactIds(archive);
    for (const [module, container] of Object.entries(archive.modules)) for (const card of container.cards) {
      for (const [field, rule] of Object.entries(referenceRules)) {
        const targetId = card.data[field]; if (!targetId) continue;
        const target = indexed.get(targetId);
        if (!target || target.module !== rule.module || target.card.status !== 'active' || !rule.types.includes(target.card.type)) return `“${field}”关联的卡片已不存在、类型不匹配或不再有效。`;
        if (field === 'responsibleExecutorContactId' && !executors.has(targetId)) return '负责执行人尚未被设置为执行人，无法保存该关联。';
      }
      if (module === 'ifOneDay' && card.status === 'active' && card.type === 'roleAssignment') {
        const key = card.data.role === 'executor' ? `executor:${card.data.contactCardId}` : card.data.role;
        if (activeRoles.has(key)) return card.data.role === 'executor' ? '同一联系人已经设置为执行人，请勿重复设置。' : '第一联系人和备用联系人分别最多设置一位。';
        activeRoles.add(key);
      }
    }
    return '';
  }
  function validateArchiveForFormalSave() { return validateArchiveContent(state.archive); }
  async function deriveAesKey(passwordBytes, salt, usages) {
    const material = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, usages);
  }
  function validatePassword(password, confirmation) {
    if (typeof password !== 'string' || password.length === 0) return '请输入备份密码。';
    if (confirmation !== undefined && password !== confirmation) return '两次输入的存档密码不一致。';
    return '';
  }
  async function createLifeFile(password) {
    if (!cryptoReady()) throw new Error('CRYPTO_UNAVAILABLE');
    const validation = validateArchiveForFormalSave(); if (validation) throw new Error(validation);
    const payload = { ...state.archive, exportedAt: now() };
    const plaintext = utf8.encode(JSON.stringify(payload));
    if (plaintext.byteLength > MAX_PAYLOAD_BYTES) throw new Error('当前存档内容超过 V1 文件大小限制。');
    const salt = randomBytes(16); const iv = randomBytes(12); const passwordBytes = utf8.encode(password);
    const key = await deriveAesKey(passwordBytes, salt, ['encrypt']);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, plaintext));
    return { life: { formatVersion: '1.0.0', encryptionVersion: 'aes-gcm-pbkdf2-v1', kdfAlgorithm: 'PBKDF2', kdfParameters: { ...KDF_PARAMETERS }, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) }, exportedAt: payload.exportedAt };
  }
  function createPlainLifeFile() {
    const validation = validateArchiveForFormalSave(); if (validation) throw new Error(validation);
    const archive = { ...state.archive, exportedAt: now() }; const life = { formatVersion: '1.0.0', backupType: 'unencrypted-v1', archive };
    if (utf8.encode(JSON.stringify(archive)).byteLength > MAX_PAYLOAD_BYTES || utf8.encode(JSON.stringify(life)).byteLength > MAX_LIFE_BYTES) throw new Error('当前存档内容超过 V1 文件大小限制。');
    return { life, exportedAt: archive.exportedAt };
  }
  function validateLifeEnvelope(life, fileSize) {
    const allowed = ['formatVersion', 'encryptionVersion', 'kdfAlgorithm', 'kdfParameters', 'salt', 'iv', 'ciphertext'];
    if (!life || typeof life !== 'object' || Array.isArray(life) || !Object.keys(life).every(key => allowed.includes(key)) || allowed.some(key => !(key in life)) || life.formatVersion !== '1.0.0' || life.encryptionVersion !== 'aes-gcm-pbkdf2-v1') return { error: '该存档格式不受支持或结构无效。' };
    const params = life.kdfParameters;
    const salt = strictBase64Bytes(life.salt); const iv = strictBase64Bytes(life.iv);
    if (life.kdfAlgorithm !== 'PBKDF2' || !params || typeof params !== 'object' || Object.keys(params).length !== 4 || params.kdfVersion !== KDF_PARAMETERS.kdfVersion || params.hash !== KDF_PARAMETERS.hash || params.iterations !== KDF_PARAMETERS.iterations || params.derivedKeyLength !== KDF_PARAMETERS.derivedKeyLength || !salt || salt.byteLength !== 16 || !iv || iv.byteLength !== 12) return { error: '该存档使用的密钥派生或加密参数不受支持。' };
    const ciphertext = strictBase64Bytes(life.ciphertext);
    if (fileSize > MAX_LIFE_BYTES || !ciphertext || ciphertext.byteLength < 16 || ciphertext.byteLength > MAX_CIPHERTEXT_BYTES) return { error: '该存档的加密数据无效或已损坏。' };
    return { salt, iv, ciphertext };
  }
  async function readLifeFile(file, password) {
    if (!file || file.size > MAX_LIFE_BYTES) throw new Error('该存档的加密数据无效或已损坏。');
    let life;
    try { life = JSON.parse(utf8Decoder.decode(await file.arrayBuffer())); } catch (_) { throw new Error('该存档格式不受支持或结构无效。'); }
    if (exactKeys(life, ['formatVersion', 'backupType', 'archive']) && life.formatVersion === '1.0.0' && life.backupType === 'unencrypted-v1') {
      const archive = normalizeRelationships(life.archive);
      if (validateArchiveContent(archive)) throw new Error('该未加密备份的数据版本或关联关系暂不支持。');
      return { archive, encrypted: false };
    }
    const envelope = validateLifeEnvelope(life, file.size); if (envelope.error) throw new Error(envelope.error);
    const passwordError = validatePassword(password); if (passwordError) throw new Error('该文件是加密备份，请输入备份时设置的密码。');
    if (!cryptoReady()) throw new Error('当前浏览器不支持解密该 .life 文件。');
    try {
      const key = await deriveAesKey(utf8.encode(password), envelope.salt, ['decrypt']);
      const decoded = JSON.parse(utf8Decoder.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: envelope.iv, tagLength: 128 }, key, envelope.ciphertext)));
      let archive; try { archive = normalizeRelationships(decoded); } catch (_) { throw new Error('PAYLOAD_INVALID'); }
      if (validateArchiveContent(archive)) throw new Error('PAYLOAD_INVALID');
      return { archive, encrypted: true };
    } catch (error) { if (error.message === 'PAYLOAD_INVALID') throw new Error('存档已解密，但其中的数据版本暂不支持。'); throw new Error(CANNOT_DECRYPT_MESSAGE); }
  }
  function relationshipFieldsHtml(module, type, existing) {
    if (type === 'contact') {
      const roles = state.archive.modules.ifOneDay.cards.filter(card => card.status === 'active' && card.type === 'roleAssignment' && card.data.contactCardId === existing?.id);
      return `<div class="form-note"><p>联系人是人的基础资料。第一联系人和备用联系人各最多一位；同一人也可以另外设置为执行人。</p><input type="hidden" name="contactRolesPresented" value="yes">${['primaryContact', 'backupContact'].map(role => `<label class="quick-checkbox"><input type="checkbox" name="${role}" value="yes" ${roles.some(card => card.data.role === role) ? 'checked' : ''}>设为${enumLabels[role]}</label>`).join('')}<p>取消勾选并保存卡片，会移除对应的身份安排；不会取消执行人身份。需要执行人时，请新增“执行人安排”卡片。</p></div>`;
    }
    const legacy = taskModules.includes(module) && legacyResponsibilityFields[type];
    const value = legacy && existing?.data[legacy[0]];
    if (!value) return '';
    const contact = legacy[2] === 'contactRef' ? findCardById(value)?.card : null;
    const description = contact ? contactOptionLabel(contact) : value;
    return `<div class="form-note"><strong>旧存档安排已保留，等待你确认</strong><p>${escapeHtml(description)}</p><p>这条旧安排尚未转换为负责执行人（对方可能未设置为执行人，或原来只填写了称呼）。请先确认身份，再在上方选择。我们不会按姓名自动匹配或新增执行人。</p><label class="quick-checkbox"><input type="checkbox" name="clearLegacyResponsibility" value="yes">我已确认，可以清除这条旧安排</label></div>`;
  }
  function cardTypeChangeError(module, existing, nextType) {
    if (!existing || existing.type === nextType) return '';
    if (['contact', 'roleAssignment'].includes(existing.type)) return '联系人和身份安排涉及关联关系，不支持直接更换卡片类型。请通过对应卡片管理身份。';
    for (const { card } of referencesTo(existing.id)) {
      for (const [field, rule] of Object.entries(referenceRules)) {
        if (card.data[field] === existing.id && (module !== rule.module || existing.status !== 'active' || !rule.types.includes(nextType))) {
          return `这张卡片正在被“${card.title}”等安排引用，请先处理相关关联，再更换卡片类型。`;
        }
      }
    }
    return executorRoleRemovalError(existing, { ...existing, type: nextType, data: {} });
  }
  function openCardDialog(module, cardId, initialType) {
    const dialog = $('#card-dialog'); const existing = cardId ? state.archive.modules[module].cards.find(card => card.id === cardId) : null; const type = existing?.type || initialType || Object.keys(cardTypes[module])[0];
    let archiveCardPrivacyReminderShown = false;
    let typeChanged = false;
    const render = (selectedType, retained = null) => { const config = cardTypes[module][selectedType]; const original = existing && !typeChanged ? existing : null; const data = original?.data || (retained?.responsibleExecutorContactId ? { responsibleExecutorContactId: retained.responsibleExecutorContactId } : {}); const cardPolicy = retained?.exportPolicy || original?.exportPolicy || policy(selectedType); dialog.innerHTML = `<form class="dialog-card card-form" autocomplete="off"><div class="dialog-top"><div><p class="eyebrow">${existing ? '编辑卡片' : '新增卡片'}</p><h2>${moduleMeta[module].title}</h2></div><button class="icon-close" type="button" data-close>×</button></div><label>卡片类型<select name="type" data-type-select>${Object.entries(cardTypes[module]).map(([key, item]) => `<option value="${key}" ${key === selectedType ? 'selected' : ''}>${item[0]}</option>`).join('')}</select></label><label>卡片标题<input name="title" maxlength="80" value="${escapeHtml(original?.title || config[0])}" autocomplete="off"></label><div class="form-grid">${config[1].map(field => fieldHtml(field, data[field[0]])).join('')}</div><div class="print-policy"><p>打印范围</p><label>完整人生存档<select name="fullArchive"><option value="include" ${cardPolicy.fullArchive === 'include' ? 'selected' : ''}>完整显示</option><option value="summary" ${cardPolicy.fullArchive === 'summary' ? 'selected' : ''}>仅显示摘要</option><option value="exclude" ${cardPolicy.fullArchive === 'exclude' ? 'selected' : ''}>不显示</option></select></label><label>执行人指南<select name="executorGuide"><option value="include" ${cardPolicy.executorGuide === 'include' ? 'selected' : ''}>完整显示</option><option value="summary" ${cardPolicy.executorGuide === 'summary' ? 'selected' : ''}>仅显示摘要</option><option value="exclude" ${cardPolicy.executorGuide === 'exclude' ? 'selected' : ''}>不显示</option></select></label><label>人生存档卡<select name="archiveCard"><option value="exclude" ${cardPolicy.archiveCard === 'exclude' ? 'selected' : ''}>不显示（默认）</option><option value="summary" ${cardPolicy.archiveCard === 'summary' ? 'selected' : ''}>仅显示摘要</option><option value="include" ${cardPolicy.archiveCard === 'include' ? 'selected' : ''}>显示安全字段</option></select></label></div><p class="form-note">人生存档卡通过字段白名单、关键词和格式规则限制敏感信息输出，但不能保证识别所有形式的密码、密钥或其他秘密。保存或打印前，请自行检查内容。</p><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>取消</button><button class="button button-primary" type="submit">保存卡片</button></div></form>`;
      dialog.querySelector('.form-grid').insertAdjacentHTML('beforeend', relationshipFieldsHtml(module, selectedType, original));
      if (existing?.type === 'roleAssignment' && existing.data.role !== 'executor') dialog.querySelector('select[name="type"] option[value="roleAssignment"]').textContent = `${enumLabels[existing.data.role]}设置`;
      const addContact = dialog.querySelector('[data-add-contact-first]');
      if (addContact) addContact.onclick = () => { if (!window.confirm('前往添加联系人会关闭当前未保存的卡片。是否继续？')) return; dialog.close(); openCardDialog('ifOneDay', null, 'contact'); };
      dialog.querySelector('select[name="executorGuide"] option[value="include"]').textContent = '显示详细信息（固定安全字段）';
      const archiveCardSelect = dialog.querySelector('select[name="archiveCard"]');
      let previousArchiveCardPolicy = archiveCardSelect.value;
      archiveCardSelect.onchange = event => {
        const nextPolicy = event.target.value;
        if (!archiveCardPrivacyReminderShown && ARCHIVE_CARD_SENSITIVE_TYPES.has(selectedType) && previousArchiveCardPolicy === 'exclude' && nextPolicy !== 'exclude') {
          archiveCardPrivacyReminderShown = true;
          showToast('这类卡片可能包含账号、金融或文件位置线索。人生存档卡只输出安全白名单字段，打印前仍请确认接收人和保存方式。');
        }
        previousArchiveCardPolicy = nextPolicy;
      };
      dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => dialog.close());
      const typeSelect = dialog.querySelector('[data-type-select]');
      if (existing && ['contact', 'roleAssignment'].includes(existing.type)) {
        typeSelect.disabled = true;
        typeSelect.insertAdjacentHTML('afterend', '<small class="form-note">联系人和身份安排涉及关联关系，不支持直接更换类型。请通过对应卡片管理身份。</small>');
      }
      const currentForm = dialog.querySelector('form');
      const formSnapshot = () => JSON.stringify(Array.from(new FormData(currentForm)).filter(([name]) => name !== 'type'));
      const initialSnapshot = formSnapshot();
      typeSelect.onchange = event => {
        const nextType = event.target.value;
        if (nextType === selectedType) return;
        const error = cardTypeChangeError(module, existing, nextType);
        if (error) { typeSelect.value = selectedType; showToast(error); return; }
        const message = existing ? '更换卡片类型后，当前卡片中已经填写的内容将被清空，并按照新的卡片类型重新填写。是否继续？' : '切换卡片类型会清空当前尚未保存的填写内容。是否继续？';
        if ((existing || formSnapshot() !== initialSnapshot) && !window.confirm(message)) { typeSelect.value = selectedType; return; }
        const form = new FormData(currentForm);
        const retained = existing ? { responsibleExecutorContactId: form.get('responsibleExecutorContactId') || null, exportPolicy: { fullArchive: form.get('fullArchive'), executorGuide: form.get('executorGuide'), archiveCard: form.get('archiveCard') } } : null;
        typeChanged = true;
        render(nextType, retained);
      };
      currentForm.onsubmit = event => { event.preventDefault(); if (saveCard(module, existing, selectedType, new FormData(event.currentTarget), typeChanged)) dialog.close(); };
    }; render(type); dialog.showModal();
  }
  function saveCard(module, existing, type, form, typeChanged = false) {
    const typeError = cardTypeChangeError(module, existing, type);
    if (typeError) { showToast(typeError); return false; }
    const config = cardTypes[module][type]; const data = {};
    config[1].forEach(([name, , kind]) => {
      const value = (form.get(name) || '').trim();
      if (kind === 'contactRef' || kind === 'executorRef' || kind === 'petRef' || kind === 'accountRef' || kind === 'date') data[name] = value || null;
      else if (kind === 'contactMethods') data[name] = value ? value.split(/[、，,；;]/).map(item => item.trim()).filter(Boolean).slice(0, 3).map(item => ({ kind: 'other', value: item, note: '' })) : [];
      else if (kind === 'textList') data[name] = value ? value.split(/[、，,]/).map(item => item.trim()).filter(Boolean) : [];
      else data[name] = value;
    });
    if (type === 'roleAssignment') {
      data.role = existing?.type === 'roleAssignment' ? existing.data.role : 'executor';
      if (!data.contactCardId) { showToast('请先添加联系人，再选择关联联系人设置身份。'); return false; }
    }
    const legacy = taskModules.includes(module) && legacyResponsibilityFields[type];
    if (!typeChanged && legacy && existing?.type === type && existing.data[legacy[0]] && form.get('clearLegacyResponsibility') !== 'yes') {
      const oldValue = existing.data[legacy[0]];
      if (!(legacy[2] === 'contactRef' && oldValue === data.responsibleExecutorContactId)) data[legacy[0]] = oldValue;
    }
    if (type === 'archiveAccess' && /密码是|密码为|口令是|口令为|password\s*[:：=]/i.test(data.passwordHintLocation)) { showToast('密码获取提示位置只能填写提示卡、保险箱等位置，不能填写真实密码。'); return false; }
    const card = existing ? { ...existing, data: { ...data } } : { id: uid(), createdAt: now(), status: 'active', exportPolicy: policy(type), data: {} };
    card.type = type; card.title = (form.get('title') || config[0]).trim() || config[0]; card.updatedAt = now(); card.data = data; card.exportPolicy = { fullArchive: form.get('fullArchive') || 'include', executorGuide: form.get('executorGuide') || 'exclude', archiveCard: form.get('archiveCard') || 'exclude' };
    const referenceError = validateReferenceIntegrity(module, card);
    if (referenceError) { showToast(referenceError); return false; }
    const removalError = executorRoleRemovalError(existing, card);
    if (removalError) { showToast(removalError); return false; }
    if (hasDuplicateActiveRole(card)) { showToast(card.data.role === 'executor' ? '该联系人已经设置为执行人，不需要重复创建。' : '第一联系人和备用联系人分别最多设置一位，请先调整已有安排。'); return false; }
    if (type === 'contact' && form.get('contactRolesPresented') === 'yes') {
      for (const role of ['primaryContact', 'backupContact']) if (form.get(role) === 'yes' && state.archive.modules.ifOneDay.cards.some(item => item.type === 'roleAssignment' && item.status === 'active' && item.data.role === role && item.data.contactCardId !== card.id)) {
        showToast(`已经设置了${enumLabels[role]}，请先在原联系人中取消该身份，再设置其他人。`); return false;
      }
    }
    if (existing) Object.assign(existing, card); else state.archive.modules[module].cards.push(card);
    if (type === 'contact' && form.get('contactRolesPresented') === 'yes') {
      for (const role of ['primaryContact', 'backupContact']) {
        const assigned = state.archive.modules.ifOneDay.cards.filter(item => item.type === 'roleAssignment' && item.status === 'active' && item.data.role === role && item.data.contactCardId === card.id);
        if (form.get(role) === 'yes') {
          if (!assigned.length) addCard('ifOneDay', 'roleAssignment', enumLabels[role], { role, contactCardId: card.id, responsibilities: [], notes: '' });
        } else state.archive.modules.ifOneDay.cards = state.archive.modules.ifOneDay.cards.filter(item => !assigned.includes(item));
      }
    }
    state.archive.modules[module].updatedAt = now(); markChanged(); renderModule(module); showToast(existing ? '卡片已更新。' : '卡片已加入当前存档。'); return true;
  }
  function referencesTo(cardId) { return allCards().filter(({ card }) => Object.keys(referenceRules).some(name => card.data[name] === cardId)); }
  function deleteCard(module, cardId) {
    const cards = state.archive.modules[module].cards; const index = cards.findIndex(card => card.id === cardId); if (index < 0) return;
    const references = referencesTo(cardId);
    if (references.length) { showToast(`这张卡片正被 ${references.length} 张卡片引用（例如“${references[0].card.title}”）。请先解除或替换关联关系。`); return; }
    const removalError = executorRoleRemovalError(cards[index]); if (removalError) { showToast(removalError); return; }
    const [card] = cards.splice(index, 1); state.deleted.push({ module, card, index }); markChanged(); renderModule(module);
    showToast('卡片已删除。本次使用期间可以撤销。', () => {
      const item = state.deleted[state.deleted.length - 1]; if (!item) return;
      const error = validateReferenceIntegrity(item.module, item.card);
      if (error || hasDuplicateActiveRole(item.card)) { showToast(error || '已有同类身份安排，请先调整后再撤销删除。'); return; }
      state.deleted.pop(); state.archive.modules[item.module].cards.splice(item.index, 0, item.card); markChanged(); renderModule(item.module); showToast('已撤销删除。');
    });
  }
  function openQuickStart() {
    const dialog = $('#quick-start-dialog');
    dialog.innerHTML = `<form class="dialog-card quick-form" autocomplete="off"><div class="dialog-top"><div><p class="eyebrow">第一次整理 · 可选</p><h2>5 分钟快速开始</h2></div><button class="icon-close" type="button" data-close aria-label="关闭快速开始">×</button></div><p class="quick-form-intro">第一次使用不知道从哪里开始？可以先从几件常见的事情整理。没有的项目直接跳过就好，以后也可以随时补充。</p>
      <section class="quick-section"><div class="quick-section-heading"><span>1</span><div><h3>有没有一个重要的人，你希望先记下来？</h3><p>例如家人、伴侣、朋友。现在不想设置也可以跳过。</p></div></div><div class="form-grid"><label>联系人称呼<input name="contactName" maxlength="80" placeholder="例如：哥哥、朋友小周"></label><label>联系方式线索<input name="contactMethod" maxlength="250" placeholder="例如：手机通讯录中的称呼"></label></div><label class="quick-checkbox"><input name="alsoExecutor" type="checkbox" value="yes"> 这个人也可以作为执行人</label></section>
      <section class="quick-section"><div class="quick-section-heading"><span>2</span><div><h3>有没有几个你觉得重要的账号？</h3><p>可以填写 0～3 个。没有就跳过；不要填写真实密码，只写密码放在哪里。</p></div></div><div class="quick-accounts">${[1,2,3].map(number => `<div class="quick-account-row"><span>账号 ${number}</span><input name="platform${number}" maxlength="120" placeholder="平台名称"><input name="account${number}" maxlength="180" placeholder="账号名称或识别方式"><input name="location${number}" maxlength="500" placeholder="密码保存位置"></div>`).join('')}</div></section>
      <section class="quick-section"><div class="quick-section-heading"><span>3</span><div><h3>有没有一件重要物品，希望先记下来？</h3><p>例如“纪念相机—书房柜子”或“重要 U 盘—保险柜”。没有需要记录的也可以跳过，以后可以随时补充。</p></div></div><div class="form-grid"><label>内容名称<input name="itemName" maxlength="120" placeholder="例如：纪念相机"></label><label>存放位置或线索<input name="itemLocation" maxlength="500" placeholder="例如：书房柜子"></label></div></section>
      <section class="quick-section"><div class="quick-section-heading"><span>4</span><div><h3>有没有一件特别想提前交代的事？</h3><p>选择后可以补充一句简单说明。暂时没有就直接跳过，以后可以再补。</p></div></div><label>事项类型<select name="specialType" data-special-type><option value="none">暂时没有</option><option value="pet">宠物需要照顾</option><option value="debt">有重要账单或债务</option><option value="work">有工作事项</option><option value="privacy">有需要保留或清理的隐私内容</option><option value="item">有重要物品需要处理</option><option value="other">其他</option></select></label><div data-special-details hidden><label><span data-special-label>简短补充</span><input name="specialDetail" maxlength="500" placeholder="简单写下名称或处理线索"></label></div></section>
      <div class="dialog-actions"><button class="button button-quiet" type="button" data-close>稍后再说</button><button class="button button-primary" type="submit">完成快速整理</button></div></form>`;
    const close = () => { dialog.innerHTML = ''; dialog.close(); };
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = close);
    const specialType = dialog.querySelector('[data-special-type]');
    const specialDetails = dialog.querySelector('[data-special-details]');
    const specialLabel = dialog.querySelector('[data-special-label]');
    const specialInput = dialog.querySelector('input[name="specialDetail"]');
    const specialCopy = { pet: ['宠物名称或照顾提示', '例如：豆豆，需要每天吃药'], debt: ['账单或债务说明', '例如：房贷资料在书房'], work: ['工作事项说明', '例如：项目资料需要交给同事'], privacy: ['希望保留或清理的内容', '例如：清理旧手机里的私人照片'], item: ['重要物品或处理提示', '例如：相机交给家人'], other: ['简短补充', '写下想提前交代的事情'] };
    const updateSpecialDetails = () => { const copy = specialCopy[specialType.value]; specialDetails.hidden = !copy; if (copy) { specialLabel.textContent = copy[0]; specialInput.placeholder = copy[1]; } };
    specialType.onchange = updateSpecialDetails;
    updateSpecialDetails();
    dialog.querySelector('form').onsubmit = event => { event.preventDefault(); applyQuickStart(new FormData(event.currentTarget)); close(); };
    dialog.showModal();
  }
  function addCard(module, type, title, data, id = uid()) {
    const values = { ...data };
    if (taskModules.includes(module)) {
      values.responsibleExecutorContactId = values.responsibleExecutorContactId || null;
      const legacy = legacyResponsibilityNames[type]; if (legacy && !values[legacy]) delete values[legacy];
    }
    state.archive.modules[module].cards.push({ id, type, title, createdAt: now(), updatedAt: now(), status: 'active', exportPolicy: policy(type), data: values });
  }
  function applyQuickStart(form) {
    const clean = name => String(form.get(name) || '').trim();
    const normalized = value => String(value || '').trim().toLocaleLowerCase('zh-CN');
    const activeCards = (module, type) => state.archive.modules[module].cards.filter(card => card.status === 'active' && card.type === type);
    let created = 0;

    const contactName = clean('contactName'); const contactMethod = clean('contactMethod');
    let contactId = null;
    if (contactName || contactMethod) {
      // 姓名不能作为身份标识；只有唯一且完整一致的联系线索才复用已有联系人。
      const matchingContacts = contactMethod ? activeCards('ifOneDay', 'contact').filter(card => (!contactName || normalized(card.data.displayName) === normalized(contactName)) && card.data.contactMethods.some(item => normalized(item.value) === normalized(contactMethod))) : [];
      const existingContact = matchingContacts.length === 1 ? matchingContacts[0] : null;
      if (existingContact) contactId = existingContact.id;
      else { contactId = uid(); addCard('ifOneDay', 'contact', contactName || '重要联系人', { displayName: contactName || '重要联系人', relationship: '', contactMethods: contactMethod ? [{ kind: 'other', value: contactMethod, note: '' }] : [], notes: '' }, contactId); created += 1; }
      if (form.get('alsoExecutor') === 'yes' && !activeCards('ifOneDay', 'roleAssignment').some(card => card.data.role === 'executor' && card.data.contactCardId === contactId)) { addCard('ifOneDay', 'roleAssignment', '执行人', { role: 'executor', contactCardId: contactId, responsibilities: [], notes: '' }); created += 1; }
    }

    [1,2,3].forEach(number => {
      const platform = clean(`platform${number}`); const account = clean(`account${number}`); const location = clean(`location${number}`);
      if (!platform && !account && !location) return;
      const duplicate = activeCards('digitalWorld', 'socialAccount').some(card => platform || account ? normalized(card.data.platformName) === normalized(platform) && normalized(card.data.accountName) === normalized(account) : normalized(card.data.passwordLocation) === normalized(location));
      if (!duplicate) { addCard('digitalWorld', 'socialAccount', platform || account || '重要账号', { platformName: platform, accountName: account, passwordLocation: location, twoFactorLocation: '', recoveryMethod: '', handlingInstruction: '', notes: '' }); created += 1; }
    });

    const itemName = clean('itemName'); const itemLocation = clean('itemLocation');
    if (itemName || itemLocation) {
      const name = itemName || '重要物品';
      const duplicate = activeCards('realWorld', 'valuableItem').some(card => normalized(card.data.itemName) === normalized(name) && normalized(card.data.storageLocation) === normalized(itemLocation));
      if (!duplicate) { addCard('realWorld', 'valuableItem', name, { itemName: name, storageLocation: itemLocation, proofLocation: '', valuationHint: '', recipientHint: '', notes: '' }); created += 1; }
    }

    const specialType = clean('specialType'); const specialDetail = clean('specialDetail');
    if (specialDetail && specialType !== 'none') {
      const specialCards = {
        pet: ['peopleAndMatters', 'pet', specialDetail, { name: specialDetail, species: '', careRoutine: '', medicalRecordLocation: '', temporaryCarerContactCardId: null, longTermArrangement: '', suppliesLocation: '', notes: '' }],
        debt: ['realWorld', 'loanOrDebt', specialDetail, { itemName: specialDetail, relatedPartyHint: '', contractLocation: '', repaymentMaterialLocation: '', handlingInstruction: '', notes: '' }],
        work: ['peopleAndMatters', 'importantWork', specialDetail, { workName: specialDetail, storageLocation: '', ownershipNote: '', preservationInstruction: '', responsibleContactCardId: null, notes: '' }],
        privacy: ['ifOneDay', 'privacyCleanup', specialDetail, { itemName: specialDetail, materialLocation: '', action: '', responsibleContactCardId: null, priority: 'normal', notes: '' }],
        item: ['realWorld', 'valuableItem', specialDetail, { itemName: specialDetail, storageLocation: '', proofLocation: '', valuationHint: '', recipientHint: '', notes: '' }],
        other: ['peopleAndMatters', 'specialArrangement', specialDetail, { itemName: specialDetail, background: '', steps: '', materialLocation: '', responsibleContactCardId: null, notes: '' }]
      };
      const mapped = specialCards[specialType];
      if (mapped) { const [module, type, title, data] = mapped; const duplicate = activeCards(module, type).some(card => normalized(card.title) === normalized(title)); if (!duplicate) { addCard(module, type, title, data); created += 1; } }
    }

    if (!created) return 0;
    Object.values(state.archive.modules).forEach(module => module.updatedAt = now());
    markChanged(); setView('home'); showToast('这些基础内容已经整理好了。接下来可以从四个章节继续慢慢补充。');
    return created;
  }
  function openCheck() { setView('check'); }
  function downloadLifeFile(life) {
    const blob = new Blob([JSON.stringify(life)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = lifeFilename(); anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  function showEncryptedBackupForm(dialog) {
    if (!cryptoReady()) { showToast('当前浏览器不支持加密备份，请改用未加密备份。'); return; }
    dialog.innerHTML = `<form class="dialog-card"><div class="dialog-top"><div><p class="eyebrow">加密 .life 备份</p><h2>设置备份密码</h2></div><button class="icon-close" type="button" data-close>×</button></div><p>密码不会保存、上传或找回。忘记密码将无法解密此备份。密码长短和字符不限，两次填写一致即可。</p><label>备份密码<input name="password" type="password" autocomplete="new-password" required></label><label>确认备份密码<input name="confirmation" type="password" autocomplete="new-password" required></label><label class="password-toggle"><input type="checkbox" data-password-visible> 显示密码</label><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>取消</button><button class="button button-primary" type="submit">加密并下载</button></div></form>`;
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { dialog.innerHTML = ''; dialog.close(); });
    dialog.querySelector('[data-password-visible]').onchange = event => dialog.querySelectorAll('input[name="password"], input[name="confirmation"]').forEach(input => input.type = event.target.checked ? 'text' : 'password');
    dialog.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const submittedForm = event.currentTarget;
      if (submittedForm.dataset.busy) return;
      const form = new FormData(submittedForm); const password = String(form.get('password') || ''); const confirmation = String(form.get('confirmation') || ''); const passwordError = validatePassword(password, confirmation);
      if (passwordError) { showToast(passwordError); return; }
      submittedForm.dataset.busy = 'true';
      try {
        const result = await createLifeFile(password);
        // 加密期间关闭窗口或重新打开另一份表单，均视为取消本次备份。
        if (!dialog.open || dialog.querySelector('form') !== submittedForm) return;
        if (!saveLocalArchive({ announce: false })) return;
        downloadLifeFile(result.life); state.formalExportState = { hasExportedLife: true, lastExportedAt: result.exportedAt, safeDefaultFilename: '人生存档_YYYY-MM-DD_HHmm.life' }; updateChrome(); dialog.innerHTML = ''; dialog.close(); showToast('已保存到当前电脑，并生成加密 .life 备份。');
      }
      catch (error) { showToast(error.message === 'CRYPTO_UNAVAILABLE' ? '当前浏览器不支持加密备份。' : error.message || '无法生成加密备份。'); }
      finally { delete submittedForm.dataset.busy; }
    };
  }
  function showPlainBackupRisk(dialog) {
    dialog.innerHTML = `<form class="dialog-card"><div class="dialog-top"><div><p class="eyebrow">未加密 .life 备份</p><h2>确认明文备份风险</h2></div><button class="icon-close" type="button" data-close>×</button></div><p>未加密 .life 可被任何拿到文件的人直接读取，不受密码保护。请只保存在可信设备或安全介质中。</p><label class="risk-check"><input type="checkbox" data-plain-risk> 我已理解该文件是未加密明文副本，并会自行妥善保管。</label><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>取消</button><button class="button button-primary" type="submit">确认并下载</button></div></form>`;
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { dialog.innerHTML = ''; dialog.close(); });
    dialog.querySelector('form').onsubmit = event => { event.preventDefault(); if (!dialog.querySelector('[data-plain-risk]').checked) { showToast('请先确认未加密备份的明文隐私风险。'); return; } try { const result = createPlainLifeFile(); if (!saveLocalArchive({ announce: false })) return; downloadLifeFile(result.life); state.formalExportState = { hasExportedLife: true, lastExportedAt: result.exportedAt, safeDefaultFilename: '人生存档_YYYY-MM-DD_HHmm.life' }; updateChrome(); dialog.innerHTML = ''; dialog.close(); showToast('已保存到当前电脑，并生成未加密 .life 备份。请妥善保管备份文件。'); } catch (error) { showToast(error.message || '无法生成未加密备份。'); } };
  }
  function openBackupDialog() {
    const dialog = $('#export-dialog');
    dialog.innerHTML = `<div class="dialog-card"><div class="dialog-top"><div><p class="eyebrow">保存并备份</p><h2>选择 .life 备份方式</h2></div><button class="icon-close" type="button" data-close>×</button></div><p>选择备份方式并确认下载后，才会保存到当前电脑并生成 .life 备份文件。关闭此窗口不会保存本次修改。备份文件可用于迁移、换电脑恢复或交接。</p><div class="print-options"><button class="print-option recommended" type="button" data-encrypted-backup><strong>加密备份（推荐）</strong><span>设置密码，使用 PBKDF2 + AES-GCM 加密。</span></button><button class="print-option" type="button" data-plain-backup><strong>未加密备份</strong><span>无需密码，但文件内容可被直接读取，生成前必须确认风险。</span></button></div></div>`;
    dialog.querySelector('[data-close]').onclick = () => { dialog.innerHTML = ''; dialog.close(); };
    dialog.querySelector('[data-encrypted-backup]').onclick = () => showEncryptedBackupForm(dialog);
    dialog.querySelector('[data-plain-backup]').onclick = () => showPlainBackupRisk(dialog);
    dialog.showModal();
  }
  function openImportDialog() {
    const dialog = $('#import-dialog');
    dialog.innerHTML = `<form class="dialog-card"><div class="dialog-top"><div><p class="eyebrow">导入人生存档</p><h2>在当前内存中打开 .life</h2></div><button class="icon-close" type="button" data-close>×</button></div><p>导入只替换当前页面内存中的内容，不会自动覆盖本机已保存的人生存档。确认内容后，请主动点击“保存人生存档”。</p><label>选择 .life 文件<input name="lifeFile" type="file" accept=".life,application/json" required></label><label>加密备份密码（未加密备份可留空）<input name="password" type="password" autocomplete="current-password"></label><label class="password-toggle"><input type="checkbox" data-password-visible> 显示密码</label><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>取消</button><button class="button button-primary" type="submit">打开备份</button></div></form>`;
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { dialog.innerHTML = ''; dialog.close(); });
    dialog.querySelector('[data-password-visible]').onchange = event => { dialog.querySelector('input[name="password"]').type = event.target.checked ? 'text' : 'password'; };
    dialog.querySelector('form').onsubmit = async event => { event.preventDefault(); const form = new FormData(event.currentTarget); const file = form.get('lifeFile'); const password = String(form.get('password') || ''); try { const result = await readLifeFile(file, password); state.archive = result.archive; state.editingMode = 'importedTemporary'; state.isDirty = true; state.deleted = []; state.formalExportState = { hasExportedLife: true, lastExportedAt: result.archive.exportedAt || null, safeDefaultFilename: '人生存档_YYYY-MM-DD_HHmm.life' }; dialog.innerHTML = ''; dialog.close(); setView('home'); updateChrome(); showToast(`${result.encrypted ? '加密' : '未加密'} .life 已导入当前内存，尚未覆盖本机存档。确认后请点击“保存人生存档”。`); } catch (error) { showToast(error.message || '无法导入该存档。'); } };
    dialog.showModal();
  }
  function openClearDialog() {
    const dialog = $('#clear-dialog');
    dialog.innerHTML = `<form class="dialog-card"><div class="dialog-top"><div><p class="eyebrow">清空人生存档</p><h2>清空当前页面，保存后才生效</h2></div><button class="icon-close" type="button" data-close>×</button></div><p>确认后，当前页面的内容会清空，但不会立即改动上次保存的人生存档。只有点击“保存人生存档”，或在“保存并备份”中最终确认下载，才会保存清空结果。不保存就关闭，下次打开仍会恢复上次保存的内容。已经下载的 .life 备份文件不会被删除。</p><label class="risk-check"><input type="checkbox" data-clear-confirm> 我确认清空当前页面，并理解清空结果需要另外保存才会生效。</label><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>取消</button><button class="button button-danger" type="submit">确认清空</button></div></form>`;
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { dialog.innerHTML = ''; dialog.close(); });
    dialog.querySelector('form').onsubmit = event => {
      event.preventDefault();
      if (!dialog.querySelector('[data-clear-confirm]').checked) { showToast('请先确认要清空当前页面。'); return; }
      state.archive = createArchive();
      state.editingMode = 'memoryTemporary';
      state.isDirty = true;
      state.deleted = [];
      state.saveReminderShown = false;
      state.formalExportState = { hasExportedLife: false, lastExportedAt: null, safeDefaultFilename: '人生存档_YYYY-MM-DD_HHmm.life' };
      dialog.innerHTML = '';
      dialog.close();
      setView('home');
      updateChrome();
      showToast('当前页面已清空，尚未保存。保存后才会替换上次保存的内容。');
    };
    dialog.showModal();
  }
  function openExampleDialog() {
    const dialog = $('#example-dialog');
    dialog.innerHTML = `<div class="dialog-card example-dialog"><div class="dialog-top"><div><p class="eyebrow">只读示例</p><h2>示例人生存档</h2></div><button class="icon-close" type="button" data-close>×</button></div><p class="example-notice">以下均为虚构内容，仅用于说明填写方式，不会写入你的人生存档。</p><div class="example-modules"><section><h3>我的数字世界</h3><article><strong>常用邮箱</strong><span>账号线索：lin-demo</span><span>密码保存位置：本机密码管理器</span></article></section><section><h3>我的现实世界</h3><article><strong>家庭重要文件</strong><span>原件位置：书房文件柜 A 层</span><span>处理方式：先联系执行人确认清单</span></article></section><section><h3>我在乎的人和事</h3><article><strong>宠物：豆包</strong><span>日常习惯：早晚各一次散步</span><span>长期安排：由朋友小周照顾</span></article></section><section><h3>如果有一天</h3><article><strong>第一联系人：家人 A</strong><span>联系线索：家庭通讯录中的“家人 A”</span></article><article><strong>执行人：朋友 B</strong><span>可协助事项：查找文件与联系家人</span></article></section></div><div class="dialog-actions"><button class="button button-primary" type="button" data-close>看完了</button></div></div>`;
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { dialog.innerHTML = ''; dialog.close(); });
    dialog.showModal();
  }
  function hasSeenUserNotice() {
    try { return localStorage.getItem(USER_NOTICE_KEY) === 'yes'; }
    catch (_) { return false; }
  }
  function rememberUserNotice() {
    try { localStorage.setItem(USER_NOTICE_KEY, 'yes'); }
    catch (_) { /* 无法记住时不影响继续使用 */ }
  }
  function openUserNoticeDialog({ firstUse = false } = {}) {
    const dialog = $('#user-notice-dialog');
    dialog.setAttribute('aria-labelledby', 'user-notice-title');
    dialog.innerHTML = `
      <div class="dialog-card guide-dialog-card user-notice-card">
        <div class="dialog-top guide-dialog-top">
          <div><p class="eyebrow">人生存档 · 用户须知</p><h2 id="user-notice-title">使用人生存档前，请先知道这件最重要的事</h2><p>这不是一份难懂的协议，只是想先告诉你：怎样做，才能让这份人生存档以后真的帮上忙。</p></div>
          ${firstUse ? '' : '<button class="icon-close" type="button" data-notice-close aria-label="关闭用户须知">×</button>'}
        </div>

        <section class="guide-section">
          <p>人生存档可以帮你把重要账号、资产线索、文件位置、宠物安排、联系人和想留下的话整理好。</p>
          <div class="guide-callout user-notice-key-message"><strong>但是，仅仅填写完成还不够。</strong><p>如果有一天你因为意外、疾病或其他原因无法亲自处理自己的事情，这个软件不会自动知道你发生了什么，也不会自动通知你的家人或联系人。</p></div>
          <p>所以，想让人生存档真正发挥作用，你需要提前做好下面几件事：</p>
          <div class="guide-step-list">
            <article class="guide-step"><span>第一步</span><div><h4>把重要的事情填写清楚</h4><p>不用一次全部完成，可以先整理你需要的账号、数字资产线索、文件、联系人和宠物安排。如果以后需要别人帮你处理事情，可以先添加联系人，再从联系人中设置一个或多个执行人。现在不想设置也可以，以后再补。</p></div></article>
            <article class="guide-step"><span>第二步</span><div><h4>记得点击“保存人生存档”</h4><p>只有你主动保存以后，下次重新打开软件才能恢复到最后一次保存的内容。如果修改以后没有保存就直接关闭，这次没有保存的修改不会保留。</p></div></article>
            <article class="guide-step"><span>第三步</span><div><h4>建议再做一份 .life 备份</h4><p>点击“保存并备份”，可以另外生成一个 .life 人生存档文件。</p><p>你可以把它放在 U 盘、移动硬盘、自己的网盘、保险柜或其他你认为安全的位置。</p><p>.life 文件主要用于备份、换电脑恢复，以及以后需要时让你信任的人恢复你的人生存档。</p></div></article>
            <article class="guide-step user-notice-most-important"><span>第四步</span><div><h4>至少让一个你信任的人知道它存在</h4><p><strong>这是最重要的一步。人生存档不会自动联系任何人。</strong></p><p>请提前让至少一位你真正信任的人知道：</p><ol><li>你留有一份《人生存档》</li><li>人生存档大概放在哪里</li><li>谁是你的第一联系人或执行人</li><li>如果备份设置了密码，需要去哪里获得密码或解锁线索</li></ol><p>你不需要现在就把完整人生存档交给对方。只需要让对方知道：“如果真的有一天需要处理我的事情，我留了一份人生存档，你知道应该去哪里找。”</p></div></article>
          </div>
        </section>

        <section class="guide-section">
          <h3>联系人和执行人怎么设置？</h3><p>先在“如果有一天”添加联系人，再从已有联系人中设置执行人。执行人可以设置多位。之后在“我的数字世界”“我的现实世界”和“我在乎的人和事”的具体卡片中，可以按需要选择一位“负责执行人”，也可以暂不指定。联系人、执行人和负责执行人都可以不填，以后再补。</p>
          <p class="guide-number">例</p><h3>举个简单的例子</h3>
          <div class="guide-example user-notice-example"><p><b>人生存档备份：</b>家里保险柜里的 U 盘</p><p><b>执行人：</b>哥哥</p><p><b>密码获取方式：</b>保险柜里的蓝色密封信封</p><p><b>提前告诉哥哥：</b>“如果以后真的发生需要你帮我处理事情的情况，我留了一份人生存档，在家里保险柜的 U 盘里。”</p></div>
          <p>这样即使你当时无法亲自说话，对方也知道这份存档存在，并知道应该从哪里开始。</p>
        </section>

        <section class="guide-section">
          <p class="guide-number">备份</p><h3>关于加密备份</h3>
          <div class="guide-two-column">
            <article class="guide-choice"><h4>如果选择加密</h4><p>别人拿到 .life 文件也不能直接打开，更安全。</p><p>但是请一定安排好密码的获取方式。如果只有你一个人知道密码，而你以后无法告诉别人，这份加密存档也可能无法发挥作用。</p></article>
            <article class="guide-choice"><h4>如果选择不加密</h4><p>以后恢复更加方便，但任何得到文件的人都有可能查看里面的内容。</p><p>请只把未加密备份放在你认为足够安全的位置。</p></article>
          </div>
          <p>最终由你自己决定使用哪种方式。</p>
        </section>

        <section class="guide-section user-notice-reminder">
          <p class="guide-number">记住</p><h3>人生存档真正发挥作用，需要完成这四件事</h3>
          <p class="user-notice-flow"><strong>整理好</strong><span>→</span><strong>保存好</strong><span>→</span><strong>备份好</strong><span>→</span><strong>让可信的人知道怎么找到</strong></p>
          <p>少了最后一步，即使内容填写得非常完整，也可能没有人知道它存在。</p>
        </section>

        <section class="guide-section">
          <p class="guide-number">安全</p><h3>安全提醒</h3>
          <div class="guide-safety-list">
            <article><span>1</span><div><h4>不要填写真实账号密码、支付密码、验证码、私钥或助记词</h4><p class="guide-good">可以写：“密码保存在密码管理器里”“密码在保险柜的蓝色信封”“验证设备是备用手机”。</p><p class="guide-bad">不要写：“我的密码是 123456”。</p></div></article>
            <article><span>2</span><div><h4>打印或交给别人以前先检查</h4><p>完整人生存档和打印文件可能包含大量个人隐私，请自己决定保存在哪里以及交给谁。</p></div></article>
            <article><span>3</span><div><h4>重要安排仍要按正式方式办理</h4><p>人生存档用于帮助你整理信息、记录个人意愿和留下处理线索，不代表所有内容自动具有遗嘱、公证、继承或其他法律效力。</p></div></article>
          </div>
        </section>

        <div class="guide-finish user-notice-finish"><button class="button button-primary" type="button" data-notice-accept>我明白了，开始创建人生存档</button><p>以后可以随时从左下角“安全与使用说明”重新查看本须知。</p></div>
      </div>`;
    const finish = () => { rememberUserNotice(); dialog.innerHTML = ''; dialog.close(); };
    dialog.querySelector('[data-notice-accept]').onclick = finish;
    dialog.querySelectorAll('[data-notice-close]').forEach(button => button.onclick = () => { dialog.innerHTML = ''; dialog.close(); });
    dialog.oncancel = event => { if (firstUse) event.preventDefault(); };
    dialog.onclose = () => { dialog.innerHTML = ''; dialog.oncancel = null; };
    dialog.showModal();
  }
  function maybeOpenUserNotice() {
    if (!hasSeenUserNotice()) setTimeout(() => openUserNoticeDialog({ firstUse: true }), 0);
  }
  function openGuideDialog() {
    const dialog = $('#guide-dialog');
    dialog.setAttribute('aria-labelledby', 'guide-title');
    dialog.innerHTML = `
      <div class="dialog-card guide-dialog-card">
        <div class="dialog-top guide-dialog-top">
          <div><p class="eyebrow">安全与使用说明</p><h2 id="guide-title">第一次用？按这个顺序来就行</h2><p>不用研究复杂原理，照着下面的步骤操作就可以。</p></div>
          <button class="icon-close" type="button" data-close aria-label="关闭安全与使用说明">×</button>
        </div>

        <div class="guide-notice-link"><div><strong>想重新查看第一次打开时的《用户须知》？</strong><p>里面会提醒你怎样让可信的人以后能够找到这份人生存档。</p></div><button class="button button-quiet" type="button" data-open-user-notice>重新查看用户须知</button></div>

        <section class="guide-section" aria-labelledby="guide-first-use">
          <p class="guide-number">一</p><h3 id="guide-first-use">第一次使用，建议这样做</h3>
          <div class="guide-step-list">
            <article class="guide-step"><span>第1步</span><div><h4>先填写最重要的内容</h4><p>不用一次全部填完。可以按自己的需要填写，没有的内容直接跳过，以后再补：</p><ul><li>第一联系人</li><li>最重要的几个账号和数字资产线索</li><li>重要文件放在哪里</li><li>宠物或需要照顾的事情</li><li>如果以后需要别人帮你处理事情，可以先添加联系人，再从联系人中设置一个或多个执行人</li></ul><h4>联系人和执行人怎么设置？</h4><p>先在“如果有一天”添加联系人，再从已有联系人中设置执行人。执行人可以设置多位。之后在“我的数字世界”“我的现实世界”和“我在乎的人和事”的具体卡片中，可以按需要选择一位“负责执行人”，也可以暂不指定。联系人、执行人和负责执行人都可以不填，以后再补。</p></div></article>
            <article class="guide-step"><span>第2步</span><div><h4>填写完成后点击“保存人生存档”</h4><p>只有你主动点击“保存人生存档”，当前填写的内容才会保存下来。</p><p>如果填写以后没有保存就直接关闭软件，下次打开时不会保留这一次没有保存的修改。以后修改了内容，也记得重新点一次“保存人生存档”。</p></div></article>
            <article class="guide-step"><span>第3步</span><div><h4>建议再做一份备份</h4><p>点击“保存并备份”，可以生成一个 .life 人生存档文件。</p><p>这个文件可以放到 U 盘、移动硬盘、自己的网盘或其他安全位置。它主要用于备份、换电脑恢复，或者以后交给你信任的人。</p></div></article>
          </div>
        </section>

        <section class="guide-section" aria-labelledby="guide-save-difference">
          <p class="guide-number">二</p><h3 id="guide-save-difference">“保存人生存档”和“保存并备份”有什么区别？</h3>
          <div class="guide-two-column">
            <article class="guide-choice"><h4>保存人生存档</h4><p>把现在填写好的内容保存在当前这台电脑的这个浏览器里。以后重新打开人生存档，可以继续看到上一次保存好的内容。</p></article>
            <article class="guide-choice"><h4>保存并备份</h4><p>除了保存当前内容，还会额外生成一个 .life 文件。这个文件可以复制走，用于备份、换电脑恢复或交接。</p></article>
          </div>
          <div class="guide-simple"><strong>简单理解</strong><p>“保存人生存档”＝平时使用的保存按钮。</p><p>“保存并备份”＝另外做一份可以带走的备份文件。</p></div>
        </section>

        <section class="guide-section" aria-labelledby="guide-life-file">
          <p class="guide-number">三</p><h3 id="guide-life-file">.life 文件不是打开看的，是用来恢复人生存档的</h3>
          <p>保存并备份以后，你会得到一个以 .life 结尾的文件，例如：</p>
          <p class="guide-file-example">人生存档_2026-08-31_1030.life</p>
          <p><strong>请不要双击这个文件，也不要用记事本打开。</strong></p>
          <p>换了电脑、浏览器里的内容没有了、想恢复以前的一份人生存档，或者从 U 盘、网盘拿回备份时，请这样操作：</p>
          <ol class="guide-ordered"><li>先打开“人生存档”软件。</li><li>点击顶部的“导入人生存档”（也就是恢复备份）。</li><li>选择之前保存的 .life 文件。</li><li>如果这份备份设置过密码，输入当时设置的密码。</li><li>确认内容正确以后，再点击“保存人生存档”。</li></ol>
          <div class="guide-callout"><strong>特别提醒</strong><p>导入 .life 文件只是把备份内容打开。确认没有问题以后，请再点击一次“保存人生存档”，这样它才会成为当前电脑里正式保存的内容。</p><p>如果忘记了加密备份的密码，我们无法帮你找回，请妥善保管。</p></div>
        </section>

        <section class="guide-section" aria-labelledby="guide-password">
          <p class="guide-number">四</p><h3 id="guide-password">备份时要不要设置密码？</h3>
          <div class="guide-two-column">
            <article class="guide-choice"><h4>加密备份</h4><p>更安全，别人拿到 .life 文件也不能直接查看。适合放在电脑、U 盘、网盘等地方。</p><p><strong>但密码忘记以后无法恢复。</strong></p></article>
            <article class="guide-choice"><h4>未加密备份</h4><p>不需要密码，更方便家人在需要的时候恢复。但是任何拿到这个文件的人都有可能看到里面的内容。</p></article>
          </div>
          <div class="guide-callout"><strong>建议</strong><p>如果文件会放在网盘、普通 U 盘或电脑里，优先选择加密。如果文件长期放在只有可信家人能够取得的安全位置，可以根据自己的需要决定是否加密。</p></div>
        </section>

        <section class="guide-section guide-important" aria-labelledby="guide-print-range">
          <p class="guide-number">五</p><h3 id="guide-print-range">打印范围决定“这张卡片以后会出现在哪份文件里”</h3>
          <p>填写每一张卡片时，你都会看到“打印范围”。</p>
          <p><strong>它不是决定这张卡片能不能保存。</strong>无论怎么选择，这张卡片都会正常保存在你的人生存档里。</p>
          <p>“打印范围”只决定以后打印或保存 PDF 时，这张卡片要不要出现在对应文件中。</p>
          <div class="guide-print-types">
            <article><h4>完整人生存档</h4><p>这是给你自己保存的完整版。选择“完整显示”后，打印完整版时会显示这张卡片允许打印的详细内容。</p></article>
            <article><h4>执行人指南</h4><p>这是给以后帮你处理事情的人看的。你可以选择不显示、仅显示摘要或显示详细信息。如果卡片比较私密，不希望执行人看到，就选择“不显示”。</p></article>
            <article><h4>人生存档卡</h4><p>这是更精简的交接提示。敏感信息默认建议不显示，但最终由你自己决定。希望某项内容出现在人生存档卡中，可以主动选择显示。</p></article>
          </div>
          <div class="guide-example"><strong>举例：你有一张 Steam 账号卡片</strong><ul><li><b>完整人生存档：</b>可以选择显示较完整的信息。</li><li><b>执行人指南：</b>可以只显示“有一个 Steam 账号，需要处理”。</li><li><b>人生存档卡：</b>如果没有必要让它出现在简要交接卡里，可以选择“不显示”。</li></ul></div>
          <div class="guide-callout"><strong>重要说明</strong><p>打印范围不会删除任何内容，也不会影响软件里已经保存的资料。它只控制“以后打印的时候给别人看多少”。</p></div>
        </section>

        <section class="guide-section" aria-labelledby="guide-print-difference">
          <p class="guide-number">六</p><h3 id="guide-print-difference">三种打印内容有什么区别？</h3>
          <div class="guide-print-types">
            <article><h4>完整人生存档</h4><p>给自己长期保存。内容最完整，隐私程度最高，不要随便交给别人。</p></article>
            <article><h4>执行人指南</h4><p>给将来帮助你处理事情的人。重点告诉对方需要做什么、从哪里开始，不一定包含你的全部资料。</p></article>
            <article><h4>人生存档卡</h4><p>是一份比较精简的交接提示。适合告诉重要的人：“我有人生存档、在哪里、应该找谁、下一步怎么做。”</p></article>
          </div>
        </section>

        <section class="guide-section" aria-labelledby="guide-safety">
          <p class="guide-number">七</p><h3 id="guide-safety">安全注意事项</h3>
          <div class="guide-safety-list">
            <article><span>1</span><div><h4>不要填写真实密码、支付密码、验证码、私钥或助记词</h4><p class="guide-good">可以填写：“密码保存在 1Password”“密码在家里保险柜的蓝色信封”“验证设备是备用手机”。</p><p class="guide-bad">不要填写：“我的支付宝密码是 123456”。</p></div></article>
            <article><span>2</span><div><h4>资料只留在你的设备上</h4><p>人生存档完全在你的设备上运行。我们不会把你填写的资料上传、传输或建立远程副本。</p></div></article>
            <article><span>3</span><div><h4>保存到当前电脑不等于做好备份</h4><p>重要人生存档建议另外生成 .life 文件，并至少保存一份副本。</p></div></article>
            <article><span>4</span><div><h4>打印以前先检查</h4><p>完整人生存档和打印 PDF 可能包含非常私密的信息。打印或交给别人以前，请先检查打印范围。</p></div></article>
            <article><span>5</span><div><h4>设置执行人不会自动通知对方</h4><p>建议提前让至少一位你信任的人知道：你有人生存档、大概放在哪里、密码或解锁线索在哪里。</p></div></article>
            <article><span>6</span><div><h4>重要决定仍要使用正式方式办理</h4><p>本产品用于帮助整理信息和记录个人意愿，不替代正式遗嘱、公证、律师或其他具有法律效力的安排。</p></div></article>
          </div>
        </section>

        <section class="guide-section" aria-labelledby="guide-feedback">
          <p class="guide-number">八</p><h3 id="guide-feedback">建议与问题反馈</h3>
          <p>遇到使用问题，或有功能建议、体验意见，都可以写邮件告诉我们。你可以按自己的意愿说明使用的浏览器、操作步骤和问题现象，不需要提供个人资料。</p>
          <label>联系邮箱（可以手动选中复制）<input type="text" value="${FEEDBACK_EMAIL}" readonly data-feedback-email></label>
          <div class="welcome-actions"><button class="button button-secondary" type="button" data-copy-feedback-email>复制邮箱</button><a class="button button-quiet" href="mailto:${FEEDBACK_EMAIL}">使用邮件客户端联系</a></div>
          <p>没有配置邮件客户端也没关系，复制邮箱后，可以到你平时使用的邮箱里自行写信。点击邮件链接只是打开邮件客户端，不会自动发送邮件。</p>
          <div class="guide-safety-list"><article><span>!</span><div><h4>发送前，请先保护好自己的隐私</h4><p>不要通过邮件发送真实密码、支付密码、验证码、私钥、助记词，也不要发送包含个人敏感资料的完整人生存档或 .life 文件。截图请先遮盖个人信息。</p></div></article></div>
          <p>软件不会自动收集、上传或附加你的人生存档数据、浏览器信息、日志或本地文件。要不要联系、写什么、是否发送，都由你自己决定。</p>
        </section>

        <section class="guide-section guide-finish" aria-labelledby="guide-finish">
          <p class="guide-number">九</p><h3 id="guide-finish">以后需要时，随时回来看看</h3>
          <p>以后还可以随时从左下角“安全与使用说明”重新查看。</p>
          <button class="button button-primary" type="button" data-close>我知道怎么用了</button>
        </section>
      </div>`;
    const closeGuide = () => { dialog.innerHTML = ''; dialog.close(); };
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = closeGuide);
    dialog.querySelector('[data-open-user-notice]').onclick = () => { closeGuide(); openUserNoticeDialog(); };
    dialog.querySelector('[data-copy-feedback-email]').onclick = async () => {
      try {
        if (!globalThis.navigator?.clipboard?.writeText) throw new Error('CLIPBOARD_UNAVAILABLE');
        await navigator.clipboard.writeText(FEEDBACK_EMAIL);
        showToast('邮箱已复制，可以粘贴到你使用的邮箱中。');
      } catch (_) {
        const emailInput = dialog.querySelector('[data-feedback-email]');
        emailInput.focus(); emailInput.select();
        showToast('浏览器未能自动复制。邮箱已选中，请右键复制、按 Ctrl+C，或在手机上长按复制。');
      }
    };
    dialog.onclose = () => { dialog.innerHTML = ''; };
    dialog.showModal();
  }
  const printProfiles = {
    full: { title: '完整人生存档', description: '包含允许进入完整存档的全部有效卡片。适合本人或明确授权的执行人。', policy: 'fullArchive' },
    executor: { title: '执行人指南', description: '包含已授权给执行人的联系人、安排和处理线索。', policy: 'executorGuide' },
    card: { title: '人生存档卡', description: '仅包含你主动选择的卡片，并按每种类型的安全字段白名单输出。', policy: 'archiveCard' }
  };
  const summaryFields = {
    socialAccount: ['platformName', 'accountName', 'passwordLocation', 'recoveryMethod', 'handlingInstruction'], emailOrCloudDrive: ['serviceName', 'accountHint', 'passwordLocation', 'recoveryMethod', 'handlingInstruction'], gameAccount: ['platformName', 'accountName', 'passwordLocation', 'handlingInstruction'], digitalAsset: ['assetKind', 'nameHint', 'assetDescription', 'materialLocation', 'accessHintLocation', 'handlingInstruction'], digitalWork: ['workName', 'storageLocation', 'recipientHint', 'preservationInstruction'], deviceInfo: ['deviceName', 'deviceLocation', 'importantDataLocation', 'handoverInstruction'], subscription: ['serviceName', 'renewalStatus', 'cancellationMethod', 'handlingInstruction'],
    bankOrPaymentAccount: ['institutionName', 'accountPurpose', 'identifierHint', 'documentLocation', 'handlingInstruction'], investment: ['institutionName', 'productName', 'documentLocation', 'dateHint', 'handlingInstruction'], insurance: ['institutionName', 'productName', 'identifierHint', 'documentLocation', 'handlingInstruction'], loanOrDebt: ['itemName', 'contractLocation', 'repaymentMaterialLocation', 'handlingInstruction'], property: ['assetName', 'documentLocation', 'contractLocation', 'handlingInstruction'], vehicle: ['assetName', 'documentLocation', 'contractLocation', 'handlingInstruction'], contractOrDocument: ['documentName', 'documentType', 'physicalLocation', 'digitalLocation', 'handoverContactCardId'], identityDocument: ['documentName', 'documentType', 'physicalLocation', 'digitalLocation', 'handoverContactCardId'], valuableItem: ['itemName', 'storageLocation', 'recipientHint'], fileLocation: ['fileCategory', 'physicalLocation', 'digitalLocation', 'responsibleContactCardId'],
    pet: ['name', 'species', 'careRoutine', 'medicalRecordLocation', 'temporaryCarerContactCardId', 'longTermArrangement'], plant: ['name', 'location', 'careFrequency', 'recipientHint'], keepsake: ['itemName', 'storageLocation', 'recipientHint', 'message'], giftIntention: ['recipientHint', 'itemOrMaterial', 'handoverCondition', 'message'], importantPhoto: ['albumName', 'primaryLocation', 'backupLocation', 'preservationInstruction'], importantWork: ['workName', 'storageLocation', 'preservationInstruction', 'responsibleContactCardId'], specialArrangement: ['itemName', 'steps', 'materialLocation', 'responsibleContactCardId'],
    archiveAccess: ['archiveLocation', 'passwordHintLocation'], contact: ['displayName', 'relationship', 'contactMethods'], roleAssignment: ['role', 'contactCardId', 'responsibilities'], accountHandling: ['serviceName', 'targetCardId', 'decision', 'reason', 'responsibleContactCardId', 'instructionLocation'], privacyCleanup: ['itemName', 'materialLocation', 'action', 'responsibleContactCardId', 'priority'], petFinalArrangement: ['petCardId', 'primaryCarerContactCardId', 'backupPlan', 'materialLocation'], finalMessage: ['recipientHint', 'message']
  };
  const executorSummaryFields = {
    ...summaryFields,
    archiveAccess: ['archiveLocation'], contact: ['displayName', 'relationship'], roleAssignment: ['role', 'contactCardId'], accountHandling: ['serviceName', 'decision', 'responsibleContactCardId'], privacyCleanup: ['itemName', 'action', 'priority'], petFinalArrangement: ['petCardId', 'backupPlan'], finalMessage: ['recipientHint']
  };
  const executorDetailFields = {
    socialAccount: ['twoFactorLocation'], emailOrCloudDrive: ['purpose', 'importantContentHint'], gameAccount: ['assetHint', 'contactCardId'], digitalAsset: ['accountOrAddressHint', 'contactCardId'], digitalWork: ['ownershipNote'], deviceInfo: ['unlockHintLocation'], subscription: ['paymentHint', 'contactCardId'],
    bankOrPaymentAccount: ['contactHint'], investment: ['contactHint'], insurance: ['serviceContactHint'], loanOrDebt: ['relatedPartyHint'], property: ['identifierHint'], vehicle: ['identifierHint'], contractOrDocument: ['validUntil'], identityDocument: ['validUntil'], valuableItem: ['proofLocation', 'valuationHint'], fileLocation: [],
    pet: ['suppliesLocation'], plant: ['specialCareNote'], keepsake: ['meaning'], giftIntention: ['contactSuggestion'], importantPhoto: ['sharingRecipientHint'], importantWork: ['ownershipNote'], specialArrangement: ['background'],
    archiveAccess: ['passwordHintLocation'], contact: ['contactMethods'], roleAssignment: ['responsibilities'], accountHandling: ['targetCardId', 'reason', 'instructionLocation'], privacyCleanup: ['materialLocation', 'responsibleContactCardId'], petFinalArrangement: ['primaryCarerContactCardId', 'materialLocation'], finalMessage: ['message']
  };
  const archiveCardSafeFields = {
    socialAccount: { summary: ['platformName', 'accountName'], include: ['platformName', 'accountName', 'passwordLocation', 'twoFactorLocation', 'recoveryMethod', 'handlingInstruction'] },
    emailOrCloudDrive: { summary: ['serviceName', 'accountHint'], include: ['serviceName', 'accountHint', 'purpose', 'importantContentHint', 'passwordLocation', 'recoveryMethod', 'handlingInstruction'] },
    gameAccount: { summary: ['platformName', 'accountName'], include: ['platformName', 'accountName', 'assetHint', 'passwordLocation', 'handlingInstruction', 'contactCardId'] },
    digitalAsset: { summary: ['assetKind', 'nameHint'], include: ['assetKind', 'nameHint', 'assetDescription', 'accountOrAddressHint', 'materialLocation', 'accessHintLocation', 'handlingInstruction', 'contactCardId'] },
    digitalWork: { summary: ['workName'], include: ['workName', 'storageLocation', 'ownershipNote', 'recipientHint', 'preservationInstruction'] },
    deviceInfo: { summary: ['deviceName'], include: ['deviceName', 'deviceLocation', 'importantDataLocation', 'unlockHintLocation', 'handoverInstruction'] },
    subscription: { summary: ['serviceName'], include: ['serviceName', 'renewalStatus', 'paymentHint', 'cancellationMethod', 'handlingInstruction', 'contactCardId'] },
    bankOrPaymentAccount: { summary: ['institutionName', 'accountPurpose'], include: ['institutionName', 'accountPurpose', 'identifierHint', 'documentLocation', 'contactHint', 'handlingInstruction'] },
    investment: { summary: ['institutionName', 'productName'], include: ['institutionName', 'productName', 'documentLocation', 'contactHint', 'dateHint', 'handlingInstruction'] },
    insurance: { summary: ['institutionName', 'productName'], include: ['institutionName', 'productName', 'identifierHint', 'documentLocation', 'serviceContactHint', 'handlingInstruction'] },
    loanOrDebt: { summary: ['itemName'], include: ['itemName', 'relatedPartyHint', 'contractLocation', 'repaymentMaterialLocation', 'handlingInstruction'] },
    property: { summary: ['assetName'], include: ['assetName', 'identifierHint', 'documentLocation', 'contractLocation', 'handlingInstruction'] },
    vehicle: { summary: ['assetName'], include: ['assetName', 'identifierHint', 'documentLocation', 'contractLocation', 'handlingInstruction'] },
    contractOrDocument: { summary: ['documentName', 'documentType'], include: ['documentName', 'documentType', 'physicalLocation', 'digitalLocation', 'validUntil', 'handoverContactCardId'] },
    identityDocument: { summary: ['documentName', 'documentType'], include: ['documentName', 'documentType', 'physicalLocation', 'digitalLocation', 'validUntil', 'handoverContactCardId'] },
    valuableItem: { summary: ['itemName'], include: ['itemName', 'storageLocation', 'proofLocation', 'valuationHint', 'recipientHint'] },
    fileLocation: { summary: ['fileCategory'], include: ['fileCategory', 'physicalLocation', 'digitalLocation', 'responsibleContactCardId'] },
    plant: { summary: ['name'], include: ['name', 'location', 'careFrequency', 'specialCareNote', 'recipientHint'] },
    keepsake: { summary: ['itemName'], include: ['itemName', 'meaning', 'storageLocation', 'recipientHint', 'message'] },
    giftIntention: { summary: ['recipientHint', 'itemOrMaterial'], include: ['recipientHint', 'itemOrMaterial', 'handoverCondition', 'contactSuggestion', 'message'] },
    importantPhoto: { summary: ['albumName'], include: ['albumName', 'primaryLocation', 'backupLocation', 'preservationInstruction', 'sharingRecipientHint'] },
    importantWork: { summary: ['workName'], include: ['workName', 'storageLocation', 'ownershipNote', 'preservationInstruction', 'responsibleContactCardId'] },
    specialArrangement: { summary: ['itemName'], include: ['itemName', 'background', 'steps', 'materialLocation', 'responsibleContactCardId'] },
    archiveAccess: { summary: ['archiveLocation'], include: ['archiveLocation', 'passwordHintLocation'] },
    contact: { summary: ['displayName', 'relationship'], include: ['displayName', 'relationship', 'contactMethods'] },
    roleAssignment: { summary: ['role', 'contactCardId'], include: ['role', 'contactCardId', 'responsibilities'] },
    accountHandling: { summary: ['serviceName', 'decision'], include: ['serviceName', 'targetCardId', 'decision', 'reason', 'responsibleContactCardId', 'instructionLocation'] },
    privacyCleanup: { summary: ['itemName', 'action'], include: ['itemName', 'materialLocation', 'action', 'responsibleContactCardId', 'priority'] },
    petFinalArrangement: { summary: ['petCardId', 'backupPlan'], include: ['petCardId', 'primaryCarerContactCardId', 'backupPlan', 'materialLocation'] },
    finalMessage: { summary: ['recipientHint'], include: ['recipientHint', 'message'] },
    pet: { summary: ['name', 'longTermArrangement'], include: ['name', 'species', 'careRoutine', 'medicalRecordLocation', 'temporaryCarerContactCardId', 'longTermArrangement', 'suppliesLocation'] }
  };
  const ARCHIVE_CARD_SECRET_PATTERN = /(?:密码|支付密码|验证码|私钥|助记词|口令)\s*(?:(?:是|为|[:：=])\s*)?[A-Za-z0-9+/=_\-!@#$%^&*().]{4,}(?:\s+[A-Za-z0-9+/=_\-!@#$%^&*().]{2,})*|(?:password|passcode|otp|private\s*key|seed\s*phrase|mnemonic)\s*[:=]\s*\S+/i;
  const ARCHIVE_CARD_RAW_SECRET_PATTERN = /^(?:0x)?[a-f0-9]{64}$|^(?:[a-z]{3,}\s+){11,23}[a-z]{3,}$/i;
  const ARCHIVE_CARD_CREDENTIAL_CLUE_FIELDS = new Set(['passwordLocation', 'twoFactorLocation', 'unlockHintLocation', 'passwordHintLocation', 'accessHintLocation']);
  const ARCHIVE_CARD_LOCATION_CUE_PATTERN = /位置|存放|保存|保管|密码本|密码管理器|保险箱|信封|文件柜|抽屉|U盘|硬盘|手机|电脑|设备|应用|浏览器|云盘|纸质|提示卡|管理员|联系人|1Password|Bitwarden|KeePass/i;
  for (const module of taskModules) for (const type of Object.keys(cardTypes[module])) {
    const legacyName = legacyResponsibilityNames[type];
    for (const fields of [summaryFields, executorSummaryFields, executorDetailFields]) fields[type] = [...new Set([...(fields[type] || []).filter(name => name !== legacyName), 'responsibleExecutorContactId'])];
    for (const level of ['summary', 'include']) archiveCardSafeFields[type][level] = [...new Set([...archiveCardSafeFields[type][level].filter(name => name !== legacyName), 'responsibleExecutorContactId'])];
  }
  const enumLabels = { primaryContact: '第一联系人', backupContact: '备用联系人', executor: '执行人', keep: '保留', delete: '删除', handover: '交接', normal: '一般', high: '优先', exchange: '交易平台资产', wallet: '链上钱包', nft: 'NFT／链上藏品', other: '其他数字资产' };
  function fieldLabel(module, type, name) { return name === 'responsibleExecutorContactId' ? '负责执行人' : cardTypes[module][type][1].find(field => field[0] === name)?.[1] || (legacyResponsibilityNames[type] === name ? '旧存档安排（待确认）' : name); }
  function printableValue(value) {
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) return '';
    if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : item.value || '').filter(Boolean).join('；');
    if (typeof value === 'string' && value.endsWith?.('') && Object.prototype.hasOwnProperty.call(enumLabels, value)) return enumLabels[value];
    if (typeof value === 'string' && value.includes('-')) { const target = findCardById(value); if (target) return target.card.type === 'contact' ? target.card.data.displayName || target.card.title : target.card.title; }
    return String(value);
  }
  function archiveCardPrintableValue(name, value) {
    const text = printableValue(value);
    if (!text || ARCHIVE_CARD_SECRET_PATTERN.test(text) || ARCHIVE_CARD_RAW_SECRET_PATTERN.test(text.trim())) return '';
    if (ARCHIVE_CARD_CREDENTIAL_CLUE_FIELDS.has(name) && !ARCHIVE_CARD_LOCATION_CUE_PATTERN.test(text)) return '';
    return text;
  }
  function printableRows(module, card, mode) {
    const fields = mode === 'summary' ? summaryFields[card.type] : mode === 'executorSummary' ? executorSummaryFields[card.type] : mode === 'executorInclude' ? [...new Set([...(executorSummaryFields[card.type] || []), ...(executorDetailFields[card.type] || [])])] : cardTypes[module][card.type][1].map(field => field[0]);
    const legacyName = taskModules.includes(module) && legacyResponsibilityNames[card.type];
    const withLegacy = (mode === 'full' || mode === 'executorInclude') && legacyName && card.data[legacyName] ? [...fields, legacyName] : fields;
    const rows = [...new Set(withLegacy)].map(name => ({ label: fieldLabel(module, card.type, name), value: printableValue(card.data[name]) })).filter(item => item.value);
    const identity = contactPrintIdentity(module, card);
    if (identity) rows.push({ label: '身份', value: identity });
    return rows;
  }
  function isInternalContactRole(card) { return card.type === 'roleAssignment' && ['primaryContact', 'backupContact'].includes(card.data.role); }
  function contactPrintIdentity(module, card) {
    if (module !== 'ifOneDay' || card.type !== 'contact') return '';
    return ['primaryContact', 'backupContact', 'executor'].filter(role => state.archive.modules.ifOneDay.cards.some(item => item.status === 'active' && item.type === 'roleAssignment' && item.data.role === role && item.data.contactCardId === card.id)).map(role => enumLabels[role]).join('、');
  }
  function printCardHtml(module, card, mode) {
    if (isInternalContactRole(card)) return '';
    const rows = printableRows(module, card, mode);
    if (!rows.length) return '';
    return `<article class="print-card"><p class="type">${escapeHtml(cardTypeLabel(module, card))}</p><h3>${escapeHtml(card.title)}</h3><dl>${rows.map(row => `<div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`).join('')}</dl></article>`;
  }
  function modulePrintHtml(profile) {
    return Object.entries(state.archive.modules).map(([module, container]) => {
      const cards = container.cards.filter(card => card.status === 'active' && card.exportPolicy[profile.policy] !== 'exclude');
      const content = cards.map(card => {
        const selectedPolicy = card.exportPolicy[profile.policy];
        const mode = profile.policy === 'executorGuide' ? selectedPolicy === 'include' ? 'executorInclude' : 'executorSummary' : selectedPolicy === 'summary' ? 'summary' : 'full';
        return printCardHtml(module, card, mode);
      }).filter(Boolean).join('');
      return content ? `<section class="print-module"><h2>${escapeHtml(moduleMeta[module].title)}</h2>${content}</section>` : '';
    }).filter(Boolean).join('');
  }
  function archiveCardPrintHtml() {
    const safeEntry = (module, card) => {
      if (card.status !== 'active' || card.exportPolicy.archiveCard === 'exclude' || isInternalContactRole(card)) return '';
      const fields = archiveCardSafeFields[card.type][card.exportPolicy.archiveCard === 'include' ? 'include' : 'summary'];
      const rows = fields.map(name => ({ label: fieldLabel(module, card.type, name), value: archiveCardPrintableValue(name, card.data[name]) })).filter(row => row.value);
      const identity = contactPrintIdentity(module, card);
      if (identity) rows.push({ label: '身份', value: identity });
      if (!rows.length) return '';
      const safeTitle = archiveCardPrintableValue('title', card.title) || cardTypes[module][card.type][0];
      return `<div><strong>${escapeHtml(safeTitle)}</strong><span>${rows.map(row => `${escapeHtml(row.label)}：${escapeHtml(row.value)}`).join('<br>')}</span></div>`;
    };
    const safeSection = (title, module, cards) => { const content = cards.map(card => safeEntry(module, card)).filter(Boolean).join(''); return content ? `<div class="contact-block"><h2>${escapeHtml(title)}</h2>${content}</div>` : ''; };
    const sections = Object.entries(state.archive.modules).map(([module, container]) => safeSection(moduleMeta[module].title, module, container.cards)).filter(Boolean).join('');
    const content = sections || '<div class="contact-block"><h2>打印内容</h2><p>尚未选择任何卡片进入人生存档卡。</p></div>';
    return `<section class="archive-card-print"><p class="card-kicker">人生存档卡</p><h1>${escapeHtml(state.archive.archiveTitle || '我的人生存档')}</h1><p class="card-intro">这里只输出你主动选择的卡片，并严格限制为每种类型预先定义的安全字段。疑似真实密码、支付密码、验证码、私钥或助记词内容会被过滤。</p>${content}<p class="card-footer">需要完整资料时，请找到人生存档备份；如使用加密备份，请按事先安排的方式获取密码。</p></section>`;
  }
  function printStyle() { return `@page{size:A4;margin:16mm}*{box-sizing:border-box}body{color:#27342d;font:13px/1.6 -apple-system,BlinkMacSystemFont,"Microsoft YaHei",sans-serif;margin:0}.print-header{border-bottom:2px solid #3f6d58;margin-bottom:22px;padding-bottom:14px}.print-header .eyebrow,.type,.card-kicker{color:#3f6d58;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.print-header h1{font-size:27px;line-height:1.2;margin:3px 0 6px}.print-header p{color:#627169;margin:0}.print-module{break-before:page;margin-top:25px}.print-module:first-of-type{break-before:auto}.print-module h2{font-size:20px;margin:0 0 12px;padding-bottom:6px;border-bottom:1px solid #d9e2da}.print-card{break-inside:avoid;border:1px solid #dce4dd;border-radius:8px;margin:0 0 10px;padding:13px}.print-card .type{margin:0 0 2px}.print-card h3{font-size:15px;margin:0 0 8px}.print-card dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 20px;margin:0}.print-card dl div{break-inside:avoid}.print-card dt{color:#6e7b73;font-size:11px}.print-card dd{margin:1px 0 0;white-space:pre-wrap;word-break:break-word}.empty-print{color:#859188;font-style:italic}.print-footer{border-top:1px solid #dce4dd;color:#77847b;font-size:10px;margin-top:25px;padding-top:8px}.archive-card-print{border:2px solid #3f6d58;border-radius:12px;min-height:170mm;padding:20mm}.archive-card-print h1{font-size:30px;margin:4px 0 10px}.card-intro{color:#607068;margin-bottom:25px}.contact-block{border-top:1px solid #dce4dd;padding:12px 0}.contact-block h2{font-size:16px;margin:0 0 8px}.contact-block div{display:grid;gap:3px;margin:9px 0}.contact-block span{white-space:pre-wrap;word-break:break-word}.card-footer{color:#607068;font-size:11px;margin-top:28px}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`; }
  function restoreAfterPrint() {
    if (!activePrintFrame) return;
    activePrintFrame.remove();
    activePrintFrame = null;
    const focusTarget = printReturnFocus;
    printReturnFocus = null;
    setTimeout(() => {
      if (focusTarget?.isConnected) {
        try { focusTarget.focus({ preventScroll: true }); } catch (_) { focusTarget.focus(); }
      }
    }, 0);
  }
  function openPrintWindow(kind, returnFocus) {
    const profile = printProfiles[kind];
    if (activePrintFrame) restoreAfterPrint();
    const frame = document.createElement('iframe');
    frame.title = `${profile.title}打印视图`;
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
    activePrintFrame = frame;
    printReturnFocus = returnFocus || document.querySelector('[data-open-print]');
    const body = kind === 'card' ? archiveCardPrintHtml() : modulePrintHtml(profile);
    frame.onload = () => {
      const printWindow = frame.contentWindow;
      if (!printWindow) { restoreAfterPrint(); showToast('当前浏览器无法建立打印视图。'); return; }
      printWindow.addEventListener('afterprint', restoreAfterPrint, { once: true });
      try { printWindow.focus(); printWindow.print(); }
      catch (_) { restoreAfterPrint(); showToast('当前浏览器无法打开打印界面。'); }
    };
    frame.srcdoc = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escapeHtml(profile.title)}</title><style>${printStyle()}</style><body><header class="print-header"><p class="eyebrow">人生存档 · 本地打印视图</p><h1>${escapeHtml(profile.title)}</h1>${(state.archive.ownerDisplayName || '').trim() ? `<p>存档人：${escapeHtml(state.archive.ownerDisplayName.trim())}</p>` : ''}<p>生成于 ${escapeHtml(new Date().toLocaleString('zh-CN'))}</p></header>${body}<footer class="print-footer">仅在当前设备内生成。请确认接收人适合接触这些资料。</footer></body></html>`;
    document.body.appendChild(frame);
  }
  function openPrintDialog() {
    const dialog = $('#print-dialog');
    dialog.innerHTML = `<form class="dialog-card"><div class="dialog-top"><div><p class="eyebrow">导出打印</p><h2>选择打印范围</h2></div><button class="icon-close" type="button" data-close>×</button></div><p>浏览器将打开打印窗口。请在其中选择“另存为 PDF”，并确认接收人适合接触该范围的资料。</p><p class="guide-callout"><strong>保存 PDF 前请先检查打印预览。若出现本地文件路径、日期等附加信息，请关闭“页眉和页脚”；如果当前打印方式没有该选项，可尝试切换为“Microsoft Print to PDF”。</strong></p><label class="risk-check print-risk"><input type="checkbox" data-print-risk-confirm> 我已理解：浏览器打印页、纸质打印和“另存为 PDF”都是未加密明文副本，不受 .life 存档密码保护。我会自行妥善保管，并确认接收人适合接触这些资料。</label><div class="print-options">${Object.entries(printProfiles).map(([key, profile]) => `<button class="print-option" type="button" data-print-kind="${key}"><strong>${profile.title}</strong><span>${profile.description}</span></button>`).join('')}</div></form>`;
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { dialog.innerHTML = ''; dialog.close(); });
    dialog.querySelectorAll('[data-print-kind]').forEach(button => button.onclick = () => { if (!dialog.querySelector('[data-print-risk-confirm]').checked) { showToast('请先确认打印内容会生成未加密明文副本。'); return; } const kind = button.dataset.printKind; const returnFocus = document.querySelector('[data-open-print]'); dialog.innerHTML = ''; dialog.close(); openPrintWindow(kind, returnFocus); });
    dialog.showModal();
  }
  function openOwnerDialog() {
    const dialog = $('#owner-dialog');
    dialog.innerHTML = `<form class="dialog-card" autocomplete="off"><div class="dialog-top"><h2 id="owner-dialog-title">存档人称呼</h2><button class="icon-close" type="button" data-close aria-label="关闭">×</button></div><label>存档人称呼（可选）<input name="ownerDisplayName" value="${escapeHtml(state.archive.ownerDisplayName || '')}" aria-describedby="owner-description"></label><p id="owner-description">用于打印和辨认这份存档，可以填写姓名、昵称或其他称呼，也可以留空。</p><p class="form-note">此处保存只确认本次编辑。要保存到本机，请再点击“保存人生存档”，或完成“保存并备份”。</p><div class="dialog-actions"><button class="button button-quiet" type="button" data-close>取消</button><button class="button button-primary" type="submit">保存</button></div></form>`;
    const close = () => { dialog.close(); dialog.innerHTML = ''; };
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = close);
    dialog.querySelector('form').onsubmit = event => {
      event.preventDefault();
      const value = String(new FormData(event.currentTarget).get('ownerDisplayName') || '').trim();
      if (value !== (state.archive.ownerDisplayName || '')) { state.archive.ownerDisplayName = value; markChanged(); }
      close();
    };
    dialog.showModal();
  }
  function bind() {
    $('[data-edit-owner]').onclick = openOwnerDialog;
    $$('.nav-item[data-view]').forEach(item => item.onclick = event => { event.preventDefault(); setView(item.dataset.view); });
    $$('.mobile-nav-menu a').forEach(item => item.addEventListener('click', () => item.closest('.mobile-nav-menu')?.removeAttribute('open')));
    $$('.module-card').forEach(card => { const go = () => setView(card.dataset.module); card.onclick = go; card.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); go(); } }; });
    $$('[data-open-quick-start]').forEach(button => button.onclick = openQuickStart);
    $$('[data-shortcut-module]').forEach(button => button.onclick = () => openCardDialog(button.dataset.shortcutModule, null, button.dataset.shortcutType));
    $$('[data-open-check]').forEach(button => button.onclick = openCheck);
    $$('[data-save-local]').forEach(button => button.onclick = () => saveLocalArchive());
    $$('[data-backup-life]').forEach(button => button.onclick = openBackupDialog);
    $$('[data-import-life]').forEach(button => button.onclick = openImportDialog);
    $$('[data-open-print]').forEach(button => button.onclick = openPrintDialog);
    $$('[data-open-example]').forEach(button => button.onclick = openExampleDialog);
    $$('[data-open-guide]').forEach(button => button.onclick = event => { event.preventDefault(); openGuideDialog(); });
    $$('[data-clear-local]').forEach(button => button.onclick = openClearDialog);
    window.addEventListener('focus', () => { if (activePrintFrame) setTimeout(restoreAfterPrint, 100); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && activePrintFrame) setTimeout(restoreAfterPrint, 100); });
    window.addEventListener('beforeunload', event => { if (!state.isDirty) return; event.preventDefault(); event.returnValue = ''; });
    maybeOpenUserNotice();
  }
  loadLocalArchive(); bind(); updateChrome(); renderModule('digitalWorld', true);
})();
