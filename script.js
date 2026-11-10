"use strict";

/* =========================================================
   MeteoOra — meteo attuale + prossima ora
   Dati: Open-Meteo (https://open-meteo.com/)
   ========================================================= */

const API = {
  forecast: "https://api.open-meteo.com/v1/forecast",
  geocode: "https://geocoding-api.open-meteo.com/v1/search",
  reverse: "https://api.bigdatacloud.net/data/reverse-geocode-client",
};

const STORAGE = {
  theme: "meteo:themeMode",
  place: "meteo:place",
  log: "meteo:log",
};

const REFRESH_MS = 10 * 60 * 1000; // 10 minuti
const LOG_MAX = 720; // circa 30 giorni di voci orarie

const state = {
  lat: null,
  lon: null,
  place: null,
  data: null,
  utcOffsetSeconds: null,
  isDay: null,
  lastFetch: 0,
};

const els = {
  status: document.getElementById("status"),
  weather: document.getElementById("weather"),
  currentCard: document.getElementById("current-card"),
  nextCard: document.getElementById("next-card"),
  place: document.getElementById("place-name"),
  currentTime: document.getElementById("current-time"),
  dayBadge: document.getElementById("day-badge"),
  currentIcon: document.getElementById("current-icon"),
  currentTemp: document.getElementById("current-temp"),
  currentCondition: document.getElementById("current-condition"),
  feels: document.getElementById("feels"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  precip: document.getElementById("precip"),
  pressure: document.getElementById("pressure"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  nextTime: document.getElementById("next-time"),
  nextIcon: document.getElementById("next-icon"),
  nextTemp: document.getElementById("next-temp"),
  nextCondition: document.getElementById("next-condition"),
  nextRain: document.getElementById("next-rain"),
  nextWind: document.getElementById("next-wind"),
  updated: document.getElementById("updated"),
  geoBtn: document.getElementById("geo-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  themeToggle: document.getElementById("theme-toggle"),
  cityInput: document.getElementById("city-input"),
  results: document.getElementById("city-results"),
  logTable: document.getElementById("log-table"),
  logBody: document.getElementById("log-body"),
  logEmpty: document.getElementById("log-empty"),
  logExport: document.getElementById("log-export"),
  logClear: document.getElementById("log-clear"),
  year: document.getElementById("year"),
};

/* ---------- Descrizioni codici WMO ---------- */
const WEATHER = {
  0: ["Cielo sereno", "clear"],
  1: ["Prevalentemente sereno", "partly"],
  2: ["Parzialmente nuvoloso", "partly"],
  3: ["Coperto", "cloudy"],
  45: ["Nebbia", "fog"],
  48: ["Nebbia con brina", "fog"],
  51: ["Pioviggine leggera", "drizzle"],
  53: ["Pioviggine moderata", "drizzle"],
  55: ["Pioviggine intensa", "drizzle"],
  56: ["Pioviggine gelata", "drizzle"],
  57: ["Pioviggine gelata intensa", "drizzle"],
  61: ["Pioggia leggera", "rain"],
  63: ["Pioggia moderata", "rain"],
  65: ["Pioggia intensa", "rain"],
  66: ["Pioggia gelata", "rain"],
  67: ["Pioggia gelata intensa", "rain"],
  71: ["Neve leggera", "snow"],
  73: ["Neve moderata", "snow"],
  75: ["Neve intensa", "snow"],
  77: ["Granelli di neve", "snow"],
  80: ["Rovesci leggeri", "rain"],
  81: ["Rovesci moderati", "rain"],
  82: ["Rovesci intensi", "rain"],
  85: ["Rovesci di neve", "snow"],
  86: ["Rovesci di neve intensi", "snow"],
  95: ["Temporale", "storm"],
  96: ["Temporale con grandine", "storm"],
  99: ["Temporale forte con grandine", "storm"],
};

/* ---------- Icone SVG inline ---------- */
const ICONS = {
  sun: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="11.5" class="c-sun"/>
    <g class="c-ray" stroke-width="3.5" stroke-linecap="round">
      <path d="M32 5.5v7"/><path d="M32 51.5v7"/><path d="M5.5 32h7"/><path d="M51.5 32h7"/>
      <path d="M13.3 13.3l5 5"/><path d="M45.7 45.7l5 5"/>
      <path d="M50.7 13.3l-5 5"/><path d="M18.3 45.7l-5 5"/>
    </g>
  </svg>`,

  moon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M41.5 8.5A24 24 0 1 0 55.5 42 19 19 0 0 1 41.5 8.5Z" class="c-moon"/>
  </svg>`,

  partlyDay: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="23" cy="21" r="8.5" class="c-sun"/>
    <g class="c-ray" stroke-width="3" stroke-linecap="round">
      <path d="M23 5.5v5"/><path d="M8.5 21h5"/>
      <path d="M12.5 10.5l3.5 3.5"/><path d="M33.5 10.5L30 14"/>
    </g>
    <path d="M22 50h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 22.4 29 10.5 10.5 0 0 0 22 50Z" class="c-cloud"/>
  </svg>`,

  partlyNight: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 6a17 17 0 1 0 13 27A13.5 13.5 0 0 1 35 6Z" class="c-moon"/>
    <path d="M22 50h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 22.4 29 10.5 10.5 0 0 0 22 50Z" class="c-cloud"/>
  </svg>`,

  cloudy: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 49h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 20.4 28 10.5 10.5 0 0 0 20 49Z" class="c-cloud"/>
  </svg>`,

  fog: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 42h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 20.4 21 10.5 10.5 0 0 0 20 42Z" class="c-cloud"/>
    <g class="c-fog" stroke-width="3.5" stroke-linecap="round">
      <path d="M14 50h36"/><path d="M19 57h26"/>
    </g>
  </svg>`,

  drizzle: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 40h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 20.4 19 10.5 10.5 0 0 0 20 40Z" class="c-cloud"/>
    <g class="c-rain" stroke-width="3" stroke-linecap="round">
      <path d="M24 47l-1.5 3.5"/><path d="M33 47l-1.5 3.5"/><path d="M42 47l-1.5 3.5"/>
    </g>
  </svg>`,

  rain: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 40h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 20.4 19 10.5 10.5 0 0 0 20 40Z" class="c-cloud"/>
    <g class="c-rain" stroke-width="3.5" stroke-linecap="round">
      <path d="M23 48l-2.5 6"/><path d="M33 48l-2.5 6"/><path d="M43 48l-2.5 6"/>
    </g>
  </svg>`,

  snow: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 40h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 20.4 19 10.5 10.5 0 0 0 20 40Z" class="c-cloud"/>
    <g class="c-snow" stroke-width="2.4" stroke-linecap="round">
      <path d="M22 47v9M18.3 49.5l7.4 4M25.7 49.5l-7.4 4"/>
      <path d="M32 47v9M28.3 49.5l7.4 4M35.7 49.5l-7.4 4"/>
      <path d="M42 47v9M38.3 49.5l7.4 4M45.7 49.5l-7.4 4"/>
    </g>
  </svg>`,

  storm: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 38h26a9.5 9.5 0 0 0 1.6-18.8A14 14 0 0 0 20.4 17 10.5 10.5 0 0 0 20 38Z" class="c-cloud"/>
    <path d="M35 40l-8 12h6l-3 9 9-12h-6l4-9Z" class="c-bolt"/>
  </svg>`,
};

/* ---------- Utility ---------- */
function iconFor(kind, isDay) {
  if (kind === "clear") return isDay ? ICONS.sun : ICONS.moon;
  if (kind === "partly") return isDay ? ICONS.partlyDay : ICONS.partlyNight;
  return ICONS[kind] || ICONS.cloudy;
}

function weatherInfo(code) {
  const entry = WEATHER[code] || ["Non disponibile", "cloudy"];
  return {
    label: entry[0],
    kind: entry[1],
    theme: entry[1] === "drizzle" ? "rain" : entry[1],
  };
}

function clock(iso) {
  return typeof iso === "string" ? iso.slice(11, 16) : "—";
}

function formatNextTime(iso, nowIso) {
  if (iso.slice(0, 10) === nowIso.slice(0, 10)) return `Alle ${clock(iso)}`;
  return `Domani alle ${clock(iso)}`;
}

function isDayHour(iso) {
  const hour = Number(iso.slice(11, 13));
  return hour >= 7 && hour < 20;
}

function windDirection(deg) {
  if (deg == null || Number.isNaN(Number(deg))) return "—";
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(Number(deg) / 45) % 8];
}

function formatWind(speed, deg) {
  const dir = windDirection(deg);
  return `${Math.round(Number(speed))} km/h · ${dir}`;
}

function formatNumber(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("it-IT", { maximumFractionDigits: digits });
}

function setStatus(message, type = "") {
  els.status.textContent = message || "";
  els.status.className = "status" + (type ? ` ${type}` : "");
}

function setBusy(busy) {
  els.weather.classList.toggle("loading", busy);
  els.weather.setAttribute("aria-busy", String(busy));
  els.refreshBtn.classList.toggle("spinning", busy);
  els.refreshBtn.disabled = busy;
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function geoErrorMessage(err) {
  switch (err && err.code) {
    case 1:
      return "Permesso di geolocalizzazione negato. Cerca una città oppure abilita la posizione dal browser.";
    case 2:
      return "Posizione non disponibile. Controlla le impostazioni di localizzazione del dispositivo.";
    case 3:
      return "Tempo scaduto durante il rilevamento della posizione. Riprova o cerca una città.";
    default:
      return "Impossibile rilevare la posizione. Cerca una città.";
  }
}

/* ---------- Tema automatico giorno/notte ---------- */
let themeMode = "auto";

function readThemeMode() {
  try {
    const saved = localStorage.getItem(STORAGE.theme);
    return saved === "light" || saved === "dark" ? saved : "auto";
  } catch {
    return "auto";
  }
}

function getLocationNow() {
  if (!Number.isFinite(state.utcOffsetSeconds)) return null;
  const date = new Date(Date.now() + state.utcOffsetSeconds * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function sunTimesFor(daily, date) {
  if (!daily || !Array.isArray(daily.time)) return null;
  const index = daily.time.indexOf(date);
  if (index < 0) return null;

  const sunrise = daily.sunrise ? daily.sunrise[index] : null;
  const sunset = daily.sunset ? daily.sunset[index] : null;
  if (!sunrise || !sunset) return null;

  return { sunrise: sunrise.slice(0, 16), sunset: sunset.slice(0, 16) };
}

function isDayAt(iso, daily, fallback) {
  const times = sunTimesFor(daily, iso.slice(0, 10));
  if (!times) return fallback;

  const moment = iso.slice(0, 16);
  return moment >= times.sunrise && moment < times.sunset;
}

function currentDayState() {
  if (!state.data) return null;
  const now = getLocationNow() || state.data.current.time;
  return isDayAt(now, state.data.daily, state.data.current.is_day === 1);
}

function resolveTheme() {
  if (themeMode === "light" || themeMode === "dark") return themeMode;

  const day = currentDayState();
  if (day !== null) return day ? "light" : "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme() {
  const theme = resolveTheme();

  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute("content", theme === "dark" ? "#0f1117" : "#f7f8fb");
  }

  const labels = {
    auto: "Tema automatico (alba e tramonto). Passa al tema chiaro.",
    light: "Tema chiaro. Passa al tema scuro.",
    dark: "Tema scuro. Passa al tema automatico.",
  };

  els.themeToggle.textContent =
    themeMode === "auto" ? "🌗" : themeMode === "dark" ? "🌙" : "☀️";
  els.themeToggle.setAttribute("aria-label", labels[themeMode]);
  els.themeToggle.title = labels[themeMode];
}

function initTheme() {
  themeMode = readThemeMode();
  applyTheme();
}

function updateDayNightUI(isDay) {
  if (!state.data) return;

  const info = weatherInfo(state.data.current.weather_code);
  els.dayBadge.textContent = isDay ? "☀ Giorno" : "☾ Notte";
  els.currentCard.dataset.day = isDay ? "true" : "false";
  els.currentIcon.innerHTML = iconFor(info.kind, isDay);
}

// Controlla ogni 30 secondi se alba o tramonto hanno cambiato giorno/notte
function refreshDayNight() {
  if (!state.data) return;

  const day = currentDayState();
  if (day === null || day === state.isDay) return;

  state.isDay = day;
  updateDayNightUI(day);

  if (themeMode === "auto") applyTheme();
}

/* ---------- Posizione salvata ---------- */
function savePlace(place) {
  try {
    localStorage.setItem(
      STORAGE.place,
      JSON.stringify({
        name: place.name,
        lat: place.lat,
        lon: place.lon,
        source: place.source || "search",
      })
    );
  } catch {
    /* localStorage non disponibile: ignora */
  }
}

function loadSavedPlace() {
  try {
    const place = JSON.parse(localStorage.getItem(STORAGE.place));
    if (place && Number.isFinite(place.lat) && Number.isFinite(place.lon)) {
      return place;
    }
  } catch {
    /* dati non validi: ignora */
  }
  return null;
}

/* ---------- Geocodifica inversa ---------- */
async function reverseName(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      localityLanguage: "it",
    });
    const res = await fetchWithTimeout(`${API.reverse}?${params}`, 5000);
    if (!res.ok) return "La mia posizione";
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || "La mia posizione";
  } catch {
    return "La mia posizione";
  }
}

/* ---------- Chiamata meteo ---------- */
async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "surface_pressure",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
      "precipitation",
      "wind_speed_10m",
    ].join(","),
    daily: "sunrise,sunset",
    timezone: "auto",
    forecast_days: "2",
  });

  const res = await fetchWithTimeout(`${API.forecast}?${params}`, 9000);
  if (!res.ok) throw new Error(`Errore API meteo: HTTP ${res.status}`);
  return res.json();
}

