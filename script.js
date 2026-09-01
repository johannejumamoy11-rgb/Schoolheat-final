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
  { name: "Adminsytration Building / DepEd SS Building", x: 48.8, y: 47.4, baseTemp: 30.8, baseHum: 63 },
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

const STATUS_COLORS = {
  safe: '#10b981',
  caution: '#f59e0b',
  danger: '#ef4444',
  extreme: '#dc2626',
  nodata: '#6b7280'
};

const STATUS_LABELS = {
  safe: 'Safe',
  caution: 'Caution',
  danger: 'Danger',
  extreme: 'Extreme',
  nodata: 'No Data'
};

class SchoolHeatApp {
  constructor() {
    const defaultSettings = { firebase: true, sms: false, outlier: true, spike: true, demoMode: false, tempOffset: 0, humidityOffset: 0, darkMode: false, emergencyPhone: '' };
    try {
      const storedReadings = JSON.parse(localStorage.getItem('sh_readings') || '[]');
      this.readings = Array.isArray(storedReadings) ? storedReadings : [];
    } catch (error) {
      this.readings = [];
      localStorage.removeItem('sh_readings');
    }
    try {
      const storedSettings = JSON.parse(localStorage.getItem('sh_settings') || '{}');
      this.settings = { ...defaultSettings, ...(storedSettings && typeof storedSettings === 'object' ? storedSettings : {}) };
    } catch (error) {
      this.settings = defaultSettings;
      localStorage.removeItem('sh_settings');
    }
    this.currentTab = 'dashboard';
    this.forecastChartLoaded = false;
    this.trendChartLoaded = false;
    this.distributionChartLoaded = false;
    this._resizeHandler = null;
    this.autoReadActive = false;
    this.autoReadInterval = null;
    this.autoReadLocIndex = 0;
    this.serialPort = null;
    this.serialReader = null;
    this.serialConnected = false;
    this.lastSerialData = null;
    this.bridgeConnected = false;
    this.bridgeTimer = null;
    this.lastBridgeTimestamp = null;
    this.sharedSyncTimer = null;
    this.sharedSyncBusy = false;
    this.cloudSyncTimer = null;
    this.cloudSyncBusy = false;
    this.cloudToken = null;
    this.cloudRefreshToken = null;
    this.cloudTokenExpiry = 0;
    this.lastSensorValues = {};
    this.init();
  }

  init() {
    this.populateLocations();
    this.applySettings();
    this.bindEvents();
    this.bindSettingsEvents();
    this.startClock();
    this.checkFirstVisit();
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.setupForecastObserver();
    this.setupTrendObserver();
    this.setupDistributionObserver();
    this.setupPullToRefresh();
    this.setupResizeHandler();
    this.hideLoader();
    // Start shared Arduino synchronization in the background.
    // This keeps Dashboard, History, and Map consistent across devices.
    if (!this.settings.demoMode) {
      setTimeout(() => {
        this.startCloudSync();
        this.startSharedSync();
      }, 300);
    }
  }

