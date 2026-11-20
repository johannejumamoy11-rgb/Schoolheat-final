const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const script = fs.readFileSync(scriptPath, 'utf8');
const indexPath = path.join(__dirname, '..', 'index.html');
const index = fs.readFileSync(indexPath, 'utf8');
const appBootstrap = /\r?\nconst app = new SchoolHeatApp\(\);\r?\nwindow\.app = app;\s*$/;

assert.match(script, appBootstrap);
const isolatedScript = script.replace(appBootstrap, '');
const context = { window: {} };
vm.runInNewContext(
  `${isolatedScript}\nglobalThis.SchoolHeatAppForTest = SchoolHeatApp;\nglobalThis.SchoolHeatLocationsForTest = LOCATIONS;\nglobalThis.SchoolHeatStatusColorForTest = getStatusColor;\nglobalThis.SchoolHeatAccessibleAccentForTest = getAccessibleAccent;\nglobalThis.SchoolHeatAccessibleColorForTest = getAccessibleColor;\nglobalThis.SchoolHeatContrastRatioForTest = getContrastRatio;\nglobalThis.SchoolHeatReadableTextColorForTest = getReadableTextColor;\nglobalThis.SchoolHeatCustomPaletteDefaultsForTest = CUSTOM_THEME_COLOR_DEFAULTS;\nglobalThis.SchoolHeatPaletteValidationForTest = getCustomPaletteValidationError;\nglobalThis.SchoolHeatPaletteNormalizationForTest = normalizeCustomPaletteColors;\nglobalThis.SchoolHeatColorPalettesForTest = APP_COLOR_PALETTES;\nglobalThis.SchoolHeatCustomAccentChoicesForTest = CUSTOM_ACCENT_CHOICES;\nglobalThis.SchoolHeatCustomPaletteGeneratorForTest = createCustomPaletteColors;`,
  context
);

const app = Object.create(context.SchoolHeatAppForTest.prototype);

test('removes file-import controls and implementation', () => {
  assert.doesNotMatch(index, /history-upload|history-file-input|Choose data file/);
  assert.doesNotMatch(script, /importReadingsFile|parseDelimitedText|parseXlsxFile|normalizeUploadedReadings/);
  assert.doesNotMatch(script, /getReadingSourceLabel/);
});

test('offers one-tap swatches plus one full-spectrum picker', () => {
  const paletteChoices = [...index.matchAll(/data-palette-choice="([^"]+)"/g)]
    .map(match => match[1])
    .sort();
  assert.deepEqual(paletteChoices, ['canopy', 'lagoon', 'schoolheat']);
  const accentChoices = [...index.matchAll(/data-custom-accent-choice="([^"]+)"/g)]
    .map(match => match[1])
    .sort();
  assert.deepEqual(accentChoices, [...context.SchoolHeatCustomAccentChoicesForTest].sort());
  assert.equal(accentChoices.length, 16);
  assert.match(index, /input id="setting-any-color" type="color"/);
  assert.equal((index.match(/type="color"/g) || []).length, 1);
  assert.doesNotMatch(index, /data-custom-palette-field/);
  assert.doesNotMatch(script, /readCustomPaletteInputs|setCustomPaletteStatus/);
  assert.match(script, /addEventListener\('change', \(\) => applyCustomAccent\(anyColorPicker\.value\)\)/);
});

test('builds readable full palettes from one selected color in both themes', () => {
  const defaults = context.SchoolHeatCustomPaletteDefaultsForTest;
  const createPalette = context.SchoolHeatCustomPaletteGeneratorForTest;
  const validate = context.SchoolHeatPaletteValidationForTest;
  context.SchoolHeatCustomAccentChoicesForTest.forEach(color => {
    ['dark', 'light'].forEach(theme => {
      const palette = createPalette(theme, color);
      assert.equal(validate(palette), '');
      assert.notEqual(palette.background, defaults[theme].background);
      assert.notEqual(palette.surface, defaults[theme].surface);
      assert.equal(palette.text, defaults[theme].text);
      assert.equal(palette.secondaryText, defaults[theme].secondaryText);
    });
  });
  ['dark', 'light'].forEach(theme => {
    assert.equal(validate(createPalette(theme, '#e83e92')), '');
  });
});

test('keeps reading history out of Settings and preserves alert controls', () => {
  assert.doesNotMatch(index, /Heat Alert Activity|alert-history-list/);
  assert.doesNotMatch(script, /renderAlertHistory/);
  assert.match(index, /id="alerts-center"/);
});

