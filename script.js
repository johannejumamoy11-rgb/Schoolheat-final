/* ============================================
   SchoolHeat Ultimate — TUKLAS 2026
   Core Application Logic v4.2 (Corrected Locations)
   ============================================ */

const LOCATIONS = [
  { name: "Guard House", x: 52.2, y: 69.5, baseTemp: 34.5, baseHum: 58 },
  { name: "2 Storey, 2 Classroom, DepEd SS Building", x: 56.8, y: 67.2, baseTemp: 32.0, baseHum: 65 },
  { name: "3 Classroom, SBP4BE Building AusAID", x: 30.4, y: 66.4, baseTemp: 31.5, baseHum: 68 },
  { name: "6 Classroom, DepEd Modified School Building (For Condemnation)", x: 15.8, y: 71.8, baseTemp: 33.0, baseHum: 70 },
  { name: "School Clinic", x: 23.2, y: 72, baseTemp: 29.0, baseHum: 62 },
  { name: "Handwashing Facility", x: 43.1, y: 42.1, baseTemp: 33.5, baseHum: 72 },
  { name: "3 Classroom , DepEd SS Building", x: 45.3, y: 52.4, baseTemp: 31.8, baseHum: 66 },
  { name: "6 Classroom, JICA - Educational Facilities Improvement Program (EFIP)", x: 8, y: 64, baseTemp: 31.2, baseHum: 67 },
  { name: "2 Classroom, DepEd SS Building", x: 12.3, y: 53, baseTemp: 31.5, baseHum: 68 },
  { name: "Literacy Office", x: 7.4, y: 42.8, baseTemp: 30.5, baseHum: 64 },
  { name: "School Canteen", x: 20.7, y: 38.5, baseTemp: 34.0, baseHum: 75 },
  { name: "Administration Building / DepEd SS Building", x: 48.8, y: 47.4, baseTemp: 30.8, baseHum: 63 },
  { name: "2 Storey, 4 Classroom, DepEd SS Building", x: 16.3, y: 52.3, baseTemp: 31.8, baseHum: 67 },
  { name: "4 Classroom, PPSIP Building", x: 12.85, y: 29.4, baseTemp: 31.5, baseHum: 66 },
  { name: "4 Classroom, SEDP Building", x: 15.1, y: 39.6, baseTemp: 31.6, baseHum: 67 },
  { name: "2 Classroom, Baptist Donated Building", x: 25, y: 38.7, baseTemp: 31.4, baseHum: 68 },
  { name: "3 Classroom, SBP4BE Building AusAID", x: 35.5, y: 43, baseTemp: 31.5, baseHum: 68 },
  { name: "3 Classroom, DepEd SS Building", x: 55.6, y: 39, baseTemp: 31.8, baseHum: 66 },
  { name: "PTA Office", x: 48.6, y: 36, baseTemp: 30.5, baseHum: 62 },
  { name: "1 Classroom, SS Building", x: 61, y: 39.3, baseTemp: 31.5, baseHum: 65 },
  { name: "SSLG Office", x: 19.85, y: 28.55, baseTemp: 30.2, baseHum: 63 },
  { name: "3 Storey, 15 Classroom, DepEd SS Building", x: 28.8, y: 28.5, baseTemp: 32.0, baseHum: 66 },
  { name: "2 Storey Comp.Lab", x: 42, y: 34, baseTemp: 30.0, baseHum: 58 },
  { name: "Guidance Office", x: 47, y: 36.2, baseTemp: 30.3, baseHum: 62 },
  { name: "1 Classroom, DepEd SS Building", x: 57, y: 51.6, baseTemp: 31.5, baseHum: 66 },
  { name: "3 Storey, 9 Classroom, DepEd SS Building", x: 61, y: 53, baseTemp: 32.0, baseHum: 67 },
  { name: "1 Classroom, DepEd SS Building", x: 52.5, y: 47.5, baseTemp: 31.4, baseHum: 65 },
  { name: "Publication Office", x: 7.2, y: 30, baseTemp: 30.2, baseHum: 63 },
  { name: "1 Classroom, DepEd SS Building", x: 50.4, y: 37.4, baseTemp: 31.5, baseHum: 66 }
];

const STUDY_CLASSROOMS = [
  "Einstein Classroom",
  "Newton Classroom",
  "Locke Classroom"
];

const STATUS_COLORS = {
  safe: '#81c99d',
  caution: '#f0c66c',
  danger: '#ef9874',
  extreme: '#f17b7b',
  nodata: '#a7b3ab'
};