  hideLoader() {
    const loader = document.getElementById('loading-screen');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }, 1200);
  }

  checkFirstVisit() {
    const visited = localStorage.getItem('sh_visited');
    if (!visited && this.readings.length === 0) {
      this.generateDemoData(true);
      localStorage.setItem('sh_visited', 'true');
      this.toast('Welcome! Demo data loaded for preview', 'info');
    }
  }

  startClock() {
    const update = () => {
      const el = document.getElementById('header-clock');
      if (el) {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    };
    update();
    setInterval(update, 1000);
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
        this.syncMapPins();
      }
    };
    window.addEventListener('resize', this._resizeHandler);
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
  }

  bindEvents() {
    const tempInput = document.getElementById('temp-input');
    const humInput = document.getElementById('humidity-input');
    if (tempInput) tempInput.addEventListener('input', () => this.updatePreview());
    if (humInput) humInput.addEventListener('input', () => this.updatePreview());
    const locationSelect = document.getElementById('location-select');
    if (locationSelect) locationSelect.addEventListener('change', () => this.setBridgeLocation(locationSelect.value));

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key >= '1' && e.key <= '6') {
        const tabs = ['dashboard','monitor','history','forecast','map','settings'];
        this.switchTab(tabs[parseInt(e.key) - 1]);
      }
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

  bindSettingsEvents() {
    const toggles = ['setting-firebase', 'setting-sms', 'setting-outlier', 'setting-spike', 'setting-demo', 'setting-darkmode'];
    toggles.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => {
        if (id === 'setting-darkmode') {
          this.saveSettings();
          this.toggleDarkMode();
        } else {
          this.saveSettings();
        }
      });
    });
    const calTemp = document.getElementById('cal-temp');
    const calHum = document.getElementById('cal-humidity');
    const alertPhone = document.getElementById('alert-phone');
    if (calTemp) calTemp.addEventListener('change', () => this.saveSettings());
    if (calHum) calHum.addEventListener('change', () => this.saveSettings());
    if (alertPhone) alertPhone.addEventListener('change', () => this.saveSettings());
  }

  calculateHeatIndex(T, H) {
    // NOAA Heat Index Formula (Steadman-Rothfusz Regression)
    // For temperatures >= 26.67°C (80°F)
    if (T < 26.67) {
      return T; // Below 26.67°C, heat index equals temperature
    }

    // Convert Celsius to Fahrenheit for calculation
    const F = (T * 9/5) + 32;
    const RH = H; // Relative Humidity in %

    // Coefficients for the NOAA formula
    const c1 = -42.379;
    const c2 = 2.04901523;
    const c3 = 10.14333127;
    const c4 = -0.22475541;
    const c5 = -0.00683783;
    const c6 = -0.05481717;
    const c7 = 0.00122874;
    const c8 = 0.00085282;
    const c9 = -0.00000199;

    // Apply NOAA formula
    const HI_F = c1 + 
                 (c2 * F) + 
                 (c3 * RH) + 
                 (c4 * F * RH) + 
                 (c5 * F * F) + 
                 (c6 * RH * RH) + 
                 (c7 * F * F * RH) + 
                 (c8 * F * RH * RH) + 
                 (c9 * F * F * RH * RH);

    // Convert back to Celsius
    const HI_C = (HI_F - 32) * 5/9;
    return Math.max(T, HI_C);
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
    const hi = this.calculateHeatIndex(temp, hum);
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

  selectLocation(loc) {
    const select = document.getElementById('location-select');
    if (select) {
      select.value = loc;
      this.setBridgeLocation(loc);
      this.toast(`Selected: ${loc}`, 'info');
    }
  }

  checkAlerts() {
    const dangerReadings = this.readings.filter(r => r.status === 'danger' || r.status === 'extreme');
    const banner = document.getElementById('alert-banner');
    const text = document.getElementById('alert-text');
    if (!banner || !text) return;
    if (dangerReadings.length > 0) {
      const latest = dangerReadings[0];
      text.textContent = `${STATUS_LABELS[latest.status]} heat at ${latest.location} — ${latest.heatIndex.toFixed(1)}°C`;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  /* ============================================
     AUTO-READ TOGGLE (CONTINUOUS SENSOR MODE)
     ============================================ */

  autoRead() {
    if (this.autoReadActive) {
      this.stopAutoRead();
    } else {
      this.startAutoRead();
    }
  }

  async startAutoRead() {
    if (!this.settings.demoMode) {
      // Prefer the local SchoolHeat Bridge when the app is served by it.
      // This allows the Arduino to stay connected to the desktop while
      // phones/tablets view the same live sensor stream over Wi-Fi.
      const bridgeReady = await this.startBridgeRead();
      if (bridgeReady) {
        this.autoReadActive = true;
        this.autoReadLocIndex = 0;
        this.updateAutoReadButton();
        const overlay = document.getElementById('auto-read-overlay');
        if (overlay) {
          overlay.classList.add('active');
          setTimeout(() => overlay.classList.remove('active'), 1500);
        }
        this.toast('Live Arduino Bridge connected', 'success');
        return;
      }

      // Hosted copies (GitHub Pages, etc.) must use the internet/cloud bridge.
      // Do not fall back to Web Serial here, because a hosted page cannot
      // reach the Arduino through the SchoolHeat desktop bridge automatically.
      // This also prevents the confusing "Failed to open serial port" error.
      if (!this.getBridgeBaseUrl()) {
        this.toast('Cloud Live mode: keep the Arduino connected to the bridge computer. This device receives readings automatically.', 'info');
        return;
      }

      // Direct Web Serial is only a fallback when the page is running locally
      // and the user intentionally uses a supported desktop browser.
      if (!navigator.serial) {
        this.toast('No SchoolHeat Bridge found. Start the desktop Bridge first.', 'error');
        return;
      }
      const connected = await this.connectSerial();
      if (!connected) return;
    } else {
      this.toast('Demo Mode ON — Simulating sensor data', 'warning');
    }

    this.autoReadActive = true;
    this.autoReadLocIndex = 0;
    this.updateAutoReadButton();

    const overlay = document.getElementById('auto-read-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), 1500);
    }

    this.performSensorReading();

    this.autoReadInterval = setInterval(() => {
      this.performSensorReading();
    }, 3000);
  }

  stopAutoRead() {
    this.autoReadActive = false;
    if (this.autoReadInterval) {
      clearInterval(this.autoReadInterval);
      this.autoReadInterval = null;
    }
    this.stopBridgeRead();
    this.disconnectSerial();
    this.updateAutoReadButton();
    this.toast('Auto-Read OFF', 'info');
  }

  updateAutoReadButton() {
    const btn = document.getElementById('btn-auto-read');
    const badge = document.getElementById('auto-read-badge');
    if (!btn) return;
    if (this.autoReadActive) {
      btn.classList.add('auto-read-active');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        Stop Auto-Read
      `;
      if (badge) badge.style.display = 'inline-flex';
    } else {
      btn.classList.remove('auto-read-active');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        Auto-Read Arduino
      `;
      if (badge) badge.style.display = 'none';
    }
  }

  performSensorReading() {
    // REAL ARDUINO MODE
    if (!this.settings.demoMode) {
      if (!this.serialConnected) {
        this.toast('Arduino disconnected. Stopping Auto-Read.', 'error');
        this.stopAutoRead();
        return;
      }
      if (!this.lastSerialData) {
        this.toast('Waiting for Arduino data... Make sure your sketch prints T:26.0,H:63.2', 'warning');
        return;
      }
      const locSelect = document.getElementById('location-select');
      const locName = locSelect ? locSelect.value : null;
      if (!locName) {
        this.toast('Please select a location before reading from Arduino.', 'warning');
        this.stopAutoRead();
        return;
      }
      const temp = this.lastSerialData.temp;
      const hum = this.lastSerialData.hum;
      const hi = this.calculateHeatIndex(temp, hum);
      const status = this.getStatus(hi);
      const quality = this.getQualityScore(temp, hum);
      const reading = {
        id: Date.now(),
        location: locName,
        temperature: parseFloat(temp.toFixed(1)),
        humidity: parseFloat(hum.toFixed(1)),
        heatIndex: parseFloat(hi.toFixed(2)),
        status,
        quality: quality.label,
        qualityClass: quality.class,
        timestamp: new Date().toISOString(),
        sensorTimestamp: new Date().toISOString(),
        source: 'arduino'
      };
      // Publish direct Web Serial readings to the internet cloud too.
      this.postCloudReading(reading, reading.sensorTimestamp);
      this.readings.unshift(reading);
      this.saveReadings();
      this.updateDashboard();
      this.renderHistory();
      this.renderMap();
      this.checkAlerts();
      this.updateMonitorGauge();
      this.updateRecentLocations();
      const tempInput = document.getElementById('temp-input');
      const humInput = document.getElementById('humidity-input');
      if (tempInput) tempInput.value = temp.toFixed(1);
      if (humInput) humInput.value = hum.toFixed(1);
      this.updatePreview();
      this.toast(`Saved: ${locName} — ${hi.toFixed(1)}°C (${STATUS_LABELS[status]})`, 'success');
      return;
    }

    // DEMO MODE
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
      location: loc.name,
      temperature: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(hum.toFixed(1)),
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
    this.updateMonitorGauge();

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

  /* ============================================
     INTERNET CLOUD SYNC — WORKS WITHOUT SAME WI-FI
     ============================================ */

  getCloudConfig() {
    const cfg = window.SCHOOLHEAT_CLOUD || {};
    if (!cfg.enabled || !cfg.apiKey || cfg.apiKey.startsWith('PASTE_') ||
        !cfg.databaseURL || cfg.databaseURL.includes('YOUR_PROJECT') ||
        !cfg.projectId || cfg.projectId === 'YOUR_PROJECT') return null;
    return cfg;
  }

  async cloudAuthenticate(force = false) {
    const cfg = this.getCloudConfig();
    if (!cfg) return false;
    if (!force && this.cloudToken && Date.now() < this.cloudTokenExpiry - 60000) return true;
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(cfg.apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true })
      });
      if (!response.ok) throw new Error('Firebase anonymous sign-in failed');
      const data = await response.json();
      this.cloudToken = data.idToken;
      this.cloudRefreshToken = data.refreshToken || null;
      this.cloudTokenExpiry = Date.now() + (Number(data.expiresIn || 3600) * 1000);
      return true;
    } catch (err) {
      this.cloudToken = null;
      return false;
    }
  }

  cloudKey(value) {
    return btoa(unescape(encodeURIComponent(String(value))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  async cloudRequest(path, options = {}, retry = true) {
    const cfg = this.getCloudConfig();
    if (!cfg) return null;
    if (!(await this.cloudAuthenticate())) return null;
    const separator = path.includes('?') ? '&' : '?';
    const url = `${cfg.databaseURL.replace(/\/$/, '')}/${cfg.path}/${path}${separator}auth=${encodeURIComponent(this.cloudToken)}`;
    const response = await fetch(url, { cache: 'no-store', ...options });
    if (response.status === 401 && retry) {
      await this.cloudAuthenticate(true);
      return this.cloudRequest(path, options, false);
    }
    if (!response.ok) throw new Error(`Cloud request failed (${response.status})`);
    if (response.status === 204) return null;
    return response.json();
  }

  async startCloudSync() {
    if (!this.getCloudConfig() || this.settings.demoMode) return false;
    const ok = await this.cloudAuthenticate();
    if (!ok) return false;
    await this.syncCloudLocation();
    await this.syncCloudReadings();
    if (this.cloudSyncTimer) clearInterval(this.cloudSyncTimer);
    this.cloudSyncTimer = setInterval(() => this.syncCloudReadings(), 2000);
    return true;
  }

  async syncCloudLocation() {
    const cfg = this.getCloudConfig();
    if (!cfg) return;
    try {
      const remote = await this.cloudRequest('location.json');
      const select = document.getElementById('location-select');
      if (remote && select && [...select.options].some(o => o.value === remote)) {
        select.value = remote;
      } else if (select?.value) {
        await this.cloudRequest('location.json', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(select.value)
        });
      }
    } catch (err) {}
  }

  async setCloudLocation(location) {
    if (!location || !this.getCloudConfig()) return;
    try {
      await this.cloudRequest('location.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
      });
    } catch (err) {}
  }

  async syncCloudReadings() {
    if (this.cloudSyncBusy || !this.getCloudConfig() || this.settings.demoMode) return;
    this.cloudSyncBusy = true;
    try {
      const data = await this.cloudRequest('readings.json?orderBy=%22sensorTimestamp%22&limitToLast=500');
      const incoming = data && typeof data === 'object' ? Object.values(data) : [];
      const localBySensor = new Map(this.readings.filter(r => r.sensorTimestamp).map(r => [r.sensorTimestamp, r]));
      let changed = false;
      for (const r of incoming) {
        const key = r.sensorTimestamp || r.timestamp;
        if (!key || localBySensor.has(key) || r.temperature == null || r.humidity == null) continue;
        const temp = Number(r.temperature), hum = Number(r.humidity);
        const hi = r.heatIndex != null ? Number(r.heatIndex) : this.calculateHeatIndex(temp, hum);
        const quality = this.getQualityScore(temp, hum);
        const complete = {
          id: r.id || Date.now(), location: r.location || document.getElementById('location-select')?.value,
          temperature: Number(temp.toFixed(1)), humidity: Number(hum.toFixed(1)),
          heatIndex: Number(hi.toFixed(2)), status: r.status || this.getStatus(hi),
          quality: r.quality || quality.label, qualityClass: r.qualityClass || quality.class,
          timestamp: r.timestamp || key, sensorTimestamp: key, source: 'arduino'
        };
        if (!complete.location) continue;
        this.readings.push(complete);
        localBySensor.set(key, complete);
        changed = true;
      }
      if (changed) {
        this.readings.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.saveReadings(); this.updateDashboard(); this.renderHistory(); this.renderMap();
        this.checkAlerts(); this.updateRecentLocations(); this.updateMonitorGauge();
      }
    } catch (err) {
      // Cloud may be temporarily unavailable; keep local readings intact.
    } finally {
      this.cloudSyncBusy = false;
    }
  }

  async postCloudReading(reading, sensorTimestamp) {
    const cfg = this.getCloudConfig();
    if (!cfg) return false;
    try {
      const key = this.cloudKey(sensorTimestamp || reading.timestamp);
      await this.cloudRequest(`readings/${key}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reading, sensorTimestamp: sensorTimestamp || reading.timestamp })
      });
      return true;
    } catch (err) { return false; }
  }

  /* ============================================
     SCHOOLHEAT BRIDGE — DESKTOP ARDUINO TO PHONE
     ============================================ */

  getBridgeBaseUrl() {
    // The local Python bridge is used only when the page is actually served
    // by the bridge. GitHub Pages and other hosted copies use cloud sync.
    const host = location.hostname || '';
    const localHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' ||
      /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);
    return (location.protocol === 'http:' && localHost) ? location.origin : '';
  }

  async startBridgeRead() {
    const base = this.getBridgeBaseUrl();
    if (!base) return false;
    try {
      const response = await fetch(base + '/api/status', { cache: 'no-store' });
      if (!response.ok) return false;
      const status = await response.json();
      if (!status.bridge) return false;

      this.bridgeConnected = true;
      this.lastBridgeTimestamp = null;
      if (status.location) {
        const select = document.getElementById('location-select');
        if (select && [...select.options].some(o => o.value === status.location)) select.value = status.location;
      } else {
        const select = document.getElementById('location-select');
        if (select && select.value) await this.setBridgeLocation(select.value);
      }
      await this.syncSharedReadings();
      await this.fetchBridgeReading();
      this.bridgeTimer = setInterval(() => this.fetchBridgeReading(), 1000);
      return true;
    } catch (err) {
      this.bridgeConnected = false;
      return false;
    }
  }

  async startSharedSync() {
    const base = this.getBridgeBaseUrl();
    if (!base || this.settings.demoMode) return false;
    try {
      const response = await fetch(base + '/api/status', { cache: 'no-store' });
      if (!response.ok) return false;
      const status = await response.json();
      if (!status.bridge) return false;
      this.bridgeConnected = true;
      if (status.location) {
        const select = document.getElementById('location-select');
        if (select && [...select.options].some(o => o.value === status.location)) select.value = status.location;
      } else {
        const select = document.getElementById('location-select');
        if (select && select.value) this.setBridgeLocation(select.value);
      }
      await this.syncSharedReadings();
      await this.fetchBridgeReading();
      if (this.sharedSyncTimer) clearInterval(this.sharedSyncTimer);
      this.sharedSyncTimer = setInterval(() => this.syncSharedReadings(), 1500);
      return true;
    } catch (err) {
      this.bridgeConnected = false;
      return false;
    }
  }

  async fetchBridgeReading() {
    if (!this.bridgeConnected) return;
    const base = this.getBridgeBaseUrl();
    if (!base) return;
    try {
      const response = await fetch(base + '/api/latest', { cache: 'no-store' });
      if (!response.ok) throw new Error('Bridge unavailable');
      const data = await response.json();
      if (!data || data.temperature == null || data.humidity == null || !data.timestamp) return;

      const stamp = data.timestamp;
      if (stamp === this.lastBridgeTimestamp) return;
      this.lastBridgeTimestamp = stamp;
      this.lastSerialData = { temp: Number(data.temperature), hum: Number(data.humidity) };

      const locSelect = document.getElementById('location-select');
      const locName = locSelect ? locSelect.value : null;
      if (!locName) return;

      // Calculate exactly the same way the existing SchoolHeat code does.
      const temp = this.lastSerialData.temp;
      const hum = this.lastSerialData.hum;
      const hi = this.calculateHeatIndex(temp, hum);
      const status = this.getStatus(hi);
      const quality = this.getQualityScore(temp, hum);
      const reading = {
        id: Date.now(),
        location: locName,
        temperature: parseFloat(temp.toFixed(1)),
        humidity: parseFloat(hum.toFixed(1)),
        heatIndex: parseFloat(hi.toFixed(2)),
        status,
        quality: quality.label,
        qualityClass: quality.class,
        timestamp: stamp,
        sensorTimestamp: stamp,
        source: 'arduino'
      };

      // Do not create a local duplicate if this sample was already synced.
      if (!this.readings.some(r => r.sensorTimestamp === stamp)) {
        this.readings.unshift(reading);
        this.saveReadings();
        this.updateDashboard();
        this.renderHistory();
        this.renderMap();
        this.checkAlerts();
        this.updateRecentLocations();
        this.updateMonitorGauge();
      }

      const tempInput = document.getElementById('temp-input');
      const humInput = document.getElementById('humidity-input');
      if (tempInput) tempInput.value = temp.toFixed(1);
      if (humInput) humInput.value = hum.toFixed(1);
      this.updatePreview();
      await this.postSharedReading(reading, stamp);
      await this.postCloudReading(reading, stamp);
    } catch (err) {
      this.bridgeConnected = false;
      if (this.bridgeTimer) {
        clearInterval(this.bridgeTimer);
        this.bridgeTimer = null;
      }
    }
  }

  stopBridgeRead() {
    this.bridgeConnected = false;
    if (this.bridgeTimer) {
      clearInterval(this.bridgeTimer);
      this.bridgeTimer = null;
    }
    if (this.sharedSyncTimer) {
      clearInterval(this.sharedSyncTimer);
      this.sharedSyncTimer = null;
    }
  }

  async syncSharedReadings() {
    if (this.sharedSyncBusy) return;
    const base = this.getBridgeBaseUrl();
    if (!base) return;
    this.sharedSyncBusy = true;
    try {
      const response = await fetch(base + '/api/readings', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const incoming = Array.isArray(data.readings) ? data.readings : [];
      const localBySensor = new Map(
        this.readings.filter(r => r.sensorTimestamp).map(r => [r.sensorTimestamp, r])
      );
      const select = document.getElementById('location-select');
      const defaultLocation = select?.value || null;
      let changed = false;

      for (const r of incoming) {
        const key = r.sensorTimestamp || r.timestamp;
        if (!key || localBySensor.has(key)) continue;

        let complete = r;
        // Raw samples are calculated here with the existing SchoolHeat formula.
        if (r.heatIndex == null) {
          const location = r.location || defaultLocation;
          if (!location || r.temperature == null || r.humidity == null) continue;
          const temp = Number(r.temperature);
          const hum = Number(r.humidity);
          const hi = this.calculateHeatIndex(temp, hum);
          const quality = this.getQualityScore(temp, hum);
          complete = {
            id: Date.now(),
            location,
            temperature: parseFloat(temp.toFixed(1)),
            humidity: parseFloat(hum.toFixed(1)),
            heatIndex: parseFloat(hi.toFixed(2)),
            status: this.getStatus(hi),
            quality: quality.label,
            qualityClass: quality.class,
            timestamp: r.sensorTimestamp || new Date().toISOString(),
            sensorTimestamp: key,
            source: 'arduino'
          };
          await this.postSharedReading(complete, key);
          await this.postCloudReading(complete, key);
        } else {
          complete = {
            id: r.id || Date.now(),
            location: r.location,
            temperature: Number(r.temperature),
            humidity: Number(r.humidity),
            heatIndex: Number(r.heatIndex),
            status: r.status,
            quality: r.quality || 'Good',
            qualityClass: r.qualityClass || '',
            timestamp: r.timestamp || new Date().toISOString(),
            sensorTimestamp: key,
            source: r.source || 'arduino'
          };
        }

        this.readings.push(complete);
        localBySensor.set(key, complete);
        changed = true;
      }

      if (changed) {
        this.readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.saveReadings();
        this.updateDashboard();
        this.renderHistory();
        this.renderMap();
        this.checkAlerts();
        this.updateRecentLocations();
        this.updateMonitorGauge();
      }
    } catch (err) {
      // The bridge can be temporarily offline; local data remains available.
    } finally {
      this.sharedSyncBusy = false;
    }
  }

  async setBridgeLocation(location) {
    const base = this.getBridgeBaseUrl();
    if (!location) return;
    if (base) try {
      await fetch(base + '/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      });
    } catch (err) {}
    await this.setCloudLocation(location);
  }

  async postSharedReading(reading, sensorTimestamp) {
    const base = this.getBridgeBaseUrl();
    if (!base) return;
    try {
      await fetch(base + '/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reading, sensorTimestamp: sensorTimestamp || reading.timestamp })
      });
    } catch (err) {
      // Keep the reading locally if the bridge is temporarily unavailable.
    }
  }

  /* ============================================
     WEB SERIAL API — REAL ARDUINO
     ============================================ */

  async connectSerial() {
    if (!navigator.serial) {
      this.toast('Web Serial API not available. Use Chrome/Edge on desktop.', 'error');
      return false;
    }
    try {
      this.serialPort = await navigator.serial.requestPort({ filters: [] });
      await this.serialPort.open({ baudRate: 9600 });
      this.serialConnected = true;
      this.toast('Arduino connected via USB Serial', 'success');
      this.readSerialLoop();
      return true;
    } catch (err) {
      if (err.name === 'NotFoundError') {
        this.toast('No Arduino selected. Plug in your Arduino and try again.', 'warning');
      } else if (err.name === 'AbortError') {
        this.toast('Arduino connection cancelled.', 'info');
      } else {
        this.toast('Serial error: ' + err.message, 'error');
      }
      return false;
    }
  }

  async disconnectSerial() {
    this.serialConnected = false;
    if (this.serialReader) {
      try { await this.serialReader.cancel(); } catch (e) {}
      this.serialReader = null;
    }
    if (this.serialPort) {
      try { await this.serialPort.close(); } catch (e) {}
      this.serialPort = null;
    }
  }

  async readSerialLoop() {
    if (!this.serialPort || !this.serialConnected) return;
    try {
      const textDecoder = new TextDecoderStream();
      const readableClosed = this.serialPort.readable.pipeTo(textDecoder.writable);
      this.serialReader = textDecoder.readable.getReader();
      let buffer = '';
      while (this.serialConnected) {
        const { value, done } = await this.serialReader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          this.parseSerialLine(line.trim());
        }
      }
    } catch (err) {
      if (this.serialConnected) {
        this.toast('Serial read error: ' + err.message, 'error');
        this.stopAutoRead();
      }
    }
  }

  parseSerialLine(line) {
    if (!line) return;
    let temp = null, hum = null;
    const thMatch = line.match(/[Tt]emp(?:erature)?[:=]\s*([0-9.]+).*?[Hh]um(?:idity)?[:=]\s*([0-9.]+)/);
    if (thMatch) { temp = parseFloat(thMatch[1]); hum = parseFloat(thMatch[2]); }
    if (temp === null) {
      const simpleMatch = line.match(/^([0-9.]+)[,;\s]+([0-9.]+)$/);
      if (simpleMatch) { temp = parseFloat(simpleMatch[1]); hum = parseFloat(simpleMatch[2]); }
    }
    if (temp === null) {
      try {
        const json = JSON.parse(line);
        if (json.t !== undefined && json.h !== undefined) {
          temp = parseFloat(json.t); hum = parseFloat(json.h);
        } else if (json.temperature !== undefined && json.humidity !== undefined) {
          temp = parseFloat(json.temperature); hum = parseFloat(json.humidity);
        }
      } catch (e) {}
    }
    if (temp !== null && hum !== null && !isNaN(temp) && !isNaN(hum)) {
      this.lastSerialData = { temp, hum };
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

  drawMonitorGauge(value) {
    const canvas = document.getElementById('monitor-gauge');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const centerX = w / 2;
    const centerY = h * 0.72;
    const radius = Math.min(w, h) * 0.38;
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
    const color = STATUS_COLORS[status] || STATUS_COLORS.nodata;

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
      { angle: Math.PI * 1.25, text: '27°' },
      { angle: Math.PI * 2.25, text: '55°' }
    ];
    labels.forEach(la => {
      const lr = radius + lineWidth / 2 + 16;
      ctx.fillText(la.text, centerX + Math.cos(la.angle) * lr, centerY + Math.sin(la.angle) * lr);
    });
  }

  updateDashboard() {
    const counts = { safe: 0, caution: 0, danger: 0, extreme: 0 };
    const latestByLoc = {};
    this.readings.forEach(r => {
      if (!latestByLoc[r.location] || new Date(r.timestamp) > new Date(latestByLoc[r.location].timestamp)) {
        latestByLoc[r.location] = r;
      }
    });
    Object.values(latestByLoc).forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });

    Object.entries(counts).forEach(([status, count]) => {
      const el = document.getElementById('count-' + status);
      if (el) this.animateCounter(el, parseInt(el.textContent) || 0, count);
    });

    const latest = this.readings[0];
    if (latest) {
      document.getElementById('gauge-value').textContent = latest.heatIndex.toFixed(1);
      document.getElementById('latest-location').textContent = latest.location;
      document.getElementById('latest-time').textContent = this.formatTime(latest.timestamp);
      document.getElementById('latest-temp').textContent = latest.temperature.toFixed(1) + '°C';
      document.getElementById('latest-humidity').textContent = latest.humidity.toFixed(1) + '%';
      document.getElementById('latest-hi').textContent = latest.heatIndex.toFixed(1) + '°C';
      const stEl = document.getElementById('latest-status');
      stEl.textContent = STATUS_LABELS[latest.status];
      stEl.className = 'status-pill ' + latest.status;
      this.drawGauge(latest.heatIndex);
    } else {
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
              <div class="activity-loc">${r.location}</div>
              <div class="activity-meta">${this.formatTime(r.timestamp)} • ${r.temperature.toFixed(1)}°C / ${r.humidity.toFixed(1)}%</div>
            </div>
            <div class="activity-hi ${r.status}">${r.heatIndex.toFixed(1)}°C</div>
          </div>
        `).join('');
      }
    }

    this.checkAlerts();
    this.updateRecentLocations();
    this.updateMonitorGauge();
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
    const size = canvas.width;
    const center = size / 2;
    const radius = size * 0.38;
    const lineWidth = size * 0.055;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.shadowColor = 'rgba(59, 130, 246, 0.25)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(center, center, radius, Math.PI * 0.8, Math.PI * 2.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    const segments = [
      { start: Math.PI * 0.8, end: Math.PI * 1.1, color: STATUS_COLORS.safe },
      { start: Math.PI * 1.1, end: Math.PI * 1.4, color: STATUS_COLORS.caution },
      { start: Math.PI * 1.4, end: Math.PI * 1.7, color: STATUS_COLORS.danger },
      { start: Math.PI * 1.7, end: Math.PI * 2.2, color: STATUS_COLORS.extreme }
    ];
    segments.forEach(seg => {
      ctx.beginPath();
      ctx.arc(center, center, radius, seg.start, seg.end);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineWidth * 0.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    const maxVal = 50;
    const angle = Math.PI * 0.8 + (Math.min(value, maxVal) / maxVal) * (Math.PI * 1.4);
    const status = this.getStatus(value);
    const color = STATUS_COLORS[status] || STATUS_COLORS.nodata;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(center, center, radius, Math.PI * 0.8, angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    if (value > 0) {
      const needleLen = radius - 6;
      const nx = center + Math.cos(angle) * needleLen;
      const ny = center + Math.sin(angle) * needleLen;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(center, center, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
  }

  renderHistory() {
    const list = document.getElementById('history-list');
    const search = document.getElementById('history-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('history-filter')?.value || 'all';
    if (!list) return;

    let filtered = this.readings;
    if (search) {
      filtered = filtered.filter(r =>
        r.location.toLowerCase().includes(search) ||
        r.status.toLowerCase().includes(search)
      );
    }
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter);
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="empty-title">No readings match</div>
          <div class="empty-desc">Try adjusting your search or filters</div>
        </div>`;
    } else {
      list.innerHTML = filtered.map((r, i) => `
        <div class="history-item" style="animation-delay:${Math.min(i*0.03,0.4)}s">
          <div class="history-pin ${r.status}">${r.heatIndex.toFixed(0)}</div>
          <div class="history-info">
            <div class="history-loc">${r.location}</div>
            <div class="history-meta">
              <span>${this.formatTime(r.timestamp)}</span>
              <span>${r.temperature.toFixed(1)}°C</span>
              <span>${r.humidity.toFixed(1)}%</span>
              ${r.quality ? `<span class="quality-badge ${r.qualityClass}">${r.quality}</span>` : ''}
            </div>
          </div>
          <div class="history-hi ${r.status}">${r.heatIndex.toFixed(1)}°C</div>
        </div>
      `).join('');
    }

    this.drawDistributionChart();
  }

  filterHistory() {
    this.renderHistory();
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
    const dpr = window.devicePixelRatio || 1;
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
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add at least 2 readings to see the trend', w/2, h/2);
      return;
    }

    const byDate = {};
    this.readings.slice().reverse().forEach(r => {
      const d = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate[d]) byDate[d] = { sum: 0, count: 0 };
      byDate[d].sum += r.heatIndex;
      byDate[d].count++;
    });
    const labels = Object.keys(byDate).slice(-10);
    const data = labels.map(d => byDate[d].sum / byDate[d].count);

    let maxVal = Math.max(...data, 45);
    let minVal = Math.min(...data, 20);
    const range = maxVal - minVal;
    const step = range <= 10 ? 2 : range <= 20 ? 5 : 10;
    maxVal = Math.ceil(maxVal / step) * step;
    minVal = Math.floor(minVal / step) * step;
    const niceRange = maxVal - minVal || 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridCount = Math.round(niceRange / step);
    for (let i = 0; i <= gridCount; i++) {
      const val = maxVal - (step * i);
      const y = pad.top + (chartH / gridCount) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(0) + '°', pad.left - 8, y);
    }

    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    labels.forEach((label, i) => {
      const x = pad.left + (chartW / (labels.length - 1)) * i;
      ctx.fillStyle = '#6b7280';
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
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    ctx.shadowColor = 'rgba(59, 130, 246, 0.35)';
    ctx.shadowBlur = 12;
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
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    points.forEach(p => {
      const color = STATUS_COLORS[p.status];
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.12;
      ctx.fill();
      ctx.restore();
    });

    if (tooltip) {
      canvas.onmousemove = (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * dpr;
        const my = (e.clientY - r.top) * dpr;
        let closest = null;
        let minDist = Infinity;
        points.forEach(p => {
          const d = Math.hypot(p.x - mx, p.y - my);
          if (d < 24 * dpr && d < minDist) { minDist = d; closest = p; }
        });
        if (closest) {
          tooltip.innerHTML = `<div class="tt-date">${closest.label}</div><div class="tt-val ${closest.status}">${closest.val.toFixed(1)}°C — ${STATUS_LABELS[closest.status]}</div>`;
          tooltip.style.left = (closest.x / dpr) + 'px';
          tooltip.style.top = ((closest.y / dpr) - 55) + 'px';
          tooltip.classList.add('visible');
        } else {
          tooltip.classList.remove('visible');
        }
      };
      canvas.onmouseleave = () => tooltip.classList.remove('visible');
    }
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
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const centerX = w * 0.32;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.26;
    const thickness = 16;

    ctx.clearRect(0, 0, w, h);

    const counts = { safe: 0, caution: 0, danger: 0, extreme: 0 };
    this.readings.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    if (total === 0) {
      ctx.fillStyle = '#6b7280';
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
      const color = STATUS_COLORS[status];

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

    ctx.fillStyle = '#f0f0f5';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 5);
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Readings', centerX, centerY + 10);

    const legendEl = document.getElementById('distribution-legend');
    if (legendEl) {
      legendEl.innerHTML = statuses.map(s => {
        const pct = total > 0 ? Math.round((counts[s] / total) * 100) : 0;
        return `
          <div class="dist-legend-item">
            <span style="background:${STATUS_COLORS[s]}"></span>
            <span>${STATUS_LABELS[s]}</span>
            <span class="dist-count">${counts[s]} (${pct}%)</span>
          </div>
        `;
      }).join('');
    }
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

  drawForecastChart() {
    const canvas = document.getElementById('forecast-chart');
    const tooltip = document.getElementById('forecast-tooltip');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 32, right: 20, bottom: 44, left: 48 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    if (this.readings.length < 3) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Collect at least 3 days of data for forecast', w/2, h/2);
      document.getElementById('forecast-summary').innerHTML = `
        <div class="empty-state compact">
          <div class="empty-icon small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.5 19c0-1.7-1.3-3-3-3c-1.1 0-2.1.6-2.6 1.5L9 14.5c-.5-.9-1.5-1.5-2.6-1.5c-1.7 0-3 1.3-3 3"/><path d="M22 19c0-1.7-1.3-3-3-3c-1.1 0-2.1.6-2.6 1.5L13.5 14.5c-.5-.9-1.5-1.5-2.6-1.5c-1.7 0-3 1.3-3 3"/><path d="M2 19c0-1.7 1.3-3 3-3c1.1 0 2.1.6 2.6 1.5L10.5 14.5c.5-.9 1.5-1.5 2.6-1.5c1.7 0 3 1.3 3 3"/></svg></div>
          <div class="empty-desc">Collect at least 3 days of data to generate a forecast</div>
        </div>`;
      document.getElementById('forecast-cards').innerHTML = '';
      return;
    }

    const recent = this.readings.slice(0, Math.min(this.readings.length, 20)).reverse();
    const n = recent.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    recent.forEach((r, i) => {
      sumX += i;
      sumY += r.heatIndex;
      sumXY += i * r.heatIndex;
      sumX2 += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n;

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = new Date();
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const val = intercept + slope * (n + i - 1);
      forecast.push({
        day: days[d.getDay()],
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.max(20, val),
        status: this.getStatus(Math.max(20, val))
      });
    }

    const allValues = [...recent.map(r => r.heatIndex), ...forecast.map(f => f.value)];
    let maxVal = Math.max(...allValues, 45);
    let minVal = Math.min(...allValues, 20);
    const range = maxVal - minVal;
    const step = range <= 10 ? 2 : range <= 20 ? 5 : 10;
    maxVal = Math.ceil(maxVal / step) * step;
    minVal = Math.floor(minVal / step) * step;
    const niceRange = maxVal - minVal || 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridCount = Math.round(niceRange / step);
    for (let i = 0; i <= gridCount; i++) {
      const val = maxVal - (step * i);
      const y = pad.top + (chartH / gridCount) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(0) + '°', pad.left - 8, y);
    }

    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const histCount = Math.min(5, recent.length);
    const histPoints = [];
    for (let i = 0; i < histCount; i++) {
      const idx = recent.length - histCount + i;
      const x = pad.left + (chartW / 11) * i;
      const y = pad.top + chartH - ((recent[idx].heatIndex - minVal) / niceRange) * chartH;
      histPoints.push({ x, y, val: recent[idx].heatIndex, status: recent[idx].status, type: 'hist', day: days[new Date(recent[idx].timestamp).getDay()] });
    }

    const fcPoints = forecast.map((f, i) => ({
      x: pad.left + (chartW / 11) * (histCount + i),
      y: pad.top + chartH - ((f.value - minVal) / niceRange) * chartH,
      val: f.value,
      status: f.status,
      type: 'fc',
      day: f.day
    }));

    const allPoints = [...histPoints, ...fcPoints];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    allPoints.forEach((p, i) => {
      ctx.fillStyle = p.type === 'fc' ? '#9ca3af' : '#6b7280';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(p.day || (i+1), p.x, pad.top + chartH + 10);
    });

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(histPoints[0].x, histPoints[0].y);
    for (let i = 1; i < histPoints.length; i++) ctx.lineTo(histPoints[i].x, histPoints[i].y);
    ctx.strokeStyle = 'rgba(107,114,128,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const grad = ctx.createLinearGradient(fcPoints[0].x, 0, fcPoints[fcPoints.length-1].x, 0);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#8b5cf6');

    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.3)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(fcPoints[0].x, fcPoints[0].y);
    for (let i = 1; i < fcPoints.length; i++) {
      const prev = fcPoints[i-1];
      const curr = fcPoints[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(fcPoints[0].x, pad.top + chartH);
    fcPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(fcPoints[fcPoints.length-1].x, pad.top + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    areaGrad.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
    areaGrad.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    allPoints.forEach(p => {
      const color = STATUS_COLORS[p.status];
      ctx.save();
      if (p.type === 'fc') {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.type === 'fc' ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (p.type === 'fc') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.12;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });

    const cardsEl = document.getElementById('forecast-cards');
    if (cardsEl) {
      cardsEl.innerHTML = forecast.map(f => `
        <div class="forecast-day">
          <div class="forecast-day-name">${f.day}</div>
          <div class="forecast-day-date">${f.date}</div>
          <div class="forecast-day-icon">${this.getWeatherIcon(f.status)}</div>
          <div class="forecast-day-temp ${f.status}">${f.value.toFixed(1)}°</div>
          <div class="forecast-day-label ${f.status}">${STATUS_LABELS[f.status]}</div>
        </div>
      `).join('');
    }

    const summary = document.getElementById('forecast-summary');
    if (summary) {
      const avg = forecast.reduce((a, f) => a + f.value, 0) / forecast.length;
      const avgStatus = this.getStatus(avg);
      const maxFc = Math.max(...forecast.map(f => f.value));
      const minFc = Math.min(...forecast.map(f => f.value));
      summary.innerHTML = `
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
          <span>Avg: <strong style="color:${STATUS_COLORS[avgStatus]}">${avg.toFixed(1)}°C</strong></span>
          <span>High: <strong style="color:${STATUS_COLORS[this.getStatus(maxFc)]}">${maxFc.toFixed(1)}°C</strong></span>
          <span>Low: <strong style="color:${STATUS_COLORS[this.getStatus(minFc)]}">${minFc.toFixed(1)}°C</strong></span>
        </div>
        <div style="margin-top:6px;font-size:0.72rem;color:var(--text-muted);">Next 7 days forecast based on ${n} recent readings</div>
      `;
    }

    if (tooltip) {
      canvas.onmousemove = (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * dpr;
        const my = (e.clientY - r.top) * dpr;
        let closest = null;
        let minDist = Infinity;
        allPoints.forEach(p => {
          const d = Math.hypot(p.x - mx, p.y - my);
          if (d < 24 * dpr && d < minDist) { minDist = d; closest = p; }
        });
        if (closest) {
          const prefix = closest.type === 'fc' ? 'Forecast' : 'Recorded';
          tooltip.innerHTML = `<div class="tt-date">${prefix}: ${closest.day}</div><div class="tt-val ${closest.status}">${closest.val.toFixed(1)}°C — ${STATUS_LABELS[closest.status]}</div>`;
          tooltip.style.left = (closest.x / dpr) + 'px';
          tooltip.style.top = ((closest.y / dpr) - 55) + 'px';
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
      const status = reading ? reading.status : 'nodata';
      const hi = reading ? reading.heatIndex.toFixed(1) + '°C' : 'No data';
      const safeName = loc.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      return `
        <div class="map-pin ${status}" style="left:${loc.x}%;top:${loc.y}%" data-loc="${safeName}" onclick="app.togglePinTooltip(this)">
          <div class="map-pin-tooltip">
            <div class="tt-loc">${safeName}</div>
            <div class="tt-hi ${status}">${hi}</div>
          </div>
        </div>
      `;
    }).join('');

    this.syncMapPins();
  }

  togglePinTooltip(pinEl) {
    document.querySelectorAll('.map-pin.active').forEach(p => {
      if (p !== pinEl) p.classList.remove('active');
    });
    pinEl.classList.toggle('active');
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
    const sms = document.getElementById('setting-sms');
    const out = document.getElementById('setting-outlier');
    const spk = document.getElementById('setting-spike');
    const demo = document.getElementById('setting-demo');
    const darkmode = document.getElementById('setting-darkmode');
    const cTemp = document.getElementById('cal-temp');
    const cHum = document.getElementById('cal-humidity');
    const alertPhone = document.getElementById('alert-phone');
    if (fb) fb.checked = this.settings.firebase;
    if (sms) sms.checked = this.settings.sms;
    if (out) out.checked = this.settings.outlier;
    if (spk) spk.checked = this.settings.spike;
    if (demo) demo.checked = this.settings.demoMode;
    if (darkmode) darkmode.checked = this.settings.darkMode;
    if (cTemp) cTemp.value = this.settings.tempOffset;
    if (cHum) cHum.value = this.settings.humidityOffset;
    if (alertPhone) alertPhone.value = this.settings.emergencyPhone || '';
    // Apply dark mode on load
    if (this.settings.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  saveSettings() {
    this.settings = {
      firebase: document.getElementById('setting-firebase')?.checked ?? true,
      sms: document.getElementById('setting-sms')?.checked ?? false,
      outlier: document.getElementById('setting-outlier')?.checked ?? true,
      spike: document.getElementById('setting-spike')?.checked ?? true,
      demoMode: document.getElementById('setting-demo')?.checked ?? false,
      darkMode: document.getElementById('setting-darkmode')?.checked ?? false,
      tempOffset: parseFloat(document.getElementById('cal-temp')?.value) || 0,
      humidityOffset: parseFloat(document.getElementById('cal-humidity')?.value) || 0,
      emergencyPhone: document.getElementById('alert-phone')?.value || ''
    };
    localStorage.setItem('sh_settings', JSON.stringify(this.settings));
    this.toast('Settings saved', 'success');
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
          location: loc,
          temperature: parseFloat(temp.toFixed(1)),
          humidity: parseFloat(hum.toFixed(1)),
          heatIndex: parseFloat(hi.toFixed(2)),
          status: this.getStatus(hi),
          quality: quality.label,
          qualityClass: quality.class,
          timestamp: ts.toISOString()
        });
      }
    }
    this.readings = demo.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    this.saveReadings();
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.trendChartLoaded = false;
    this.distributionChartLoaded = false;
    this.forecastChartLoaded = false;
    this.drawTrendChart();
    this.drawDistributionChart();
    this.drawForecastChart();
    if (!silent) this.toast('Demo data generated! 7 days of readings added.', 'success');
  }

  clearAllData() {
    if (!confirm('Are you sure you want to clear ALL readings? This cannot be undone.')) return;
    this.readings = [];
    this.saveReadings();
    this.updateDashboard();
    this.renderHistory();
    this.renderMap();
    this.trendChartLoaded = false;
    this.distributionChartLoaded = false;
    this.forecastChartLoaded = false;
    this.drawTrendChart();
    this.drawDistributionChart();
    this.drawForecastChart();
    this.toast('All data cleared.', 'info');
  }

  exportCSV() {
    if (this.readings.length === 0) {
      this.toast('No data to export', 'warning');
      return;
    }
    const headers = ['ID','Location','Temperature (°C)','Humidity (%)','Heat Index (°C)','Status','Quality','Timestamp'];
    const rows = this.readings.map(r => [r.id, r.location, r.temperature, r.humidity, r.heatIndex, r.status, r.quality || '-', r.timestamp]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    this.downloadFile(csv, 'schoolheat_readings.csv', 'text/csv');
    this.toast('CSV exported successfully', 'success');
  }

  exportJSON() {
    if (this.readings.length === 0) {
      this.toast('No data to export', 'warning');
      return;
    }
    const json = JSON.stringify(this.readings, null, 2);
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

  switchTab(tabId) {
    if (!document.getElementById('tab-' + tabId)) return;
    this.currentTab = tabId;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabId)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-tab="${tabId}"]`)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'history') {
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
        this.syncMapPins();
        const img = document.getElementById('map-img');
        if (img && !img.src && img.dataset.attempt === '0') {
          img.src = 'assets/campus-map.jpg';
        }
      }, 100);
    }
    if (tabId === 'monitor') {
      this.updateRecentLocations();
      this.updateMonitorGauge();
    }
  }

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = {
      success: '<svg class="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg class="toast-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg class="toast-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg class="toast-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = (icons[type] || icons.info) + '<span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  toggleDarkMode() {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  sendDistributionAlert() {
    const phone = this.settings.emergencyPhone;
    if (!phone) {
      this.toast('Please set emergency phone number in Settings', 'warning');
      this.switchTab('settings');
      return;
    }
    
    const safeCnt = this.readings.filter(r => r.status === 'safe').length;
    const cautionCnt = this.readings.filter(r => r.status === 'caution').length;
    const dangerCnt = this.readings.filter(r => r.status === 'danger').length;
    const extremeCnt = this.readings.filter(r => r.status === 'extreme').length;
    
    const msg = `🔥 SchoolHeat Alert: Safe: ${safeCnt} | Caution: ${cautionCnt} | Danger: ${dangerCnt} | EXTREME: ${extremeCnt}`;
    this.sendSMSAlert(phone, msg, 'distribution');
  }

  sendForecastAlert() {
    const phone = this.settings.emergencyPhone;
    if (!phone) {
      this.toast('Please set emergency phone number in Settings', 'warning');
      this.switchTab('settings');
      return;
    }
    
    const forecast = this.generateForecastData();
    if (!forecast || forecast.length === 0) {
      this.toast('No forecast data available yet', 'warning');
      return;
    }
    
    const extremeDays = forecast.filter(f => f.status === 'extreme').length;
    const msg = `📊 7-Day Forecast: ${extremeDays} days with EXTREME heat expected. Max: ${Math.max(...forecast.map(f => f.value)).toFixed(1)}°C`;
    this.sendSMSAlert(phone, msg, 'forecast');
  }

  testAlertMessage() {
    const phone = this.settings.emergencyPhone;
    if (!phone) {
      this.toast('Please set emergency phone number first', 'warning');
      return;
    }
    const msg = `🧪 Test Alert from SchoolHeat: System is functioning correctly. Current time: ${new Date().toLocaleTimeString()}`;
    this.sendSMSAlert(phone, msg, 'test');
  }

  sendSMSAlert(phone, message, type = 'alert') {
    // Check if SMS is enabled
    if (!this.settings.sms) {
      this.toast('SMS alerts are disabled. Enable in Settings.', 'warning');
      return;
    }
    
    // Simulate SMS sending (in production, use Twilio or similar SMS API)
    console.log(`[${type.toUpperCase()} SMS] To: ${phone}\nMessage: ${message}`);
    
    // Show success toast with message preview
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
      <svg class="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <div style="text-align: left;">
        <div><strong>Alert Sent ✓</strong></div>
        <div style="font-size: 0.9em; opacity: 0.9; margin-top: 4px;">To: ${phone}</div>
        <div style="font-size: 0.85em; opacity: 0.8; margin-top: 2px;">"${message.substring(0, 50)}..."</div>
      </div>
    `;
    container.appendChild(toast);
    
    // Log to local storage for audit trail
    const alerts = JSON.parse(localStorage.getItem('sh_alerts') || '[]');
    alerts.push({
      timestamp: new Date().toISOString(),
      phone: phone,
      message: message,
      type: type,
      status: 'sent'
    });
    localStorage.setItem('sh_alerts', JSON.stringify(alerts.slice(-50))); // Keep last 50 alerts
    
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  generateForecastData() {
    // Reuse the forecast calculation logic
    const recent = this.readings.slice(0, 20).reverse();
    if (recent.length < 3) return [];
    
    const n = recent.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    recent.forEach((r, i) => {
      sumX += i;
      sumY += r.heatIndex;
      sumXY += i * r.heatIndex;
      sumX2 += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n;
    
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const val = intercept + slope * (n + i - 1);
      forecast.push({
        value: Math.max(20, val),
        status: this.getStatus(Math.max(20, val))
      });
    }
    return forecast;
  }
}

const app = new SchoolHeatApp();
window.app = app;