test('uses plain language for old readings', () => {
  const freshnessApp = Object.create(context.SchoolHeatAppForTest.prototype);
  const freshness = freshnessApp.getReadingFreshness({
    timestamp: new Date(Date.now() - 16 * 60 * 1000).toISOString()
  });

  assert.equal(freshness.state, 'stale');
  assert.equal(freshness.label, 'OLD DATA');
  assert.equal(freshness.detail, 'Last reading 16 min ago. Update the sensor to get a new reading.');
});

test('keeps user-selected accent colors readable against both theme surfaces', () => {
  const accents = ['#ffffff', '#000000', '#ff4f8b', '#287985'];
  const surfaces = ['#fffdf6', '#192624'];
  accents.forEach(accent => {
    const textColor = context.SchoolHeatReadableTextColorForTest(accent);
    assert.ok(
      context.SchoolHeatContrastRatioForTest(textColor, accent) >= 4.5,
      `${textColor} must meet 4.5:1 contrast on ${accent}`
    );
    surfaces.forEach(surface => {
      const readableAccent = context.SchoolHeatAccessibleAccentForTest(accent, surface);
      assert.ok(
        context.SchoolHeatContrastRatioForTest(readableAccent, surface) >= 4.5,
        `${readableAccent} must meet 4.5:1 contrast on ${surface}`
      );
    });
  });
});

test('validates full custom palettes for readable text in each theme', () => {
  const defaults = context.SchoolHeatCustomPaletteDefaultsForTest;
  const validation = context.SchoolHeatPaletteValidationForTest;
  ['dark', 'light'].forEach(theme => {
    const palettes = [
      defaults[theme],
      context.SchoolHeatColorPalettesForTest.canopy[theme],
      context.SchoolHeatColorPalettesForTest.lagoon[theme]
    ];
    palettes.forEach(colors => {
      assert.equal(validation(colors), '');
      const surfaces = [colors.background, colors.surface];
      [colors.accent, colors.secondaryAccent].forEach(accent => {
        const readableAccent = context.SchoolHeatAccessibleAccentForTest(accent, surfaces);
        assert.ok(readableAccent);
        surfaces.forEach(surface => {
          assert.ok(context.SchoolHeatContrastRatioForTest(readableAccent, surface) >= 4.5);
        });
      });
      const readableBorder = context.SchoolHeatAccessibleColorForTest(colors.border, surfaces, 3);
      assert.ok(readableBorder);
      surfaces.forEach(surface => {
        assert.ok(context.SchoolHeatContrastRatioForTest(readableBorder, surface) >= 3);
      });
    });
  });

  const unreadable = { ...defaults.light, text: '#ffffff' };
  assert.match(validation(unreadable), /Main text needs at least 4\.5:1 contrast/);
});

test('keeps custom palettes separate for light and dark themes and migrates saved accents', () => {
  const normalized = context.SchoolHeatPaletteNormalizationForTest(null, '#c14eb3');
  assert.equal(normalized.dark.accent, '#c14eb3');
  assert.equal(normalized.light.accent, '#c14eb3');
  assert.notEqual(normalized.dark.background, normalized.light.background);

  const edited = {
    dark: { ...normalized.dark, background: '#183129' },
    light: { ...normalized.light, background: '#f5f0dc' }
  };
  const restored = context.SchoolHeatPaletteNormalizationForTest(edited, '#287985');
  assert.equal(restored.dark.background, '#183129');
  assert.equal(restored.light.background, '#f5f0dc');
});

test('does not show stale or demo danger readings as active heat alerts', () => {
  const previousDocument = context.document;
  const makeAlertApp = reading => {
    const calls = [];
    const banner = { style: { display: 'none' } };
    const text = { textContent: '' };
    context.document = {
      getElementById: id => ({
        'alert-banner': banner,
        'alert-text': text
      })[id] || null
    };
    const alertApp = Object.create(context.SchoolHeatAppForTest.prototype);
    alertApp.readings = [reading];
    alertApp.lastObservedReadingId = 'previous-reading';
    alertApp.settings = { pushAlerts: true, smsAlerts: true };
    alertApp.translateText = value => value;
    alertApp.formatTime = () => '3:00 PM';
    alertApp.toast = () => calls.push('toast');
    alertApp.showBrowserNotification = () => calls.push('browser');
    alertApp.sendHeatPushAlert = () => calls.push('push');
    alertApp.sendHeatSmsAlert = () => calls.push('sms');
    return { alertApp, banner, text, calls };
  };

  try {
    const staleReading = {
      id: 'stale-reading',
      location: 'School Clinic',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      temperature: 38,
      humidity: 80,
      heatIndex: 45,
      status: 'extreme'
    };
    const stale = makeAlertApp(staleReading);
    stale.alertApp.checkAlerts();
    assert.equal(stale.banner.style.display, 'none');
    assert.deepEqual(stale.calls, []);

    const demoReading = {
      ...staleReading,
      id: 'demo-reading',
      timestamp: new Date().toISOString(),
      isDemo: true
    };
    const demo = makeAlertApp(demoReading);
    demo.alertApp.checkAlerts();
    assert.equal(demo.banner.style.display, 'none');
    assert.deepEqual(demo.calls, []);
  } finally {
    if (previousDocument === undefined) delete context.document;
    else context.document = previousDocument;
  }
});