function getDesignToken(name, fallback) {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function getStatusColor(status) {
  return getDesignToken(`--${status}`, STATUS_COLORS[status] || STATUS_COLORS.nodata);
}

const STATUS_LABELS = {
  safe: 'Hayo',
  caution: 'Hinay',
  danger: 'Hinga',
  extreme: 'Hinto',
  nodata: 'No Data'
};

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function hexToRgb(hex) {
  if (!HEX_COLOR_PATTERN.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function getRelativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function getContrastRatio(first, second) {
  const luminances = [getRelativeLuminance(first), getRelativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

function mixHexColors(first, second, amount) {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  if (!firstRgb || !secondRgb) return first;
  const channels = ['r', 'g', 'b'].map(channel => Math.round(
    firstRgb[channel] * (1 - amount) + secondRgb[channel] * amount
  ));
  return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

function getAccessibleAccent(hex, surface) {
  return getAccessibleColor(hex, surface, 4.5);
}

function getAccessibleColor(hex, surface, minimumRatio) {
  const surfaces = Array.isArray(surface) ? surface : [surface];
  if (surfaces.every(item => getContrastRatio(hex, item) >= minimumRatio)) return hex;
  for (const target of ['#000000', '#ffffff']) {
    for (let step = 1; step <= 50; step++) {
      const candidate = mixHexColors(hex, target, step / 50);
      if (surfaces.every(item => getContrastRatio(candidate, item) >= minimumRatio)) return candidate;
    }
  }
  return null;
}

function getReadableTextColor(hex) {
  const light = '#fffdf6';
  const dark = '#000000';
  return getContrastRatio(hex, light) >= getContrastRatio(hex, dark) ? light : dark;
}

const CUSTOM_PALETTE_FIELDS = Object.freeze([
  'background',
  'surface',
  'border',
  'text',
  'secondaryText',
  'accent',
  'secondaryAccent'
]);

const CUSTOM_THEME_COLOR_DEFAULTS = Object.freeze({
  dark: Object.freeze({
    background: '#111b1a',
    surface: '#192624',
    border: '#62746d',
    text: '#f3f1e8',
    secondaryText: '#c1ccc4',
    accent: '#82c4a8',
    secondaryAccent: '#e58e6b'
  }),
  light: Object.freeze({
    background: '#f4f1e7',
    surface: '#fffdf6',
    border: '#77867d',
    text: '#1c302c',
    secondaryText: '#455b53',
    accent: '#17685e',
    secondaryAccent: '#a64f36'
  })
});

const APP_COLOR_PALETTES = Object.freeze({
  schoolheat: null,
  canopy: Object.freeze({
    dark: Object.freeze({
      background: '#111b15',
      surface: '#1d2b21',
      border: '#65786a',
      text: '#f1f3e8',
      secondaryText: '#c4d0c0',
      accent: '#78b879',
      secondaryAccent: '#d59a68'
    }),
    light: Object.freeze({
      background: '#eff3e8',
      surface: '#fbfdf6',
      border: '#788672',
      text: '#26372a',
      secondaryText: '#526451',
      accent: '#356d42',
      secondaryAccent: '#925334'
    })
  }),
  lagoon: Object.freeze({
    dark: Object.freeze({
      background: '#101b20',
      surface: '#19282d',
      border: '#657980',
      text: '#edf4f1',
      secondaryText: '#bfd0d1',
      accent: '#6abbb3',
      secondaryAccent: '#e39a7b'
    }),
    light: Object.freeze({
      background: '#edf4f1',
      surface: '#fbfdfb',
      border: '#748987',
      text: '#213b3d',
      secondaryText: '#4e6664',
      accent: '#216b6d',
      secondaryAccent: '#93503a'
    })
  }),
  custom: null
});

function getCustomPaletteValidationError(colors) {
  if (!colors || CUSTOM_PALETTE_FIELDS.some(field => !HEX_COLOR_PATTERN.test(colors[field] || ''))) {
    return 'Choose a valid color for every palette field.';
  }
  const surfaces = [colors.background, colors.surface];
  const textColors = [
    ['Main text', colors.text],
    ['Secondary text', colors.secondaryText]
  ];
  for (const [label, color] of textColors) {
    if (surfaces.some(surface => getContrastRatio(color, surface) < 4.5)) {
      return `${label} needs at least 4.5:1 contrast on both backgrounds.`;
    }
  }
  if ([colors.accent, colors.secondaryAccent].some(color => !getAccessibleAccent(color, surfaces))) {
    return 'Choose page and card colors that allow readable accents.';
  }
  if (!getAccessibleColor(colors.border, surfaces, 3)) {
    return 'Borders need at least 3:1 contrast on both backgrounds.';
  }
  return '';
}

function normalizeCustomPaletteColors(storedColors, legacyAccent) {
  const normalized = {};
  ['dark', 'light'].forEach(theme => {
    const defaults = CUSTOM_THEME_COLOR_DEFAULTS[theme];
    const storedTheme = storedColors && typeof storedColors === 'object'
      ? storedColors[theme]
      : null;
    const colors = { ...defaults };
    if (storedTheme && typeof storedTheme === 'object') {
      CUSTOM_PALETTE_FIELDS.forEach(field => {
        if (HEX_COLOR_PATTERN.test(storedTheme[field] || '')) colors[field] = storedTheme[field];
      });
    } else if (HEX_COLOR_PATTERN.test(legacyAccent || '')) {
      colors.accent = legacyAccent;
    }
    normalized[theme] = getCustomPaletteValidationError(colors) ? { ...defaults } : colors;
  });
  return normalized;
}

const CUSTOM_ACCENT_CHOICES = Object.freeze([
  '#4f8d5a',
  '#b94444',
  '#287985',
  '#26999e',
  '#3777a8',
  '#3a5f8e',
  '#82c4a8',
  '#7252a3',
  '#535fa8',
  '#ac4a72',
  '#ca6389',
  '#cf7155',
  '#ba6048',
  '#bd6c23',
  '#bd8218',
  '#b49b24'
]);

function createCustomPaletteColors(theme, selectedAccent) {
  const defaults = CUSTOM_THEME_COLOR_DEFAULTS[theme];
  if (!defaults || !HEX_COLOR_PATTERN.test(selectedAccent || '')) {
    throw new TypeError('A supported theme and valid accent color are required.');
  }

  const tint = theme === 'dark' ? 0.08 : 0.025;
  const background = mixHexColors(defaults.background, selectedAccent, tint);
  const surface = mixHexColors(defaults.surface, selectedAccent, tint * 1.25);
  const surfaces = [background, surface];
  const palette = {
    background,
    surface,
    border: getAccessibleColor(
      mixHexColors(defaults.border, selectedAccent, 0.14),
      surfaces,
      3
    ) || defaults.border,
    text: defaults.text,
    secondaryText: defaults.secondaryText,
    accent: getAccessibleAccent(selectedAccent, surfaces) || defaults.accent,
    secondaryAccent: getAccessibleAccent(
      mixHexColors(defaults.secondaryAccent, selectedAccent, 0.2),
      surfaces
    ) || defaults.secondaryAccent
  };
  if (getCustomPaletteValidationError(palette)) {
    throw new Error('The selected color could not produce a readable app palette.');
  }
  return palette;
}

const FORECAST_CANDIDATE_MODELS = [
  'mlr',
  'random-forest',
  'xgboost-style',
  'lightgbm-style',
  'svr'
];

const FORECAST_MODEL_LABELS = {
  mlr: 'Multiple Linear Regression',
  'random-forest': 'Random Forest (custom JS)',
  'xgboost-style': 'XGBoost-style trees (custom JS)',
  'lightgbm-style': 'LightGBM-style trees (custom JS)',
  svr: 'Linear SVR (custom JS)',
  persistence: 'Persistence baseline'
};

const AUTO_READ_INTERVAL_MS = 300000;
const STALE_READING_AFTER_MS = 15 * 60 * 1000;
const ESP32_GAP_THRESHOLD_MS = AUTO_READ_INTERVAL_MS * 1.5;
const ESP32_BRIDGE_BASE = 'http://localhost:8765';
const SMS_QUEUE_STORAGE_KEY = 'sh_pending_sms';
const SMS_QUEUE_MAX_ITEMS = 20;
const SMS_RETRY_DELAY_MS = 5 * 60 * 1000;
const HISTORY_PAGE_SIZE = 50;

class SchoolHeatApp {
  constructor() {
    const defaultSettings = { firebase: true, browserNotifications: false, pushAlerts: false, smsAlerts: false, smsNumbers: '', outlier: true, spike: true, demoMode: false, tempOffset: 0, humidityOffset: 0, darkMode: true, colorMode: 'automatic', accentPalette: 'schoolheat', customAccentColor: '#287985', customPaletteColors: null, language: 'en' };
    try {
      const storedReadings = JSON.parse(localStorage.getItem('sh_readings') || '[]');
      this.readings = Array.isArray(storedReadings) ? storedReadings : [];
    } catch (error) {
      this.readings = [];
      localStorage.removeItem('sh_readings');
    }
    this.lastObservedReadingId = this.readings[0]?.id ?? null;
    try {
      const storedSettings = JSON.parse(localStorage.getItem('sh_settings') || '{}');
      this.settings = { ...defaultSettings, ...(storedSettings && typeof storedSettings === 'object' ? storedSettings : {}) };
    } catch (error) {
      this.settings = defaultSettings;
      localStorage.removeItem('sh_settings');
    }
    if (!['automatic', 'unified'].includes(this.settings.colorMode)) {
      this.settings.colorMode = 'automatic';
    }
    if (!Object.prototype.hasOwnProperty.call(APP_COLOR_PALETTES, this.settings.accentPalette)) {
      this.settings.accentPalette = 'schoolheat';
    }
    if (!HEX_COLOR_PATTERN.test(this.settings.customAccentColor)) {
      this.settings.customAccentColor = '#287985';
    }
    this.settings.customPaletteColors = normalizeCustomPaletteColors(
      this.settings.customPaletteColors,
      this.settings.customAccentColor
    );
    if (window.SCHOOLHEAT_I18N?.languages && !window.SCHOOLHEAT_I18N.languages[this.settings.language]) {
      this.settings.language = 'en';
    }
    this.language = this.settings.language;
    this.localizedTextNodes = new WeakMap();
    this.localizedAttributes = new WeakMap();
    this.languageObserver = null;
    this.currentTab = 'dashboard';
    this.historyPage = 0;
    this.historyFilterTimer = null;
    this.forecastChartLoaded = false;
    this.forecastComparisonCache = null;
    this.dashboardForecastObserver = null;
    this.dashboardForecastRenderScheduled = false;
    this.dashboardForecastVisibilityHandler = null;
    this.trendChartLoaded = false;
    this.trendActiveIndex = null;
    this.distributionChartLoaded = false;
    this.mapZoom = 1;
    this.lastDeviceStatus = null;
    this._resizeHandler = null;
    this.autoReadActive = false;
    this.autoReadInterval = null;
    this.autoReadLocIndex = 0;
    this.wifiSyncActive = false;
    this.wifiSyncTimer = null;
    this.wifiSyncBusy = false;
    this.wifiSyncSetupDone = false;
    this.wifiSyncInitialSampleDone = false;
    this.bluetoothSyncBusy = false;
    this.bluetoothRequestSequence = 0;
    this.lastSensorValues = {};
    this.deferredInstallPrompt = null;
    this.alertBackendPromise = null;
    this.alertFunctionsPromise = null;
    this.pushBackendPromise = null;
    this.pushMessageUnsubscribe = null;
    this.smsSendInProgress = false;
    this.smsRetryTimer = null;
    this.smsStartupQueueReview = false;
    this.smsAutoRetryPaused = false;
    this.init();
  }

  init() {
    this.populateLocations();
    this.applySettings();
    this.bindEvents();
    this.setupNavigation();
    this.bindSettingsEvents();
    this.updateAutoReadButton();
    this.startClock();
    this.checkFirstVisit();
    this.setupDashboardForecastObserver();
    this.updateDashboard();
    this.renderMap();
    this.setupForecastObserver();
    this.setupTrendObserver();
    this.setupDistributionObserver();
    this.setupPullToRefresh();
    this.setupMapZoomControls();
    this.setupResizeHandler();
    this.setupOfflineAndInstall();
    try {
      const queue = this.readPendingSmsQueue();
      this.smsStartupQueueReview = queue.length > 0;
      this.updateSmsQueueCancelButton(queue.length);
    } catch (error) {
      console.error('Could not read the pending SMS queue:', error);
      this.smsAutoRetryPaused = true;
      this.updateSmsQueueCancelButton(0);
      this.toast('Pending SMS could not be read from this device. Check browser storage.', 'error');
    }
    window.addEventListener('storage', event => {
      if (event.key !== SMS_QUEUE_STORAGE_KEY) return;
      try {
        this.updateSmsQueueCancelButton(this.readPendingSmsQueue().length);
      } catch (error) {
        console.error('Could not read the pending SMS queue:', error);
        this.updateSmsQueueCancelButton(0);
        this.toast('Pending SMS could not be read from this device. Check browser storage.', 'error');
      }
    });
    window.addEventListener('online', () => {
      if (this.smsStartupQueueReview) {
        this.promptPendingSmsRetry();
      } else if (!this.smsAutoRetryPaused) {
        this.flushSmsQueue();
      }
    });
    if (navigator.onLine) {
      setTimeout(() => {
        if (this.smsStartupQueueReview) {
          this.promptPendingSmsRetry();
        } else if (!this.smsAutoRetryPaused) {
          this.flushSmsQueue();
        }
      }, 1500);
    }
    this.hideLoader();
    if (this.settings.pushAlerts) this.refreshPushRegistration();
  }

  hideLoader() {
    const loader = document.getElementById('loading-screen');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }, 1200);
  }

  setupOfflineAndInstall() {
    const status = document.getElementById('offline-status');
    const installButton = document.getElementById('install-app-button');
    const updateStatus = () => {
      if (!status) return;
      status.textContent = navigator.onLine
        ? 'Network connected. Core SchoolHeat features also work offline after installation.'
        : 'Offline. Saved readings and settings are available on this device; cloud features are paused.';
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.deferredInstallPrompt = event;
    });
    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      if (installButton) installButton.textContent = 'SchoolHeat Installed';
      this.toast('SchoolHeat was installed on this device.', 'success');
    });

    installButton?.addEventListener('click', async () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        this.toast('SchoolHeat is already installed on this device.', 'info');
        return;
      }
      if (!this.deferredInstallPrompt) {
        this.toast('Use your browser menu and choose Install app or Add to Home Screen. Open SchoolHeat online once before using it offline.', 'info');
        return;
      }

      this.deferredInstallPrompt.prompt();
      const { outcome } = await this.deferredInstallPrompt.userChoice;
      this.deferredInstallPrompt = null;
      if (outcome === 'accepted' && installButton) installButton.textContent = 'SchoolHeat Installed';
    });
  }

  checkFirstVisit() {
    const visited = localStorage.getItem('sh_visited');
    if (!visited && this.readings.length === 0) {
      this.generateDemoData(true);
      localStorage.setItem('sh_visited', 'true');
      this.toast('Welcome! Demo data loaded for preview; demo readings are excluded from forecasts.', 'info');
    }
  }

  startClock() {
    const update = () => {
      const date = document.getElementById('header-date');
      const el = document.getElementById('header-clock');
      const now = new Date();
      if (date) {
        date.textContent = now.toLocaleDateString(this.getLanguageLocale(), {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      }
      if (el) {
        el.textContent = now.toLocaleTimeString(this.getLanguageLocale(), { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      this.updateReadingFreshness();
    };
    update();
    setInterval(update, 60_000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) update();
    });
  }

  getReadingFreshness(reading, now = Date.now()) {
    if (!reading) return { state: 'nodata', label: 'NO DATA', detail: 'No readings have been recorded.' };
    if (reading.timestamp === null || reading.timestamp === undefined || reading.timestamp === '') {
      return { state: 'invalid', label: 'CHECK TIME', detail: 'Reading timestamp is missing. Check the sensor clock.' };
    }
    const recordedAt = new Date(reading.timestamp).getTime();
    if (!Number.isFinite(recordedAt)) {
      return { state: 'invalid', label: 'CHECK TIME', detail: 'Reading timestamp is invalid. Check the sensor clock.' };
    }

    const ageMs = now - recordedAt;
    if (ageMs < -2 * 60 * 1000) {
      return { state: 'invalid', label: 'CHECK TIME', detail: 'Reading timestamp is in the future. Check the sensor clock.' };
    }
    if (ageMs <= STALE_READING_AFTER_MS) {
      const ageMinutes = Math.floor(Math.max(0, ageMs) / 60000);
      const age = ageMinutes < 1 ? 'less than a minute ago' : `${ageMinutes} min ago`;
      return { state: 'recent', label: 'RECENT', detail: `Last reading ${age}.` };
    }

    const ageMinutes = Math.floor(ageMs / 60000);
    const age = ageMinutes < 60
      ? `${ageMinutes} min ago`
      : `${Math.floor(ageMinutes / 60)} hr ${ageMinutes % 60} min ago`;
    return { state: 'stale', label: 'OLD DATA', detail: `Last reading ${age}. Update the sensor to get a new reading.` };
  }

  hasValidMeasurement(reading) {
    return Boolean(reading) &&
      ['temperature', 'humidity', 'heatIndex'].every(key => {
        const value = reading[key];
        return value !== null &&
          value !== undefined &&
          !(typeof value === 'string' && !value.trim()) &&
          Number.isFinite(Number(value));
      });
  }

  getMapDataStatus(reading, now = Date.now()) {
    if (!reading) return 'NO DATA';
    if (reading.isDemo) return 'DEMO DATA';
    if (!this.hasValidMeasurement(reading)) {
      return 'NO DATA';
    }
    return this.getReadingFreshness(reading, now).state === 'recent' ? 'RECENT' : 'SAVED READING';
  }

  updateReadingFreshness() {
    const freshness = this.getReadingFreshness(this.readings[0]);
    const header = document.getElementById('header-live-status');
    const headerText = document.getElementById('header-live-text');
    const monitorBadge = document.getElementById('monitor-live-badge');
    const monitorText = document.getElementById('monitor-live-text');
    const detail = document.getElementById('reading-freshness');
    const dashboardBadge = document.getElementById('dashboard-freshness');

    if (header) header.className = `header-live ${freshness.state}`;
    if (headerText) headerText.textContent = this.translateText(freshness.label);
    if (monitorBadge) monitorBadge.className = `monitor-live-badge ${freshness.state}`;
    if (monitorText) monitorText.textContent = this.translateText(freshness.label);
    if (dashboardBadge) {
      dashboardBadge.className = `dashboard-freshness ${freshness.state}`;
      dashboardBadge.textContent = this.translateText(freshness.label);
    }
    if (detail) {
      detail.className = `reading-freshness ${freshness.state}`;
      detail.textContent = freshness.detail;
    }
    return freshness;
  }

  updateHeatGuidance(reading, freshness) {
    const card = document.getElementById('heat-guidance-card');
    const level = document.getElementById('heat-guidance-level');
    const title = document.getElementById('heat-guidance-title');
    const detail = document.getElementById('heat-guidance-detail');
    if (!card || !level || !title || !detail) return;

    if (!reading || !this.hasValidMeasurement(reading)) {
      card.className = 'glass-card heat-guidance-card nodata';
      level.textContent = reading ? 'INVALID DATA' : 'NO DATA';
      title.textContent = reading ? 'The latest saved reading is incomplete' : 'Get a reading to see the suggested response';
      detail.textContent = reading
        ? 'One or more required measurement values are missing or invalid, so no heat classification is shown.'
        : 'Sync a sensor or enter a reading. Without current data, this app cannot indicate classroom heat conditions.';
      return;
    }

    const status = this.getStatus(reading.heatIndex);
    if (freshness.state === 'stale' || freshness.state === 'invalid') {
      card.className = `glass-card heat-guidance-card ${freshness.state}`;
      level.textContent = this.translateText(freshness.label);
      title.textContent = 'Confirm current conditions before acting';
      detail.textContent = `${reading.location}: the last saved reading was ${STATUS_LABELS[status]} at ${reading.heatIndex.toFixed(1)}°C. ${freshness.detail}`;
      return;
    }

    const actions = {
      safe: ['Hayo · Routine monitoring', 'Keep water accessible and continue routine monitoring.'],
      caution: ['Hinay · Increase precautions', 'Encourage water breaks, improve airflow, and watch for rising heat.'],
      danger: ['Hinga · Rest and cool down', 'Pause strenuous activities, move people to a cooler space, and follow your school heat-response procedure.'],
      extreme: ['Hinto · Stop heat exposure', 'Stop heat-exposing activities, move people to a cooler space, and alert school staff. Follow the school emergency plan.']
    };
    card.className = `glass-card heat-guidance-card ${status}`;
    level.textContent = STATUS_LABELS[status].toUpperCase();
    title.textContent = actions[status][0];
    detail.textContent = `${reading.location}: ${reading.heatIndex.toFixed(1)}°C heat index. ${actions[status][1]}`;
  }

  setupPullToRefresh() {
    let startY = 0;
    let refreshing = false;
    const content = document.querySelector('.tab-content');
    if (!content) return;
    content.addEventListener('touchstart', e => {
      if (content.scrollTop === 0) startY = e.touches[0].clientY;
    }, { passive: true });
    content.addEventListener('touchmove', e => {
      if (refreshing || content.scrollTop > 0) return;
      const diff = e.touches[0].clientY - startY;
      if (diff > 80) {
        refreshing = true;
        this.toast('Refreshing...', 'info');
        this.updateDashboard();
        this.renderHistory();
        this.renderMap();
        setTimeout(() => { refreshing = false; }, 1000);
      }
    }, { passive: true });
  }

  setupResizeHandler() {
    this._resizeHandler = () => {
      if (this.currentTab === 'map') {
        this.applyMapZoom();
        this.syncMapPins();
      }
      if (this.currentTab === 'history') {
        this.drawTrendChart();
        this.drawDistributionChart();
      }
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  setupNavigation() {
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const collapseToggle = document.getElementById('sidebar-collapse-toggle');
    const backdrop = document.getElementById('nav-backdrop');

    mobileToggle?.addEventListener('click', () => {
      this.setMobileNavigationOpen(!document.body.classList.contains('mobile-nav-open'));
    });
    backdrop?.addEventListener('click', () => this.setMobileNavigationOpen(false));
    collapseToggle?.addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('nav-collapsed');
      collapseToggle.setAttribute('aria-expanded', String(!collapsed));
      const labelText = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      collapseToggle.setAttribute('aria-label', this.translateText(labelText));
      collapseToggle.title = this.translateText(labelText);
      const label = collapseToggle.querySelector('span');
      if (label) label.textContent = labelText;
    });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.setMobileNavigationOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) this.setMobileNavigationOpen(false);
    });
  }

  setMobileNavigationOpen(isOpen) {
    document.body.classList.toggle('mobile-nav-open', isOpen);
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const backdrop = document.getElementById('nav-backdrop');
    mobileToggle?.setAttribute('aria-expanded', String(isOpen));
    mobileToggle?.setAttribute('aria-label', this.translateText(isOpen ? 'Close navigation' : 'Open navigation'));
    if (backdrop) backdrop.hidden = !isOpen;
  }

  setupMapZoomControls() {
    document.getElementById('map-zoom-in')?.addEventListener('click', () => {
      this.setMapZoom(this.mapZoom + 0.25);
    });
    document.getElementById('map-zoom-out')?.addEventListener('click', () => {
      this.setMapZoom(this.mapZoom - 0.25);
    });
    document.getElementById('map-zoom-reset')?.addEventListener('click', () => {
      this.setMapZoom(1);
    });
  }

  setMapZoom(zoom) {
    this.mapZoom = Math.max(1, Math.min(3, Math.round(zoom * 100) / 100));
    this.applyMapZoom();
  }

  applyMapZoom() {
    const scrollWrap = document.getElementById('map-scroll-wrap');
    const mapWrap = document.getElementById('map-wrap');
    const zoomLevel = document.getElementById('map-zoom-level');
    if (!scrollWrap || !mapWrap) return;

    const previousWidth = scrollWrap.scrollWidth;
    const centerRatio = previousWidth > 0
      ? (scrollWrap.scrollLeft + scrollWrap.clientWidth / 2) / previousWidth
      : 0.5;
    const baseWidth = Math.max(scrollWrap.clientWidth, 372);
    mapWrap.style.width = `${Math.round(baseWidth * this.mapZoom)}px`;
    if (zoomLevel) zoomLevel.textContent = `${Math.round(this.mapZoom * 100)}%`;
    this.syncMapPins();

    const nextWidth = scrollWrap.scrollWidth;
    scrollWrap.scrollLeft = centerRatio * nextWidth - scrollWrap.clientWidth / 2;
  }

  populateLocations() {
    const select = document.getElementById('location-select');
    if (!select) return;
    LOCATIONS.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc.name;
      opt.textContent = loc.name;
      select.appendChild(opt);
    });
    const studyGroup = document.createElement('optgroup');
    studyGroup.label = 'Study classrooms';
    STUDY_CLASSROOMS.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      studyGroup.appendChild(option);
    });
    select.appendChild(studyGroup);
  }

  bindEvents() {
    const tempInput = document.getElementById('temp-input');
    const humInput = document.getElementById('humidity-input');
    if (tempInput) tempInput.addEventListener('input', () => this.updatePreview());
    if (humInput) humInput.addEventListener('input', () => this.updatePreview());
    document.getElementById('history-list')?.addEventListener('click', event => {
      const pageButton = event.target.closest('[data-history-page]');
      if (pageButton) {
        const pageDelta = Number(pageButton.dataset.historyPage);
        if (!Number.isInteger(pageDelta)) return;
        this.historyPage += Math.sign(pageDelta);
        this.renderHistory(false);
        return;
      }
      const button = event.target.closest('[data-delete-reading-index]');
      if (!button) return;
      this.deleteReading(Number(button.dataset.deleteReadingIndex));
    });
    document.getElementById('knowledge-ask-button')?.addEventListener('click', () => this.askKnowledgeAssistant());
    document.getElementById('knowledge-question')?.addEventListener('keydown', event => {
      if (event.key === 'Enter') this.askKnowledgeAssistant();
    });
    document.querySelectorAll('[data-knowledge-question]').forEach(button => {
      button.addEventListener('click', () => {
        const input = document.getElementById('knowledge-question');
        if (!input) return;
        input.value = button.dataset.knowledgeQuestion || '';
        this.askKnowledgeAssistant();
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLElement &&
          (e.target.matches('input, select, textarea') || e.target.isContentEditable)) return;
      const tabShortcuts = ['dashboard', 'monitor', 'map', 'history', 'forecast', 'settings', 'hotlines', 'about'];
      if (/^[1-8]$/.test(e.key)) this.switchTab(tabShortcuts[Number(e.key) - 1]);
      if (e.key === 'n' || e.key === 'N') {
        this.switchTab('monitor');
        document.getElementById('location-select')?.focus();
      }
      if (e.key === 'c' || e.key === 'C') this.calculate();
      if (e.key === 'd' || e.key === 'D') this.autoRead();
      if (e.key === 'Escape') {
        document.getElementById('auto-read-overlay')?.classList.remove('active');
      }
    });
  }

  escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  bindSettingsEvents() {
    const toggles = ['setting-firebase', 'setting-browser-notifications', 'setting-push-alerts', 'setting-sms-alerts', 'setting-outlier', 'setting-spike', 'setting-demo', 'setting-darkmode'];
    toggles.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => {
        if (id === 'setting-browser-notifications') {
          this.setBrowserNotifications(el.checked);
          return;
        }
        if (id === 'setting-push-alerts') {
          this.setPushAlerts(el.checked);
          return;
        }
        if (id === 'setting-darkmode') {
          this.saveSettings();
          this.toggleDarkMode();
        } else {
          this.saveSettings();
          if (id === 'setting-demo') this.updateAutoReadButton();
        }
      });
    });
    const calTemp = document.getElementById('cal-temp');
    const calHum = document.getElementById('cal-humidity');
    const smsNumbers = document.getElementById('setting-sms-numbers');
    const languageSelect = document.getElementById('setting-language');
    const colorModeSelect = document.getElementById('setting-color-mode');
    const paletteChoiceButtons = document.querySelectorAll('[data-palette-choice]');
    const customAccentChoiceButtons = document.querySelectorAll('[data-custom-accent-choice]');
    const anyColorPicker = document.getElementById('setting-any-color');
    const resetPaletteButton = document.getElementById('setting-reset-palette');
    if (calTemp) calTemp.addEventListener('change', () => this.saveSettings());
    if (calHum) calHum.addEventListener('change', () => this.saveSettings());
    if (smsNumbers) smsNumbers.addEventListener('change', () => this.saveSettings());
    if (languageSelect) languageSelect.addEventListener('change', () => {
      this.settings.language = languageSelect.value;
      this.applyLanguage(languageSelect.value);
      this.saveSettings();
    });
    if (colorModeSelect) colorModeSelect.addEventListener('change', () => {
      this.settings.colorMode = colorModeSelect.value;
      this.applyTheme();
      this.saveSettings();
    });
    paletteChoiceButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.settings.accentPalette = button.dataset.paletteChoice;
        this.applyTheme();
        this.saveSettings(false);
      });
    });
    const applyCustomAccent = selectedAccent => {
      if (!HEX_COLOR_PATTERN.test(selectedAccent || '')) {
        console.error('Ignoring invalid custom color selection.');
        return;
      }
      this.settings.accentPalette = 'custom';
      this.settings.customAccentColor = selectedAccent;
      ['dark', 'light'].forEach(theme => {
        this.settings.customPaletteColors[theme] = createCustomPaletteColors(theme, selectedAccent);
      });
      this.applyTheme();
      this.saveSettings(false);
    };
    customAccentChoiceButtons.forEach(button => {
      button.addEventListener('click', () => applyCustomAccent(button.dataset.customAccentChoice));
    });
    if (anyColorPicker) anyColorPicker.addEventListener('change', () => applyCustomAccent(anyColorPicker.value));
    if (resetPaletteButton) resetPaletteButton.addEventListener('click', () => {
      this.settings.accentPalette = 'schoolheat';
      this.applyTheme();
      this.saveSettings(false);
    });
  }

  calculateHeatIndex(T, H) {
    const temperatureF = T * 9 / 5 + 32;
    const humidity = Math.max(0, Math.min(100, H));

    let heatIndexF = 0.5 * (
      temperatureF + 61 + (temperatureF - 68) * 1.2 + humidity * 0.094
    );
    heatIndexF = 0.5 * (heatIndexF + temperatureF);

    if (heatIndexF >= 80) {
      const c1 = -42.379;
      const c2 = 2.04901523;
      const c3 = 10.14333127;
      const c4 = -0.22475541;
      const c5 = -0.00683783;
      const c6 = -0.05481717;
      const c7 = 0.00122874;
      const c8 = 0.00085282;
      const c9 = -0.00000199;
      const f2 = temperatureF * temperatureF;
      const rh2 = humidity * humidity;

      heatIndexF = c1 + c2 * temperatureF + c3 * humidity
        + c4 * temperatureF * humidity + c5 * f2 + c6 * rh2
        + c7 * f2 * humidity + c8 * temperatureF * rh2
        + c9 * f2 * rh2;

      if (humidity < 13 && temperatureF >= 80 && temperatureF <= 112) {
        heatIndexF -= ((13 - humidity) / 4)
          * Math.sqrt((17 - Math.abs(temperatureF - 95)) / 17);
      } else if (humidity > 85 && temperatureF >= 80 && temperatureF <= 87) {
        heatIndexF += ((humidity - 85) / 10) * ((87 - temperatureF) / 5);
      }
    }

    const heatIndexC = (heatIndexF - 32) * 5 / 9;
    return Math.max(T, heatIndexC);
  }

  getStatus(hi) {
    if (hi < 27) return 'safe';
    if (hi < 33) return 'caution';
    if (hi < 42) return 'danger';
    return 'extreme';
  }

  getQualityScore(temp, humidity) {
    let score = 100;
    if (temp < 15 || temp > 55) score -= 30;
    else if (temp < 20 || temp > 50) score -= 15;
    if (humidity < 10 || humidity > 100) score -= 30;
    else if (humidity < 20 || humidity > 95) score -= 15;
    if (temp > 40 && humidity > 90) score -= 20;
    if (score >= 90) return { label: 'Good', class: 'good' };
    if (score >= 70) return { label: 'Fair', class: 'warn' };
    return { label: 'Poor', class: 'bad' };
  }

  updatePreview() {
    const temp = parseFloat(document.getElementById('temp-input')?.value);
    const hum = parseFloat(document.getElementById('humidity-input')?.value);
    const card = document.getElementById('preview-card');
    if (!card || isNaN(temp) || isNaN(hum)) {
      if (card) card.style.display = 'none';
      return;
    }
    card.style.display = 'block';
    const calibratedTemp = temp + (this.settings?.tempOffset || 0);
    const calibratedHum = Math.max(0, Math.min(100, hum + (this.settings?.humidityOffset || 0)));
    const hi = this.calculateHeatIndex(calibratedTemp, calibratedHum);
    const status = this.getStatus(hi);
    const bar = document.getElementById('preview-bar');
    const val = document.getElementById('preview-value');
    const stat = document.getElementById('preview-status');
    if (bar) {
      const pct = Math.min(100, Math.max(0, (hi / 50) * 100));
      bar.style.width = pct + '%';
    }
    if (val) val.textContent = hi.toFixed(1) + ' °C';
    if (stat) {
      stat.textContent = STATUS_LABELS[status];
      stat.className = 'preview-status ' + status;
    }
  }

  calculate() {
    const loc = document.getElementById('location-select')?.value;
    const temp = parseFloat(document.getElementById('temp-input')?.value);
    const hum = parseFloat(document.getElementById('humidity-input')?.value);
    if (!loc || isNaN(temp) || isNaN(hum)) {
      this.toast('Please fill in all fields', 'warning');
      return;
    }
    if (temp < 0 || temp > 60 || hum < 0 || hum > 100) {
      this.toast('Temperature or humidity out of range', 'error');
      return;
    }
    const calibratedTemp = temp + this.settings.tempOffset;
    const calibratedHum = Math.max(0, Math.min(100, hum + this.settings.humidityOffset));
    const hi = this.calculateHeatIndex(calibratedTemp, calibratedHum);
    const status = this.getStatus(hi);
    const quality = this.getQualityScore(calibratedTemp, calibratedHum);
    const reading = {
      id: Date.now(),
      source: 'manual',
      location: loc,
      temperature: calibratedTemp,
      humidity: calibratedHum,
      heatIndex: parseFloat(hi.toFixed(2)),
      status,
      quality: quality.label,
      qualityClass: quality.class,
      timestamp: new Date().toISOString()
    };
    this.readings.unshift(reading);
    this.saveReadings();
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.checkAlerts();
    this.toast(`Saved: ${loc} — ${hi.toFixed(1)}°C (${STATUS_LABELS[status]})`, 'success');
    if (this.currentTab === 'forecast') this.drawForecastChart();
    document.getElementById('temp-input').value = '';
    document.getElementById('humidity-input').value = '';
    document.getElementById('preview-card').style.display = 'none';
    this.updateRecentLocations();
    this.updateMonitorGauge();
  }

  updateRecentLocations() {
    const recent = [...new Set(this.readings.slice(0, 10).map(r => r.location))].slice(0, 5);
    const container = document.getElementById('recent-locations');
    const chips = document.getElementById('recent-chips');
    if (!container || !chips) return;
    if (recent.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';
    chips.innerHTML = recent.map(loc => {
      const safeLoc = loc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      return `<span class="recent-chip" data-loc="${safeLoc}">${safeLoc}</span>`;
    }).join('');
    chips.querySelectorAll('.recent-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const loc = e.target.dataset.loc;
        if (loc) this.selectLocation(loc);
      });
    });
  }

  selectLocation(loc, showToast = true) {
    const select = document.getElementById('location-select');
    if (select) {
      select.value = loc;
      if (showToast) this.toast(`Selected: ${loc}`, 'info');
    }
  }

  checkAlerts() {
    const banner = document.getElementById('alert-banner');
    const text = document.getElementById('alert-text');
    const latest = this.readings[0];
    const readingStatus = latest && this.hasValidMeasurement(latest)
      ? this.getStatus(Number(latest.heatIndex))
      : null;
    const isRecentHazard = Boolean(
      latest &&
      !latest.isDemo &&
      ['danger', 'extreme'].includes(readingStatus) &&
      this.getReadingFreshness(latest).state === 'recent'
    );

    if (banner && text && isRecentHazard) {
      text.textContent = `${this.translateText('Recent high heat reading')}: ${STATUS_LABELS[readingStatus]} at ${latest.location} — ${Number(latest.heatIndex).toFixed(1)}°C · ${this.formatTime(latest.timestamp)}`;
      banner.style.display = 'flex';
    } else if (banner) {
      banner.style.display = 'none';
    }
    if (!latest || latest.id === this.lastObservedReadingId) return;

    this.lastObservedReadingId = latest.id;
    if (!isRecentHazard) return;

    const previous = this.readings.slice(1).find(reading =>
      reading.location === latest.location &&
      !reading.isDemo &&
      this.hasValidMeasurement(reading) &&
      this.getReadingFreshness(reading).state === 'recent'
    );
    const previousStatus = previous ? this.getStatus(Number(previous.heatIndex)) : null;
    const wasHazard = ['danger', 'extreme'].includes(previousStatus);
    if (!wasHazard || previousStatus !== readingStatus) {
      const message = `HEAT WARNING: ${STATUS_LABELS[readingStatus]} at ${latest.location} — ${Number(latest.heatIndex).toFixed(1)}°C`;
      this.toast(message, 'error');
      this.showBrowserNotification(message, `${STATUS_LABELS[readingStatus]} heat warning`);
      if (this.settings.pushAlerts) this.sendHeatPushAlert(latest);
      if (this.settings.smsAlerts) this.sendHeatSmsAlert(latest);
    }
  }

  async setBrowserNotifications(enabled) {
    const toggle = document.getElementById('setting-browser-notifications');
    if (!('Notification' in window)) {
      if (toggle) toggle.checked = false;
      this.settings.browserNotifications = false;
      this.saveSettings();
      this.toast('Browser notifications are not supported here. In-app warnings will still work.', 'warning');
      return;
    }

    let permission = Notification.permission;
    if (enabled && permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (enabled && permission !== 'granted') {
      if (toggle) toggle.checked = false;
      this.settings.browserNotifications = false;
      this.saveSettings();
      this.toast('Notification permission was not granted. In-app warnings will still work.', 'warning');
      return;
    }

    this.settings.browserNotifications = enabled && permission === 'granted';
    this.saveSettings();
    this.toast(this.settings.browserNotifications ? 'Browser notifications enabled.' : 'Browser notifications disabled.', 'info');
  }

  showBrowserNotification(message, title = 'SchoolHeat alert') {
    if (!this.settings.browserNotifications || !('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const notification = new Notification(title, {
        body: message,
        icon: 'assets/app-logo.png',
        tag: 'schoolheat-hazard',
        renotify: true
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Could not show browser notification:', error);
      this.toast('Could not show browser notification. Check browser notification settings.', 'warning');
    }
  }

  async getAlertService() {
    if (!this.alertBackendPromise) {
      this.alertBackendPromise = (async () => {
        const config = window.SCHOOLHEAT_CLOUD;
        if (!config?.enabled || !config.apiKey || !config.projectId) {
          return { error: 'Firebase authentication is not configured in cloud_config.js.' };
        }
        if (!config.appCheckSiteKey) {
          return { error: 'Firebase App Check is not configured in cloud_config.js.' };
        }
        if (!window.isSecureContext) {
          return { error: 'SMS alerts require SchoolHeat to be hosted over HTTPS.' };
        }

        try {
          const [appSdk, authSdk, appCheckSdk] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-check.js')
          ]);
          const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp({
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            databaseURL: config.databaseURL,
            projectId: config.projectId,
            storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId
          });
          const appCheck = appCheckSdk.initializeAppCheck(app, {
            provider: new appCheckSdk.ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
            isTokenAutoRefreshEnabled: true
          });
          const auth = authSdk.getAuth(app);
          if (!auth.currentUser) await authSdk.signInAnonymously(auth);
          return {
            app,
            auth,
            appCheck,
            appCheckSdk,
            authSdk,
          };
        } catch (error) {
          console.error('Could not initialize Firebase alerts:', error);
          return { error: 'Firebase Auth or App Check is unavailable. Check its configuration in Firebase Console.' };
        }
      })();
    }
    return this.alertBackendPromise;
  }

  async getAlertFunctions() {
    if (!this.alertFunctionsPromise) {
      this.alertFunctionsPromise = (async () => {
        const service = await this.getAlertService();
        if (service.error) return service;
        try {
          const functionsSdk = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-functions.js');
          const functions = functionsSdk.getFunctions(service.app, 'asia-southeast1');
          const callable = name => functionsSdk.httpsCallable(functions, name);
          return {
            ...service,
            register: callable('registerPushDevice'),
            unregister: callable('unregisterPushDevice'),
            send: callable('sendHeatAlert')
          };
        } catch (error) {
          console.error('Could not initialize Firebase Cloud Functions:', error);
          return { error: 'Firebase Cloud Functions are unavailable. Check the push backend deployment.' };
        }
      })();
    }
    return this.alertFunctionsPromise;
  }

  async getPushService() {
    if (!this.pushBackendPromise) {
      this.pushBackendPromise = (async () => {
        const config = window.SCHOOLHEAT_CLOUD;
        if (!config?.vapidKey) {
          return { error: 'Push setup is incomplete: add the FCM Web Push certificate key to cloud_config.js.' };
        }
        if (!window.isSecureContext || !('serviceWorker' in navigator)) {
          return { error: 'Phone push requires SchoolHeat to be hosted over HTTPS and supported by this browser.' };
        }

        const service = await this.getAlertFunctions();
        if (service.error) return service;
        try {
          const messagingSdk = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging.js');
          if (!(await messagingSdk.isSupported())) {
            return { error: 'This browser does not support Firebase web push notifications.' };
          }
          return {
            ...service,
            messaging: messagingSdk.getMessaging(service.app),
            messagingSdk
          };
        } catch (error) {
          console.error('Could not initialize phone push:', error);
          return { error: 'Push service is unavailable. Check Firebase Auth, App Check, and backend deployment.' };
        }
      })();
    }
    return this.pushBackendPromise;
  }

  async sendHeatSmsAlert(reading, test = false) {
    if (!this.settings.smsAlerts && !test) return;
    const config = window.SCHOOLHEAT_CLOUD;
    if (!config?.smsWorkerUrl) {
      this.toast('SMS is not configured: add the Cloudflare Worker URL to cloud_config.js.', 'error');
      return;
    }

    const numbers = String(this.settings.smsNumbers || '')
      .split(/[,\n;]+/)
      .map(number => number.trim())
      .filter(Boolean);
    if (!numbers.length) {
      this.toast('SMS not sent: add at least one recipient number in Settings.', 'warning');
      return;
    }

    let queue;
    try {
      queue = this.readPendingSmsQueue();
      if (queue.length >= SMS_QUEUE_MAX_ITEMS) {
        this.toast('SMS was not queued: the 20-message offline queue is full. Reconnect to the internet and let it send first.', 'error');
        return;
      }
      queue.push({
        id: window.crypto?.randomUUID?.() || `sms-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        payload: {
          test,
          numbers,
          location: reading?.location || '',
          temperature: reading?.temperature,
          humidity: reading?.humidity,
          timestamp: reading?.timestamp || ''
        },
        queuedAt: Date.now()
      });
      this.savePendingSmsQueue(queue);
    } catch (error) {
      console.error('Could not save the pending SMS:', error);
      this.toast('SMS was not sent: this device could not save the pending message.', 'error');
      return;
    }

    if (!navigator.onLine) {
      this.toast(`SMS queued on this device (position ${queue.length}); it will send when internet returns.`, 'warning');
      return;
    }
    await this.flushSmsQueue();
  }

  readPendingSmsQueue() {
    const queue = JSON.parse(localStorage.getItem(SMS_QUEUE_STORAGE_KEY) || '[]');
    if (!Array.isArray(queue) || queue.some(item =>
      !item || typeof item.id !== 'string' || !item.payload || !Array.isArray(item.payload.numbers)
    )) {
      throw new Error('The saved SMS queue is invalid.');
    }
    return queue;
  }

  savePendingSmsQueue(queue) {
    localStorage.setItem(SMS_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    this.updateSmsQueueCancelButton(queue.length);
  }

  updateSmsQueueCancelButton(queueLength) {
    const button = document.getElementById('setting-sms-cancel-queue');
    if (button) button.hidden = queueLength === 0;
  }

  promptPendingSmsRetry() {
    if (!this.smsStartupQueueReview || this.smsSendInProgress) return;

    let queue;
    try {
      queue = this.readPendingSmsQueue();
    } catch (error) {
      console.error('Could not read the pending SMS queue:', error);
      this.smsStartupQueueReview = false;
      this.smsAutoRetryPaused = true;
      this.toast('Pending SMS could not be read from this device. Check browser storage.', 'error');
      return;
    }
    this.smsStartupQueueReview = false;
    if (!queue.length) return;

    const retry = confirm(`There are ${queue.length} queued SMS alerts from an earlier session. Retry them now? Choose Cancel to keep them queued and decide in Settings.`);
    if (!retry) {
      this.smsAutoRetryPaused = true;
      this.toast('Queued SMS alerts were kept on this device and will not retry until you choose Retry Queued SMS.', 'warning');
      return;
    }
    this.smsAutoRetryPaused = false;
    this.flushSmsQueue();
  }

  retryPendingSmsQueue() {
    if (this.smsSendInProgress) {
      this.toast('An SMS attempt is already in progress. Wait for its result before retrying.', 'warning');
      return;
    }

    let queue;
    try {
      queue = this.readPendingSmsQueue();
    } catch (error) {
      console.error('Could not read the pending SMS queue:', error);
      this.toast('Pending SMS could not be read from this device. Check browser storage.', 'error');
      return;
    }
    if (!queue.length) {
      this.toast('There are no queued SMS alerts to retry.', 'warning');
      return;
    }
    if (!navigator.onLine) {
      this.toast('SMS alerts are still queued. Reconnect to the internet before retrying.', 'warning');
      return;
    }

    this.smsStartupQueueReview = false;
    this.smsAutoRetryPaused = false;
    this.flushSmsQueue();
  }

  cancelPendingSmsQueue() {
    if (this.smsSendInProgress) {
      this.toast('An SMS attempt is already in progress and cannot be cancelled. Check CLOUDSMS message activity before trying again.', 'warning');
      return;
    }

    let queue;
    try {
      queue = this.readPendingSmsQueue();
    } catch (error) {
      console.error('Could not read the pending SMS queue:', error);
      this.toast('Pending SMS could not be read from this device. Check browser storage.', 'error');
      return;
    }
    if (!queue.length) {
      this.toast('There are no queued SMS alerts to cancel.', 'warning');
      return;
    }

    const alertCount = queue.length;
    const alertLabel = `${alertCount} queued SMS alert${alertCount === 1 ? '' : 's'}`;
    if (!confirm(`Cancel ${alertLabel} on this device? Saved recipient numbers and SMS settings will stay unchanged.`)) return;
    if (this.smsSendInProgress) {
      this.toast('An SMS attempt started before the queue could be cancelled. Check CLOUDSMS message activity before trying again.', 'warning');
      return;
    }

    try {
      this.savePendingSmsQueue([]);
    } catch (error) {
      console.error('Could not cancel pending SMS alerts:', error);
      this.toast('Queued SMS alerts were not cancelled because browser storage could not be updated.', 'error');
      return;
    }
    if (this.smsRetryTimer) clearTimeout(this.smsRetryTimer);
    this.smsRetryTimer = null;
    this.smsStartupQueueReview = false;
    this.smsAutoRetryPaused = false;
    this.toast(`${alertLabel} cancelled. Saved recipient numbers and SMS settings were kept.`, 'success');
  }

  scheduleSmsRetry(delayMs = SMS_RETRY_DELAY_MS) {
    if (this.smsRetryTimer) clearTimeout(this.smsRetryTimer);
    this.smsRetryTimer = setTimeout(() => {
      this.smsRetryTimer = null;
      this.flushSmsQueue();
    }, Math.max(1000, delayMs));
  }

  async flushSmsQueue() {
    if (this.smsSendInProgress || !navigator.onLine) return;
    let queue;
    try {
      queue = this.readPendingSmsQueue();
    } catch (error) {
      console.error('Could not read the pending SMS queue:', error);
      this.toast('Pending SMS could not be read from this device. Check browser storage.', 'error');
      return;
    }
    if (!queue.length) return;

    this.smsSendInProgress = true;
    try {
      const config = window.SCHOOLHEAT_CLOUD;
      if (!config?.smsWorkerUrl) throw new Error('The Cloudflare SMS Worker URL is not configured.');
      const service = await this.getAlertService();
      if (service.error) throw new Error(service.error);
      if (!service.auth.currentUser) await service.authSdk.signInAnonymously(service.auth);
      const [idToken, appCheckToken] = await Promise.all([
        service.auth.currentUser.getIdToken(),
        service.appCheckSdk.getToken(service.appCheck, false)
      ]);
      const item = queue[0];
      const response = await fetch(config.smsWorkerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': item.id,
          'X-Firebase-AppCheck': appCheckToken.token
        },
        body: JSON.stringify(item.payload)
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('The SMS Worker returned an invalid response.');
      }
      if (response.status === 429 || response.status >= 500) {
        const retryAfterSeconds = Math.max(1, Number(result.retryAfterSeconds) || 300);
        const errorDetail = typeof result.error === 'string'
          ? result.error
          : `The SMS service returned HTTP ${response.status}.`;
        const providerStatus = Number.isInteger(result.providerStatus)
          ? ` (provider HTTP ${result.providerStatus})`
          : '';
        this.toast(`SMS remains queued: ${errorDetail}${providerStatus} It will retry in about ${retryAfterSeconds} seconds while SchoolHeat is open.`, 'warning');
        this.scheduleSmsRetry(retryAfterSeconds * 1000);
        return;
      }
      if (!response.ok) {
        queue.shift();
        this.savePendingSmsQueue(queue);
        this.toast(`SMS was not accepted: ${result.error || `request failed (${response.status})`}`, 'error');
        if (queue.length) this.scheduleSmsRetry();
        return;
      }

      queue.shift();
      this.savePendingSmsQueue(queue);
      const sent = Number(result.sent) || 0;
      const failed = Number(result.failed) || 0;
      if (sent) {
        this.toast(`CLOUDSMS accepted SMS for ${sent} recipient${sent === 1 ? '' : 's'}${failed ? `; ${failed} failed` : ''}. Check CLOUDSMS message activity for delivery status.`, failed ? 'warning' : 'success');
      } else {
        this.toast('SMS was not accepted by CLOUDSMS.', 'warning');
      }
      if (queue.length) this.scheduleSmsRetry();
    } catch (error) {
      console.error('SMS delivery attempt failed:', error);
      this.toast('SMS remains queued on this device and will be retried when the service is available.', 'warning');
      this.scheduleSmsRetry();
    } finally {
      this.smsSendInProgress = false;
    }
  }

  async setPushAlerts(enabled) {
    const toggle = document.getElementById('setting-push-alerts');
    if (!enabled) {
      const service = await this.getPushService();
      if (service.error) {
        if (toggle) toggle.checked = true;
        this.toast(`Could not turn off phone push: ${service.error}`, 'error');
        return;
      }
      try {
        await service.unregister();
        this.settings.pushAlerts = false;
        this.saveSettings();
        this.toast('Phone push alerts turned off for this device.', 'info');
      } catch (error) {
        console.error('Could not unregister phone push:', error);
        if (toggle) toggle.checked = true;
        this.toast(`Could not turn off phone push: ${error.message || 'server request failed.'}`, 'error');
      }
      return;
    }

    if (!('Notification' in window)) {
      if (toggle) toggle.checked = false;
      this.toast('Phone push notifications are not supported by this browser.', 'warning');
      return;
    }
    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (toggle) toggle.checked = false;
      this.toast('Notification permission was not granted. Enable it in the browser settings.', 'warning');
      return;
    }

    const service = await this.getPushService();
    if (service.error) {
      if (toggle) toggle.checked = false;
      this.toast(`Phone push not enabled: ${service.error}`, 'error');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const token = await service.messagingSdk.getToken(service.messaging, {
        vapidKey: window.SCHOOLHEAT_CLOUD.vapidKey,
        serviceWorkerRegistration: registration
      });
      if (!token) throw new Error('The browser did not create a push subscription.');
      await service.register({ token });
      this.listenForPushMessages(service);
      this.settings.pushAlerts = true;
      this.saveSettings();
      this.toast('Phone push enabled on this device. Enable it on the laptop running SchoolHeat too.', 'success');
    } catch (error) {
      console.error('Could not enable phone push:', error);
      this.settings.pushAlerts = false;
      if (toggle) toggle.checked = false;
      this.saveSettings();
      this.toast(`Phone push not enabled: ${error.message || 'subscription setup failed.'}`, 'error');
    }
  }

  async refreshPushRegistration() {
    const service = await this.getPushService();
    if (service.error) {
      this.toast(`Phone push needs attention: ${service.error}`, 'warning');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const token = await service.messagingSdk.getToken(service.messaging, {
        vapidKey: window.SCHOOLHEAT_CLOUD.vapidKey,
        serviceWorkerRegistration: registration
      });
      if (!token) throw new Error('The browser did not return a push subscription.');
      await service.register({ token });
      this.listenForPushMessages(service);
    } catch (error) {
      console.error('Could not refresh phone push registration:', error);
      this.toast(`Phone push registration could not be refreshed: ${error.message || 'request failed.'}`, 'warning');
    }
  }

  async sendHeatPushAlert(reading, test = false) {
    if (!this.settings.pushAlerts && !test) return;
    const service = await this.getPushService();
    if (service.error) {
      this.toast(`Push not sent: ${service.error}`, 'error');
      return;
    }
    this.listenForPushMessages(service);
    try {
      const response = await service.send({
        test,
        location: reading?.location || '',
        temperature: reading?.temperature,
        humidity: reading?.humidity
      });
      const sent = Number(response.data?.sent) || 0;
      if (!sent) {
        this.toast('Push not sent: no devices have enabled SchoolHeat phone push.', 'warning');
        return;
      }
      this.toast(`Push submitted to ${sent} device${sent === 1 ? '' : 's'}. Delivery requires the phone to be online; check its notification settings.`, 'success');
    } catch (error) {
      console.error('Heat alert push request failed:', error);
      this.toast(`Push not sent: ${error.message || 'push service request failed.'}`, 'error');
    }
  }

  listenForPushMessages(service) {
    if (this.pushMessageUnsubscribe) return;
    this.pushMessageUnsubscribe = service.messagingSdk.onMessage(service.messaging, payload => {
      const title = payload.notification?.title || 'SchoolHeat heat warning';
      const body = payload.notification?.body || 'A new heat alert is available.';
      this.toast(`${title}: ${body}`, 'warning');
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: 'assets/app-logo.png',
          tag: 'schoolheat-heat-alert',
          renotify: true
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    });
  }

  /* ============================================
     AUTO-READ TOGGLE (CONTINUOUS SENSOR MODE)
     ============================================ */

  autoRead() {
    if (this.wifiSyncActive || !this.settings.demoMode) {
      this.toggleWifiSensorSync();
      return;
    }
    if (this.autoReadActive) {
      this.stopAutoRead();
    } else {
      this.startAutoRead();
    }
  }

  async startAutoRead() {
    this.toast('Demo Mode ON — Simulating sensor data', 'warning');
    this.autoReadActive = true;
    this.autoReadLocIndex = 0;
    this.updateAutoReadButton();

    const overlay = document.getElementById('auto-read-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), 1500);
    }

    this.performSensorReading();
    this.scheduleAutoRead();
  }

  scheduleAutoRead() {
    if (!this.autoReadActive || this.autoReadInterval) return;
    this.autoReadInterval = setInterval(() => {
      this.performSensorReading();
    }, AUTO_READ_INTERVAL_MS);
  }

  stopAutoRead() {
    this.autoReadActive = false;
    if (this.autoReadInterval) {
      clearInterval(this.autoReadInterval);
      this.autoReadInterval = null;
    }
    this.updateAutoReadButton();
    this.toast('Auto-Read OFF', 'info');
  }

  updateAutoReadButton() {
    const btn = document.getElementById('btn-auto-read');
    const badge = document.getElementById('auto-read-badge');
    if (!btn) return;
    if (this.wifiSyncActive) {
      btn.classList.add('auto-read-active');
      if (badge) badge.style.display = 'inline-flex';
      btn.textContent = 'Stop ESP32 Auto-Read (Wi-Fi)';
    } else if (this.autoReadActive) {
      btn.classList.add('auto-read-active');
      if (badge) badge.style.display = 'inline-flex';
      btn.textContent = 'Stop Demo Auto-Read';
    } else {
      btn.classList.remove('auto-read-active');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        ${this.settings.demoMode ? 'Start Demo Auto-Read' : 'Auto-Read ESP32 (Wi-Fi)'}
      `;
      if (badge) badge.style.display = 'none';
    }
  }

  performSensorReading() {
    if (!this.settings.demoMode) return;
    const loc = LOCATIONS[this.autoReadLocIndex];
    this.autoReadLocIndex = (this.autoReadLocIndex + 1) % LOCATIONS.length;

    let last = this.lastSensorValues[loc.name];
    if (!last) {
      last = { temp: loc.baseTemp, hum: loc.baseHum };
    }

    const tempDrift = (Math.random() - 0.5) * 1.2;
    const humDrift = (Math.random() - 0.5) * 4;

    let temp = last.temp + tempDrift;
    let hum = last.hum + humDrift;

    temp = Math.max(20, Math.min(55, temp));
    hum = Math.max(30, Math.min(98, hum));

    const hour = new Date().getHours();
    const timeFactor = Math.sin((hour - 6) / 12 * Math.PI) * 2.5;
    temp += timeFactor;

    this.lastSensorValues[loc.name] = { temp, hum };

    const hi = this.calculateHeatIndex(temp, hum);
    const status = this.getStatus(hi);
    const quality = this.getQualityScore(temp, hum);

    const reading = {
      id: Date.now(),
      source: 'demo',
      location: loc.name,
      temperature: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(hum.toFixed(1)),
      heatIndex: parseFloat(hi.toFixed(2)),
      status,
      quality: quality.label,
      qualityClass: quality.class,
      timestamp: new Date().toISOString(),
      isDemo: true
    };

    this.readings.unshift(reading);
    this.saveReadings();
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.checkAlerts();
    this.updateMonitorGauge();
    if (this.currentTab === 'forecast') this.drawForecastChart();

    const locSelect = document.getElementById('location-select');
    if (locSelect) locSelect.value = loc.name;
    const tempInput = document.getElementById('temp-input');
    const humInput = document.getElementById('humidity-input');
    if (tempInput) tempInput.value = temp.toFixed(1);
    if (humInput) humInput.value = hum.toFixed(1);
    this.updatePreview();

    if (this.autoReadLocIndex % 5 === 0) {
      this.toast(`Scanning: ${loc.name} — ${hi.toFixed(1)}°C`, 'info');
    }
  }

  toggleWifiSensorSync() {
    if (!this.wifiSyncActive && this.bluetoothSyncBusy) {
      this.toast('Wait for the Bluetooth sync to finish before starting Wi-Fi sync.', 'warning');
      return;
    }
    if (this.wifiSyncActive) {
      this.wifiSyncActive = false;
      this.wifiSyncSetupDone = false;
      this.wifiSyncInitialSampleDone = false;
      if (this.wifiSyncTimer) clearInterval(this.wifiSyncTimer);
      this.wifiSyncTimer = null;
      this.updateAutoReadButton();
      this.setWifiSyncStatus('Wi-Fi sync stopped. The ESP32 will continue storing readings while powered.');
      return;
    }

    const location = document.getElementById('location-select')?.value;
    if (!location) {
      this.toast('Choose the ESP32 sensor location before starting Wi-Fi sync.', 'warning');
      return;
    }
    if (this.autoReadActive) this.stopAutoRead();

    this.wifiSyncActive = true;
    this.wifiSyncSetupDone = false;
    this.wifiSyncInitialSampleDone = false;
    this.updateAutoReadButton();
    this.setWifiSyncStatus('Connecting to the laptop bridge and ESP32 Wi-Fi...');
    this.syncLocalWifiReadings(true);
    this.wifiSyncTimer = setInterval(() => {
      this.syncLocalWifiReadings(!this.wifiSyncSetupDone);
    }, 20000);
  }

  setWifiSyncStatus(message) {
    const status = document.getElementById('wifi-sync-status');
    if (status) status.textContent = message;
  }

  recordDeviceStatus(sensor, transport) {
    const numberOrNull = value =>
      value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
        ? Number(value)
        : null;
    this.lastDeviceStatus = {
      transport,
      checkedAt: Date.now(),
      deviceId: String(sensor.deviceId || '').slice(0, 60),
      storageReady: sensor.storageReady === true,
      storageFull: sensor.storageFull === true,
      pendingReadings: numberOrNull(sensor.pendingReadings),
      droppedReadingsSinceBoot: numberOrNull(sensor.droppedReadingsSinceBoot),
      sensorErrors: numberOrNull(sensor.sensorErrors),
      sensorSampleAttempted: typeof sensor.sensorSampleAttempted === 'boolean' ? sensor.sensorSampleAttempted : null,
      sensorReadingValid: typeof sensor.sensorReadingValid === 'boolean' ? sensor.sensorReadingValid : null,
      latestSampleSaved: typeof sensor.latestSampleSaved === 'boolean' ? sensor.latestSampleSaved : null
    };
    this.renderSensorTrust();
  }

  async syncLocalWifiReadings(setDeviceClock) {
    if (!this.wifiSyncActive || this.wifiSyncBusy) return;
    this.wifiSyncBusy = true;
    try {
      if (!window.isSecureContext) {
        throw new Error('Open the installed SchoolHeat app from its HTTPS GitHub Pages address before connecting to the ESP32.');
      }
      const request = async (path, options = {}) => {
        const response = await fetch(`${ESP32_BRIDGE_BASE}${path}`, {
          cache: 'no-store',
          ...options,
          headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Local bridge request failed (${response.status}).`);
        return result;
      };
      const location = document.getElementById('location-select')?.value;
      if (!location) throw new Error('Choose the sensor location in the Monitor tab.');

      const sensor = await request('/bridge/status');
      this.recordDeviceStatus(sensor, 'Wi-Fi');
      if (!sensor.storageReady) throw new Error('ESP32 flash storage is unavailable; readings are not being stored.');
      await request('/bridge/location', {
        method: 'POST',
        body: JSON.stringify({ location })
      });
      if (setDeviceClock) {
        await request('/bridge/time', {
          method: 'POST',
          body: JSON.stringify({ epochMs: Date.now() })
        });
        this.wifiSyncSetupDone = true;
      }
      if (!this.wifiSyncInitialSampleDone) {
        await request('/bridge/sample', { method: 'POST', body: '{}' });
        this.wifiSyncInitialSampleDone = true;
      }

      const deviceId = String(sensor.deviceId || 'unknown');
      const cursorKey = `sh_esp32_last_sequence_${deviceId}`;
      const lastSequence = Number(localStorage.getItem(cursorKey)) || 0;
      const batch = await request(`/bridge/readings?after=${encodeURIComponent(lastSequence)}`);
      const validRows = [];
      let missingTime = Number(batch.untimestampedReadings) || 0;
      (Array.isArray(batch.readings) ? batch.readings : []).forEach(row => {
        const sequence = Number(row.sequence);
        const temperature = Number(row.temperature);
        const humidity = Number(row.humidity);
        if (!Number.isSafeInteger(sequence) || sequence < 1 ||
            !Number.isFinite(temperature) || temperature < 0 || temperature > 60 ||
            !Number.isFinite(humidity) || humidity < 0 || humidity > 100) return;
        if (typeof row.timestamp !== 'string' || !Number.isFinite(Date.parse(row.timestamp))) {
          missingTime++;
          return;
        }
        validRows.push({ ...row, sequence, temperature, humidity });
      });
      validRows.sort((a, b) => a.sequence - b.sequence);

      const imported = this.importEsp32Readings(deviceId, validRows, location);

      const syncedThrough = Number(batch.cursor);
      if (Number.isSafeInteger(syncedThrough) && syncedThrough >= lastSequence) {
        localStorage.setItem(cursorKey, String(syncedThrough));
      }

      const warnings = [];
      if (missingTime) warnings.push(`${missingTime} reading(s) have no reliable timestamp and were skipped`);
      if (sensor.droppedReadingsSinceBoot) warnings.push(`${sensor.droppedReadingsSinceBoot} oldest reading(s) were rotated out of ESP32 storage`);
      if (sensor.storageFull) warnings.push('ESP32 flash storage could not save a new reading');
      if (sensor.sensorErrors) warnings.push(`${sensor.sensorErrors} DHT22 read error(s) since reboot`);
      const summary = `${imported.length ? `${imported.length} new reading(s) synced` : 'No new readings'} · ${sensor.pendingReadings} stored on ESP32.`;
      this.setWifiSyncStatus(warnings.length ? `${summary} ${warnings.join('; ')}.` : `ESP32 connected · ${summary}`);
    } catch (error) {
      console.error('ESP32 Wi-Fi sync failed:', error);
      const message = error instanceof TypeError
        ? 'Could not reach the laptop bridge. Start start-local-bridge.ps1, connect this device to SchoolHeat Wi-Fi, and keep the bridge window open.'
        : error.message;
      this.setWifiSyncStatus(`ESP32 sync error: ${message}`);
    } finally {
      this.wifiSyncBusy = false;
    }
  }

  importEsp32Readings(deviceId, rows, fallbackLocation) {
    const knownIds = new Set(this.readings.map(reading => reading.id));
    const imported = [];
    rows.forEach(row => {
      const id = `esp32-${deviceId}-${row.sequence}`;
      if (knownIds.has(id)) return;
      const heatIndex = this.calculateHeatIndex(row.temperature, row.humidity);
      const quality = this.getQualityScore(row.temperature, row.humidity);
      imported.push({
        id,
        source: 'esp32',
        location: typeof row.location === 'string' && row.location ? row.location : fallbackLocation,
        temperature: parseFloat(row.temperature.toFixed(1)),
        humidity: parseFloat(row.humidity.toFixed(1)),
        heatIndex: parseFloat(heatIndex.toFixed(2)),
        status: this.getStatus(heatIndex),
        quality: quality.label,
        qualityClass: quality.class,
        timestamp: row.timestamp
      });
    });

    if (!imported.length) return imported;
    const previousReadings = this.readings.slice();
    for (const reading of imported) this.readings.unshift(reading);
    try {
      this.saveReadings();
    } catch (error) {
      this.readings = previousReadings;
      throw new Error(`Could not save synced readings in this browser: ${error.message}`);
    }
    for (const reading of imported) this.checkAlerts();
    this.forecastComparisonCache = null;
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.updateMonitorGauge();
    if (this.currentTab === 'forecast') this.drawForecastChart();
    const latest = this.readings[0];
    const tempInput = document.getElementById('temp-input');
    const humInput = document.getElementById('humidity-input');
    if (tempInput) tempInput.value = latest.temperature.toFixed(1);
    if (humInput) humInput.value = latest.humidity.toFixed(1);
    this.updatePreview();
    return imported;
  }

  async syncBluetoothReadings() {
    if (this.bluetoothSyncBusy) return;
    if (this.wifiSyncActive) {
      this.setWifiSyncStatus('Stop Wi-Fi Auto-Read before starting Bluetooth sync.');
      return;
    }
    if (!window.isSecureContext || !navigator.bluetooth) {
      this.setWifiSyncStatus('Bluetooth sync requires Web Bluetooth support and the HTTPS GitHub Pages app.');
      return;
    }
    const location = document.getElementById('location-select')?.value;
    if (!location) {
      this.toast('Choose the ESP32 sensor location before syncing.', 'warning');
      return;
    }

    this.bluetoothSyncBusy = true;
    const button = document.getElementById('btn-bluetooth-sync');
    if (button) button.disabled = true;
    let device;
    let selectingDevice = true;
    try {
      this.setWifiSyncStatus('Choose your assigned ESP32 in the Bluetooth device prompt.');
      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['8b9d1a00-6e8f-4f4b-9a7d-2f4d5c6e7a10'] }]
      });
      selectingDevice = false;
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('8b9d1a00-6e8f-4f4b-9a7d-2f4d5c6e7a10');
      const command = await service.getCharacteristic('8b9d1a01-6e8f-4f4b-9a7d-2f4d5c6e7a10');
      const responseCharacteristic = await service.getCharacteristic('8b9d1a02-6e8f-4f4b-9a7d-2f4d5c6e7a10');
      await responseCharacteristic.startNotifications();
      let pendingResponse = null;
      let responseBuffer = null;
      let responseReceived = null;
      let responseTotal = 0;
      const onBluetoothResponse = event => {
        const value = event.target.value;
        if (!pendingResponse || value.byteLength < 5) return;
        const offset = (value.getUint8(0) << 8) | value.getUint8(1);
        const total = (value.getUint8(2) << 8) | value.getUint8(3);
        const chunkLength = value.byteLength - 4;
        if (total < 1 || total > 512 || offset + chunkLength > total) return;
        if (offset === 0) {
          responseBuffer = new Uint8Array(total);
          responseReceived = new Uint8Array(total);
          responseTotal = total;
        }
        if (!responseBuffer || total !== responseTotal) return;
        for (let index = 0; index < chunkLength; index++) {
          const position = offset + index;
          if (!responseReceived[position]) {
            responseBuffer[position] = value.getUint8(index + 4);
            responseReceived[position] = 1;
          }
        }
        if (responseReceived.reduce((sum, received) => sum + received, 0) !== responseTotal) return;

        let result;
        try {
          result = JSON.parse(new TextDecoder().decode(responseBuffer));
        } catch (error) {
          pendingResponse.reject(new Error(`ESP32 sent an invalid Bluetooth response: ${error.message}`));
          pendingResponse = null;
          return;
        }
        if (result.id !== pendingResponse.requestId) {
          responseBuffer = null;
          responseReceived = null;
          responseTotal = 0;
          return;
        }
        const completed = pendingResponse;
        pendingResponse = null;
        if (result.error) completed.reject(new Error(result.error));
        else completed.resolve(result);
      };
      responseCharacteristic.addEventListener('characteristicvaluechanged', onBluetoothResponse);
      const send = async payload => {
        const requestId = `${Date.now()}-${++this.bluetoothRequestSequence}`;
        const bytes = new TextEncoder().encode(JSON.stringify({ ...payload, id: requestId }));
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (pendingResponse?.requestId !== requestId) return;
            pendingResponse = null;
            reject(new Error('The ESP32 did not respond over Bluetooth in time.'));
          }, 20000);
          pendingResponse = {
            requestId,
            resolve: result => {
              clearTimeout(timeout);
              resolve(result);
            },
            reject: error => {
              clearTimeout(timeout);
              reject(error);
            }
          };
          command.writeValueWithResponse(bytes).catch(error => {
            if (pendingResponse?.requestId !== requestId) return;
            pendingResponse = null;
            clearTimeout(timeout);
            reject(error);
          });
        });
      };

      const sensor = await send({ op: 'status' });
      this.recordDeviceStatus(sensor, 'Bluetooth');
      if (!sensor.storageReady) throw new Error('ESP32 flash storage is unavailable; readings are not being stored.');
      await send({ op: 'location', location });
      if (!sensor.clockSynced) {
        await send({ op: 'time', epochMs: Date.now() });
      }

      const deviceId = String(sensor.deviceId || 'unknown');
      let cursor = 0;
      const latestSequence = Number(sensor.latestSequence);
      if (!Number.isSafeInteger(latestSequence) || latestSequence < 0) {
        throw new Error('ESP32 did not report its latest Bluetooth reading sequence.');
      }
      const rows = [];
      let missingTime = 0;
      let page;
      do {
        const previousCursor = cursor;
        page = await send({ op: 'readings', after: cursor });
        cursor = Number(page.cursor);
        if (!Number.isSafeInteger(cursor) || cursor < previousCursor) {
          throw new Error('The ESP32 returned an invalid Bluetooth sync cursor.');
        }
        missingTime += Number(page.untimed) || 0;
        (Array.isArray(page.rows) ? page.rows : []).forEach(row => {
          if (!Array.isArray(row) || row.length < 4) return;
          const sequence = Number(row[0]);
          const temperature = Number(row[1]);
          const humidity = Number(row[2]);
          const timestamp = row[3];
          if (!Number.isSafeInteger(sequence) || sequence < 1 ||
              !Number.isFinite(temperature) || temperature < 0 || temperature > 60 ||
              !Number.isFinite(humidity) || humidity < 0 || humidity > 100 ||
              typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))) {
            missingTime++;
            return;
          }
          rows.push({ sequence, temperature, humidity, timestamp, location: page.location });
        });
        if (!page.done && cursor === previousCursor) {
          throw new Error('Bluetooth sync stopped because the ESP32 cursor did not advance.');
        }
        this.setWifiSyncStatus(`Bluetooth connected · reading ${rows.length} stored sample(s)…`);
      } while (!page.done);

      rows.sort((a, b) => a.sequence - b.sequence);
      const imported = this.importEsp32Readings(deviceId, rows, location);
      const warnings = [];
      if (missingTime) warnings.push(`${missingTime} reading(s) without a reliable timestamp were skipped`);
      if (sensor.droppedReadingsSinceBoot) warnings.push(`${sensor.droppedReadingsSinceBoot} oldest reading(s) were rotated out`);
      if (sensor.sensorErrors) warnings.push(`${sensor.sensorErrors} DHT22 read error(s) since reboot`);
      let healthStatus;
      if (typeof sensor.sensorSampleAttempted !== 'boolean') {
        healthStatus = 'ESP32 firmware does not report DHT22 health yet; upload the latest sketch';
      } else if (!sensor.sensorSampleAttempted) {
        healthStatus = 'ESP32 connected; DHT22 has not been sampled yet';
      } else if (!sensor.sensorReadingValid) {
        healthStatus = `DHT22 read failed on the latest attempt (${sensor.sensorErrors || 0} error(s) since reboot)`;
      } else {
        const temperature = Number(sensor.latestTemperature);
        const humidity = Number(sensor.latestHumidity);
        const values = Number.isFinite(temperature) && Number.isFinite(humidity)
          ? ` (${temperature.toFixed(1)}°C, ${humidity.toFixed(1)}% RH)`
          : '';
        healthStatus = sensor.latestSampleSaved
          ? `DHT22 working${values}; latest reading saved to ESP32`
          : `DHT22 responds${values}, but latest reading was not saved to flash`;
      }
      const summary = `${imported.length ? `${imported.length} new reading(s) imported` : 'No new readings'} · ${sensor.pendingReadings} stored on ESP32.`;
      this.setWifiSyncStatus(warnings.length
        ? `Bluetooth sync complete · ${summary} ${healthStatus}. ${warnings.join('; ')}.`
        : `Bluetooth sync complete · ${summary} ${healthStatus}.`);
      responseCharacteristic.removeEventListener('characteristicvaluechanged', onBluetoothResponse);
      await responseCharacteristic.stopNotifications();
      device.gatt.disconnect();
    } catch (error) {
      if (device?.gatt?.connected) device.gatt.disconnect();
      console.error('ESP32 Bluetooth sync failed:', error);
      const message = selectingDevice && (error.name === 'NotFoundError' || error.name === 'AbortError')
        ? 'Bluetooth device selection was cancelled.'
        : error.message;
      this.setWifiSyncStatus(`Bluetooth sync error: ${message}`);
    } finally {
      this.bluetoothSyncBusy = false;
      if (button) button.disabled = false;
    }
  }

  /* ============================================
     MONITOR TAB — GAUGE & SCALES
     ============================================ */

  updateMonitorGauge() {
    const canvas = document.getElementById('monitor-gauge');
    const valEl = document.getElementById('monitor-gauge-val');
    const statusEl = document.getElementById('monitor-gauge-status');
    const tempBar = document.getElementById('scale-temp-bar');
    const tempVal = document.getElementById('scale-temp-val');
    const humBar = document.getElementById('scale-hum-bar');
    const humVal = document.getElementById('scale-hum-val');

    const latest = this.readings[0];
    if (!latest) {
      if (valEl) valEl.textContent = '--';
      if (statusEl) { statusEl.textContent = 'No Data'; statusEl.className = 'monitor-gauge-status nodata'; }
      if (tempVal) tempVal.textContent = '-- °C';
      if (humVal) humVal.textContent = '-- %';
      if (tempBar) tempBar.style.width = '0%';
      if (humBar) humBar.style.width = '0%';
      this.drawMonitorGauge(0);
      return;
    }

    const hi = latest.heatIndex;
    const status = latest.status;
    const temp = latest.temperature;
    const hum = latest.humidity;

    if (valEl) valEl.textContent = hi.toFixed(1);
    if (statusEl) {
      statusEl.textContent = STATUS_LABELS[status];
      statusEl.className = 'monitor-gauge-status ' + status;
    }
    if (tempVal) tempVal.textContent = temp.toFixed(1) + ' °C';
    if (humVal) humVal.textContent = hum.toFixed(1) + ' %';
    if (tempBar) tempBar.style.width = Math.min(100, Math.max(0, (temp / 55) * 100)) + '%';
    if (humBar) humBar.style.width = Math.min(100, Math.max(0, hum)) + '%';

    this.drawMonitorGauge(hi);
  }

  getSensorTrustSummary() {
    const readings = this.readings
      .filter(reading =>
        !reading.isDemo &&
        typeof reading.id === 'string' &&
        reading.id.startsWith('esp32-') &&
        Number.isFinite(Date.parse(reading.timestamp))
      )
      .slice()
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const intervals = [];
    const byDeviceAndLocation = new Map();
    readings.forEach(reading => {
      const match = reading.id.match(/^esp32-(.*)-(\d+)$/);
      const key = `${match ? match[1] : 'unknown'}\n${reading.location}`;
      const group = byDeviceAndLocation.get(key) || [];
      group.push(Date.parse(reading.timestamp));
      byDeviceAndLocation.set(key, group);
    });
    byDeviceAndLocation.forEach(timestamps => {
      timestamps.sort((a, b) => a - b);
      for (let index = 1; index < timestamps.length; index++) {
        const interval = timestamps[index] - timestamps[index - 1];
        if (interval > 0) intervals.push(interval);
      }
    });
    const orderedIntervals = intervals.slice().sort((a, b) => a - b);
    const middle = Math.floor(orderedIntervals.length / 2);
    const medianInterval = orderedIntervals.length
      ? orderedIntervals.length % 2
        ? orderedIntervals[middle]
        : (orderedIntervals[middle - 1] + orderedIntervals[middle]) / 2
      : null;
    return {
      readings,
      intervals,
      medianInterval,
      gapCount: intervals.filter(interval => interval > ESP32_GAP_THRESHOLD_MS).length
    };
  }

  renderSensorTrust() {
    const contact = document.getElementById('sensor-trust-contact');
    const count = document.getElementById('sensor-trust-count');
    const sample = document.getElementById('sensor-trust-sample');
    const cadence = document.getElementById('sensor-trust-cadence');
    const storage = document.getElementById('sensor-trust-storage');
    const caveat = document.getElementById('sensor-trust-caveat');
    if (!contact || !count || !sample || !cadence || !storage || !caveat) return;

    const summary = this.getSensorTrustSummary();
    count.textContent = String(summary.readings.length);
    cadence.textContent = summary.readings.length
      ? `${summary.medianInterval === null
        ? this.translateText('No interval yet')
        : `${this.translateText('Median')} ${Math.round(summary.medianInterval / 60000)} ${this.translateText('min')}`} · ${summary.gapCount} ${this.translateText('gap(s) over 7.5 min')}`
      : this.translateText('No ESP32 history');

    const status = this.lastDeviceStatus;
    contact.textContent = status
      ? `${status.transport} response ${this.formatTime(new Date(status.checkedAt).toISOString())}; connection may since have ended`
      : this.translateText('No device response in this session');

    if (!status || status.sensorSampleAttempted === null) {
      sample.textContent = this.translateText('Not reported');
    } else if (!status.sensorSampleAttempted) {
      sample.textContent = this.translateText('Not sampled yet');
    } else if (status.sensorReadingValid === false) {
      sample.textContent = this.translateText('Latest attempt invalid');
    } else if (status.sensorReadingValid === true && status.latestSampleSaved === false) {
      sample.textContent = this.translateText('Valid, not saved');
    } else if (status.sensorReadingValid === true && status.latestSampleSaved === true) {
      sample.textContent = this.translateText('Valid sample saved');
    } else {
      sample.textContent = this.translateText('Health not reported');
    }

    if (!status) {
      storage.textContent = this.translateText('Not checked');
    } else if (!status.storageReady) {
      storage.textContent = this.translateText('Unavailable');
    } else {
      const pending = status.pendingReadings === null
        ? this.translateText('count not reported')
        : `${status.pendingReadings} ${this.translateText('pending')}`;
      const warnings = [];
      if (status.storageFull) warnings.push(this.translateText('full'));
      if (status.droppedReadingsSinceBoot) warnings.push(`${status.droppedReadingsSinceBoot} ${this.translateText('rotated')}`);
      storage.textContent = `${this.translateText('Ready')} · ${pending}${warnings.length ? ` · ${warnings.join(', ')}` : ''}`;
    }

    caveat.textContent = status?.sensorErrors
      ? `${status.sensorErrors} DHT22 read error(s) reported since reboot. Device connectivity, successful transmission, valid readings, and measurement accuracy are different; calibration is not verified.`
      : 'Connectivity, successful transmission, valid sensor readings, and measurement accuracy are different. SchoolHeat cannot verify calibration or accuracy.';

    const dashboardResponse = document.getElementById('dashboard-sensor-response');
    const dashboardCount = document.getElementById('dashboard-sensor-count');
    const dashboardSample = document.getElementById('dashboard-sensor-sample');
    const dashboardLastReading = document.getElementById('dashboard-sensor-last-reading');
    const dashboardGaps = document.getElementById('dashboard-sensor-gaps');
    const dashboardDeviceStatus = document.getElementById('dashboard-device-status');
    const dashboardDeviceDot = document.getElementById('dashboard-device-dot');
    const lastReading = summary.readings[summary.readings.length - 1];
    if (dashboardResponse) dashboardResponse.textContent = contact.textContent;
    if (dashboardCount) dashboardCount.textContent = String(summary.readings.length);
    if (dashboardSample) dashboardSample.textContent = sample.textContent;
    if (dashboardLastReading) {
      dashboardLastReading.textContent = lastReading
        ? this.formatTime(lastReading.timestamp)
        : this.translateText('No ESP32 history');
    }
    if (dashboardGaps) {
      dashboardGaps.textContent = summary.readings.length
        ? String(summary.gapCount)
        : this.translateText('No ESP32 history');
    }
    if (dashboardDeviceStatus) dashboardDeviceStatus.textContent = contact.textContent;
    if (dashboardDeviceDot) dashboardDeviceDot.className = `dashboard-device-dot ${status ? 'has-response' : 'no-response'}`;
  }

  drawMonitorGauge(value) {
    const canvas = document.getElementById('monitor-gauge');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const centerX = w / 2;
    const centerY = h * 0.58;
    const radius = Math.min(w * 0.38, h * 0.34);
    const lineWidth = 14;

    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    const segments = [
      { start: Math.PI * 0.75, end: Math.PI * 1.125, color: STATUS_COLORS.safe },
      { start: Math.PI * 1.125, end: Math.PI * 1.5, color: STATUS_COLORS.caution },
      { start: Math.PI * 1.5, end: Math.PI * 1.875, color: STATUS_COLORS.danger },
      { start: Math.PI * 1.875, end: Math.PI * 2.25, color: STATUS_COLORS.extreme }
    ];
    segments.forEach(seg => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, seg.start, seg.end);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineWidth * 0.45;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    const maxVal = 55;
    const angle = Math.PI * 0.75 + (Math.min(value, maxVal) / maxVal) * (Math.PI * 1.5);
    const status = this.getStatus(value);
    const color = getStatusColor(status);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 0.75, angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i <= 10; i++) {
      const tickAngle = Math.PI * 0.75 + (i / 10) * (Math.PI * 1.5);
      const isMajor = i % 5 === 0;
      const tickLen = isMajor ? 10 : 5;
      const tickR = radius - lineWidth / 2 - 6;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(tickAngle) * tickR, centerY + Math.sin(tickAngle) * tickR);
      ctx.lineTo(centerX + Math.cos(tickAngle) * (tickR - tickLen), centerY + Math.sin(tickAngle) * (tickR - tickLen));
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.stroke();
    }

    if (value > 0) {
      const needleLen = radius - 14;
      const nx = centerX + Math.cos(angle) * needleLen;
      const ny = centerY + Math.sin(angle) * needleLen;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labels = [
      { angle: Math.PI * 0.75, text: '0°' },
      { angle: Math.PI * 1.5, text: '27.5°' },
      { angle: Math.PI * 2.25, text: '55°' }
    ];
    labels.forEach(la => {
      const lr = radius + lineWidth / 2 + 16;
      ctx.fillText(la.text, centerX + Math.cos(la.angle) * lr, centerY + Math.sin(la.angle) * lr);
    });
  }

  getLatestReadingsByLocation() {
    const latestByLoc = new Map();
    this.readings.forEach(r => {
      const current = latestByLoc.get(r.location);
      if (!current || new Date(r.timestamp) > new Date(current.timestamp)) {
        latestByLoc.set(r.location, r);
      }
    });
    return latestByLoc;
  }

  renderDashboardLocationSummary(latestByLoc = this.getLatestReadingsByLocation()) {
    const locationSummary = document.getElementById('dashboard-location-summary');
    const mapSummary = document.getElementById('dashboard-map-summary');
    const savedLocationCount = latestByLoc.size;
    const mappedMarkerCount = LOCATIONS.filter(location => latestByLoc.has(location.name)).length;
    const mappedPinCount = LOCATIONS.length;
    const missingMappedCount = mappedPinCount - mappedMarkerCount;
    if (locationSummary) {
      locationSummary.textContent = `${savedLocationCount} ${this.translateText(savedLocationCount === 1
        ? 'location with a saved reading.'
        : 'locations with saved readings.')}`;
    }
    if (mapSummary) {
      mapSummary.textContent = mappedMarkerCount
        ? `${mappedMarkerCount} ${this.translateText(mappedMarkerCount === 1
          ? 'mapped pin has a saved reading, including demo data. Pins without readings remain unclassified.'
          : 'mapped pins have saved readings, including demo data. Pins without readings remain unclassified.')}`
        : this.translateText('No saved readings are available for any mapped pin yet.');
    }

    const coverageCount = document.getElementById('dashboard-coverage-count');
    const coverageTotal = document.getElementById('dashboard-coverage-total');
    const coverageMissing = document.getElementById('dashboard-coverage-missing');
    const coverageMeter = document.getElementById('dashboard-coverage-meter');
    const coverageFill = document.getElementById('dashboard-coverage-fill');
    if (coverageCount) coverageCount.textContent = String(mappedMarkerCount);
    if (coverageTotal) coverageTotal.textContent = String(mappedPinCount);
    if (coverageMissing) {
      coverageMissing.textContent = `${missingMappedCount} ${this.translateText(
        missingMappedCount === 1 ? 'map pin has no saved reading' : 'map pins have no saved readings'
      )}`;
    }
    if (coverageMeter) {
      coverageMeter.setAttribute('aria-valuemin', '0');
      coverageMeter.setAttribute('aria-valuemax', String(mappedPinCount));
      coverageMeter.setAttribute('aria-valuenow', String(mappedMarkerCount));
      coverageMeter.setAttribute(
        'aria-valuetext',
        `${mappedMarkerCount} / ${mappedPinCount} ${this.translateText('map pins with saved readings')}`
      );
    }
    if (coverageFill) {
      coverageFill.style.transform = `scaleX(${mappedPinCount ? mappedMarkerCount / mappedPinCount : 0})`;
    }

    const aboutPinCount = document.getElementById('about-map-pin-count');
    const dashboardMapSiteCount = document.getElementById('dashboard-map-site-count');
    if (aboutPinCount) aboutPinCount.textContent = String(mappedPinCount);
    if (dashboardMapSiteCount) {
      dashboardMapSiteCount.textContent = `${mappedPinCount} ${this.translateText('map pins')}`;
    }
  }

  updateDashboard() {
    const counts = { safe: 0, caution: 0, danger: 0, extreme: 0 };
    const latestByLoc = this.getLatestReadingsByLocation();
    latestByLoc.forEach(r => {
      if (!this.hasValidMeasurement(r)) return;
      const status = this.getStatus(Number(r.heatIndex));
      if (counts[status] !== undefined) counts[status]++;
    });
    this.renderDashboardLocationSummary(latestByLoc);

    Object.entries(counts).forEach(([status, count]) => {
      const el = document.getElementById('count-' + status);
      if (el) this.animateCounter(el, parseInt(el.textContent) || 0, count);
    });

    const latest = this.readings[0];
    const freshness = this.updateReadingFreshness();
    this.updateHeatGuidance(latest, freshness);
    const dashboardLastUpdate = document.getElementById('dashboard-last-update');
    const dashboardLatestLocation = document.getElementById('dashboard-latest-location');
    if (dashboardLastUpdate) dashboardLastUpdate.textContent = latest ? this.formatTime(latest.timestamp) : 'No reading recorded';
    if (dashboardLatestLocation) dashboardLatestLocation.textContent = latest ? latest.location : '—';
    if (latest && this.hasValidMeasurement(latest)) {
      const demoLabel = document.getElementById('latest-demo-label');
      if (demoLabel) {
        demoLabel.hidden = !latest.isDemo;
        demoLabel.textContent = latest.isDemo ? this.translateText('DEMO DATA') : '';
      }
      document.getElementById('gauge-value').textContent = latest.heatIndex.toFixed(1);
      document.getElementById('latest-location').textContent = latest.location;
      document.getElementById('latest-time').textContent = this.formatTime(latest.timestamp);
      document.getElementById('latest-temp').textContent = latest.temperature.toFixed(1) + '°C';
      document.getElementById('latest-humidity').textContent = latest.humidity.toFixed(1) + '%';
      document.getElementById('latest-hi').textContent = latest.heatIndex.toFixed(1) + '°C';
      const stEl = document.getElementById('latest-status');
      const status = this.getStatus(latest.heatIndex);
      stEl.textContent = STATUS_LABELS[status];
      stEl.className = 'status-pill ' + status;
      this.drawGauge(latest.heatIndex);
    } else {
      const demoLabel = document.getElementById('latest-demo-label');
      if (demoLabel) {
        demoLabel.hidden = !latest?.isDemo;
        demoLabel.textContent = latest?.isDemo ? this.translateText('DEMO DATA') : '';
      }
      document.getElementById('gauge-value').textContent = '—';
      document.getElementById('latest-location').textContent = '—';
      document.getElementById('latest-time').textContent = '—';
      document.getElementById('latest-temp').textContent = '—';
      document.getElementById('latest-humidity').textContent = '—';
      document.getElementById('latest-hi').textContent = '—';
      const stEl = document.getElementById('latest-status');
      stEl.textContent = 'No Data';
      stEl.className = 'status-pill nodata';
      this.drawGauge(0);
    }

    const activityList = document.getElementById('activity-list');
    if (activityList) {
      if (this.readings.length === 0) {
        activityList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
            <div class="empty-title">No readings yet</div>
            <div class="empty-desc">Add your first reading or tap Auto-Read to get started</div>
            <button class="btn-primary btn-sm" onclick="app.switchTab('monitor')" style="margin-top:12px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Reading
            </button>
          </div>`;
      } else {
        activityList.innerHTML = this.readings.slice(0, 5).map((r, i) => `
          <div class="activity-item" style="animation-delay:${Math.min(i*0.05,0.3)}s">
            <div class="activity-dot ${r.status}"></div>
            <div class="activity-info">
              <div class="activity-loc">${this.escapeHTML(r.location)}</div>
              <div class="activity-meta">${this.formatTime(r.timestamp)} • ${r.temperature.toFixed(1)}°C / ${r.humidity.toFixed(1)}%${r.isDemo ? ` • ${this.translateText('DEMO DATA')}` : ''}</div>
            </div>
            <div class="activity-hi ${r.status}">${r.heatIndex.toFixed(1)}°C</div>
          </div>
        `).join('');
      }
    }

    this.checkAlerts();
    this.updateRecentLocations();
    this.updateMonitorGauge();
    this.renderSensorTrust();
    this.scheduleDashboardForecastRender();
  }

  setupDashboardForecastObserver() {
    const card = document.querySelector('.forecast-preview-card');
    if (!card) return;
    if (typeof IntersectionObserver === 'undefined') {
      this.dashboardForecastVisibilityHandler = () => this.scheduleDashboardForecastRender();
      window.addEventListener('scroll', this.dashboardForecastVisibilityHandler, { passive: true });
      window.addEventListener('resize', this.dashboardForecastVisibilityHandler);
      return;
    }

    this.dashboardForecastObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.scheduleDashboardForecastRender();
    }, { rootMargin: '200px 0px' });
    this.dashboardForecastObserver.observe(card);
  }

  scheduleDashboardForecastRender() {
    if (this.currentTab !== 'dashboard' || this.dashboardForecastRenderScheduled) return;
    const card = document.querySelector('.forecast-preview-card');
    if (!card) return;
    const isNearViewport = () => {
      const rect = card.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.width > 0 && rect.bottom >= -200 && rect.top <= viewportHeight + 200;
    };
    if (!isNearViewport()) return;

    this.dashboardForecastRenderScheduled = true;
    const render = () => {
      this.dashboardForecastRenderScheduled = false;
      if (this.currentTab === 'dashboard' && isNearViewport()) {
        const renderPromise = this.renderDashboardForecast();
        if (renderPromise && typeof renderPromise.catch === 'function') {
          renderPromise.catch(error => {
            console.error('Could not render the dashboard forecast:', error);
            this.toast(`Forecast calculation failed: ${error.message}`, 'error');
          });
        }
      }
    };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(render, { timeout: 1500 });
    } else {
      window.setTimeout(render, 250);
    }
  }

  async renderDashboardForecast() {
    const empty = document.getElementById('dashboard-forecast-empty');
    const emptyTitle = document.getElementById('dashboard-forecast-empty-title');
    const emptyDetail = document.getElementById('dashboard-forecast-empty-detail');
    const content = document.getElementById('dashboard-forecast-content');
    const canvas = document.getElementById('dashboard-forecast-chart');
    const action = document.getElementById('dashboard-forecast-action');
    const actionLabel = document.getElementById('dashboard-forecast-action-label');
    if (!empty || !content || !canvas) return;
    const setAction = (label, tab) => {
      if (actionLabel) actionLabel.textContent = this.translateText(label);
      if (action) action.onclick = () => this.switchTab(tab);
    };

    const historyData = this.getMinuteForecastHistory();
    const current = historyData.history[historyData.history.length - 1];
    const now = Date.now();
    if (current) {
      const forecastAge = now - current.minute * 60000;
      if (!Number.isFinite(forecastAge) ||
        forecastAge > STALE_READING_AFTER_MS ||
        forecastAge < -2 * 60000 ||
        (current.minute + 30) * 60000 <= now) {
        empty.hidden = false;
        content.hidden = true;
        if (emptyTitle) emptyTitle.textContent = this.translateText('No recent sensor reading');
        if (emptyDetail) {
          emptyDetail.textContent = this.translateText('The last real reading is too old. Sync the sensor for a new forecast.');
        }
        setAction('Open Sensor Monitor', 'monitor');
        canvas.setAttribute('aria-label', 'A forecast is unavailable because there is no recent sensor reading.');
        return;
      }
    }

    const forecast = await this.buildForecastComparison(historyData);
    if (this.currentTab !== 'dashboard') return;
    const best = forecast ? this.getBestForecastModel(forecast) : null;
    if (!forecast || !best?.result || !Number.isFinite(best.result.value)) {
      empty.hidden = false;
      content.hidden = true;
      if (emptyTitle) emptyTitle.textContent = this.translateText('Forecast unavailable');
      if (emptyDetail) {
        emptyDetail.textContent = this.translateText('At least 12 complete same-location examples from non-demo readings are needed. No prediction is shown until the data supports one.');
      }
      setAction('View forecast details', 'forecast');
      canvas.setAttribute('aria-label', 'Forecast unavailable because there is not enough eligible data.');
      return;
    }

    empty.hidden = true;
    content.hidden = false;
    setAction('View forecast details', 'forecast');
    const status = best.result.status;
    const value = document.getElementById('dashboard-forecast-value');
    const statusElement = document.getElementById('dashboard-forecast-status');
    const model = document.getElementById('dashboard-forecast-model');
    const time = document.getElementById('dashboard-forecast-time');
    if (value) value.textContent = `${best.result.value.toFixed(1)}°C`;
    if (statusElement) {
      statusElement.textContent = STATUS_LABELS[status] || this.translateText('Unknown');
      statusElement.className = `status-pill ${status || 'nodata'}`;
    }
    if (model) {
      model.textContent = best.metric
        ? `${best.label} · MAE ${best.metric.mae.toFixed(1)}°C`
        : `${best.label} · no validation score`;
    }
    if (time) time.textContent = `For ${this.formatTime(forecast.date.toISOString())}`;

    this.drawDashboardForecast(forecast, best.result);
  }

  drawDashboardForecast(forecast, prediction) {
    const canvas = document.getElementById('dashboard-forecast-chart');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    if (!context || !rect.width || !rect.height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 14, right: 12, bottom: 24, left: 36 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const points = forecast.history.filter(point =>
      Number.isFinite(point.minute) && Number.isFinite(point.value));
    const chartLine = getDesignToken('--chart-line', '#17685e');
    const predictionColor = getDesignToken('--chart-prediction', '#a64f36');
    const chartGrid = getDesignToken('--chart-grid', 'rgba(28, 48, 44, 0.14)');
    const chartLabel = getDesignToken('--chart-label', '#53675f');
    const values = [...points.map(point => point.value), prediction.value];
    const minimum = Math.min(...values) - 1;
    const maximum = Math.max(...values) + 1;
    const valueRange = Math.max(maximum - minimum, 2);
    const firstMinute = forecast.current.minute - 30;
    const x = minute => padding.left + ((minute - firstMinute) / 60) * chartWidth;
    const y = value => padding.top + ((maximum - value) / valueRange) * chartHeight;

    context.clearRect(0, 0, width, height);
    context.font = '10px Inter, sans-serif';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    for (let index = 0; index <= 2; index++) {
      const value = maximum - (valueRange * index / 2);
      const lineY = y(value);
      context.strokeStyle = chartGrid;
      context.beginPath();
      context.moveTo(padding.left, lineY);
      context.lineTo(width - padding.right, lineY);
      context.stroke();
      context.fillStyle = chartLabel;
      context.fillText(`${value.toFixed(0)}°`, padding.left - 7, lineY);
    }

    const currentPoint = points[points.length - 1] || forecast.current;
    if (points.length) {
      context.beginPath();
      points.forEach((point, index) => {
        const pointX = x(point.minute);
        const pointY = y(point.value);
        if (index === 0) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      });
      context.strokeStyle = chartLine;
      context.lineWidth = 2.5;
      context.lineJoin = 'round';
      context.stroke();
    }

    context.beginPath();
    context.setLineDash([5, 4]);
    context.moveTo(x(currentPoint.minute), y(currentPoint.value));
    context.lineTo(x(forecast.current.minute + 30), y(prediction.value));
    context.strokeStyle = predictionColor;
    context.lineWidth = 2.5;
    context.stroke();
    context.setLineDash([]);

    [
      { minute: currentPoint.minute, value: currentPoint.value, color: chartLine },
      { minute: forecast.current.minute + 30, value: prediction.value, color: predictionColor }
    ].forEach(point => {
      context.beginPath();
      context.arc(x(point.minute), y(point.value), 3.5, 0, Math.PI * 2);
      context.fillStyle = point.color;
      context.fill();
    });

    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillStyle = chartLabel;
    context.fillText('−30 min', padding.left, height - 15);
    context.fillText('Now', x(forecast.current.minute), height - 15);
    context.fillText('+30 min', width - padding.right, height - 15);
    canvas.setAttribute(
      'aria-label',
      `Recorded Heat Index is ${forecast.current.value.toFixed(1)} degrees Celsius at ${forecast.location}; the forecast for ${this.formatTime(forecast.date.toISOString())} is ${prediction.value.toFixed(1)} degrees Celsius.`
    );
  }

  animateCounter(el, from, to) {
    if (from === to) return;
    const duration = 500;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  drawGauge(value) {
    const canvas = document.getElementById('gauge-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth || 240;
    const height = rect.height || canvas.clientHeight || 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);

    const size = Math.min(width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = size * 0.38;
    const lineWidth = size * 0.055;
    ctx.clearRect(0, 0, width, height);
    const maxVal = 50;
    const startAngle = Math.PI * 0.8;
    const sweep = Math.PI * 1.4;

    ctx.save();
    ctx.shadowColor = getDesignToken('--chart-glow', 'rgba(23, 104, 94, 0.28)');
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sweep);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    const segments = [
      { start: 0, end: 27, color: getStatusColor('safe') },
      { start: 27, end: 33, color: getStatusColor('caution') },
      { start: 33, end: 42, color: getStatusColor('danger') },
      { start: 42, end: maxVal, color: getStatusColor('extreme') }
    ];
    segments.forEach(seg => {
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle + (seg.start / maxVal) * sweep,
        startAngle + (seg.end / maxVal) * sweep
      );
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineWidth * 0.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    const angle = startAngle + (Math.min(value, maxVal) / maxVal) * sweep;
    const status = this.getStatus(value);
    const color = getStatusColor(status);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    if (value > 0) {
      const needleLen = radius - 6;
      const nx = centerX + Math.cos(angle) * needleLen;
      const ny = centerY + Math.sin(angle) * needleLen;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
  }

  renderHistory(updateCharts = true) {
    const list = document.getElementById('history-list');
    if (!list || this.currentTab !== 'history') return;
    if (this.historyFilterTimer) {
      window.clearTimeout(this.historyFilterTimer);
      this.historyFilterTimer = null;
    }
    const search = document.getElementById('history-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('history-filter')?.value || 'all';
    const hasFilters = Boolean(search) || filter !== 'all';
    const matches = [];
    if (hasFilters) {
      this.readings.forEach((reading, index) => {
        const location = String(reading.location || '').toLowerCase();
        const status = String(reading.status || '').toLowerCase();
        if (search && !location.includes(search) && !status.includes(search)) return;
        if (filter !== 'all' && reading.status !== filter) return;
        matches.push({ reading, index });
      });
    }

    const total = hasFilters ? matches.length : this.readings.length;
    const pageCount = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
    this.historyPage = Math.max(0, Math.min(this.historyPage, pageCount - 1));
    const start = this.historyPage * HISTORY_PAGE_SIZE;
    const visible = hasFilters
      ? matches.slice(start, start + HISTORY_PAGE_SIZE)
      : this.readings.slice(start, start + HISTORY_PAGE_SIZE)
        .map((reading, offset) => ({ reading, index: start + offset }));

    if (total === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="empty-title">No readings match</div>
          <div class="empty-desc">Try adjusting your search or filters</div>
        </div>`;
    } else {
      const pagination = pageCount > 1
        ? `<nav class="history-pagination" aria-label="${this.translateText('Reading history pages')}">
            <button class="btn-secondary" type="button" data-history-page="-1" aria-label="${this.translateText('Previous page')}" ${this.historyPage === 0 ? 'disabled' : ''}>‹</button>
            <span aria-live="polite">${this.historyPage + 1} / ${pageCount}</span>
            <button class="btn-secondary" type="button" data-history-page="1" aria-label="${this.translateText('Next page')}" ${this.historyPage === pageCount - 1 ? 'disabled' : ''}>›</button>
          </nav>`
        : '';
      list.innerHTML = `${visible.map(({ reading: r, index }, i) => `
        <div class="history-item" style="animation-delay:${Math.min(i*0.03,0.4)}s">
          <div class="history-pin ${r.status}">${r.heatIndex.toFixed(0)}</div>
          <div class="history-info">
            <div class="history-loc">${this.escapeHTML(r.location)}</div>
            <div class="history-datetime">
              <span class="history-date">${this.formatDate(r.timestamp)}</span>
              <span class="history-time"><span>Saved at</span> ${this.formatClockTime(r.timestamp)} <small>local time</small></span>
            </div>
            <div class="history-meta">
              <span>${r.temperature.toFixed(1)}°C</span>
              <span>${r.humidity.toFixed(1)}%</span>
              ${r.isDemo ? `<span class="history-source">${this.translateText('DEMO DATA')}</span>` : ''}
              ${r.quality ? `<span class="quality-badge ${r.qualityClass}">Data quality: ${r.quality}</span>` : ''}
            </div>
          </div>
          <div class="history-result">
            <div class="history-hi ${r.status}">${r.heatIndex.toFixed(1)}°C</div>
            <div class="history-status ${r.status}">${STATUS_LABELS[r.status] || 'Unknown'}</div>
          </div>
          <button class="history-delete-button" type="button" data-delete-reading-index="${index}" aria-label="Delete reading from ${this.escapeHTML(r.location)} on ${this.formatTime(r.timestamp)}" title="Delete this reading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
          </button>
        </div>
      `).join('')}${pagination}`;
    }

    if (updateCharts) {
      this.drawDistributionChart();
      if (this.currentTab === 'history') {
        this.trendActiveIndex = null;
        this.drawTrendChart();
      }
    }
  }

  getLocalDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const pad = number => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  async askKnowledgeAssistant() {
    const input = document.getElementById('knowledge-question');
    const output = document.getElementById('knowledge-answer');
    if (!input || !output) return;
    try {
      output.textContent = await this.answerKnowledgeQuestion(input.value);
    } catch (error) {
      console.error('Could not answer the SchoolHeat question:', error);
      output.textContent = `SchoolHeat could not complete this answer: ${error.message}`;
    }
  }

  async answerKnowledgeQuestion(question) {
    const query = String(question || '').trim().toLowerCase();
    if (!query) return 'Enter a question about stored readings or SchoolHeat.';

    const knownLocations = [...LOCATIONS.map(location => location.name), ...STUDY_CLASSROOMS];
    const location = knownLocations.find(name => query.includes(name.toLowerCase()));
    const readings = this.readings
      .filter(reading =>
        !reading.isDemo &&
        typeof reading.location === 'string' &&
        reading.location.trim() &&
        Number.isFinite(Date.parse(reading.timestamp)) &&
        this.hasValidMeasurement(reading)
      )
      .filter(reading => !String(reading.id).startsWith('demo-'))
      .slice()
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const currentDate = new Date();
    const today = this.getLocalDateKey(currentDate);
    const yesterdayDate = new Date(currentDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = this.getLocalDateKey(yesterdayDate);
    const period = query.includes('yesterday') ? yesterday : query.includes('today') ? today : '';
    const scoped = readings.filter(reading =>
      (!location || reading.location === location) &&
      (!period || this.getLocalDateKey(reading.timestamp) === period)
    );

    if (query.includes('difference') &&
        (query.includes('temperature') && (query.includes('heat index') || query.includes('heat-index')))) {
      return 'Air temperature is the measured air condition. Heat Index is calculated from air temperature and relative humidity to estimate how hot conditions feel; it is not an independent sensor measurement.';
    }

    if (query.includes('no data') || query.includes('missing data') || query.includes('why') && query.includes('location')) {
      if (!location) return 'Name a mapped location so SchoolHeat can check whether this browser has a stored reading for it.';
      const actual = readings.filter(reading => reading.location === location);
      if (actual.length) {
        const latest = actual[0];
        return `${location} has ${actual.length} stored non-demo reading(s). The latest is ${this.formatTime(latest.timestamp)}. The map shows NO DATA only when no saved record is available for that site; it does not copy readings from another location.`;
      }
      const demos = this.readings.filter(reading => reading.location === location && reading.isDemo).length;
      return demos
        ? `${location} has demo records, but no eligible non-demo measurement in this browser. Demo values are excluded from this answer.`
        : `No non-demo measurement for ${location} is stored in this browser. SchoolHeat does not estimate or copy a reading for that site.`;
    }

    if (query.includes('sensor') && (query.includes('reliable') || query.includes('reliability') || query.includes('quality'))) {
      const summary = this.getSensorTrustSummary();
      const device = this.lastDeviceStatus;
      const latest = summary.readings[summary.readings.length - 1];
      const recordSummary = `${summary.readings.length} saved ESP32 reading(s)` +
        (summary.medianInterval === null ? '' : `; median interval ${Math.round(summary.medianInterval / 60000)} minutes`) +
        `; ${summary.gapCount} gap(s) over 7.5 minutes`;
      const contactSummary = device
        ? `Last device response was via ${device.transport} at ${this.formatTime(new Date(device.checkedAt).toISOString())}; the connection may since have ended.`
        : 'No device response has been checked in this app session.';
      const sampleSummary = device?.sensorErrors
        ? `The device reported ${device.sensorErrors} DHT22 read error(s) since reboot.`
        : 'No device-reported DHT22 errors are available in this session.';
      const latestSummary = latest ? ` Latest saved ESP32 record: ${this.formatTime(latest.timestamp)}.` : '';
      return `${recordSummary}. ${contactSummary} ${sampleSummary}${latestSummary} These records do not establish measurement accuracy or calibration, so SchoolHeat does not assign a reliability percentage.`;
    }

    if (query.includes('forecast') || query.includes('prediction')) {
      const result = await this.buildForecastComparison();
      if (!result) {
        return 'No forecast is available. The existing model needs at least 12 complete same-location, non-demo 30-minute examples; gaps can extend the collection period.';
      }
      const best = this.getBestForecastModel(result);
      const metric = best.metric;
      const generatedAt = result.generatedAt ? this.formatTime(result.generatedAt.toISOString()) : 'not recorded';
      const estimate = `${best.label} predicts ${best.result.value.toFixed(1)}°C Heat Index at ${this.formatTime(result.date.toISOString())} for ${result.location}.`;
      const evaluation = metric
        ? `Walk-forward evaluation used ${metric.samples} holdout sample(s) from ${this.formatTime(metric.evaluationStart.toISOString())} to ${this.formatTime(metric.evaluationEnd.toISOString())}; MAE was ${metric.mae.toFixed(2)}°C.`
        : 'There are not yet enough holdout samples to report validated model performance; this selection is provisional.';
      return `${estimate} Forecast generated ${generatedAt}. ${evaluation} This is a prediction, not a measured value or official safety decision.`;
    }

    if (query.includes('compare') && (query.includes('today') || query.includes('yesterday'))) {
      const comparisonLocation = location || readings[0]?.location;
      if (!comparisonLocation) return 'No eligible stored readings are available for comparison.';
      const average = dateKey => {
        const values = readings.filter(reading =>
          reading.location === comparisonLocation &&
          this.getLocalDateKey(reading.timestamp) === dateKey
        );
        return values.length
          ? { count: values.length, value: values.reduce((sum, reading) => sum + Number(reading.heatIndex), 0) / values.length }
          : null;
      };
      const todayAverage = average(today);
      const yesterdayAverage = average(yesterday);
      if (!todayAverage || !yesterdayAverage) {
        return `A same-location comparison is unavailable for ${comparisonLocation}; both today and yesterday need stored non-demo readings.`;
      }
      const difference = todayAverage.value - yesterdayAverage.value;
      const direction = difference > 0 ? 'higher' : difference < 0 ? 'lower' : 'the same';
      return `${comparisonLocation}: today's average Heat Index was ${todayAverage.value.toFixed(1)}°C from ${todayAverage.count} reading(s); yesterday's was ${yesterdayAverage.value.toFixed(1)}°C from ${yesterdayAverage.count}. Today is ${Math.abs(difference).toFixed(1)}°C ${direction}.`;
    }

    if (query.includes('humidity') && (query.includes('change') || query.includes('throughout') || query.includes('trend'))) {
      const targetLocation = location || readings[0]?.location;
      const targetDate = period || this.getLocalDateKey(readings[0]?.timestamp);
      const humidityReadings = readings
        .filter(reading =>
          reading.location === targetLocation &&
          (!targetDate || this.getLocalDateKey(reading.timestamp) === targetDate)
        )
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      if (humidityReadings.length < 2) {
        return `Humidity change is unavailable${targetLocation ? ` for ${targetLocation}` : ''}${targetDate ? ` on ${targetDate}` : ''}; at least two stored readings are needed.`;
      }
      const first = humidityReadings[0];
      const last = humidityReadings[humidityReadings.length - 1];
      const difference = Number(last.humidity) - Number(first.humidity);
      const direction = difference > 0 ? 'increased' : difference < 0 ? 'decreased' : 'did not change';
      return `${targetLocation}, ${this.formatDate(first.timestamp)}: relative humidity ${direction} by ${Math.abs(difference).toFixed(1)} percentage points, from ${Number(first.humidity).toFixed(1)}% at ${this.formatClockTime(first.timestamp)} to ${Number(last.humidity).toFixed(1)}% at ${this.formatClockTime(last.timestamp)} across ${humidityReadings.length} stored readings.`;
    }

    if (query.includes('how many') || query.includes('count') || query.includes('number of') || query.includes('valid reading')) {
      return `${scoped.length} stored non-demo reading(s) match${location ? ` for ${location}` : ''}${period ? ` on ${period}` : ''}. These are records with a valid timestamp, temperature, humidity, and stored Heat Index; imported or manually entered measurements are not independently verified.`;
    }

    if ((query.includes('highest') || query.includes('maximum') || query.includes('peak')) &&
        (query.includes('temperature') || query.includes('humidity') || query.includes('heat') || query.includes('index'))) {
      if (!scoped.length) return `No eligible non-demo readings match${location ? ` for ${location}` : ''}${period ? ` on ${period}` : ''}.`;
      const field = query.includes('temperature') && !query.includes('heat index')
        ? 'temperature'
        : query.includes('humidity') && !query.includes('heat') && !query.includes('index')
          ? 'humidity'
          : 'heatIndex';
      const peak = scoped.reduce((best, reading) =>
        Number(reading[field]) > Number(best[field]) ? reading : best
      );
      const label = field === 'temperature' ? 'Temperature' : field === 'humidity' ? 'Relative humidity' : 'Heat Index';
      const unit = field === 'temperature' || field === 'heatIndex' ? '°C' : '%';
      return `Highest ${label}${period ? ` ${query.includes('yesterday') ? 'yesterday' : 'today'}` : ''}: ${Number(peak[field]).toFixed(1)}${unit} at ${peak.location}, ${this.formatTime(peak.timestamp)} (${scoped.length} eligible reading(s) checked).`;
    }

    if (query.includes('current') || query.includes('classification') || query.includes('heat level')) {
      const latest = location ? scoped[0] : readings[0];
      if (!latest) return 'No eligible non-demo reading is available to determine a heat classification.';
      const freshness = this.getReadingFreshness(latest);
      const status = this.getStatus(Number(latest.heatIndex));
      return `The latest saved non-demo Heat Index for ${latest.location} was ${Number(latest.heatIndex).toFixed(1)}°C (${STATUS_LABELS[status]}) at ${this.formatTime(latest.timestamp)}. ${freshness.state === 'recent' ? 'Its timestamp is recent, but that alone does not confirm the sensor is connected now.' : `It is ${freshness.label.toLowerCase()}, so treat it as historical rather than current.`}`;
    }

    return 'I can answer about the highest reading today, humidity changes, valid-reading counts, today/yesterday comparisons, forecasts, sensor data quality, missing campus locations, and the difference between temperature and Heat Index. Try one of those questions.';
  }

  filterHistory() {
    this.historyPage = 0;
    if (this.historyFilterTimer) window.clearTimeout(this.historyFilterTimer);
    this.historyFilterTimer = window.setTimeout(() => {
      this.historyFilterTimer = null;
      this.renderHistory(false);
    }, 120);
  }

  deleteReading(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.readings.length) return;
    const reading = this.readings[index];
    const label = `${reading.location} — ${this.formatTime(reading.timestamp)}`;
    if (!confirm(`Delete this reading?\n\n${label}\n\nThis cannot be undone.`)) return;

    const previousReadings = this.readings;
    const previousObservedId = this.lastObservedReadingId;
    this.readings = this.readings.filter((_, readingIndex) => readingIndex !== index);
    try {
      this.saveReadings();
    } catch (error) {
      this.readings = previousReadings;
      this.lastObservedReadingId = previousObservedId;
      console.error('Could not delete the SchoolHeat reading:', error);
      this.toast(`Could not delete this reading: ${error.message}`, 'error');
      return;
    }

    this.lastObservedReadingId = this.readings[0]?.id ?? null;
    this.forecastComparisonCache = null;
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    if (this.currentTab === 'forecast') this.drawForecastChart();
    this.toast('Reading deleted.', 'success');
  }

  setupTrendObserver() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !this.trendChartLoaded) {
          this.trendChartLoaded = true;
          this.drawTrendChart();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(canvas);
  }

  drawTrendChart() {
    const canvas = document.getElementById('trend-chart');
    const tooltip = document.getElementById('trend-tooltip');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chartLine = getDesignToken('--chart-line', '#17685e');
    const chartGlow = getDesignToken('--chart-glow', 'rgba(23, 104, 94, 0.28)');
    const chartFillTop = getDesignToken('--chart-fill-top', 'rgba(23, 104, 94, 0.17)');
    const chartFillBottom = getDesignToken('--chart-fill-bottom', 'rgba(23, 104, 94, 0)');
    const chartGrid = getDesignToken('--chart-grid', 'rgba(28, 48, 44, 0.14)');
    const chartLabel = getDesignToken('--chart-label', '#53675f');
    const statusColors = {
      safe: getStatusColor('safe'),
      caution: getStatusColor('caution'),
      danger: getStatusColor('danger'),
      extreme: getStatusColor('extreme')
    };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 32, right: 20, bottom: 40, left: 48 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    if (this.readings.length < 2) {
      ctx.fillStyle = chartLabel;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add at least 2 readings to see the trend', w/2, h/2);
      return;
    }

    const byDate = new Map();
    for (const reading of this.readings) {
      const dateKey = this.getLocalDateKey(reading.timestamp);
      if (!dateKey) continue;
      if (!byDate.has(dateKey) && byDate.size === 10) break;
      const aggregate = byDate.get(dateKey) || { sum: 0, count: 0 };
      aggregate.sum += reading.heatIndex;
      aggregate.count++;
      byDate.set(dateKey, aggregate);
    }
    const dates = Array.from(byDate.keys()).reverse();
    const labels = dates.map(dateKey => {
      const [year, month, day] = dateKey.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = dates.map(dateKey => {
      const aggregate = byDate.get(dateKey);
      return aggregate.sum / aggregate.count;
    });

    let maxVal = Math.max(...data, 45);
    let minVal = Math.min(...data, 20);
    const range = maxVal - minVal;
    const step = range <= 10 ? 2 : range <= 20 ? 5 : 10;
    maxVal = Math.ceil(maxVal / step) * step;
    minVal = Math.floor(minVal / step) * step;
    const niceRange = maxVal - minVal || 1;

    ctx.strokeStyle = chartGrid;
    ctx.lineWidth = 1;
    const gridCount = Math.round(niceRange / step);
    for (let i = 0; i <= gridCount; i++) {
      const val = maxVal - (step * i);
      const y = pad.top + (chartH / gridCount) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = chartLabel;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(0) + '°', pad.left - 8, y);
    }

    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.strokeStyle = chartGrid;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    labels.forEach((label, i) => {
      const x = pad.left + (chartW / (labels.length - 1)) * i;
      ctx.fillStyle = chartLabel;
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(label, x, pad.top + chartH + 10);
    });

    const points = data.map((val, i) => ({
      x: pad.left + (chartW / (labels.length - 1)) * i,
      y: pad.top + chartH - ((val - minVal) / niceRange) * chartH,
      val,
      status: this.getStatus(val),
      label: labels[i]
    }));

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, chartFillTop);
    grad.addColorStop(1, chartFillBottom);

    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    ctx.shadowColor = chartGlow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
    }
    ctx.strokeStyle = chartLine;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    const activePoint = Number.isInteger(this.trendActiveIndex)
      ? points[this.trendActiveIndex]
      : null;
    if (activePoint) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(activePoint.x, pad.top);
      ctx.lineTo(activePoint.x, pad.top + chartH);
      ctx.strokeStyle = chartLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    points.forEach((p, index) => {
      const color = statusColors[p.status];
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, index === this.trendActiveIndex ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, index === this.trendActiveIndex ? 12 : 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.12;
      ctx.fill();
      ctx.restore();
    });

    if (tooltip && activePoint) {
      tooltip.innerHTML = `<div class="tt-date">${activePoint.label} average</div><div class="tt-val ${activePoint.status}">${activePoint.val.toFixed(1)}°C — ${STATUS_LABELS[activePoint.status]}</div>`;
      tooltip.style.left = `${Math.max(4, Math.min(w - tooltip.offsetWidth - 4, activePoint.x - tooltip.offsetWidth / 2))}px`;
      tooltip.style.top = `${Math.max(4, activePoint.y - 58)}px`;
      tooltip.classList.add('visible');
    } else if (tooltip) {
      tooltip.classList.remove('visible');
    }

    const selectPoint = clientX => {
      const bounds = canvas.getBoundingClientRect();
      const x = clientX - bounds.left;
      if (x < points[0].x - 12 || x > points[points.length - 1].x + 12) return;
      let closestIndex = 0;
      points.forEach((point, index) => {
        if (Math.abs(point.x - x) < Math.abs(points[closestIndex].x - x)) closestIndex = index;
      });
      if (closestIndex !== this.trendActiveIndex) {
        this.trendActiveIndex = closestIndex;
        this.drawTrendChart();
      }
    };
    canvas.onpointermove = event => selectPoint(event.clientX);
    canvas.onpointerdown = event => {
      selectPoint(event.clientX);
      if (event.pointerType === 'mouse') canvas.focus();
    };
    canvas.onpointerleave = event => {
      if (event.pointerType === 'touch') return;
      if (this.trendActiveIndex !== null) {
        this.trendActiveIndex = null;
        this.drawTrendChart();
      }
    };
    canvas.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Escape') {
        this.trendActiveIndex = null;
      } else if (event.key === 'Home') {
        this.trendActiveIndex = 0;
      } else if (event.key === 'End') {
        this.trendActiveIndex = points.length - 1;
      } else {
        const currentIndex = Number.isInteger(this.trendActiveIndex) ? this.trendActiveIndex : 0;
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        this.trendActiveIndex = Math.max(0, Math.min(points.length - 1, currentIndex + direction));
      }
      this.drawTrendChart();
    };
  }

  setupDistributionObserver() {
    const canvas = document.getElementById('distribution-chart');
    if (!canvas) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !this.distributionChartLoaded) {
          this.distributionChartLoaded = true;
          this.drawDistributionChart();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(canvas);
  }

  drawDistributionChart() {
    const canvas = document.getElementById('distribution-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const statusColors = {
      safe: getStatusColor('safe'),
      caution: getStatusColor('caution'),
      danger: getStatusColor('danger'),
      extreme: getStatusColor('extreme')
    };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const isCompact = w < 520;
    const centerX = isCompact ? w / 2 : w * 0.32;
    const centerY = h / 2;
    const radius = Math.min(w, h) * (isCompact ? 0.32 : 0.26);
    const thickness = isCompact ? 18 : 16;

    ctx.clearRect(0, 0, w, h);

    const counts = { safe: 0, caution: 0, danger: 0, extreme: 0 };
    this.readings.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    if (total === 0) {
      ctx.fillStyle = getDesignToken('--chart-label', '#53675f');
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', centerX, centerY);
      return;
    }

    let startAngle = -Math.PI / 2;
    const statuses = ['safe', 'caution', 'danger', 'extreme'];
    statuses.forEach(status => {
      const count = counts[status];
      if (count === 0) return;
      const slice = (count / total) * Math.PI * 2;
      const endAngle = startAngle + slice;
      const color = statusColors[status];

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      startAngle = endAngle;
    });

    ctx.fillStyle = getDesignToken('--text-primary', '#1c302c');
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 5);
    ctx.fillStyle = getDesignToken('--chart-label', '#53675f');
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Readings', centerX, centerY + 10);

    const legendEl = document.getElementById('distribution-legend');
    if (legendEl) {
      legendEl.innerHTML = statuses.map(s => {
        const pct = total > 0 ? Math.round((counts[s] / total) * 100) : 0;
        return `
          <div class="dist-legend-item">
            <span style="background:${statusColors[s]}"></span>
            <span>${STATUS_LABELS[s]}</span>
            <span class="dist-count">${counts[s]} (${pct}%)</span>
          </div>
        `;
      }).join('');
    }
  }

  getMinuteForecastHistory() {
    const latest = this.readings.reduce((current, reading) => {
      if (reading.isDemo) return current;
      const timestamp = new Date(reading.timestamp).getTime();
      return Number.isFinite(timestamp) && (!current || timestamp > current.timestamp)
        ? { location: reading.location, timestamp }
        : current;
    }, null);
    if (!latest) return { location: null, history: [], byMinute: new Map() };

    const cutoff = latest.timestamp - 7 * 24 * 60 * 60 * 1000;
    const buckets = new Map();
    this.readings.forEach(reading => {
      if (reading.isDemo) return;
      const timestamp = new Date(reading.timestamp).getTime();
      const heatIndex = Number(reading.heatIndex);
      if (reading.location !== latest.location || (timestamp < cutoff && !reading.sourceFile) ||
          !Number.isFinite(timestamp) || !Number.isFinite(heatIndex)) return;
      const minute = Math.floor(timestamp / 60000);
      const bucket = buckets.get(minute) || { total: 0, count: 0 };
      bucket.total += heatIndex;
      bucket.count += 1;
      buckets.set(minute, bucket);
    });

    const history = [...buckets.entries()]
      .map(([minute, bucket]) => ({ minute, date: new Date(minute * 60000), value: bucket.total / bucket.count }))
      .sort((a, b) => a.minute - b.minute);
    return { location: latest.location, history, byMinute: new Map(history.map(point => [point.minute, point.value])) };
  }

  getForecastValueAtMinute(history, minute) {
    let closest = null;
    let closestDistance = 3;
    for (let offset = -2; offset <= 2; offset++) {
      const value = history.get(minute + offset);
      const distance = Math.abs(offset);
      if (Number.isFinite(value) && distance < closestDistance) {
        closest = value;
        closestDistance = distance;
      }
    }
    return closest;
  }

  getForecastValueAtOrBeforeMinute(history, minute) {
    for (let offset = 0; offset <= 2; offset++) {
      const value = history.get(minute - offset);
      if (Number.isFinite(value)) return value;
    }
    return null;
  }

  getForecastFeatures(history, minute) {
    const current = this.getForecastValueAtOrBeforeMinute(history, minute);
    const lag5 = this.getForecastValueAtOrBeforeMinute(history, minute - 5);
    const lag15 = this.getForecastValueAtOrBeforeMinute(history, minute - 15);
    const lag30 = this.getForecastValueAtOrBeforeMinute(history, minute - 30);
    if ([current, lag5, lag15, lag30].some(value => !Number.isFinite(value))) return null;
    const date = new Date(minute * 60000);
    const minuteOfDay = (date.getHours() * 60 + date.getMinutes()) / 1440 * Math.PI * 2;
    return [
      (current - 30) / 10,
      (lag5 - 30) / 10,
      (lag15 - 30) / 10,
      (lag30 - 30) / 10,
      (current - lag15) / 10,
      Math.sin(minuteOfDay),
      Math.cos(minuteOfDay)
    ];
  }

  getExtendedMlrFeatures(features) {
    return [features[0], features[3], features[4], features[5], features[6]];
  }

  solveLinearSystem(matrix, vector) {
    const size = vector.length;
    const augmented = matrix.map((row, i) => [...row, vector[i]]);
    for (let col = 0; col < size; col++) {
      let pivot = col;
      for (let row = col + 1; row < size; row++) {
        if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) pivot = row;
      }
      if (Math.abs(augmented[pivot][col]) < 1e-10) continue;
      [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];
      const divisor = augmented[col][col];
      for (let j = col; j <= size; j++) augmented[col][j] /= divisor;
      for (let row = 0; row < size; row++) {
        if (row === col) continue;
        const factor = augmented[row][col];
        for (let j = col; j <= size; j++) augmented[row][j] -= factor * augmented[col][j];
      }
    }
    return augmented.map(row => Number.isFinite(row[size]) ? row[size] : 0);
  }

  trainExtendedMlr(features, targets) {
    const width = features[0].length;
    const means = Array.from({ length: width }, (_, col) =>
      features.reduce((sum, row) => sum + row[col], 0) / features.length
    );
    const scales = Array.from({ length: width }, (_, col) => {
      const variance = features.reduce((sum, row) => sum + (row[col] - means[col]) ** 2, 0) / features.length;
      return Math.sqrt(variance) || 1;
    });
    const normalized = features.map(row => [1, ...row.map((value, col) => (value - means[col]) / scales[col])]);
    const matrix = Array.from({ length: width + 1 }, () => Array(width + 1).fill(0));
    const vector = Array(width + 1).fill(0);
    normalized.forEach((row, index) => {
      row.forEach((value, i) => {
        vector[i] += value * targets[index];
        row.forEach((other, j) => { matrix[i][j] += value * other; });
      });
    });
    for (let i = 1; i <= width; i++) matrix[i][i] += 1;
    const coefficients = this.solveLinearSystem(matrix, vector);
    return row => {
      const normalizedRow = [1, ...row.map((value, col) => (value - means[col]) / scales[col])];
      return normalizedRow.reduce((sum, value, i) => sum + value * coefficients[i], 0);
    };
  }

  makeRegressionTree(features, targets, depth, maxDepth, minLeaf, randomFeatureCount, random) {
    const mean = targets.reduce((sum, value) => sum + value, 0) / targets.length;
    const leaf = { value: mean };
    if (depth >= maxDepth || targets.length < minLeaf * 2) return leaf;
    const featureIndices = Array.from({ length: features[0].length }, (_, index) => index);
    for (let i = featureIndices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [featureIndices[i], featureIndices[j]] = [featureIndices[j], featureIndices[i]];
    }
    let best = null;
    featureIndices.slice(0, randomFeatureCount).forEach(feature => {
      const values = [...new Set(features.map(row => row[feature]))].sort((a, b) => a - b);
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const left = [], right = [];
        features.forEach((row, index) => (row[feature] <= threshold ? left : right).push(index));
        if (left.length < minLeaf || right.length < minLeaf) continue;
        const sumSquares = indices => {
          const avg = indices.reduce((sum, index) => sum + targets[index], 0) / indices.length;
          return indices.reduce((sum, index) => sum + (targets[index] - avg) ** 2, 0);
        };
        const score = sumSquares(left) + sumSquares(right);
        if (!best || score < best.score) best = { feature, threshold, left, right, score };
      }
    });
    if (!best) return leaf;
    const child = indices => this.makeRegressionTree(
      indices.map(index => features[index]),
      indices.map(index => targets[index]),
      depth + 1, maxDepth, minLeaf, randomFeatureCount, random
    );
    return {
      feature: best.feature,
      threshold: best.threshold,
      left: child(best.left),
      right: child(best.right)
    };
  }

  predictRegressionTree(tree, features) {
    if (tree.value !== undefined) return tree.value;
    return this.predictRegressionTree(
      features[tree.feature] <= tree.threshold ? tree.left : tree.right,
      features
    );
  }

  createSeededRandom(seed) {
    let state = seed >>> 0 || 1;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  trainRandomForest(features, targets, seed) {
    const random = this.createSeededRandom(seed);
    const featureCount = Math.max(1, Math.ceil(Math.sqrt(features[0].length)));
    const trees = Array.from({ length: 32 }, () => {
      const sampleFeatures = [], sampleTargets = [];
      for (let i = 0; i < features.length; i++) {
        const index = Math.floor(random() * features.length);
        sampleFeatures.push(features[index]);
        sampleTargets.push(targets[index]);
      }
      return this.makeRegressionTree(sampleFeatures, sampleTargets, 0, 3, 2, featureCount, random);
    });
    return row => trees.reduce((sum, tree) => sum + this.predictRegressionTree(tree, row), 0) / trees.length;
  }

  trainGradientBoostedTrees(features, targets) {
    const lambda = 1;
    const learningRate = 0.12;
    const base = targets.reduce((sum, value) => sum + value, 0) / targets.length;
    const trees = [];
    let predictions = targets.map(() => base);
    for (let round = 0; round < 24; round++) {
      const gradients = predictions.map((value, index) => value - targets[index]);
      const tree = this.makeGradientBoostTree(features, gradients, 0, 2, lambda);
      trees.push(tree);
      predictions = predictions.map((value, index) => value + learningRate * this.predictRegressionTree(tree, features[index]));
    }
    return row => trees.reduce((sum, tree) => sum + learningRate * this.predictRegressionTree(tree, row), base);
  }

  trainLeafwiseGradientBoostedTrees(features, targets) {
    const lambda = 1;
    const learningRate = 0.08;
    const base = targets.reduce((sum, value) => sum + value, 0) / targets.length;
    const trees = [];
    let predictions = targets.map(() => base);
    for (let round = 0; round < 16; round++) {
      const gradients = predictions.map((value, index) => value - targets[index]);
      const tree = this.makeLeafwiseGradientTree(features, gradients, 6, lambda);
      trees.push(tree);
      predictions = predictions.map((value, index) =>
        value + learningRate * this.predictRegressionTree(tree, features[index]));
    }
    return row => trees.reduce((sum, tree) => sum + learningRate * this.predictRegressionTree(tree, row), base);
  }

  makeLeafwiseGradientTree(features, gradients, maxLeaves, lambda) {
    const indices = Array.from({ length: gradients.length }, (_, index) => index);
    const makeLeaf = leafIndices => ({
      indices: leafIndices,
      node: { value: -leafIndices.reduce((sum, index) => sum + gradients[index], 0) / (leafIndices.length + lambda) }
    });
    const rootLeaf = makeLeaf(indices);
    const leaves = [rootLeaf];

    while (leaves.length < maxLeaves) {
      let best = null;
      leaves.forEach(leaf => {
        const sumGradient = leaf.indices.reduce((sum, index) => sum + gradients[index], 0);
        const parentScore = sumGradient ** 2 / (leaf.indices.length + lambda);
        for (let feature = 0; feature < features[0].length; feature++) {
          const values = [...new Set(leaf.indices.map(index => features[index][feature]))].sort((a, b) => a - b);
          const splitCount = Math.min(24, values.length - 1);
          for (let split = 0; split < splitCount; split++) {
            const valueIndex = Math.floor((split + 1) * values.length / (splitCount + 1));
            const threshold = (values[valueIndex - 1] + values[valueIndex]) / 2;
            const left = [], right = [];
            leaf.indices.forEach(index => (features[index][feature] <= threshold ? left : right).push(index));
            if (left.length < 2 || right.length < 2) continue;
            const sumLeft = left.reduce((sum, index) => sum + gradients[index], 0);
            const sumRight = right.reduce((sum, index) => sum + gradients[index], 0);
            const gain = sumLeft ** 2 / (left.length + lambda) +
              sumRight ** 2 / (right.length + lambda) - parentScore;
            if (!best || gain > best.gain) best = { leaf, feature, threshold, left, right, gain };
          }
        }
      });

      if (!best || best.gain <= 0) break;
      const node = best.leaf.node;
      node.feature = best.feature;
      node.threshold = best.threshold;
      node.left = makeLeaf(best.left).node;
      node.right = makeLeaf(best.right).node;
      delete node.value;
      leaves.splice(leaves.indexOf(best.leaf), 1);
      leaves.push(
        { indices: best.left, node: node.left },
        { indices: best.right, node: node.right }
      );
    }
    return rootLeaf.node;
  }

  trainLinearSupportVectorRegression(features, targets) {
    const width = features[0].length;
    const means = Array.from({ length: width }, (_, col) =>
      features.reduce((sum, row) => sum + row[col], 0) / features.length);
    const scales = Array.from({ length: width }, (_, col) => {
      const variance = features.reduce((sum, row) => sum + (row[col] - means[col]) ** 2, 0) / features.length;
      return Math.sqrt(variance) || 1;
    });
    const normalized = features.map(row => row.map((value, col) => (value - means[col]) / scales[col]));
    const weights = Array(width).fill(0);
    let intercept = targets.reduce((sum, value) => sum + value, 0) / targets.length;
    const epsilon = 0.05;
    const regularization = 1;

    for (let epoch = 0; epoch < 600; epoch++) {
      const weightGradient = weights.map(weight => weight);
      let interceptGradient = 0;
      normalized.forEach((row, index) => {
        const error = row.reduce((sum, value, col) => sum + value * weights[col], intercept) - targets[index];
        if (Math.abs(error) <= epsilon) return;
        const direction = Math.sign(error) * regularization / targets.length;
        row.forEach((value, col) => { weightGradient[col] += direction * value; });
        interceptGradient += direction;
      });
      const learningRate = 0.04 / (1 + epoch / 300);
      weights.forEach((weight, col) => { weights[col] = weight - learningRate * weightGradient[col]; });
      intercept -= learningRate * interceptGradient;
    }

    return row => row.reduce((sum, value, col) =>
      sum + ((value - means[col]) / scales[col]) * weights[col], intercept);
  }

  makeGradientBoostTree(features, gradients, depth, maxDepth, lambda) {
    const sumGradient = gradients.reduce((sum, value) => sum + value, 0);
    const leaf = { value: -sumGradient / (gradients.length + lambda) };
    if (depth >= maxDepth || gradients.length < 4) return leaf;
    const parentScore = sumGradient ** 2 / (gradients.length + lambda);
    let best = null;
    for (let feature = 0; feature < features[0].length; feature++) {
      const values = [...new Set(features.map(row => row[feature]))].sort((a, b) => a - b);
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const left = [], right = [];
        features.forEach((row, index) => (row[feature] <= threshold ? left : right).push(index));
        if (left.length < 2 || right.length < 2) continue;
        const sumLeft = left.reduce((sum, index) => sum + gradients[index], 0);
        const sumRight = right.reduce((sum, index) => sum + gradients[index], 0);
        const gain = sumLeft ** 2 / (left.length + lambda) + sumRight ** 2 / (right.length + lambda) - parentScore;
        if (!best || gain > best.gain) best = { feature, threshold, left, right, gain };
      }
    }
    if (!best || best.gain <= 0) return leaf;
    const child = indices => this.makeGradientBoostTree(
      indices.map(index => features[index]),
      indices.map(index => gradients[index]),
      depth + 1, maxDepth, lambda
    );
    return {
      feature: best.feature,
      threshold: best.threshold,
      left: child(best.left),
      right: child(best.right)
    };
  }

  fitForecastModel(modelName, examples, seed) {
    const features = examples.map(example => modelName === 'mlr'
      ? this.getExtendedMlrFeatures(example.features)
      : example.features);
    const targets = examples.map(example => example.target);
    if (modelName === 'persistence') return () => 0;
    if (modelName === 'random-forest') return this.trainRandomForest(features, targets, seed);
    if (modelName === 'xgboost-style') return this.trainGradientBoostedTrees(features, targets);
    if (modelName === 'lightgbm-style') return this.trainLeafwiseGradientBoostedTrees(features, targets);
    if (modelName === 'svr') return this.trainLinearSupportVectorRegression(features, targets);
    return this.trainExtendedMlr(features, targets);
  }

  getForecastExamples(history, byMinute) {
    return history.flatMap(point => {
      const features = this.getForecastFeatures(byMinute, point.minute);
      const current = this.getForecastValueAtOrBeforeMinute(byMinute, point.minute);
      const future = this.getForecastValueAtMinute(byMinute, point.minute + 30);
      if (!features || !Number.isFinite(current) || !Number.isFinite(future)) return [];
      return [{
        minute: point.minute,
        current,
        actual: future,
        target: (future - current) / 10,
        features
      }];
    });
  }

  getForecastSeed(examples) {
    return examples.reduce((sum, example) =>
      (sum * 31 + Math.round(example.current * 100) + Math.round(example.actual * 10)) >>> 0, 7);
  }

  predictForecastValue(predict, features, current, examples) {
    const targets = examples.map(example => example.target);
    const predictedDelta = predict(features);
    const boundedDelta = Math.max(Math.min(...targets), Math.min(Math.max(...targets), predictedDelta));
    return current + boundedDelta * 10;
  }

  async evaluateForecastModels(examples) {
    const modelNames = [...FORECAST_CANDIDATE_MODELS, 'persistence'];
    const errors = Object.fromEntries(modelNames.map(name => [name, []]));
    const candidates = [];
    let trainingEnd = 0;
    examples.forEach(example => {
      while (trainingEnd < examples.length && examples[trainingEnd].minute + 32 <= example.minute) {
        trainingEnd++;
      }
      const training = examples.slice(Math.max(0, trainingEnd - 120), trainingEnd);
      if (training.length >= 12) candidates.push({ example, training });
    });

    const validationFolds = [];
    for (let index = candidates.length - 1; index >= 0 && validationFolds.length < 30; index--) {
      const candidate = candidates[index];
      if (validationFolds.every(fold => fold.example.minute - candidate.example.minute >= 30)) {
        validationFolds.push(candidate);
      }
    }

    for (const { example, training } of validationFolds.reverse()) {
      const seed = this.getForecastSeed(training);
      modelNames.forEach(modelName => {
        const predict = this.fitForecastModel(modelName, training, seed);
        const features = modelName === 'mlr'
          ? this.getExtendedMlrFeatures(example.features)
          : example.features;
        const targets = training.map(sample => sample.target);
        const predictedDelta = predict(features);
        const boundedDelta = modelName === 'persistence'
          ? predictedDelta
          : Math.max(Math.min(...targets), Math.min(Math.max(...targets), predictedDelta));
        const predicted = example.current + boundedDelta * 10;
        errors[modelName].push({
          error: predicted - example.actual,
          actual: example.actual,
          predicted,
          minute: example.minute
        });
      });
      await new Promise(resolve => window.setTimeout(resolve, 0));
    }

    return Object.fromEntries(modelNames.map(modelName => {
      const modelErrors = errors[modelName];
      const mae = modelErrors.length
        ? modelErrors.reduce((sum, item) => sum + Math.abs(item.error), 0) / modelErrors.length
        : null;
      const rmse = modelErrors.length
        ? Math.sqrt(modelErrors.reduce((sum, item) => sum + item.error ** 2, 0) / modelErrors.length)
        : null;
      const nonZeroActuals = modelErrors.filter(item => item.actual !== 0);
      const mape = nonZeroActuals.length
        ? nonZeroActuals.reduce((sum, item) => sum + Math.abs(item.error / item.actual), 0) /
          nonZeroActuals.length * 100
        : null;
      const actualMean = modelErrors.length
        ? modelErrors.reduce((sum, item) => sum + item.actual, 0) / modelErrors.length
        : null;
      const residualSumSquares = modelErrors.reduce((sum, item) => sum + item.error ** 2, 0);
      const totalSumSquares = modelErrors.reduce((sum, item) => sum + (item.actual - actualMean) ** 2, 0);
      const r2 = modelErrors.length && totalSumSquares > 0
        ? 1 - residualSumSquares / totalSumSquares
        : null;
      const hazardous = modelErrors.filter(item => item.actual >= 33);
      const hazardMisses = hazardous.filter(item => item.predicted < 33).length;
      return [modelName, {
        mae,
        rmse,
        mape,
        r2,
        samples: modelErrors.length,
        hazardMisses,
        hazardSamples: hazardous.length,
        hazardMissRate: hazardous.length ? hazardMisses / hazardous.length : null,
        evaluationStart: modelErrors.length
          ? new Date(Math.min(...modelErrors.map(item => item.minute)) * 60000)
          : null,
        evaluationEnd: modelErrors.length
          ? new Date(Math.max(...modelErrors.map(item => item.minute)) * 60000)
          : null
      }];
    }));
  }

  buildHeatIndexForecast(modelName) {
    const { location, history, byMinute } = this.getMinuteForecastHistory();
    if (history.length === 0) return null;
    const latest = history[history.length - 1];
    const anchorMinute = latest.minute;
    const examples = this.getForecastExamples(history, byMinute);
    if (examples.length < 12) return null;
    const latestFeatures = this.getForecastFeatures(byMinute, anchorMinute);
    if (!latestFeatures) return null;
    const training = examples.slice(-180);
    const features = modelName === 'mlr' ? this.getExtendedMlrFeatures(latestFeatures) : latestFeatures;
    const predict = this.fitForecastModel(modelName, training, this.getForecastSeed(training));
    const value = this.predictForecastValue(predict, features, latest.value, training);
    const date = new Date((anchorMinute + 30) * 60000);
    return {
      location,
      history: history.filter(point => point.minute >= anchorMinute - 30 && point.minute <= anchorMinute),
      current: latest,
      forecast: [{ date, value, status: this.getStatus(value) }],
      trainingSamples: training.length
    };
  }

  async buildForecastComparison(historyData = this.getMinuteForecastHistory()) {
    const { location, history, byMinute } = historyData;
    if (history.length === 0) return null;
    const current = history[history.length - 1];
    const historySignature = history.reduce((signature, point) =>
      (signature * 31 + point.minute + Math.round(point.value * 100)) >>> 0, 7);
    const cacheKey = `${location}:${current.minute}:${history.length}:${historySignature}`;
    if (this.forecastComparisonCache?.key === cacheKey) {
      if (this.forecastComparisonCache.result) return this.forecastComparisonCache.result;
      if (this.forecastComparisonCache.promise) return this.forecastComparisonCache.promise;
    }
    const latestFeatures = this.getForecastFeatures(byMinute, current.minute);
    const examples = this.getForecastExamples(history, byMinute);
    if (!latestFeatures || examples.length < 12) return null;

    const training = examples.slice(-180);
    const seed = this.getForecastSeed(training);
    const cacheEntry = { key: cacheKey, result: null, promise: null };
    const calculation = (async () => {
      const models = {};
      for (const modelName of FORECAST_CANDIDATE_MODELS) {
        const modelFeatures = modelName === 'mlr'
          ? this.getExtendedMlrFeatures(latestFeatures)
          : latestFeatures;
        const predict = this.fitForecastModel(modelName, training, seed);
        const value = this.predictForecastValue(predict, modelFeatures, current.value, training);
        models[modelName] = { value, status: this.getStatus(value) };
        await new Promise(resolve => window.setTimeout(resolve, 0));
      }

      const result = {
        location,
        history: history.filter(point => point.minute >= current.minute - 30 && point.minute <= current.minute),
        current,
        date: new Date((current.minute + 30) * 60000),
        generatedAt: new Date(),
        trainingSamples: training.length,
        models,
        metrics: await this.evaluateForecastModels(examples)
      };
      if (this.forecastComparisonCache !== cacheEntry) return this.buildForecastComparison();
      cacheEntry.result = result;
      cacheEntry.promise = null;
      return result;
    })();
    cacheEntry.promise = calculation.catch(error => {
      if (this.forecastComparisonCache === cacheEntry) this.forecastComparisonCache = null;
      throw error;
    });
    this.forecastComparisonCache = cacheEntry;
    return cacheEntry.promise;
  }

  getBestForecastModel(modelResult) {
    const scoredModels = Object.entries(modelResult.metrics)
      .filter(([name, metric]) =>
        FORECAST_CANDIDATE_MODELS.includes(name) && metric.samples >= 10 && Number.isFinite(metric.mae))
      .sort((a, b) => a[1].mae - b[1].mae);
    const name = scoredModels[0]?.[0] || 'mlr';
    return {
      name,
      label: FORECAST_MODEL_LABELS[name],
      result: modelResult.models[name],
      metric: scoredModels[0]?.[1] || null
    };
  }

  setupForecastObserver() {
    const canvas = document.getElementById('forecast-chart');
    if (!canvas) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !this.forecastChartLoaded) {
          this.forecastChartLoaded = true;
          this.drawForecastChart();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(canvas);
  }

  async drawForecastChart() {
    const canvas = document.getElementById('forecast-chart');
    const tooltip = document.getElementById('forecast-tooltip');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chartLine = getDesignToken('--chart-line', '#17685e');
    const predictionColor = getDesignToken('--chart-prediction', '#a64f36');
    const chartGrid = getDesignToken('--chart-grid', 'rgba(28, 48, 44, 0.14)');
    const chartLabel = getDesignToken('--chart-label', '#53675f');
    const statusColors = {
      safe: getStatusColor('safe'),
      caution: getStatusColor('caution'),
      danger: getStatusColor('danger'),
      extreme: getStatusColor('extreme')
    };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 24, right: 20, bottom: 40, left: 48 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const modelLabels = FORECAST_MODEL_LABELS;
    let modelResult;
    try {
      modelResult = await this.buildForecastComparison();
    } catch (error) {
      console.error('Could not generate the forecast chart:', error);
      const summary = document.getElementById('forecast-summary');
      if (summary) summary.textContent = `Forecast calculation failed: ${error.message}`;
      this.toast(`Forecast calculation failed: ${error.message}`, 'error');
      return;
    }
    const badge = document.getElementById('forecast-badge');
    if (!modelResult) {
      const generatedAt = document.getElementById('forecast-generated-at');
      if (generatedAt) generatedAt.textContent = 'Forecast generation time unavailable';
      ctx.fillStyle = chartLabel;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('More same-location readings needed', w / 2, h / 2);
      const summary = document.getElementById('forecast-summary');
      if (summary) summary.innerHTML = `
        <div class="empty-state compact">
          <div class="empty-desc">The models need at least 12 complete 30-minute examples. With readings every 5 minutes, collect at the same location for about 115 minutes (roughly 2 hours) before the first forecast is available. Gaps in readings may extend this time.</div>
        </div>`;
      const cards = document.getElementById('forecast-cards');
      if (cards) cards.innerHTML = '';
      const comparison = document.getElementById('forecast-comparison');
      if (comparison) comparison.innerHTML = '<div class="forecast-accuracy-empty">At least 12 complete 30-minute examples from non-demo readings are needed for a forecast. App-generated demo readings are excluded.</div>';
      const bestBadge = document.getElementById('forecast-best-badge');
      if (bestBadge) bestBadge.textContent = 'Accuracy not measured';
      const bestModelName = document.getElementById('forecast-best-model-name');
      if (bestModelName) bestModelName.textContent = 'Not selected';
      const legend = document.getElementById('forecast-best-legend');
      if (legend) legend.textContent = 'Best model prediction';
      if (badge) badge.textContent = 'Best prediction';
      if (tooltip) tooltip.classList.remove('visible');
      return;
    }

    const bestModel = this.getBestForecastModel(modelResult);
    const generatedAt = document.getElementById('forecast-generated-at');
    if (generatedAt) generatedAt.textContent = `Generated ${this.formatTime(modelResult.generatedAt.toISOString())}`;
    const modelName = bestModel.name;
    const isMeasuredBest = Boolean(bestModel.metric);
    const bestModelName = document.getElementById('forecast-best-model-name');
    if (bestModelName) bestModelName.textContent = bestModel.label;
    if (badge) badge.textContent = `${bestModel.label} · ${isMeasuredBest ? 'Best so far' : 'Provisional'}`;
    const forecast = modelResult.models[modelName];
    const anchorMinute = modelResult.current.minute;
    const allValues = [
      ...modelResult.history.map(point => point.value),
      forecast.value
    ];
    let minVal = Math.floor((Math.min(...allValues) - 2) / 2) * 2;
    let maxVal = Math.ceil((Math.max(...allValues) + 2) / 2) * 2;
    if (maxVal - minVal < 8) {
      minVal -= 2;
      maxVal += 2;
    }
    const step = 2;
    const niceRange = maxVal - minVal || 1;
    const xForMinute = minute => pad.left + ((minute - anchorMinute + 30) / 60) * chartW;
    const yForValue = value => pad.top + chartH - ((value - minVal) / niceRange) * chartH;

    ctx.strokeStyle = chartGrid;
    ctx.lineWidth = 1;
    const gridCount = Math.round(niceRange / step);
    for (let i = 0; i <= gridCount; i++) {
      const val = maxVal - (step * i);
      const y = pad.top + (chartH / gridCount) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = chartLabel;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(0) + '°', pad.left - 8, y);
    }

    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.strokeStyle = chartGrid;
    ctx.lineWidth = 1;
    ctx.stroke();

    const timeLabels = [-30, -20, -10, 0, 10, 20, 30];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = chartLabel;
    ctx.font = '9px Inter, sans-serif';
    timeLabels.forEach(offset => {
      const minute = anchorMinute + offset;
      ctx.fillText(offset === 0 ? 'Now' : `${offset > 0 ? '+' : ''}${offset}m`, xForMinute(minute), pad.top + chartH + 10);
    });

    const histPoints = modelResult.history.map(point => ({
      x: xForMinute(point.minute),
      y: yForValue(point.value),
      val: point.value,
      status: this.getStatus(point.value),
      type: 'hist',
      date: point.date
    }));
    for (let i = 1; i < histPoints.length; i++) {
      if (modelResult.history[i].minute - modelResult.history[i - 1].minute > 3) continue;
      ctx.beginPath();
      ctx.moveTo(histPoints[i - 1].x, histPoints[i - 1].y);
      ctx.lineTo(histPoints[i].x, histPoints[i].y);
      ctx.strokeStyle = chartGrid;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const currentPoint = {
      x: xForMinute(anchorMinute),
      y: yForValue(modelResult.current.value),
      val: modelResult.current.value,
      status: this.getStatus(modelResult.current.value),
      type: 'hist',
      date: modelResult.current.date
    };
    const forecastPoint = {
      x: xForMinute(anchorMinute + 30),
      y: yForValue(forecast.value),
      val: forecast.value,
      status: forecast.status,
      type: 'fc',
      modelName,
      date: modelResult.date
    };
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(currentPoint.x, currentPoint.y);
    ctx.lineTo(forecastPoint.x, forecastPoint.y);
    ctx.strokeStyle = predictionColor;
    ctx.lineWidth = 2.8;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();

    const allPoints = [...histPoints, currentPoint, forecastPoint];
    allPoints.forEach(point => {
      const color = point.type === 'fc' ? predictionColor : statusColors[point.status];
      ctx.save();
      if (point.type === 'fc') {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.type === 'fc' ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    });

    const cardsEl = document.getElementById('forecast-cards');
    if (cardsEl) {
      cardsEl.innerHTML = `
        <div class="forecast-day model-comparison-card selected">
          <div class="forecast-day-name">${bestModel.label}${isMeasuredBest ? ' · Best so far' : ' · Provisional'}</div>
          <div class="forecast-day-date">+30 min · ${modelResult.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
          <div class="forecast-day-temp ${forecast.status}">${forecast.value.toFixed(1)}°C</div>
          <div class="forecast-day-label ${forecast.status}">${STATUS_LABELS[forecast.status]}</div>
        </div>
      `;
    }

    const summary = document.getElementById('forecast-summary');
    if (summary) {
      summary.innerHTML = `
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
          <span>Current: <strong>${modelResult.current.value.toFixed(1)}°C</strong></span>
          <span>Best prediction: <strong style="color:${predictionColor}">${forecast.value.toFixed(1)}°C</strong></span>
        </div>
        <div style="margin-top:6px;font-size:0.72rem;color:var(--text-muted);">${bestModel.label} uses the latest ${modelResult.trainingSamples} same-location examples at ${modelResult.location || 'the current location'} to predict 30 minutes ahead.</div>
      `;
    }

    const bestBadge = document.getElementById('forecast-best-badge');
    if (bestBadge) bestBadge.textContent = bestModel.metric
      ? `Lowest holdout MAE (${bestModel.metric.samples} samples): ${bestModel.label} · ${bestModel.metric.mae.toFixed(2)}°C`
      : 'At least 10 holdout samples needed · showing provisional Multiple Linear Regression';
    const legend = document.getElementById('forecast-best-legend');
    if (legend) legend.textContent = `${bestModel.label} prediction`;
    const comparison = document.getElementById('forecast-comparison');
    if (comparison) {
      const evaluationMetric = modelResult.metrics[FORECAST_CANDIDATE_MODELS[0]];
      const evaluationPeriod = evaluationMetric?.evaluationStart && evaluationMetric?.evaluationEnd
        ? ` Evaluation period: ${this.formatTime(evaluationMetric.evaluationStart.toISOString())} to ${this.formatTime(evaluationMetric.evaluationEnd.toISOString())}.`
        : ' Evaluation period unavailable because no holdout samples were generated.';
      const evaluatedModels = Object.entries(modelResult.metrics)
        .filter(([, metric]) => metric.samples > 0 && Number.isFinite(metric.mae))
        .map(([name, metric]) => {
          const label = `${modelLabels[name]}${name === bestModel.name && bestModel.metric ? ' · Selected by MAE' : ''}`;
          const r2 = Number.isFinite(metric.r2) ? metric.r2.toFixed(2) : 'not defined';
          const mape = Number.isFinite(metric.mape) ? `${metric.mape.toFixed(1)}%` : 'not defined';
          const hazardRate = metric.hazardSamples
            ? ` (${(metric.hazardMissRate * 100).toFixed(1)}%)`
            : ' (no Hinga/Hinto holdout readings)';
          return `<p class="forecast-accuracy-caption">${label}: MAE ${metric.mae.toFixed(2)}°C · RMSE ${metric.rmse.toFixed(2)}°C · MAPE ${mape} · R² ${r2} · Hinga/Hinto under-predictions ${metric.hazardMisses}/${metric.hazardSamples}${hazardRate}.</p>`;
        }).join('');
      comparison.innerHTML = `<div class="forecast-accuracy-heading">Walk-forward model comparison <span>Lower MAE/RMSE/MAPE is better; higher R² is better.</span></div>
        <p class="forecast-accuracy-caption">${modelResult.metrics.mlr.samples} non-overlapping holdouts per model.${evaluationPeriod} An under-prediction means an actual heat index of at least 33°C was predicted below 33°C.</p>
        ${evaluatedModels}
        ${bestModel.metric ? '' : '<div class="forecast-accuracy-empty">At least 10 holdout forecasts are required before declaring a best model; the prediction above is provisional.</div>'}`;
    }

    if (tooltip) {
      canvas.onmousemove = (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        let closest = null;
        let minDist = Infinity;
        allPoints.forEach(p => {
          const d = Math.hypot(p.x - mx, p.y - my);
          if (d < 24 && d < minDist) { minDist = d; closest = p; }
        });
        if (closest) {
          const prefix = closest.type === 'fc' ? `${bestModel.label} prediction` : 'Recorded';
          const time = closest.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          tooltip.innerHTML = `<div class="tt-date">${prefix}: ${time}</div><div class="tt-val ${closest.status}">${closest.val.toFixed(1)}°C — ${STATUS_LABELS[closest.status]}</div>`;
          tooltip.style.left = closest.x + 'px';
          tooltip.style.top = (closest.y - 55) + 'px';
          tooltip.classList.add('visible');
        } else {
          tooltip.classList.remove('visible');
        }
      };
      canvas.onmouseleave = () => tooltip.classList.remove('visible');
    }
  }

  getWeatherIcon(status) {
    const icons = { safe: '☀️', caution: '⛅', danger: '🌤️', extreme: '🔥' };
    return icons[status] || '☀️';
  }

  renderMap() {
    const pinsContainer = document.getElementById('map-pins');
    if (!pinsContainer) return;

    const latestByLoc = {};
    this.readings.forEach(r => {
      if (!latestByLoc[r.location] || new Date(r.timestamp) > new Date(latestByLoc[r.location].timestamp)) {
        latestByLoc[r.location] = r;
      }
    });

    pinsContainer.innerHTML = LOCATIONS.map(loc => {
      const reading = latestByLoc[loc.name];
      const heatIndex = Number(reading?.heatIndex);
      const hasValidReading = this.hasValidMeasurement(reading);
      const status = hasValidReading ? this.getStatus(heatIndex) : 'nodata';
      const hi = hasValidReading ? heatIndex.toFixed(1) + '°C' : reading ? 'Invalid measurement' : 'No data';
      const dataStatus = this.getMapDataStatus(reading);
      const safeName = loc.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const readingTime = reading ? this.escapeHTML(this.formatTime(reading.timestamp)) : 'No stored measurement';
      const accessibleLabel = this.escapeHTML(`${loc.name}: ${dataStatus}, ${hi}`);
      return `
        <div class="map-pin ${status}" role="button" tabindex="0" aria-expanded="false" aria-label="${accessibleLabel}" style="left:${loc.x}%;top:${loc.y}%" data-loc="${safeName}">
          <div class="map-pin-tooltip">
            <div class="tt-loc">${safeName}</div>
                <div class="tt-source map-data-status">${this.translateText(dataStatus)}</div>
            <div class="tt-hi ${status}">${hi}</div>
            <div class="tt-time">${readingTime}</div>
          </div>
        </div>
      `;
    }).join('');

    pinsContainer.querySelectorAll('.map-pin').forEach(pin => {
      pin.addEventListener('click', () => this.togglePinTooltip(pin));
      pin.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.togglePinTooltip(pin);
      });
    });
    this.syncMapPins();
  }

  togglePinTooltip(pinEl) {
    document.querySelectorAll('.map-pin.active').forEach(p => {
      if (p !== pinEl) {
        p.classList.remove('active');
        p.setAttribute('aria-expanded', 'false');
      }
    });
    pinEl.classList.toggle('active');
    pinEl.setAttribute('aria-expanded', String(pinEl.classList.contains('active')));
    this.selectLocation(pinEl.dataset.loc, false);
  }

  syncMapPins() {
    const mapImg = document.getElementById('map-img');
    const pinsContainer = document.getElementById('map-pins');
    const mapWrap = document.getElementById('map-wrap');
    const fallback = document.getElementById('map-fallback');
    if (!pinsContainer || !mapWrap) return;

    pinsContainer.style.right = 'auto';
    pinsContainer.style.bottom = 'auto';

    if (mapImg && mapImg.complete && mapImg.naturalWidth > 0 && mapImg.style.display !== 'none') {
      pinsContainer.style.width = mapImg.clientWidth + 'px';
      pinsContainer.style.height = mapImg.clientHeight + 'px';
      if (fallback) fallback.classList.remove('active');
      return;
    }

    if (fallback && fallback.classList.contains('active')) {
      const svg = fallback.querySelector('.svg-map');
      if (svg) {
        const rect = svg.getBoundingClientRect();
        pinsContainer.style.width = rect.width + 'px';
        pinsContainer.style.height = rect.height + 'px';
        return;
      }
    }

    const wrapRect = mapWrap.getBoundingClientRect();
    pinsContainer.style.width = Math.max(wrapRect.width - 32, 300) + 'px';
    pinsContainer.style.height = Math.max(wrapRect.height - 32, 300) + 'px';
  }

  tryNextMapImage(img) {
    if (!img) return;
    const attempts = [
      'assets/campus-map.jpg',
      'assets/campus-map.png',
      'assets/campus-map.jpeg',
      'assets/map.jpg',
      'assets/map.png',
      'assets/school-map.jpg',
      'assets/school-map.png'
    ];
    let current = parseInt(img.dataset.attempt || '0');
    current++;
    if (current < attempts.length) {
      img.dataset.attempt = current;
      img.src = attempts[current];
    } else {
      img.style.display = 'none';
      const fallback = document.getElementById('map-fallback');
      if (fallback) {
        fallback.classList.add('active');
        fallback.style.display = 'block';
      }
      this.syncMapPins();
    }
  }

  applySettings() {
    const fb = document.getElementById('setting-firebase');
    const browserNotifications = document.getElementById('setting-browser-notifications');
    const pushAlerts = document.getElementById('setting-push-alerts');
    const smsAlerts = document.getElementById('setting-sms-alerts');
    const smsNumbers = document.getElementById('setting-sms-numbers');
    const out = document.getElementById('setting-outlier');
    const spk = document.getElementById('setting-spike');
    const demo = document.getElementById('setting-demo');
    const darkmode = document.getElementById('setting-darkmode');
    const colorMode = document.getElementById('setting-color-mode');
    const language = document.getElementById('setting-language');
    const cTemp = document.getElementById('cal-temp');
    const cHum = document.getElementById('cal-humidity');
    if (fb) fb.checked = this.settings.firebase;
    if (browserNotifications) browserNotifications.checked = this.settings.browserNotifications;
    if (pushAlerts) pushAlerts.checked = this.settings.pushAlerts;
    if (smsAlerts) smsAlerts.checked = this.settings.smsAlerts;
    if (smsNumbers) smsNumbers.value = typeof this.settings.smsNumbers === 'string' ? this.settings.smsNumbers : '';
    if (out) out.checked = this.settings.outlier;
    if (spk) spk.checked = this.settings.spike;
    if (demo) demo.checked = this.settings.demoMode;
    if (darkmode) darkmode.checked = this.settings.darkMode;
    if (colorMode) colorMode.value = this.settings.colorMode;
    if (language) language.value = this.settings.language;
    if (cTemp) cTemp.value = this.settings.tempOffset;
    if (cHum) cHum.value = this.settings.humidityOffset;
    this.applyTheme();
    this.applyLanguage(this.settings.language);
  }

  getLanguageLocale() {
    return window.SCHOOLHEAT_I18N?.languages?.[this.language]?.locale || 'en-PH';
  }

  translateText(text) {
    const dictionary = window.SCHOOLHEAT_I18N?.translations?.[this.language];
    return dictionary?.[text] || text;
  }

  translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!this.localizedTextNodes.has(node)) this.localizedTextNodes.set(node, node.nodeValue);
      const original = this.localizedTextNodes.get(node) || '';
      const trimmed = original.trim();
      if (!trimmed) return;
      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      node.nodeValue = `${leading}${this.translateText(trimmed)}${trailing}`;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.tagName)) return;

    let originalAttributes = this.localizedAttributes.get(node);
    if (!originalAttributes) {
      originalAttributes = new Map();
      this.localizedAttributes.set(node, originalAttributes);
    }
    ['aria-label', 'aria-description', 'placeholder', 'title', 'alt'].forEach(name => {
      if (!node.hasAttribute(name)) return;
      if (!originalAttributes.has(name)) originalAttributes.set(name, node.getAttribute(name));
      node.setAttribute(name, this.translateText(originalAttributes.get(name)));
    });
    Array.from(node.childNodes).forEach(child => this.translateNode(child));
  }

  applyLanguage(language) {
    const catalog = window.SCHOOLHEAT_I18N;
    if (!catalog) {
      console.error('SchoolHeat language data did not load.');
      return;
    }
    const supportedLanguages = catalog.languages || {};
    const selectedLanguage = supportedLanguages[language] ? language : 'en';
    this.language = selectedLanguage;
    this.settings.language = selectedLanguage;
    const languageSelect = document.getElementById('setting-language');
    if (languageSelect) languageSelect.value = selectedLanguage;
    document.documentElement.lang = supportedLanguages[selectedLanguage].htmlLang;

    const root = document.getElementById('app');
    if (!root) return;
    this.translateNode(root);

    if (!this.languageObserver) {
      this.languageObserver = new MutationObserver(records => {
        records.forEach(record => {
          record.addedNodes.forEach(node => this.translateNode(node));
        });
      });
      this.languageObserver.observe(root, { childList: true, subtree: true });
    }
    this.renderDashboardLocationSummary();
    this.renderSensorTrust();
    this.scheduleDashboardForecastRender();
  }

  saveSettings(showToast = true) {
    this.settings = {
      firebase: document.getElementById('setting-firebase')?.checked ?? true,
      browserNotifications: document.getElementById('setting-browser-notifications')?.checked ?? false,
      pushAlerts: document.getElementById('setting-push-alerts')?.checked ?? false,
      smsAlerts: document.getElementById('setting-sms-alerts')?.checked ?? false,
      smsNumbers: document.getElementById('setting-sms-numbers')?.value ?? '',
      outlier: document.getElementById('setting-outlier')?.checked ?? true,
      spike: document.getElementById('setting-spike')?.checked ?? true,
      demoMode: document.getElementById('setting-demo')?.checked ?? false,
      darkMode: document.getElementById('setting-darkmode')?.checked ?? false,
      colorMode: document.getElementById('setting-color-mode')?.value || 'automatic',
      accentPalette: this.settings.accentPalette,
      customAccentColor: this.settings.customAccentColor,
      customPaletteColors: this.settings.customPaletteColors,
      tempOffset: parseFloat(document.getElementById('cal-temp')?.value) || 0,
      humidityOffset: parseFloat(document.getElementById('cal-humidity')?.value) || 0,
      language: document.getElementById('setting-language')?.value || this.language || 'en'
    };
    localStorage.setItem('sh_settings', JSON.stringify(this.settings));
    if (showToast) this.toast('Settings saved', 'success');
  }

  saveReadings() {
    localStorage.setItem('sh_readings', JSON.stringify(this.readings));
  }

  generateDemoData(silent = false) {
    const now = new Date();
    const demo = [];
    for (let d = 6; d >= 0; d--) {
      const dayBase = new Date(now);
      dayBase.setDate(dayBase.getDate() - d);
      const numReadings = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < numReadings; i++) {
        const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)].name;
        const hour = 7 + Math.floor(Math.random() * 9);
        const minute = Math.floor(Math.random() * 60);
        const temp = 26 + Math.random() * 14 + (hour - 12) * 0.3;
        const hum = 50 + Math.random() * 40;
        const ts = new Date(dayBase);
        ts.setHours(hour, minute);
        const hi = this.calculateHeatIndex(temp, hum);
        const quality = this.getQualityScore(temp, hum);
        demo.push({
          id: ts.getTime() + i,
          source: 'demo',
          location: loc,
          temperature: parseFloat(temp.toFixed(1)),
          humidity: parseFloat(hum.toFixed(1)),
          heatIndex: parseFloat(hi.toFixed(2)),
          status: this.getStatus(hi),
          quality: quality.label,
          qualityClass: quality.class,
          timestamp: ts.toISOString(),
          isDemo: true
        });
      }
    }
    const existingIds = new Set(this.readings.map(reading => String(reading.id)));
    const newDemoReadings = demo.filter(reading => !existingIds.has(String(reading.id)));
    this.readings = [...this.readings, ...newDemoReadings]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    this.forecastComparisonCache = null;
    this.lastObservedReadingId = this.readings[0]?.id ?? null;
    this.saveReadings();
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.trendChartLoaded = false;
    this.distributionChartLoaded = false;
    this.forecastChartLoaded = false;
    if (this.currentTab === 'history') {
      this.drawTrendChart();
      this.drawDistributionChart();
    }
    if (this.currentTab === 'forecast') this.drawForecastChart();
    if (!silent) {
      this.toast(
        newDemoReadings.length
          ? `Demo data generated! ${newDemoReadings.length} new sample reading(s) added without replacing saved records.`
          : 'No new demo readings were added; existing records were preserved.',
        newDemoReadings.length ? 'success' : 'info'
      );
    }
  }

  clearAllData() {
    if (!confirm('Are you sure you want to clear ALL readings? This cannot be undone.')) return;
    this.readings = [];
    this.forecastComparisonCache = null;
    this.saveReadings();
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.trendChartLoaded = false;
    this.distributionChartLoaded = false;
    this.forecastChartLoaded = false;
    if (this.currentTab === 'history') {
      this.drawTrendChart();
      this.drawDistributionChart();
    }
    if (this.currentTab === 'forecast') this.drawForecastChart();
    this.toast('All data cleared.', 'info');
  }

  exportCSV() {
    if (this.readings.length === 0) {
      this.toast('No data to export', 'warning');
      return;
    }
    const headers = [
      'Reading #',
      'Location',
      'Temperature (°C)',
      'Humidity (%)',
      'Heat Index (°C)',
      'Heat Risk',
      'Data Quality',
      'Date',
      'Time',
      'Demo Data'
    ];
    const chronologicalReadings = this.readings.slice().sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (!Number.isFinite(timeA)) return Number.isFinite(timeB) ? 1 : 0;
      if (!Number.isFinite(timeB)) return -1;
      return timeA - timeB;
    });
    const rows = chronologicalReadings.map((reading, index) => {
      const date = new Date(reading.timestamp);
      const validDate = Number.isFinite(date.getTime());
      const pad = value => String(value).padStart(2, '0');
      return [
        index + 1,
        reading.location,
        reading.temperature,
        reading.humidity,
        reading.heatIndex,
        STATUS_LABELS[reading.status] || reading.status || 'Unknown',
        reading.quality || '-',
        validDate ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Invalid date',
        validDate ? `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` : 'Invalid time',
        reading.isDemo ? 'Yes' : 'No'
      ];
    });
    const csv = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    const filename = `SchoolHeat_Readings_Formatted_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`;
    this.downloadFile(csv, filename, 'text/csv');
    this.toast(`CSV exported as ${filename}`, 'success');
  }

  exportJSON() {
    if (this.readings.length === 0) {
      this.toast('No data to export', 'warning');
      return;
    }
    const readings = this.readings.map(({ source, sourceFile, ...reading }) => reading);
    const json = JSON.stringify(readings, null, 2);
    this.downloadFile(json, 'schoolheat_readings.json', 'application/json');
    this.toast('JSON exported successfully', 'success');
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  openHistoryAnalytics() {
    this.switchTab('history', false);
    requestAnimationFrame(() => {
      document.getElementById('history-analytics')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  }

  openKnowledgeAssistant() {
    this.switchTab('about', false);
    requestAnimationFrame(() => {
      const section = document.querySelector('.knowledge-assistant-section');
      section?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
      window.setTimeout(() => document.getElementById('knowledge-question')?.focus(), 150);
    });
  }

  switchTab(tabId, scrollToTop = true) {
    if (!document.getElementById('tab-' + tabId)) return;
    this.currentTab = tabId;
    document.documentElement.setAttribute('data-active-tab', tabId);
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabId)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(button => {
      const active = button.dataset.tab === tabId;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    this.setMobileNavigationOpen(false);
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'history') {
      this.renderHistory(false);
      setTimeout(() => {
        this.trendChartLoaded = false;
        this.distributionChartLoaded = false;
        this.drawTrendChart();
        this.drawDistributionChart();
      }, 100);
    }
    if (tabId === 'forecast') {
      setTimeout(() => {
        this.forecastChartLoaded = false;
        this.drawForecastChart();
      }, 100);
    }
    if (tabId === 'map') {
      setTimeout(() => {
        this.renderMap();
        this.applyMapZoom();
        this.syncMapPins();
        const img = document.getElementById('map-img');
        if (img && !img.src && img.dataset.attempt === '0') {
          img.src = 'assets/campus-map.jpg';
        }
      }, 100);
    }
    if (tabId === 'dashboard') {
      this.scheduleDashboardForecastRender();
    }
    if (tabId === 'monitor') {
      this.updateRecentLocations();
      this.updateMonitorGauge();
    }
  }

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    message = this.translateText(message);
    const icons = {
      success: '<svg class="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg class="toast-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg class="toast-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg class="toast-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = (icons[type] || icons.info) + '<span></span>';
    toast.querySelector('span').textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  formatTime(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return 'Unknown date and time';
    return `${this.formatDate(iso)} • ${this.formatClockTime(iso)}`;
  }

  formatDate(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatClockTime(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return 'Unknown';
    return date.toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  toggleDarkMode() {
    this.applyTheme();
  }

  applyAccentPalette() {
    const root = document.documentElement;
    const rootStyle = root.style;
    const colorModeControl = document.getElementById('setting-color-mode-control');
    const anyColorPicker = document.getElementById('setting-any-color');
    const palette = this.settings.accentPalette;
    const theme = this.settings.darkMode ? 'dark' : 'light';
    const customColors = this.settings.customPaletteColors[theme];
    const colors = palette === 'custom'
      ? customColors
      : APP_COLOR_PALETTES[palette]?.[theme];
    const customProperties = [
      '--surface-canvas',
      '--surface-card',
      '--surface-raised',
      '--ink-primary',
      '--ink-secondary',
      '--ink-muted',
      '--bg-primary',
      '--bg-card',
      '--bg-card-hover',
      '--text-primary',
      '--text-secondary',
      '--text-muted',
      '--brand-coral',
      '--brand-amber',
      '--brand-teal',
      '--accent-blue',
      '--accent-purple',
      '--accent-cyan',
      '--accent-pink',
      '--button-primary-bg',
      '--button-primary-text',
      '--chart-line',
      '--chart-prediction',
      '--chart-fill-top',
      '--chart-fill-bottom',
      '--chart-glow',
      '--chart-grid',
      '--chart-label',
      '--latest-reading-bg',
      '--latest-reading-text',
      '--border',
      '--border-hover'
    ];

    customProperties.forEach(property => rootStyle.removeProperty(property));
    if (anyColorPicker) anyColorPicker.value = this.settings.customAccentColor;
    document.querySelectorAll('[data-palette-choice]').forEach(button => {
      const choice = button.dataset.paletteChoice;
      const selected = choice === palette;
      const previewColors = APP_COLOR_PALETTES[choice]?.[theme] || CUSTOM_THEME_COLOR_DEFAULTS[theme];
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-selected', selected);
      button.querySelectorAll('[data-palette-preview-field]').forEach(swatch => {
        const color = previewColors[swatch.dataset.palettePreviewField];
        if (color) swatch.style.setProperty('--swatch-color', color);
      });
    });
    if (colorModeControl) colorModeControl.hidden = palette !== 'schoolheat';
    document.querySelectorAll('[data-custom-accent-choice]').forEach(button => {
      const selected = palette === 'custom' && button.dataset.customAccentChoice === this.settings.customAccentColor;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-selected', selected);
    });

    if (colors && !getCustomPaletteValidationError(colors)) {
      const surfaces = [colors.background, colors.surface];
      const accent = getAccessibleAccent(colors.accent, surfaces);
      const secondaryAccent = getAccessibleAccent(colors.secondaryAccent, surfaces);
      const border = getAccessibleColor(colors.border, surfaces, 3);
      const tertiaryAccent = getAccessibleAccent(mixHexColors(colors.accent, colors.secondaryAccent, 0.5), surfaces);
      const accentRgb = hexToRgb(accent);
      const secondaryRgb = hexToRgb(colors.secondaryText);
      const buttonText = getReadableTextColor(accent);
      const hoverSurface = getRelativeLuminance(colors.background) > 0.5
        ? mixHexColors(colors.surface, colors.background, 0.45)
        : mixHexColors(colors.surface, colors.text, 0.08);

      rootStyle.setProperty('--surface-canvas', colors.background);
      rootStyle.setProperty('--surface-card', colors.surface);
      rootStyle.setProperty('--surface-raised', hoverSurface);
      rootStyle.setProperty('--ink-primary', colors.text);
      rootStyle.setProperty('--ink-secondary', colors.secondaryText);
      rootStyle.setProperty('--ink-muted', colors.secondaryText);
      rootStyle.setProperty('--bg-primary', colors.background);
      rootStyle.setProperty('--bg-card', colors.surface);
      rootStyle.setProperty('--bg-card-hover', hoverSurface);
      rootStyle.setProperty('--text-primary', colors.text);
      rootStyle.setProperty('--text-secondary', colors.secondaryText);
      rootStyle.setProperty('--text-muted', colors.secondaryText);
      rootStyle.setProperty('--brand-teal', accent);
      rootStyle.setProperty('--brand-coral', secondaryAccent);
      rootStyle.setProperty('--brand-amber', tertiaryAccent);
      rootStyle.setProperty('--accent-blue', accent);
      rootStyle.setProperty('--accent-purple', secondaryAccent);
      rootStyle.setProperty('--accent-cyan', accent);
      rootStyle.setProperty('--accent-pink', tertiaryAccent);
      rootStyle.setProperty('--button-primary-bg', accent);
      rootStyle.setProperty('--button-primary-text', buttonText);
      rootStyle.setProperty('--chart-line', accent);
      rootStyle.setProperty('--chart-prediction', secondaryAccent);
      rootStyle.setProperty('--chart-fill-top', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`);
      rootStyle.setProperty('--chart-fill-bottom', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0)`);
      rootStyle.setProperty('--chart-glow', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`);
      rootStyle.setProperty('--chart-grid', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2)`);
      rootStyle.setProperty('--chart-label', colors.secondaryText);
      rootStyle.setProperty('--latest-reading-bg', accent);
      rootStyle.setProperty('--latest-reading-text', buttonText);
      rootStyle.setProperty('--border', border);
      rootStyle.setProperty('--border-hover', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.55)`);
    }

  }

  applyTheme() {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    document.documentElement.setAttribute(
      'data-color-mode',
      ['automatic', 'unified'].includes(this.settings.colorMode) ? this.settings.colorMode : 'automatic'
    );
    document.documentElement.setAttribute('data-active-tab', this.currentTab || 'dashboard');
    if (this.settings.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeColor?.setAttribute('content', '#111b1a');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeColor?.setAttribute('content', '#f4f1e7');
    }
    this.applyAccentPalette();
  }

  showDistributionSummary() {
    const safeCnt = this.readings.filter(r => r.status === 'safe').length;
    const cautionCnt = this.readings.filter(r => r.status === 'caution').length;
    const dangerCnt = this.readings.filter(r => r.status === 'danger').length;
    const extremeCnt = this.readings.filter(r => r.status === 'extreme').length;
    this.toast(`Readings: Hayo ${safeCnt} · Hinay ${cautionCnt} · Hinga ${dangerCnt} · Hinto ${extremeCnt}`, dangerCnt + extremeCnt > 0 ? 'error' : 'info');
  }

  async showForecastSummary() {
    let forecast;
    try {
      forecast = await this.generateForecastData();
    } catch (error) {
      console.error('Could not generate the forecast summary:', error);
      this.toast(`Forecast calculation failed: ${error.message}`, 'error');
      return;
    }
    if (!forecast || forecast.length === 0) {
      this.toast('Not enough same-location history for a 30-minute forecast yet', 'warning');
      return;
    }
    const prediction = forecast[0];
    const time = prediction.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const hazardous = prediction.status === 'danger' || prediction.status === 'extreme';
    this.toast(`30-minute forecast (${time}): ${prediction.value.toFixed(1)}°C — ${STATUS_LABELS[prediction.status]}`, hazardous ? 'error' : 'info');
  }

  testBrowserNotification() {
    if (!this.settings.browserNotifications) {
      this.toast('Enable Browser Notifications in Settings first.', 'warning');
      return;
    }
    this.showBrowserNotification('Test alert: browser notifications are enabled.', 'SchoolHeat test notification');
    this.toast('Test browser notification sent.', 'success');
  }

  testPushAlert() {
    this.sendHeatPushAlert(null, true);
  }

  testSmsAlert() {
    this.sendHeatSmsAlert(null, true);
  }

  async generateForecastData() {
    const modelResult = await this.buildForecastComparison();
    if (!modelResult) return [];
    const bestModel = this.getBestForecastModel(modelResult);
    return [{
      date: modelResult.date,
      value: bestModel.result.value,
      status: bestModel.result.status
    }];
  }
}

const app = new SchoolHeatApp();
window.app = app;