/* ---------- Prossima ora ---------- */
function getNextHour(hourly, currentTime) {
  if (!hourly || !Array.isArray(hourly.time)) return null;

  for (let i = 0; i < hourly.time.length; i += 1) {
    if (hourly.time[i] > currentTime) {
      return {
        time: hourly.time[i],
        temp: hourly.temperature_2m[i],
        code: hourly.weather_code[i],
        rainProb: hourly.precipitation_probability
          ? hourly.precipitation_probability[i]
          : null,
        wind: hourly.wind_speed_10m[i],
      };
    }
  }
  return null;
}

/* ---------- Rendering ---------- */
function render(data, place) {
  const current = data.current;
  const info = weatherInfo(current.weather_code);
  const isDay = isDayAt(current.time, data.daily, current.is_day === 1);
  state.isDay = isDay;

  els.place.textContent = place.name || "La mia posizione";
  els.currentTime.textContent = `Ora locale ${clock(current.time)}`;
  els.dayBadge.textContent = isDay ? "☀ Giorno" : "☾ Notte";

  els.currentCard.dataset.weather = info.theme;
  els.currentCard.dataset.day = isDay ? "true" : "false";

  els.currentIcon.innerHTML = iconFor(info.kind, isDay);
  els.currentTemp.innerHTML = `${Math.round(current.temperature_2m)}<span>°C</span>`;
  els.currentCondition.textContent = info.label;

  els.feels.textContent = `${Math.round(current.apparent_temperature)} °C`;
  els.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  els.wind.textContent = formatWind(current.wind_speed_10m, current.wind_direction_10m);
  els.precip.textContent = `${formatNumber(current.precipitation)} mm`;
  els.pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;

  const sun = sunTimesFor(data.daily, current.time.slice(0, 10));
  els.sunrise.textContent = sun ? clock(sun.sunrise) : "—";
  els.sunset.textContent = sun ? clock(sun.sunset) : "—";

  const next = getNextHour(data.hourly, current.time);

  if (next) {
    const nextInfo = weatherInfo(next.code);
    const nextFallback =
      next.time.slice(0, 10) === current.time.slice(0, 10)
        ? isDay
        : isDayHour(next.time);
    const nextIsDay = isDayAt(next.time, data.daily, nextFallback);

    els.nextTime.textContent = formatNextTime(next.time, current.time);
    els.nextIcon.innerHTML = iconFor(nextInfo.kind, nextIsDay);
    els.nextTemp.innerHTML = `${Math.round(next.temp)}<span>°C</span>`;
    els.nextCondition.textContent = nextInfo.label;
    els.nextRain.textContent =
      next.rainProb == null ? "—" : `${Math.round(next.rainProb)}%`;
    els.nextWind.textContent = `${Math.round(Number(next.wind))} km/h`;
    els.nextCard.dataset.weather = nextInfo.theme;
  } else {
    els.nextTime.textContent = "—";
    els.nextIcon.innerHTML = "";
    els.nextTemp.textContent = "—";
    els.nextCondition.textContent = "Dati non disponibili";
    els.nextRain.textContent = "—";
    els.nextWind.textContent = "—";
  }

  els.updated.textContent = `alle ${clock(current.time)}`;
}

