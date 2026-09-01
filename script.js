/* ============================================
   SchoolHeat v3.0 — TUKLAS 2025
   Complete Application Logic
   ============================================ */

(function() {
    'use strict';

    const CONFIG = {
        firebasePollInterval: 3000,
        localPollInterval: 2000,
        maxHistory: 100,
        demoData: false
    };

    const STATE = {
        readings: [],
        currentTab: 'monitor',
        cloudMode: false,
        localMode: false,
        firebaseUrl: '',
        localUrl: '',
        isProcessing: false,
        firebaseTimer: null,
        localTimer: null,
        lastFirebaseData: null,
        locations: [
            'Front Gate', 'Quadrangle', 'Covered Walkway',
            'Classroom, SBP4BE Building AusAID', 'School Clinic',
            "Principal's Office", 'Faculty Room', 'Library',
            'Science Lab', 'Computer Lab', 'Canteen', 'Gymnasium',
            'Auditorium', 'TLE Workshop', 'AVR Room',
            'Guidance Office', 'Registrar Office', 'Supply Room',
            'Boys Comfort Room', 'Girls Comfort Room',
            'Open Covered Court', 'Flag Pole Area', 'Parking Area',
            'Garden Area', 'Basketball Court', 'Volleyball Court',
            'Water Station', 'Waiting Shed', 'Perimeter Fence'
        ]
    };

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    function calculateHeatIndex(T, R) {
        T = parseFloat(T);
        R = parseFloat(R);
        if (isNaN(T) || isNaN(R)) return null;
        if (T < 0 || T > 60) return null;
        if (R < 0 || R > 100) return null;

        const c = [
            -42.379, 2.04901523, 10.14333127, -0.22475541,
            -6.83783e-3, -5.481717e-2, 1.22874e-3, 8.5282e-4, -1.99e-6
        ];

        let HI = c[0] + c[1]*T + c[2]*R + c[3]*T*R +
                 c[4]*T*T + c[5]*R*R + c[6]*T*T*R +
                 c[7]*T*R*R + c[8]*T*T*R*R;

        if (R < 13 && T >= 80 && T <= 112) {
            const adj = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
            HI -= adj;
        }
        if (R > 85 && T >= 80 && T <= 87) {
            const adj = ((R - 85) / 10) * ((87 - T) / 5);
            HI += adj;
        }
        if (HI < T) HI = T;

        return Math.round(HI * 10) / 10;
    }

    function getHeatStatus(HI) {
        if (HI < 27) return { level: 'safe', label: 'Safe', color: '#00e676', icon: '✅', advice: 'Conditions are comfortable. Normal activities are safe.' };
        if (HI < 32) return { level: 'caution', label: 'Caution', color: '#ffca28', icon: '⚠️', advice: 'Fatigue possible with prolonged exposure. Stay hydrated and take breaks.' };
        if (HI < 41) return { level: 'danger', label: 'Danger', color: '#ff5252', icon: '🔥', advice: 'Heat cramps and heat exhaustion likely. Limit outdoor activities.' };
        return { level: 'extreme', label: 'Extreme Danger', color: '#d50000', icon: '☠️', advice: 'Heat stroke imminent! Avoid outdoor activities. Seek air conditioning.' };
    }

    function drawGauge(value) {
        const canvas = document.getElementById('heatGauge');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 280;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const cx = size / 2, cy = size / 2, radius = 110;
        const startAngle = Math.PI * 0.75;
        const endAngle = Math.PI * 2.25;
        const totalAngle = endAngle - startAngle;

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.lineWidth = 18;
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineCap = 'round';
        ctx.stroke();

        const segments = [
            { pct: 0.30, color: '#00e676' },
            { pct: 0.25, color: '#ffca28' },
            { pct: 0.30, color: '#ff5252' },
            { pct: 0.15, color: '#d50000' }
        ];

        let currentAngle = startAngle;
        segments.forEach(seg => {
            const segAngle = totalAngle * seg.pct;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, currentAngle, currentAngle + segAngle);
            ctx.lineWidth = 18;
            ctx.strokeStyle = seg.color;
            ctx.lineCap = 'butt';
            ctx.stroke();
            currentAngle += segAngle;
        });

        for (let i = 0; i <= 10; i++) {
            const angle = startAngle + (totalAngle * i / 10);
            const isMajor = i % 5 === 0;
            const tickLen = isMajor ? 12 : 6;
            const innerR = radius - 22;
            const outerR = radius - 22 - tickLen;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            ctx.lineWidth = isMajor ? 2 : 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.stroke();
        }

        let needleAngle;
        if (value === null || isNaN(value)) {
            needleAngle = startAngle;
        } else {
            const clamped = Math.max(0, Math.min(value, 55));
            needleAngle = startAngle + (totalAngle * clamped / 55);
        }

        const needleLen = radius - 30;
        const nx = cx + Math.cos(needleAngle) * needleLen;
        const ny = cy + Math.sin(needleAngle) * needleLen;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx + 2, ny + 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b35';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 107, 53, 0.4)';
        ctx.fill();
    }

    function switchTab(tabName) {
        STATE.currentTab = tabName;
        $$('.tab-panel').forEach(p => p.classList.remove('active'));
        $$('.nav-btn').forEach(b => b.classList.remove('active'));
        const panel = $(`#tab-${tabName}`);
        const btn = $(`.nav-btn[data-tab="${tabName}"]`);
        if (panel) panel.classList.add('active');
        if (btn) btn.classList.add('active');
        if (tabName === 'dashboard') renderDashboard();
        if (tabName === 'history') renderHistory();
        if (tabName === 'prediction') renderPrediction();
        if (tabName === 'map') renderMap();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showToast(message, type = 'info') {
        const container = $('#toast-container');
        if (!container) return;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3300);
    }

    function addReading(location, temp, humidity, heatIndex) {
        const status = getHeatStatus(heatIndex);
        const reading = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            location,
            temp: parseFloat(temp),
            humidity: parseFloat(humidity),
            heatIndex,
            status: status.level
        };
        STATE.readings.unshift(reading);
        if (STATE.readings.length > CONFIG.maxHistory) {
            STATE.readings = STATE.readings.slice(0, CONFIG.maxHistory);
        }
        saveReadings();
        return reading;
    }

    function deleteReading(id) {
        STATE.readings = STATE.readings.filter(r => r.id !== id);
        saveReadings();
        renderHistory();
        renderDashboard();
        renderMap();
        showToast('Reading deleted', 'success');
    }

    function saveReadings() {
        try { localStorage.setItem('schoolheat_readings', JSON.stringify(STATE.readings)); } catch(e) {}
    }

    function loadReadings() {
        try {
            const data = localStorage.getItem('schoolheat_readings');
            if (data) STATE.readings = JSON.parse(data);
        } catch(e) {}
    }

    function clearAllData() {
        STATE.readings = [];
        saveReadings();
        renderHistory();
        renderDashboard();
        renderMap();
        showToast('All data cleared', 'success');
    }

    function renderDashboard() {
        const safe = STATE.readings.filter(r => r.status === 'safe').length;
        const caution = STATE.readings.filter(r => r.status === 'caution').length;
        const danger = STATE.readings.filter(r => r.status === 'danger' || r.status === 'extreme').length;
        const total = STATE.readings.length;
        $('#stat-safe').textContent = safe;
        $('#stat-caution').textContent = caution;
        $('#stat-danger').textContent = danger;
        $('#stat-total').textContent = total;
        renderLocationsList('all');
    }

    function renderLocationsList(filter) {
        const list = $('#locations-list');
        if (!list) return;
        const latestByLoc = {};
        STATE.readings.forEach(r => {
            if (!latestByLoc[r.location] || new Date(r.timestamp) > new Date(latestByLoc[r.location].timestamp)) {
                latestByLoc[r.location] = r;
            }
        });
        const items = STATE.locations.map(loc => {
            const r = latestByLoc[loc];
            return {
                name: loc,
                reading: r,
                status: r ? r.status : 'unknown',
                heatIndex: r ? r.heatIndex : null,
                temp: r ? r.temp : null,
                time: r ? formatTime(r.timestamp) : null
            };
        });
        const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
        list.innerHTML = filtered.map(item => {
            const status = item.status === 'unknown' ? { level: 'unknown', label: 'No Data' } : getHeatStatus(item.heatIndex);
            return `
                <div class="location-item" data-location="${escapeHtml(item.name)}">
                    <div class="location-dot ${item.status}"></div>
                    <div class="location-info">
                        <div class="location-name">${escapeHtml(item.name)}</div>
                        <div class="location-meta">${item.time ? item.temp + '°C • ' + item.time : 'No readings yet'}</div>
                    </div>
                    <div class="location-badge ${item.status}">${status.label}</div>
                </div>
            `;
        }).join('');
    }

    function renderHistory() {
        const tbody = $('#history-tbody');
        const empty = $('#history-empty');
        if (!tbody) return;
        if (STATE.readings.length === 0) {
            tbody.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
        tbody.innerHTML = STATE.readings.slice(0, 50).map(r => {
            const status = getHeatStatus(r.heatIndex);
            return `
                <tr>
                    <td>${formatTime(r.timestamp)}</td>
                    <td>${escapeHtml(r.location)}</td>
                    <td>${r.temp.toFixed(1)}°C</td>
                    <td>${r.humidity.toFixed(0)}%</td>
                    <td><strong>${r.heatIndex.toFixed(1)}°C</strong></td>
                    <td><span class="status-pill ${r.status}">${status.label}</span></td>
                    <td><button class="btn-delete" data-id="${r.id}">Delete</button></td>
                </tr>
            `;
        }).join('');
        $$('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteReading(parseInt(btn.dataset.id)));
        });
    }

    // ============================================
    // ACCURATE PREDICTION ENGINE
    // ============================================
    //
    // METHOD: Double Exponential Smoothing (Holt's Method)
    //
    // This is the industry-standard technique for short-term
    // time-series forecasting. It is used by meteorologists,
    // supply-chain analysts, and financial forecasters.
    //
    // ── THE THREE FORMULAS ──
    //
    //   1. LEVEL (smoothed baseline):
    //      L_t = α · Y_t + (1−α) · (L_{t−1} + T_{t−1})
    //
    //      → blends the actual reading Y_t with the previous
    //        forecast (L_{t−1} + T_{t−1}).
    //      → α = 0.35  (recent readings weighted more)
    //
    //   2. TREND (rate of change):
    //      T_t = β · (L_t − L_{t−1}) + (1−β) · T_{t−1}
    //
    //      → blends the latest slope (L_t − L_{t−1}) with
    //        the previously estimated trend.
    //      → β = 0.15  (trend updates slowly = more stable)
    //
    //   3. FORECAST h days ahead:
    //      F_{t+h} = L_t + h · T_t
    //
    //      → extends the current level by h steps of trend.
    //
    // ── CONFIDENCE INTERVAL ──
    //
    //   margin = 1.5 · MAD · √(1 + h)
    //
    //   MAD = mean absolute deviation
    //       = average |actual − forecast| across history
    //
    //   The √h term means uncertainty grows with distance.
    //
    // ── RELIABILITY ──
    //
    //   n < 5   → "Low"     (not enough data for Holt's)
    //   n 5–14  → "Medium"  (trend detectable, no season)
    //   n ≥ 15  → "High"    (seasonal adjustment added)
    //
    // ============================================
    function renderPrediction() {
        const canvas = document.getElementById('predictionChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 600 * dpr;
        canvas.height = 300 * dpr;
        ctx.scale(dpr, dpr);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const n = STATE.readings.length;
        const predictions = [];
        const cardsContainer = $('#prediction-cards');

        // ── NOT ENOUGH DATA ─────────────────────────────────────────
        if (n < 5) {
            ctx.clearRect(0, 0, 600, 300);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Record at least 5 readings to unlock accurate forecast.', 300, 150);
            if (cardsContainer) {
                cardsContainer.innerHTML = `
                    <div class="prediction-card" style="grid-column:1/-1;padding:30px;text-align:center">
                        <div style="font-size:2rem;margin-bottom:12px">📊</div>
                        <div style="font-weight:700;margin-bottom:8px">Need More Data</div>
                        <div style="font-size:0.875rem;color:var(--text-muted)">
                            Record 5+ heat index readings to generate an accurate 7-day forecast.
                        </div>
                    </div>
                `;
            }
            return;
        }

        // ── STEP 1: SORT READINGS BY TIME ────────────────────────────
        const sorted = [...STATE.readings].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        const Y = sorted.map(r => r.heatIndex);

        // ── STEP 2: HOLT'S DOUBLE EXPONENTIAL SMOOTHING ─────────────
        const ALPHA = 0.35;  // level smoothing (0–1, higher = more responsive)
        const BETA  = 0.15;  // trend smoothing (0–1, lower = more stable)

        // Initialize
        let L = Y[0];           // L_0 = first reading
        let T = 0;              // T_0 = 0 (no trend yet)
        if (n >= 2) {
            T = Y[1] - Y[0];    // or use first difference
        }

        // Run smoothing through all historical readings
        const fitted = [];      // fitted values for MAD calculation
        for (let i = 0; i < n; i++) {
            if (i === 0) {
                fitted.push(Y[0]);
                continue;
            }
            // Update level
            const prevL = L;
            L = ALPHA * Y[i] + (1 - ALPHA) * (L + T);
            // Update trend
            T = BETA * (L - prevL) + (1 - BETA) * T;
            // One-step-ahead fitted value
            fitted.push(prevL + T);
        }

        // ── STEP 3: MEAN ABSOLUTE DEVIATION (MAD) ───────────────────
        // MAD measures how far off our one-step forecasts were.
        let mad = 0;
        for (let i = 0; i < n; i++) {
            mad += Math.abs(Y[i] - fitted[i]);
        }
        mad = mad / n;
        if (mad < 0.5) mad = 0.5;  // minimum uncertainty

        // ── STEP 4: SEASONAL ADJUSTMENT (only if 15+ readings) ──────
        let seasonal = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat offsets
        if (n >= 15) {
            const dayAvgs = [0, 0, 0, 0, 0, 0, 0];
            const dayCounts = [0, 0, 0, 0, 0, 0, 0];
            sorted.forEach(r => {
                const d = new Date(r.timestamp).getDay();
                dayAvgs[d] += r.heatIndex;
                dayCounts[d]++;
            });
            const overallMean = Y.reduce((s, v) => s + v, 0) / n;
            for (let d = 0; d < 7; d++) {
                if (dayCounts[d] >= 2) {
                    seasonal[d] = (dayAvgs[d] / dayCounts[d]) - overallMean;
                }
            }
        }

        // ── STEP 5: GENERATE 7-DAY FORECAST ─────────────────────────
        for (let h = 1; h <= 7; h++) {
            const date = new Date(today);
            date.setDate(today.getDate() + h);
            const dayName = days[date.getDay()];
            const dayIndex = date.getDay();

            // Holt's forecast: F_{t+h} = L_t + h · T_t
            let forecast = L + h * T;

            // Add seasonal offset if we have enough data
            forecast += seasonal[dayIndex];

            // Confidence margin grows with horizon
            // margin = 1.5 · MAD · √(1 + h)
            const margin = 1.5 * mad * Math.sqrt(1 + h);

            // Clamp to realistic bounds
            forecast = Math.max(25, Math.min(55, forecast));

            // Reliability score
            let reliability;
            if (n >= 20) reliability = 'High';
            else if (n >= 10) reliability = 'Medium';
            else reliability = 'Low';

            predictions.push({
                day: dayName,
                fullDate: date.toLocaleDateString(),
                heatIndex: Math.round(forecast * 10) / 10,
                status: getHeatStatus(forecast),
                margin: Math.round(margin * 10) / 10,
                reliability,
                components: {
                    level: Math.round(L * 10) / 10,
                    trend: Math.round(T * 100) / 100,
                    seasonal: Math.round(seasonal[dayIndex] * 10) / 10
                }
            });
        }

        // ── STEP 6: DRAW CHART ──────────────────────────────────────
        const padding = { top: 40, right: 30, bottom: 60, left: 50 };
        const chartW = 600 - padding.left - padding.right;
        const chartH = 300 - padding.top - padding.bottom;

        ctx.clearRect(0, 0, 600, 300);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartH * i / 5);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartW, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px Inter';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const val = 55 - (55 * i / 5);
            const y = padding.top + (chartH * i / 5);
            ctx.fillText(val.toFixed(0) + '°C', padding.left - 10, y + 4);
        }

        const getX = (i) => padding.left + (chartW * i / 6);
        const getY = (val) => padding.top + chartH - (chartH * val / 55);

        // Confidence band (shaded uncertainty)
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(predictions[0].heatIndex + predictions[0].margin));
        for (let i = 1; i < predictions.length; i++) {
            ctx.lineTo(getX(i), getY(predictions[i].heatIndex + predictions[i].margin));
        }
        for (let i = 6; i >= 0; i--) {
            ctx.lineTo(getX(i), getY(predictions[i].heatIndex - predictions[i].margin));
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 107, 53, 0.08)';
        ctx.fill();

        // Dashed confidence lines
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 107, 53, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(predictions[0].heatIndex + predictions[0].margin));
        for (let i = 1; i < predictions.length; i++) {
            ctx.lineTo(getX(i), getY(predictions[i].heatIndex + predictions[i].margin));
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(predictions[0].heatIndex - predictions[0].margin));
        for (let i = 1; i < predictions.length; i++) {
            ctx.lineTo(getX(i), getY(predictions[i].heatIndex - predictions[i].margin));
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Area fill under line
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(predictions[0].heatIndex));
        for (let i = 1; i < predictions.length; i++) {
            ctx.lineTo(getX(i), getY(predictions[i].heatIndex));
        }
        ctx.lineTo(getX(6), padding.top + chartH);
        ctx.lineTo(getX(0), padding.top + chartH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        grad.addColorStop(0, 'rgba(255, 107, 53, 0.25)');
        grad.addColorStop(1, 'rgba(255, 107, 53, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Prediction line
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(predictions[0].heatIndex));
        for (let i = 1; i < predictions.length; i++) {
            ctx.lineTo(getX(i), getY(predictions[i].heatIndex));
        }
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Data points
        predictions.forEach((p, i) => {
            const x = getX(i);
            const y = getY(p.heatIndex);

            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fillStyle = p.status.color + '18';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = p.status.color;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(p.day, x, padding.top + chartH + 20);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '10px Inter';
            ctx.fillText(p.fullDate, x, padding.top + chartH + 34);

            ctx.fillStyle = p.status.color;
            ctx.font = 'bold 11px Inter';
            ctx.fillText(p.heatIndex.toFixed(1) + '°C', x, y - 14);
        });

        // ── STEP 7: RENDER PREDICTION CARDS ─────────────────────────
        if (cardsContainer) {
            const relColor = { High: '#00e676', Medium: '#ffca28', Low: '#ff5252' };
            cardsContainer.innerHTML = predictions.map(p => `
                <div class="prediction-card">
                    <div class="day">${p.day}</div>
                    <div class="temp" style="color:${p.status.color}">${p.heatIndex.toFixed(1)}°C</div>
                    <div class="status" style="background:${p.status.color}22;color:${p.status.color}">${p.status.label}</div>
                    <div class="confidence" style="font-size:0.65rem;color:rgba(255,255,255,0.35);margin-top:4px">
                        ±${p.margin.toFixed(1)}°C
                    </div>
                    <div class="reliability" style="font-size:0.6rem;color:${relColor[p.reliability]};margin-top:2px;font-weight:600">
                        ● ${p.reliability} Confidence
                    </div>
                </div>
            `).join('');
        }
    }

    function renderMap() {
        const grid = $('#map-grid');
        if (!grid) return;
        const latestByLoc = {};
        STATE.readings.forEach(r => {
            if (!latestByLoc[r.location] || new Date(r.timestamp) > new Date(latestByLoc[r.location].timestamp)) {
                latestByLoc[r.location] = r;
            }
        });
        grid.innerHTML = STATE.locations.map(loc => {
            const r = latestByLoc[loc];
            const status = r ? getHeatStatus(r.heatIndex) : { level: 'unknown', label: 'No Data', color: '#666' };
            return `
                <div class="map-location ${r ? r.status : 'unknown'}">
                    <div class="map-loc-name">${escapeHtml(loc)}</div>
                    <div class="map-loc-temp" style="color:${status.color}">${r ? r.heatIndex.toFixed(1) + '°C' : '--'}</div>
                    <div class="map-loc-status" style="color:${status.color}">${status.label}</div>
                </div>
            `;
        }).join('');
    }

    function updateGauge(value, status) {
        drawGauge(value);
        const numEl = $('#gauge-number');
        const statusEl = $('#gauge-status');
        if (numEl) numEl.textContent = value !== null && !isNaN(value) ? value.toFixed(1) : '--';
        if (statusEl) {
            statusEl.textContent = status ? status.label : 'Ready';
            statusEl.style.color = status ? status.color : 'var(--text-muted)';
            statusEl.style.borderColor = status ? status.color + '40' : 'var(--border)';
            statusEl.style.background = status ? status.color + '15' : 'rgba(255,255,255,0.05)';
        }
    }

    async function fetchFirebaseData() {
        if (!STATE.firebaseUrl) return;
        try {
            const url = STATE.firebaseUrl.replace(/\/$/, '') + '/sensor_data.json';
            const response = await fetch(url, { method: 'GET', cache: 'no-store' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (data && data.temperature !== undefined && data.humidity !== undefined) {
                const temp = parseFloat(data.temperature);
                const humidity = parseFloat(data.humidity);
                const hi = calculateHeatIndex(temp, humidity);
                if (hi !== null) {
                    if (STATE.currentTab === 'monitor') {
                        const status = getHeatStatus(hi);
                        updateGauge(hi, status);
                        $('#temp-input').value = temp.toFixed(1);
                        $('#humidity-input').value = humidity.toFixed(0);
                        const loc = $('#location-select').value;
                        if (loc && (!STATE.lastFirebaseData ||
                            Math.abs(STATE.lastFirebaseData.temp - temp) > 0.5 ||
                            Math.abs(STATE.lastFirebaseData.humidity - humidity) > 2)) {
                            addReading(loc, temp, humidity, hi);
                            STATE.lastFirebaseData = { temp, humidity };
                            showToast(`Updated: ${loc} — ${hi.toFixed(1)}°C`, 'info');
                        }
                    }
                    updateConnectionStatus('online', 'Cloud Live');
                }
            }
        } catch (err) {
            console.error('Firebase error:', err);
            updateConnectionStatus('offline', 'Cloud Error');
        }
    }

    function startFirebasePolling() {
        if (STATE.firebaseTimer) clearInterval(STATE.firebaseTimer);
        STATE.firebaseTimer = setInterval(fetchFirebaseData, CONFIG.firebasePollInterval);
        fetchFirebaseData();
    }

    function stopFirebasePolling() {
        if (STATE.firebaseTimer) {
            clearInterval(STATE.firebaseTimer);
            STATE.firebaseTimer = null;
        }
    }

    async function fetchLocalData() {
        if (!STATE.localUrl) return;
        try {
            const response = await fetch(STATE.localUrl + '/data', { method: 'GET', cache: 'no-store' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (data.temperature !== undefined && data.humidity !== undefined) {
                const temp = parseFloat(data.temperature);
                const humidity = parseFloat(data.humidity);
                const hi = calculateHeatIndex(temp, humidity);
                if (hi !== null && STATE.currentTab === 'monitor') {
                    const status = getHeatStatus(hi);
                    updateGauge(hi, status);
                    $('#temp-input').value = temp.toFixed(1);
                    $('#humidity-input').value = humidity.toFixed(0);
                }
                updateConnectionStatus('online', 'Local Live');
            }
        } catch (err) {
            updateConnectionStatus('offline', 'Local Error');
        }
    }

    function startLocalPolling() {
        if (STATE.localTimer) clearInterval(STATE.localTimer);
        STATE.localTimer = setInterval(fetchLocalData, CONFIG.localPollInterval);
        fetchLocalData();
    }

    function stopLocalPolling() {
        if (STATE.localTimer) {
            clearInterval(STATE.localTimer);
            STATE.localTimer = null;
        }
    }

    function updateConnectionStatus(state, text) {
        const badge = $('#connection-status');
        if (!badge) return;
        badge.className = 'status-badge ' + (state === 'online' ? 'online' : '');
        badge.querySelector('.status-text').textContent = text;
    }

    function handleCalculate() {
        if (STATE.isProcessing) return;
        STATE.isProcessing = true;
        const location = $('#location-select').value;
        const temp = parseFloat($('#temp-input').value);
        const humidity = parseFloat($('#humidity-input').value);
        if (!location) { showToast('Please select a location', 'warning'); STATE.isProcessing = false; return; }
        if (isNaN(temp) || temp < 0 || temp > 60) { showToast('Temperature must be 0-60°C', 'warning'); STATE.isProcessing = false; return; }
        if (isNaN(humidity) || humidity < 0 || humidity > 100) { showToast('Humidity must be 0-100%', 'warning'); STATE.isProcessing = false; return; }
        const hi = calculateHeatIndex(temp, humidity);
        if (hi === null) { showToast('Calculation error', 'error'); STATE.isProcessing = false; return; }
        const status = getHeatStatus(hi);
        const reading = addReading(location, temp, humidity, hi);
        updateGauge(hi, status);
        const resultPanel = $('#result-panel');
        resultPanel.classList.remove('hidden');
        $('#result-icon').textContent = status.icon;
        $('#result-status').textContent = status.label;
        $('#result-status').style.color = status.color;
        $('#result-advice').textContent = status.advice;
        $('#result-hi').textContent = hi.toFixed(1);
        $('#result-temp').textContent = temp.toFixed(1);
        $('#result-humidity').textContent = humidity.toFixed(0);
        $('#result-time').textContent = 'Recorded: ' + formatTime(reading.timestamp);
        showToast(`Heat Index: ${hi.toFixed(1)}°C — ${status.label}`, status.level === 'safe' ? 'success' : status.level === 'caution' ? 'warning' : 'error');
        STATE.isProcessing = false;
    }

    // ============================================
    // AUTO-READ: Fetch REAL sensor data
    // ============================================
    // Tries Firebase first, then Local Bridge.
    // Only falls back to demo mode if nothing is connected.
    // ============================================
    async function handleAutoRead() {
        const loc = $('#location-select').value;
        if (!loc) { showToast('Please select a location first', 'warning'); return; }

        $('#btn-auto-read').disabled = true;
        $('#btn-auto-read').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Reading Sensor...';

        let temp = null;
        let humidity = null;
        let source = '';

        // ── TRY 1: Firebase Cloud ──────────────────────────────────
        if (STATE.cloudMode && STATE.firebaseUrl) {
            try {
                const url = STATE.firebaseUrl.replace(/\/$/, '') + '/sensor_data.json';
                const response = await fetch(url, { method: 'GET', cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.temperature !== undefined && data.humidity !== undefined) {
                        temp = parseFloat(data.temperature);
                        humidity = parseFloat(data.humidity);
                        source = 'Cloud';
                    }
                }
            } catch (e) {
                console.log('Firebase auto-read failed:', e);
            }
        }

        // ── TRY 2: Local Bridge ────────────────────────────────────
        if (temp === null && STATE.localUrl) {
            try {
                const response = await fetch(STATE.localUrl + '/data', { method: 'GET', cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    if (data.temperature !== undefined && data.humidity !== undefined) {
                        temp = parseFloat(data.temperature);
                        humidity = parseFloat(data.humidity);
                        source = 'Local';
                    }
                }
            } catch (e) {
                console.log('Local auto-read failed:', e);
            }
        }

        // ── FALLBACK: Demo mode (no sensor connected) ──────────────
        if (temp === null) {
            temp = 28 + Math.random() * 15;
            humidity = 50 + Math.random() * 40;
            source = 'Demo';
            showToast('No sensor connected — using demo data. Go to Settings → Connect.', 'warning');
        }

        // ── POPULATE & CALCULATE ───────────────────────────────────
        $('#temp-input').value = temp.toFixed(1);
        $('#humidity-input').value = humidity.toFixed(0);

        const hi = calculateHeatIndex(temp, humidity);
        if (hi !== null) {
            const status = getHeatStatus(hi);
            updateGauge(hi, status);
            addReading(loc, temp, humidity, hi);

            $('#btn-auto-read').disabled = false;
            $('#btn-auto-read').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Auto-Read Arduino';

            if (source !== 'Demo') {
                showToast(`Sensor (${source}): ${temp.toFixed(1)}°C, ${humidity.toFixed(0)}%`, 'success');
            }
        } else {
            $('#btn-auto-read').disabled = false;
            $('#btn-auto-read').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Auto-Read Arduino';
            showToast('Sensor data invalid — check Arduino connection.', 'error');
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem('schoolheat_settings', JSON.stringify({
                firebaseUrl: STATE.firebaseUrl,
                localUrl: STATE.localUrl,
                cloudMode: STATE.cloudMode,
                alertNumber: $('#alert-number').value,
                alertThreshold: $('#alert-threshold').value,
                alertEnabled: $('#alert-toggle').checked
            }));
        } catch(e) {}
    }

    function loadSettings() {
        try {
            const data = localStorage.getItem('schoolheat_settings');
            if (!data) return;
            const s = JSON.parse(data);
            STATE.firebaseUrl = s.firebaseUrl || '';
            STATE.localUrl = s.localUrl || '';
            STATE.cloudMode = s.cloudMode || false;
            $('#firebase-url').value = STATE.firebaseUrl;
            $('#local-url').value = STATE.localUrl;
            $('#cloud-toggle').checked = STATE.cloudMode;
            $('#alert-number').value = s.alertNumber || '';
            $('#alert-threshold').value = s.alertThreshold || '41';
            $('#alert-toggle').checked = s.alertEnabled || false;
            if (STATE.cloudMode) {
                $('#cloud-input-group').classList.remove('hidden');
                startFirebasePolling();
            }
        } catch(e) {}
    }

    function formatTime(isoString) {
        const d = new Date(isoString);
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function init() {
        loadReadings();
        loadSettings();
        drawGauge(null);
        $$('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        $('#btn-calculate').addEventListener('click', handleCalculate);
        $('#btn-auto-read').addEventListener('click', handleAutoRead);
        $$('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderLocationsList(btn.dataset.filter);
            });
        });
        $('#cloud-toggle').addEventListener('change', (e) => {
            STATE.cloudMode = e.target.checked;
            $('#cloud-input-group').classList.toggle('hidden', !STATE.cloudMode);
            if (STATE.cloudMode) {
                if (STATE.firebaseUrl) startFirebasePolling();
            } else {
                stopFirebasePolling();
                updateConnectionStatus('offline', 'Offline');
            }
            saveSettings();
        });
        $('#btn-connect-cloud').addEventListener('click', () => {
            const url = $('#firebase-url').value.trim();
            if (!url) { showToast('Enter Firebase URL', 'warning'); return; }
            STATE.firebaseUrl = url;
            saveSettings();
            startFirebasePolling();
            showToast('Connecting to Firebase...', 'info');
        });
        $('#btn-connect-local').addEventListener('click', () => {
            const url = $('#local-url').value.trim();
            if (!url) { showToast('Enter server URL', 'warning'); return; }
            STATE.localUrl = url;
            saveSettings();
            startLocalPolling();
            showToast('Connecting to local server...', 'info');
        });
        $('#btn-clear-data').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL readings?')) {
                clearAllData();
            }
        });
        $('#alert-number').addEventListener('change', saveSettings);
        $('#alert-threshold').addEventListener('change', saveSettings);
        $('#alert-toggle').addEventListener('change', saveSettings);
        setTimeout(() => {
            $('#loading-screen').classList.add('hidden');
            $('#app').classList.remove('hidden');
        }, 1800);
        renderDashboard();
        renderHistory();
        renderMap();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