test('shows and sends a warning for a recent, valid, non-demo danger reading', () => {
  const previousDocument = context.document;
  const calls = [];
  const banner = { style: { display: 'none' } };
  const text = { textContent: '' };
  context.document = {
    getElementById: id => ({
      'alert-banner': banner,
      'alert-text': text
    })[id] || null
  };
  const alertApp = Object.create(context.SchoolHeatAppForTest.prototype);
  const reading = {
    id: 'recent-reading',
    location: 'School Clinic',
    timestamp: new Date().toISOString(),
    temperature: 38,
    humidity: 80,
    heatIndex: 45,
    status: 'extreme'
  };
  alertApp.readings = [reading];
  alertApp.lastObservedReadingId = 'previous-reading';
  alertApp.settings = { pushAlerts: true, smsAlerts: true };
  alertApp.translateText = value => value;
  alertApp.formatTime = () => '3:00 PM';
  alertApp.toast = () => calls.push('toast');
  alertApp.showBrowserNotification = () => calls.push('browser');
  alertApp.sendHeatPushAlert = () => calls.push('push');
  alertApp.sendHeatSmsAlert = () => calls.push('sms');

  try {
    alertApp.checkAlerts();

    assert.equal(banner.style.display, 'flex');
    assert.match(text.textContent, /Recent high heat reading: Hinto at School Clinic — 45\.0°C · 3:00 PM/);
    assert.deepEqual(calls, ['toast', 'browser', 'push', 'sms']);
  } finally {
    if (previousDocument === undefined) delete context.document;
    else context.document = previousDocument;
  }
});

test('uses the active theme color for chart risk statuses', () => {
  const previousDocument = context.document;
  const previousGetComputedStyle = context.getComputedStyle;
  context.document = { documentElement: {} };
  context.getComputedStyle = () => ({
    getPropertyValue: name => name === '--safe' ? '#176a4d' : ''
  });

  try {
    assert.equal(context.SchoolHeatStatusColorForTest('safe'), '#176a4d');
    assert.equal(context.SchoolHeatStatusColorForTest('caution'), '#f0c66c');
  } finally {
    if (previousDocument === undefined) delete context.document;
    else context.document = previousDocument;
    if (previousGetComputedStyle === undefined) delete context.getComputedStyle;
    else context.getComputedStyle = previousGetComputedStyle;
  }
});

test('skips model evaluation when the latest eligible forecast reading is stale', () => {
  const forecastApp = Object.create(context.SchoolHeatAppForTest.prototype);
  const attributes = {};
  let selectedTab = '';
  const elements = {
    'dashboard-forecast-empty': { hidden: true },
    'dashboard-forecast-empty-title': { textContent: '' },
    'dashboard-forecast-empty-detail': { textContent: '' },
    'dashboard-forecast-action': { onclick: null },
    'dashboard-forecast-action-label': { textContent: '' },
    'dashboard-forecast-content': { hidden: false },
    'dashboard-forecast-chart': {
      setAttribute: (name, value) => { attributes[name] = value; }
    }
  };
  context.document = { getElementById: id => elements[id] || null };
  forecastApp.translateText = text => text;
  forecastApp.switchTab = tab => { selectedTab = tab; };
  forecastApp.getMinuteForecastHistory = () => ({
    history: [{ minute: Math.floor((Date.now() - 60 * 60 * 1000) / 60000) }]
  });
  forecastApp.buildForecastComparison = () => {
    throw new Error('A stale reading must not trigger forecast model evaluation.');
  };

  forecastApp.renderDashboardForecast();

  assert.equal(elements['dashboard-forecast-empty'].hidden, false);
  assert.equal(elements['dashboard-forecast-content'].hidden, true);
  assert.equal(elements['dashboard-forecast-empty-title'].textContent, 'No recent sensor reading');
  assert.equal(elements['dashboard-forecast-action-label'].textContent, 'Open Sensor Monitor');
  elements['dashboard-forecast-action'].onclick();
  assert.equal(selectedTab, 'monitor');
  assert.match(attributes['aria-label'], /no recent/);
});