/* ---------- Registro orario ---------- */
function readLog() {
  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE.log));
    return Array.isArray(entries) ? entries.filter((entry) => entry && entry.id) : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  try {
    localStorage.setItem(STORAGE.log, JSON.stringify(entries.slice(-LOG_MAX)));
  } catch {
    /* quota piena o localStorage non disponibile */
  }
}

function hourKey(iso) {
  return iso.slice(0, 13); // YYYY-MM-DDTHH
}

function logTime(iso) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}`;
}

function maybeLogHour(data, place) {
  const current = data.current;
  if (!current || !place) return;

  const key = hourKey(current.time);
  const id = `${Number(place.lat).toFixed(2)},${Number(place.lon).toFixed(2)}|${key}`;

  const entries = readLog();
  if (entries.some((entry) => entry.id === id)) return;

  const hourly = data.hourly || {};
  const index = Array.isArray(hourly.time)
    ? hourly.time.findIndex((time) => hourKey(time) === key)
    : -1;
  const rawRain =
    index >= 0 && Array.isArray(hourly.precipitation_probability)
      ? hourly.precipitation_probability[index]
      : null;

  const entry = {
    id,
    hour: `${key}:00`,
    place: place.name || "Posizione",
    lat: place.lat,
    lon: place.lon,
    temp: Math.round(current.temperature_2m),
    wind: Math.round(current.wind_speed_10m),
    windDeg: Math.round(Number(current.wind_direction_10m)),
    windDir: windDirection(current.wind_direction_10m),
    rainProb: rawRain == null ? null : Math.round(rawRain),
  };

  entries.push(entry);
  writeLog(entries);
  renderLog();

  console.info("MeteoOra · registro orario", entry);
}

function renderLog() {
  const entries = readLog().slice().reverse(); // più recenti in alto
  const hasEntries = entries.length > 0;

  els.logTable.hidden = !hasEntries;
  els.logEmpty.hidden = hasEntries;
  els.logExport.disabled = !hasEntries;
  els.logClear.disabled = !hasEntries;

  els.logBody.innerHTML = "";

  for (const entry of entries) {
    const row = document.createElement("tr");
    const cells = [
      logTime(entry.hour),
      entry.place,
      `${entry.temp} °C`,
      `${entry.wind} km/h`,
      entry.windDir || "—",
      entry.rainProb == null ? "—" : `${entry.rainProb}%`,
    ];

    cells.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (index >= 2) cell.className = "num";
      row.appendChild(cell);
    });

    els.logBody.appendChild(row);
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportLog() {
  const entries = readLog();
  if (!entries.length) return;

  const rows = [
    ["Ora", "Località", "Temperatura (°C)", "Vento (km/h)", "Direzione", "Probabilità pioggia (%)"],
    ...entries.map((entry) => [
      entry.hour ? entry.hour.replace("T", " ") : "",
      entry.place,
      entry.temp,
      entry.wind,
      entry.windDir,
      entry.rainProb == null ? "" : entry.rainProb,
    ]),
  ];

  const csv =
    "\uFEFF" + rows.map((row) => row.map(csvEscape).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `meteo-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Caricamento meteo ---------- */
