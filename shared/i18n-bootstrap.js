(function () {
  var configIds = ['72216192', 'codex_i18n', 'codex-desktop-i18n'];
  var locale = 'zh-CN';
  var state = globalThis.__codexZhI18nState || {
    configIds: configIds.slice(),
    matchedConfigIds: [],
    matchedConfigs: [],
    patchedClients: 0,
    patchedConfigs: 0,
    lastPatchAt: 0
  };
  try { globalThis.__codexZhI18nState = state; } catch (_) {}

  function forceConfig(config) {
    if (!config || (typeof config !== 'object' && typeof config !== 'function')) return config;
    if (config.__codexZhI18nConfig) return config;
    try {
      Object.defineProperty(config, '__codexZhI18nConfig', { value: true, configurable: true });
    } catch (_) {}
    if (typeof config.get === 'function') {
      var originalGet = config.get;
      try {
        Object.defineProperty(config, 'get', {
          configurable: true,
          value: function (key, fallback) {
            if (key === 'enable_i18n') return true;
            if (key === 'locale_source') return 'SYSTEM';
            return originalGet.call(this, key, fallback);
          }
        });
      } catch (_) {}
    }
    try {
      if (config.value && typeof config.value === 'object') {
        config.value.enable_i18n = true;
        config.value.locale_source = 'SYSTEM';
      }
    } catch (_) {}
    state.patchedConfigs += 1;
    state.lastPatchAt = Date.now();
    return config;
  }

  function rememberConfigId(key, config, source) {
    var value = String(key);
    if (state.matchedConfigIds.indexOf(value) < 0) state.matchedConfigIds.push(value);
    if (!state.matchedConfigs.some(function (item) { return item.id === value && item.source === source; })) {
      var target = config && config.value && typeof config.value === 'object' ? config.value : config;
      var keys = [];
      try { keys = Object.keys(target || {}).slice(0, 20); } catch (_) {}
      state.matchedConfigs.push({ id: value, source: source || 'unknown', keys: keys });
    }
  }

  function looksLikeI18nConfig(config) {
    if (!config || typeof config !== 'object') return false;
    try {
      var value = config.value && typeof config.value === 'object' ? config.value : config;
      return Object.prototype.hasOwnProperty.call(value, 'enable_i18n') ||
        Object.prototype.hasOwnProperty.call(value, 'locale_source') ||
        Object.prototype.hasOwnProperty.call(value, 'localeOverride');
    } catch (_) { return false; }
  }

  function patchClient(client) {
    if (!client || (typeof client !== 'object' && typeof client !== 'function')) return;
    if (client.__codexZhI18nClient) return;
    var originalDynamic = client.getDynamicConfig;
    var originalLayer = client.getLayer;
    if (typeof originalDynamic !== 'function' && typeof originalLayer !== 'function') return;
    var patched = false;
    try {
      if (typeof originalDynamic === 'function') {
        Object.defineProperty(client, 'getDynamicConfig', {
          configurable: true,
          value: function (key) {
            var result = originalDynamic.apply(this, arguments);
            if (configIds.indexOf(String(key)) >= 0 || looksLikeI18nConfig(result)) {
              rememberConfigId(key, result, 'getDynamicConfig');
              return forceConfig(result);
            }
            return result;
          }
        });
        patched = true;
      }
      if (typeof originalLayer === 'function') {
        Object.defineProperty(client, 'getLayer', {
          configurable: true,
          value: function (key) {
            var result = originalLayer.apply(this, arguments);
            if (configIds.indexOf(String(key)) >= 0 || looksLikeI18nConfig(result)) {
              rememberConfigId(key, result, 'getLayer');
              return forceConfig(result);
            }
            return result;
          }
        });
        patched = true;
      }
      if (!patched) return;
      Object.defineProperty(client, '__codexZhI18nClient', { value: true, configurable: true });
      state.patchedClients += 1;
      state.lastPatchAt = Date.now();
    } catch (_) {}
  }

  function patchGlobal(statsig) {
    if (!statsig || typeof statsig !== 'object') return;
    patchClient(statsig);
    patchClient(statsig.firstInstance);
    patchClient(statsig.instance);
    var instances = statsig.instances;
    if (instances && typeof instances === 'object') {
      Object.keys(instances).forEach(function (key) { patchClient(instances[key]); });
    }
  }

  function installStatsigHook() {
    var patchCurrent = function () {
      try { patchGlobal(globalThis.__STATSIG__); } catch (_) {}
    };
    patchCurrent();
    var attempts = 0;
    var timer = window.setInterval(function () {
      patchCurrent();
      attempts += 1;
      if (attempts >= 400 || (state.patchedClients > 0 && state.patchedConfigs > 0)) {
        window.clearInterval(timer);
      }
    }, 50);
  }

  try {
    Object.defineProperty(Navigator.prototype, 'language', {
      configurable: true,
      get: function () { return locale; }
    });
    Object.defineProperty(Navigator.prototype, 'languages', {
      configurable: true,
      get: function () { return [locale, 'zh']; }
    });
  } catch (_) {}

  installStatsigHook();
  return JSON.stringify({
    status: state.patchedClients > 0 && state.patchedConfigs > 0 ? 'ok' : 'pending',
    configIds: configIds,
    matchedConfigIds: state.matchedConfigIds,
    matchedConfigs: state.matchedConfigs,
    enable_i18n: true,
    locale_source: 'SYSTEM',
    patchedClients: state.patchedClients,
    patchedConfigs: state.patchedConfigs,
    reason: state.patchedClients === 0 ? 'statsig-client-not-found' :
      state.patchedConfigs === 0 ? 'i18n-config-not-found' : '',
    lastPatchAt: state.lastPatchAt
  });
})()