test('forecast validation yields between bounded walk-forward folds', async () => {
  const validationApp = Object.create(context.SchoolHeatAppForTest.prototype);
  let yieldCount = 0;
  const previousSetTimeout = context.window.setTimeout;
  context.window.setTimeout = callback => {
    yieldCount++;
    return setTimeout(callback, 0);
  };
  validationApp.getForecastSeed = () => 1;
  validationApp.getExtendedMlrFeatures = features => features;
  validationApp.fitForecastModel = () => () => 0;
  validationApp.getStatus = () => 'safe';
  const examples = Array.from({ length: 14 }, (_, index) => ({
    minute: index * 35,
    current: 30,
    actual: 31,
    target: 0.1,
    features: [index]
  }));

  try {
    const metrics = await validationApp.evaluateForecastModels(examples);
    assert.equal(metrics.mlr.samples, 2);
    assert.equal(yieldCount, 2);
  } finally {
    context.window.setTimeout = previousSetTimeout;
  }
});

test('defers dashboard forecast work until the preview is near the viewport and idle', () => {
  let idleCallback = null;
  let renderCount = 0;
  const card = {
    rect: { width: 100, top: 900, bottom: 1000 },
    getBoundingClientRect() { return this.rect; }
  };
  context.window.innerHeight = 500;
  context.window.requestIdleCallback = callback => { idleCallback = callback; };
  context.document = {
    documentElement: { clientHeight: 500 },
    querySelector: selector => selector === '.forecast-preview-card' ? card : null
  };
  app.currentTab = 'dashboard';
  app.dashboardForecastRenderScheduled = false;
  app.renderDashboardForecast = () => { renderCount++; };

  app.scheduleDashboardForecastRender();
  assert.equal(idleCallback, null);
  assert.equal(renderCount, 0);

  card.rect = { width: 100, top: 600, bottom: 700 };
  app.scheduleDashboardForecastRender();
  assert.equal(renderCount, 0);
  idleCallback();
  assert.equal(renderCount, 1);
});

test('does not render the history list while its tab is hidden', () => {
  const list = { innerHTML: 'placeholder' };
  context.document = {
    getElementById: id => id === 'history-list' ? list : null
  };
  app.currentTab = 'dashboard';
  app.readings = Array.from({ length: 60 }, (_, index) => ({
    location: `Location ${index}`,
    status: 'safe',
    heatIndex: 25,
    timestamp: new Date().toISOString()
  }));

  app.renderHistory();

  assert.equal(list.innerHTML, 'placeholder');
});

test('keeps history to one page, hides ordinary source labels, and filters all readings', () => {
  const list = { innerHTML: '' };
  const search = { value: '' };
  const filter = { value: 'all' };
  let pendingFilter = null;
  context.window.setTimeout = callback => {
    pendingFilter = callback;
    return 1;
  };
  context.window.clearTimeout = () => {};
  context.document = {
    getElementById: id => ({
      'history-list': list,
      'history-search': search,
      'history-filter': filter
    })[id] || null
  };
  app.currentTab = 'history';
  app.historyPage = 0;
  app.readings = Array.from({ length: 75 }, (_, index) => ({
    location: `Location ${index}`,
    status: 'safe',
    heatIndex: 25,
    temperature: 24,
    humidity: 50,
    timestamp: new Date().toISOString(),
    source: 'manual',
    sourceFile: 'private-file.csv',
    isDemo: index === 74
  }));
  app.escapeHTML = text => text;
  app.formatDate = () => 'date';
  app.formatClockTime = () => 'time';
  app.formatTime = () => 'time';
  app.translateText = text => text;
  app.drawDistributionChart = () => {};
  app.drawTrendChart = () => {};

  app.renderHistory();
  assert.equal((list.innerHTML.match(/class="history-item"/g) || []).length, 50);
  assert.match(list.innerHTML, /data-history-page="1"/);
  assert.doesNotMatch(list.innerHTML, /MANUAL ENTRY|private-file\.csv|IMPORTED/);

  app.historyPage = 1;
  app.renderHistory(false);
  assert.equal((list.innerHTML.match(/class="history-item"/g) || []).length, 25);
  assert.match(list.innerHTML, /data-history-page="-1"/);

  search.value = 'location 74';
  app.filterHistory();
  pendingFilter();
  assert.equal((list.innerHTML.match(/class="history-item"/g) || []).length, 1);
  assert.match(list.innerHTML, /Location 74/);
  assert.match(list.innerHTML, /DEMO DATA/);
});