async function loadWeather(place, { save = false, quiet = false } = {}) {
  if (!quiet) {
    setBusy(true);
    setStatus("Aggiornamento meteo…", "info");
  }

  try {
    const data = await fetchForecast(place.lat, place.lon);

    state.lat = place.lat;
    state.lon = place.lon;
    state.place = place;
    state.data = data;
    const offset = Number(data.utc_offset_seconds);
    state.utcOffsetSeconds = Number.isFinite(offset) ? offset : null;
    state.lastFetch = Date.now();

    render(data, place);
    applyTheme();
    maybeLogHour(data, place);
    if (save) savePlace(place);
    if (!quiet) setStatus("");
  } catch (err) {
    console.error(err);
    setStatus(
      "Impossibile scaricare i dati meteo. Controlla la connessione e riprova.",
      "error"
    );
  } finally {
    if (!quiet) setBusy(false);
  }
}

/* ---------- Geolocalizzazione ---------- */
function locate({ silent = false } = {}) {
  if (!("geolocation" in navigator)) {
    setStatus("Il tuo browser non supporta la geolocalizzazione. Cerca una città.", "error");
    return;
  }

  if (!silent) setStatus("Rilevo la tua posizione…", "info");
  setBusy(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = Number(position.coords.latitude.toFixed(4));
      const lon = Number(position.coords.longitude.toFixed(4));
      const name = await reverseName(lat, lon);
      loadWeather({ name, lat, lon, source: "geo" }, { save: true });
    },
    (err) => {
      setBusy(false);
      const saved = loadSavedPlace();
      if (saved) {
        setStatus(
          "Posizione non disponibile: mostro l'ultima località salvata.",
          "info"
        );
        loadWeather(saved);
        return;
      }
      setStatus(geoErrorMessage(err), "error");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

/* ---------- Ricerca città ---------- */
let searchTimer = null;
let searchResults = [];
let activeIndex = -1;

function openResults() {
  els.results.hidden = false;
  els.cityInput.setAttribute("aria-expanded", "true");
}

function closeResults() {
  els.results.hidden = true;
  els.results.innerHTML = "";
  els.cityInput.setAttribute("aria-expanded", "false");
  els.cityInput.removeAttribute("aria-activedescendant");
  searchResults = [];
  activeIndex = -1;
}

function showResults(list) {
  els.results.innerHTML = "";
  activeIndex = -1;

  if (!list.length) {
    const li = document.createElement("li");
    li.className = "result-empty";
    li.textContent = "Nessuna città trovata";
    els.results.appendChild(li);
    openResults();
    return;
  }

  list.forEach((item, index) => {
    const li = document.createElement("li");
    li.id = `city-option-${index}`;
    li.dataset.index = String(index);
    li.setAttribute("role", "option");

    const name = document.createElement("span");
    name.className = "result-name";
    name.textContent = item.city;

    const meta = document.createElement("span");
    meta.className = "result-meta";
    meta.textContent = item.meta;

    li.append(name, meta);
    els.results.appendChild(li);
  });

  openResults();
}

function setActive(items) {
  items.forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });

  const active = items[activeIndex];
  if (active) {
    els.cityInput.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
  } else {
    els.cityInput.removeAttribute("aria-activedescendant");
  }
}

