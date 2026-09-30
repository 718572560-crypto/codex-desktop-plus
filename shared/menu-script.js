(function () {
  var translations = __TRANSLATIONS_JSON__;
  var platform = __PLATFORM_JSON__;
  var attempts = [];
  var electron = null;
  var tryLoad = function (name, callback) {
    try {
      var value = callback();
      attempts.push(name + ':ok');
      return value || null;
    } catch (error) {
      attempts.push(name + ':' + String(error && error.message ? error.message : error));
      return null;
    }
  };
  if (typeof require === 'function') {
    electron = tryLoad('require', function () { return require('electron'); });
  }
  if (!electron && typeof process !== 'undefined' && process.mainModule && process.mainModule.require) {
    electron = tryLoad('mainModule', function () { return process.mainModule.require('electron'); });
  }
  if (!electron && typeof process !== 'undefined' && typeof process.getBuiltinModule === 'function') {
    electron = tryLoad('getBuiltinModule', function () { return process.getBuiltinModule('electron'); });
  }
  if (!electron && typeof process !== 'undefined' && typeof process.getBuiltinModule === 'function') {
    electron = tryLoad('createRequire', function () {
      var Module = process.getBuiltinModule('module');
      var load = Module.createRequire(process.cwd() + '/codex-zh-launcher.cjs');
      return load('electron');
    });
  }
  if (!electron || !electron.Menu) {
    return JSON.stringify({
      status: 'skipped',
      reason: 'electron-menu-unavailable',
      attempts: attempts,
      node: typeof process !== 'undefined' && process.versions ? process.versions.node || '' : '',
      electron: typeof process !== 'undefined' && process.versions ? process.versions.electron || '' : ''
    });
  }
  var Menu = electron.Menu;
  var changed = 0;
  var inspected = 0;
  var untranslated = [];
  var untranslatedSeen = Object.create(null);
  var untranslatedIndex = Object.create(null);
  var version = typeof process !== 'undefined' && process.versions ? process.versions.electron || '' : '';
  var appVersion = __CODEX_VERSION_JSON__ || (typeof process !== 'undefined' && process.env ? process.env.CODEX_VERSION || '' : '');
  var isBrandLabel = function (label) { return label === 'ChatGPT' || label === 'Codex'; };
  var patternTranslation = function (label) {
    var goToChat = /^Go to Chat (\d+)$/.exec(label);
    if (goToChat) return '转到对话 ' + goToChat[1];
    if (platform === 'macos') {
      var about = /^About (.+)$/.exec(label);
      if (about) return '关于 ' + about[1];
      var hide = /^Hide (.+)$/.exec(label);
      if (hide) return '隐藏 ' + hide[1];
      var quit = /^Quit (.+)$/.exec(label);
      if (quit) return '退出 ' + quit[1];
    }
    return null;
  };
  var translateItem = function (item, path) {
    if (!item) return;
    var label = item.label || '';
    if (label) inspected += 1;
    var translated = Object.prototype.hasOwnProperty.call(translations, label)
      ? translations[label]
      : patternTranslation(label);
    if (translated) {
      item.label = translated;
      changed += 1;
    } else if (label && !isBrandLabel(label) && !/[\u3400-\u9fff]/.test(label)) {
      var key = path.concat([label]).join(' > ');
      if (!untranslatedSeen[key]) {
        untranslatedSeen[key] = 0;
        untranslatedIndex[key] = untranslated.length;
        untranslated.push({ label: label, path: path.slice(), platform: platform, electron: version, codexVersion: appVersion, count: 0 });
      }
      untranslatedSeen[key] += 1;
      untranslated[untranslatedIndex[key]].count = untranslatedSeen[key];
    }
    if (item.submenu && item.submenu.items) item.submenu.items.forEach(function (child) {
      translateItem(child, path.concat(label ? [label] : []));
    });
  };
  var translateMenu = function (menu) {
    changed = 0;
    inspected = 0;
    untranslated = [];
    untranslatedSeen = Object.create(null);
    untranslatedIndex = Object.create(null);
    if (menu && menu.items) menu.items.forEach(function (item) { translateItem(item, []); });
    return menu;
  };
  globalThis.__codexZhLauncherTranslateMenu = translateMenu;
  if (globalThis.__codexZhLauncherMenuPatchVersion !== 4) {
    var originalSetApplicationMenu = Menu.setApplicationMenu.bind(Menu);
    Menu.setApplicationMenu = function (menu) {
      try {
        if (typeof globalThis.__codexZhLauncherTranslateMenu === 'function') {
          globalThis.__codexZhLauncherTranslateMenu(menu);
        }
      } catch (_) {}
      return originalSetApplicationMenu(menu);
    };
    globalThis.__codexZhLauncherMenuPatch = true;
    globalThis.__codexZhLauncherMenuPatchVersion = 4;
  }
  var current = Menu.getApplicationMenu();
  if (current) {
    translateMenu(current);
    Menu.setApplicationMenu(current);
  }
  var status = untranslated.length > 0 || !current || inspected === 0 ? 'partial' : 'ok';
  return JSON.stringify({
    status: status,
    reason: !current || inspected === 0 ? 'application-menu-empty' : '',
    changed: changed,
    inspected: inspected,
    untranslated: untranslated,
    diagnostics: { platform: platform, electron: version, codexVersion: appVersion },
    topLabels: current && current.items ? current.items.map(function (item) { return item.label; }) : []
  });
})()