test('counts mapped pins and saved location names separately in the dashboard summary', () => {
  const coverageAttributes = {};
  const coverageFill = { style: {} };
  const elements = {
    'dashboard-location-summary': { textContent: '' },
    'dashboard-map-summary': { textContent: '' },
    'dashboard-coverage-count': { textContent: '' },
    'dashboard-coverage-total': { textContent: '' },
    'dashboard-coverage-missing': { textContent: '' },
    'dashboard-coverage-meter': {
      setAttribute: (name, value) => { coverageAttributes[name] = value; }
    },
    'dashboard-coverage-fill': coverageFill,
    'about-map-pin-count': { textContent: '' },
    'dashboard-map-site-count': { textContent: '' }
  };
  context.document = { getElementById: id => elements[id] || null };
  app.readings = [
    { location: context.SchoolHeatLocationsForTest[0].name, timestamp: '2026-01-02T00:00:00Z' },
    { location: 'Einstein Classroom', timestamp: '2026-01-02T00:01:00Z' }
  ];
  app.translateText = text => text;

  app.renderDashboardLocationSummary();

  assert.match(elements['dashboard-location-summary'].textContent, /^2 /);
  assert.match(elements['dashboard-map-summary'].textContent, /^1 mapped pin has/);
  assert.equal(elements['dashboard-coverage-count'].textContent, '1');
  assert.equal(elements['dashboard-coverage-total'].textContent, String(context.SchoolHeatLocationsForTest.length));
  assert.equal(elements['dashboard-coverage-missing'].textContent, '28 map pins have no saved readings');
  assert.equal(coverageAttributes['aria-valuenow'], '1');
  assert.equal(coverageAttributes['aria-valuemax'], '29');
  assert.equal(coverageAttributes['aria-valuetext'], '1 / 29 map pins with saved readings');
  assert.equal(coverageFill.style.transform, `scaleX(${1 / 29})`);
  assert.equal(elements['about-map-pin-count'].textContent, '29');
  assert.equal(elements['dashboard-map-site-count'].textContent, '29 map pins');
});

test('reports every map pin that shares a saved location name', () => {
  const locations = context.SchoolHeatLocationsForTest;
  const pinsByName = new Map();
  locations.forEach(location => pinsByName.set(location.name, (pinsByName.get(location.name) || 0) + 1));
  const duplicate = [...pinsByName.entries()].find(([, count]) => count > 1);
  assert.ok(duplicate, 'expected the campus map to contain repeated location labels');
  const [locationName, markerCount] = duplicate;
  const coverageAttributes = {};
  const elements = {
    'dashboard-location-summary': { textContent: '' },
    'dashboard-map-summary': { textContent: '' },
    'dashboard-coverage-count': { textContent: '' },
    'dashboard-coverage-total': { textContent: '' },
    'dashboard-coverage-missing': { textContent: '' },
    'dashboard-coverage-meter': {
      setAttribute: (name, value) => { coverageAttributes[name] = value; }
    },
    'dashboard-coverage-fill': { style: {} }
  };
  context.document = { getElementById: id => elements[id] || null };
  app.readings = [{ location: locationName, timestamp: '2026-01-02T00:00:00Z' }];
  app.translateText = text => text;

  app.renderDashboardLocationSummary();

  assert.equal(elements['dashboard-location-summary'].textContent, '1 location with a saved reading.');
  assert.equal(elements['dashboard-coverage-count'].textContent, String(markerCount));
  assert.equal(
    elements['dashboard-map-summary'].textContent,
    `${markerCount} mapped pins have saved readings, including demo data. Pins without readings remain unclassified.`
  );
  assert.equal(
    elements['dashboard-coverage-missing'].textContent,
    `${locations.length - markerCount} map pins have no saved readings`
  );
});

test('shows zero mapped-pin coverage without making an empty map look complete', () => {
  const coverageAttributes = {};
  const coverageFill = { style: {} };
  const elements = {
    'dashboard-coverage-count': { textContent: '' },
    'dashboard-coverage-total': { textContent: '' },
    'dashboard-coverage-missing': { textContent: '' },
    'dashboard-coverage-meter': {
      setAttribute: (name, value) => { coverageAttributes[name] = value; }
    },
    'dashboard-coverage-fill': coverageFill
  };
  context.document = { getElementById: id => elements[id] || null };
  app.readings = [];
  app.translateText = text => text;

  app.renderDashboardLocationSummary(new Map());

  assert.equal(elements['dashboard-coverage-count'].textContent, '0');
  assert.equal(coverageAttributes['aria-valuenow'], '0');
  assert.equal(coverageAttributes['aria-valuemax'], '29');
  assert.equal(coverageFill.style.transform, 'scaleX(0)');
});