function chooseResult(index) {
  const result = searchResults[index];
  if (!result) return;

  els.cityInput.value = result.city;
  els.cityInput.blur();
  closeResults();

  loadWeather(
    { name: result.label, lat: result.lat, lon: result.lon, source: "search" },
    { save: true }
  );
}

async function searchCity(query) {
  try {
    const params = new URLSearchParams({
      name: query,
      count: "6",
      language: "it",
      format: "json",
    });

    const res = await fetchWithTimeout(`${API.geocode}?${params}`, 8000);
    if (!res.ok) throw new Error(`Errore geocoding: HTTP ${res.status}`);

    const data = await res.json();
    const list = Array.isArray(data.results) ? data.results : [];

    searchResults = list.map((r) => {
      const region = r.admin1 && r.admin1 !== r.name ? r.admin1 : "";
      const label = [r.name, region, r.country].filter(Boolean).join(", ");
      const meta = [region, r.country].filter(Boolean).join(" · ");

      return {
        city: r.name,
        label,
        meta: meta || "—",
        lat: r.latitude,
        lon: r.longitude,
      };
    });

    showResults(searchResults);
  } catch (err) {
    console.error(err);
    closeResults();
    setStatus("Ricerca non disponibile. Controlla la connessione e riprova.", "error");
  }
}

