const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const script = fs.readFileSync(scriptPath, 'utf8');
const appBootstrap = /\r?\nconst app = new SchoolHeatApp\(\);\r?\nwindow\.app = app;\s*$/;

assert.match(script, appBootstrap);
const isolatedScript = script.replace(appBootstrap, '');
const context = { window: {} };
vm.runInNewContext(
  `${isolatedScript}\nglobalThis.SchoolHeatAppForTest = SchoolHeatApp;\nglobalThis.SchoolHeatLocationsForTest = LOCATIONS;`,
  context
);

const app = Object.create(context.SchoolHeatAppForTest.prototype);

test('labels readings from their recorded source', () => {
  assert.equal(app.getReadingSourceLabel({ source: 'manual' }), 'MANUAL ENTRY');
  assert.equal(app.getReadingSourceLabel({ source: 'esp32' }), 'ESP32 DHT22');
  assert.equal(app.getReadingSourceLabel({ source: 'imported', sourceFile: 'readings.csv' }), 'IMPORTED · readings.csv');
  assert.equal(app.getReadingSourceLabel({ source: 'demo' }), 'DEMO DATA');
});

test('recognizes older source markers without guessing for unknown records', () => {
  assert.equal(app.getReadingSourceLabel({ id: 'esp32-device-12' }), 'ESP32 DHT22');
  assert.equal(app.getReadingSourceLabel({ sourceFile: 'legacy.csv' }), 'IMPORTED · legacy.csv');
  assert.equal(app.getReadingSourceLabel({ id: 12 }), 'SOURCE NOT RECORDED');
  assert.equal(app.getReadingSourceLabel(null), 'No source information');
});

test('translates source labels using the selected language', () => {
  context.window.SCHOOLHEAT_I18N = {
    translations: { tl: { 'SOURCE NOT RECORDED': 'HINDI NAITALA ANG PINAGMULAN' } }
  };
  app.language = 'tl';
  assert.equal(app.getReadingSourceLabel({ id: 12 }), 'HINDI NAITALA ANG PINAGMULAN');
});

test('does not present an expired forecast as a current outlook', () => {
  const attributes = {};
  const elements = {
    'dashboard-forecast-empty': { hidden: true },
    'dashboard-forecast-empty-title': { textContent: '' },
    'dashboard-forecast-empty-detail': { textContent: '' },
    'dashboard-forecast-content': { hidden: false },
    'dashboard-forecast-chart': {
      setAttribute: (name, value) => { attributes[name] = value; }
    }
  };
  context.document = { getElementById: id => elements[id] || null };
  app.translateText = text => text;
  app.buildForecastComparison = () => ({
    current: { minute: Math.floor((Date.now() - 60 * 60 * 1000) / 60000) },
    date: new Date(Date.now() - 30 * 60 * 1000)
  });
  app.getBestForecastModel = () => ({ result: { value: 35 }, metric: null });

  app.renderDashboardForecast();

  assert.equal(elements['dashboard-forecast-empty'].hidden, false);
  assert.equal(elements['dashboard-forecast-content'].hidden, true);
  assert.equal(elements['dashboard-forecast-empty-title'].textContent, 'Forecast is not current');
  assert.match(attributes['aria-label'], /not recent/);
});

test('counts only mapped locations in the dashboard map summary', () => {
  const elements = {
    'dashboard-location-summary': { textContent: '' },
    'dashboard-map-summary': { textContent: '' }
  };
  context.document = { getElementById: id => elements[id] || null };
  app.readings = [
    { location: context.SchoolHeatLocationsForTest[0].name, timestamp: '2026-01-02T00:00:00Z' },
    { location: 'Einstein Classroom', timestamp: '2026-01-02T00:01:00Z' }
  ];
  app.translateText = text => text;

  app.renderDashboardLocationSummary();

  assert.match(elements['dashboard-location-summary'].textContent, /^2 /);
  assert.match(elements['dashboard-map-summary'].textContent, /^1 mapped location has/);
});