/* ---------- Eventi ---------- */
function bindEvents() {
  els.themeToggle.addEventListener("click", () => {
    themeMode =
      themeMode === "auto" ? "light" : themeMode === "light" ? "dark" : "auto";

    try {
      localStorage.setItem(STORAGE.theme, themeMode);
    } catch {
      /* ignora */
    }

    applyTheme();
  });

  els.geoBtn.addEventListener("click", () => locate());

  els.refreshBtn.addEventListener("click", () => {
    if (state.lat != null && state.place) {
      loadWeather(state.place);
    } else {
      locate();
    }
  });

  els.cityInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const query = els.cityInput.value.trim();

    if (query.length < 2) {
      closeResults();
      return;
    }

    searchTimer = setTimeout(() => searchCity(query), 400);
  });

  els.cityInput.addEventListener("keydown", (event) => {
    if (els.results.hidden) return;

    const items = Array.from(els.results.querySelectorAll("li[data-index]"));
    if (!items.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      setActive(items);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      setActive(items);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        chooseResult(activeIndex);
      }
    } else if (event.key === "Escape") {
      closeResults();
    }
  });

  els.results.addEventListener("click", (event) => {
    const item = event.target.closest("li[data-index]");
    if (item) chooseResult(Number(item.dataset.index));
  });

  els.logExport.addEventListener("click", exportLog);

  els.logClear.addEventListener("click", () => {
    if (!readLog().length) return;
    if (!window.confirm("Svuotare il registro orario salvato?")) return;
    try {
      localStorage.removeItem(STORAGE.log);
    } catch {
      /* ignora */
    }
    renderLog();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-wrap")) closeResults();
  });
}

/* ---------- Avvio ---------- */
function init() {
  els.year.textContent = new Date().getFullYear();
  initTheme();
  bindEvents();
  renderLog();

  const savedPlace = loadSavedPlace();
  if (savedPlace) {
    loadWeather(savedPlace);
  } else {
    locate({ silent: true });
  }

  // Aggiornamento automatico periodico
  setInterval(() => {
    if (state.lat != null && state.place && !document.hidden) {
      loadWeather(state.place, { quiet: true });
    }
  }, REFRESH_MS);

  // Passaggio automatico giorno/notte in base ad alba e tramonto
  setInterval(refreshDayNight, 30 * 1000);

  // Aggiorna al ritorno sulla scheda, se i dati sono vecchi
  document.addEventListener("visibilitychange", () => {
    if (
      !document.hidden &&
      state.lat != null &&
      state.place &&
      Date.now() - state.lastFetch > REFRESH_MS
    ) {
      loadWeather(state.place, { quiet: true });
    }
  });
}

init();
