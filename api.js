/* ==========================================================================
   where is my trip — Direct Gemini 2.5 Flash Lite REST Client,
   Proxy-Error Safe Fallback, Caching, Open-Meteo Weather & XSS Guard
   ========================================================================== */

(function (global) {
  "use strict";

  const GEMINI_MODEL = "gemini-2.5-flash-lite";
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const STORAGE_KEY_API = "wimt_gemini_api_key";
  const LEGACY_KEY_API = "wb_gemini_api_key";
  const CACHE_PREFIX = "wimt_guide_v1:";
  const GUIDE_TIMEOUT_MS = 25000;
  const CHAT_TIMEOUT_MS = 20000;

  // ==================== XSS ESCAPE GUARD ====================
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ==================== API KEY STORAGE ====================
  function getApiKey() {
    const envKey =
      global.__ENV__ && typeof global.__ENV__.GEMINI_API_KEY === "string"
        ? global.__ENV__.GEMINI_API_KEY.trim()
        : "";
    if (envKey) return envKey;
    try {
      return (
        localStorage.getItem(STORAGE_KEY_API) ||
        localStorage.getItem(LEGACY_KEY_API) ||
        ""
      ).trim();
    } catch (_) {
      return "";
    }
  }

  function saveApiKey(key) {
    try {
      const cleaned = String(key || "").trim();
      if (cleaned) {
        localStorage.setItem(STORAGE_KEY_API, cleaned);
        localStorage.setItem(LEGACY_KEY_API, cleaned);
      } else {
        localStorage.removeItem(STORAGE_KEY_API);
        localStorage.removeItem(LEGACY_KEY_API);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // ==================== PROXY ERROR DETECTION ====================
  // Prevents AI Studio's PROXY_GENERATION_DISABLED error from ever blocking the user
  function isProxyDisabledError(errOrMessage) {
    const msg = String(
      (errOrMessage && errOrMessage.message) || errOrMessage || ""
    ).toUpperCase();
    return (
      msg.includes("PROXY_GENERATION_DISABLED") ||
      msg.includes("GENERATECONTENT IS NOT SUPPORTED") ||
      msg.includes("LEGACY GEMINI API")
    );
  }

  // ==================== LOCALSTORAGE CACHING ====================
  function getStartMonth(startDateStr) {
    if (!startDateStr || typeof startDateStr !== "string") {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    return startDateStr.slice(0, 7);
  }

  function normalizeSegment(val) {
    return String(val || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function getGuideCacheKey(trip) {
    const parts = [
      normalizeSegment(trip.startCity),
      normalizeSegment(trip.destination),
      String(Number(trip.days) || 3),
      normalizeSegment(trip.budget),
      normalizeSegment(trip.priority),
      getStartMonth(trip.startDate)
    ];
    return CACHE_PREFIX + parts.join("|");
  }

  function getCachedGuide(trip) {
    try {
      const raw = localStorage.getItem(getGuideCacheKey(trip));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.days) && Array.isArray(parsed.reach)) {
        return parsed;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  function setCachedGuide(trip, guide) {
    try {
      localStorage.setItem(getGuideCacheKey(trip), JSON.stringify(guide));
    } catch (_) {}
  }

  // ==================== MALFORMED JSON RECOVERY ====================
  function stripCodeFences(rawText) {
    return String(rawText || "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  function parseGeminiJsonWithRetry(rawText) {
    try {
      return JSON.parse(rawText);
    } catch (_) {
      let cleaned = stripCodeFences(rawText);
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
      cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(cleaned);
    }
  }

  function coerceStringArray(val, fallbackArr, targetLen) {
    const arr = Array.isArray(val) ? val : [];
    const cleaned = arr
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          return Object.values(item)
            .filter((v) => typeof v === "string" || typeof v === "number")
            .join(" — ")
            .trim();
        }
        return String(item || "").trim();
      })
      .filter(Boolean);

    if (cleaned.length === 0 && Array.isArray(fallbackArr)) {
      return fallbackArr.slice(0, targetLen || fallbackArr.length);
    }
    if (typeof targetLen === "number" && cleaned.length > targetLen) {
      return cleaned.slice(0, targetLen);
    }
    return cleaned;
  }

  function normalizeGuidePayload(rawObj, trip) {
    const fallback = global.WIMT_DATA.buildOfflineGuide(trip);
    const daysCount = Number(trip.days) || 3;
    return {
      source: "gemini",
      reach: coerceStringArray(rawObj.reach, fallback.reach),
      local: coerceStringArray(rawObj.local, fallback.local),
      stay: coerceStringArray(rawObj.stay, fallback.stay, 3),
      days: coerceStringArray(rawObj.days, fallback.days, daysCount),
      landmarks: coerceStringArray(rawObj.landmarks, fallback.landmarks, 5),
      food: coerceStringArray(rawObj.food, fallback.food, 5),
      gems: coerceStringArray(rawObj.gems, fallback.gems, 3),
      dos: coerceStringArray(rawObj.dos, fallback.dos, 5),
      donts: coerceStringArray(rawObj.donts, fallback.donts, 5)
    };
  }

  // ==================== SINGLE GEMINI CALL FOR GUIDE ====================
  async function generateGuideWithGemini(trip, apiKey) {
    const daysCount = Number(trip.days) || 3;
    const startMonth = getStartMonth(trip.startDate);

    const prompt = [
      `Create a compact West Bengal travel JSON guide.`,
      `Inputs: Start=${trip.startCity}, Dest=${trip.destination} (West Bengal, India), Days=${daysCount}, Month=${startMonth}, Budget=${trip.budget}, Priority=${trip.priority}.`,
      `Rules: Use INR (₹) and km. Every array item must be ONE plain string under 30 words. Output ONLY valid JSON matching exact keys:`,
      `{"reach":[3-4 strings from Start to Dest],"local":[3 strings inside Dest],"stay":[exactly 3 stay strings matching Budget],"days":[exactly ${daysCount} strings, one per day],"landmarks":[exactly 5 strings],"food":[exactly 5 dish/place strings],"gems":[exactly 3 offbeat strings],"dos":[exactly 5 strings],"donts":[exactly 5 strings]}`
    ].join("\n");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GUIDE_TIMEOUT_MS);

    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
            temperature: 0.4,
            maxOutputTokens: 3500
          }
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected response type (${res.status}).`);
      }

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || `Gemini API error (${res.status})`;
        throw new Error(msg);
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Gemini returned an empty response.");

      const parsed = parseGeminiJsonWithRetry(rawText);
      const normalized = normalizeGuidePayload(parsed, trip);
      setCachedGuide(trip, normalized);
      return normalized;
    } catch (err) {
      if (err && err.name === "AbortError") {
        throw new Error("Request timed out after 25 seconds. Please retry or use a built-in route.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ==================== ANANDA CHATBOT (1 CALL PER MESSAGE) ====================
  async function askAnandaWithGemini(trip, guide, recentMessages, userMessage, apiKey) {
    const daysSummary = (guide?.days || [])
      .map((d, i) => `D${i + 1}: ${String(d).slice(0, 90)}`)
      .join(" | ");

    const systemText = [
      `You are Ananda, a warm West Bengal travel guide.`,
      `Trip: ${trip.startCity} -> ${trip.destination}, ${trip.days} days from ${trip.startDate}, Budget: ${trip.budget}, Priority: ${trip.priority}.`,
      `Itinerary summary: ${daysSummary}`,
      `Rules: West Bengal focus only, prices in ₹, distances in km, concise practical answer strictly under 140 words.`
    ].join("\n");

    const slicedHistory = (recentMessages || []).slice(-5).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.text || "").slice(0, 500) }]
    }));

    slicedHistory.push({
      role: "user",
      parts: [{ text: String(userMessage || "").trim() }]
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: slicedHistory,
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
            temperature: 0.5,
            maxOutputTokens: 400
          }
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected response (${res.status})`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `API error (${res.status})`);
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error("Ananda returned an empty reply.");
      return reply.trim();
    } catch (err) {
      if (err && err.name === "AbortError") {
        throw new Error("Ananda timed out. Please try again.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ==================== OPEN-METEO WEATHER (ZERO API KEY) ====================
  function wmoToWeatherMeta(code) {
    if (code === 0) return { symbol: "wb_sunny", label: "Clear" };
    if (code <= 3) return { symbol: "partly_cloudy_day", label: "Partly cloudy" };
    if (code === 45 || code === 48) return { symbol: "foggy", label: "Misty" };
    if (code >= 51 && code <= 67) return { symbol: "rainy", label: "Rain" };
    if (code >= 71 && code <= 77) return { symbol: "ac_unit", label: "Cold" };
    if (code >= 80 && code <= 82) return { symbol: "rainy", label: "Showers" };
    if (code >= 95) return { symbol: "thunderstorm", label: "Storm" };
    return { symbol: "partly_cloudy_day", label: "Pleasant" };
  }

  function toIsoDate(dt) {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
      dt.getDate()
    ).padStart(2, "0")}`;
  }

  function getTripDateList(startDateStr, daysCount) {
    const start = new Date(`${startDateStr}T00:00:00`);
    const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
    const totalDays = Math.min(14, Math.max(1, Number(daysCount) || 3));
    const list = [];
    for (let d = 0; d < totalDays; d++) {
      const dt = new Date(safeStart);
      dt.setDate(safeStart.getDate() + d);
      list.push(toIsoDate(dt));
    }
    return list;
  }

  function buildSeasonalDay(lat, destName, isoDate, dayIdx) {
    const dt = new Date(`${isoDate}T00:00:00`);
    const month = Number.isNaN(dt.getTime()) ? new Date().getMonth() : dt.getMonth(); // 0-11
    const nameLower = normalizeSegment(destName);
    const isHighHills = nameLower.includes("sandakphu") || nameLower.includes("lava") || nameLower.includes("rishop");
    const isHills =
      isHighHills ||
      lat >= 26.8 ||
      nameLower.includes("darjeeling") ||
      nameLower.includes("kalimpong") ||
      nameLower.includes("kurseong") ||
      nameLower.includes("mirik") ||
      nameLower.includes("sittong") ||
      nameLower.includes("takdah");
    const isCoastal =
      nameLower.includes("digha") ||
      nameLower.includes("mandarmani") ||
      nameLower.includes("tajpur") ||
      nameLower.includes("bakkhali") ||
      nameLower.includes("sundarban");

    // Monthly baseline [max, min, rainProb, wmoCode] for Bengal plains
    const plainsProfile = [
      [25, 13, 10, 1], // Jan
      [29, 16, 10, 0], // Feb
      [34, 21, 15, 1], // Mar
      [36, 25, 25, 2], // Apr
      [36, 26, 45, 80], // May
      [34, 26, 70, 61], // Jun
      [32, 26, 80, 63], // Jul
      [32, 26, 75, 61], // Aug
      [32, 25, 65, 80], // Sep
      [31, 23, 35, 2], // Oct
      [29, 18, 10, 0], // Nov
      [26, 14, 5, 0]   // Dec
    ];

    const base = plainsProfile[month] || plainsProfile[10];
    let max = base[0];
    let min = base[1];
    let rain = base[2];
    let code = base[3];

    if (isHighHills) {
      max -= 16;
      min -= 14;
      if (month >= 5 && month <= 9) code = 45;
      else if (month === 11 || month === 0 || month === 1) code = 2;
    } else if (isHills) {
      max -= 11;
      min -= 10;
      if (month >= 5 && month <= 9) code = 61;
      else if (month === 10 || month === 11 || month === 0) code = 45;
    } else if (isCoastal) {
      max -= 2;
      min += 2;
      rain = Math.min(90, rain + 5);
    }

    const wave = ((dayIdx % 3) - 1);
    return {
      date: isoDate,
      max: Math.round(max + wave),
      min: Math.round(min + (dayIdx % 2 === 0 ? 0 : -1)),
      code,
      rain,
      meta: wmoToWeatherMeta(code),
      sourceType: "seasonal"
    };
  }

  async function resolveDestinationCoords(destinationName) {
    const known = global.WIMT_DATA.DESTINATIONS[destinationName];
    if (known) return { lat: known.lat, lon: known.lon, resolvedName: destinationName, waypoints: known.waypoints || [] };

    const norm = normalizeSegment(destinationName);
    for (const [key, val] of Object.entries(global.WIMT_DATA.DESTINATIONS)) {
      if (normalizeSegment(key).includes(norm) || norm.includes(normalizeSegment(key))) {
        return { lat: val.lat, lon: val.lon, resolvedName: key, waypoints: val.waypoints || [] };
      }
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      destinationName + " West Bengal"
    )}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        return {
          lat: geoData.results[0].latitude,
          lon: geoData.results[0].longitude,
          resolvedName: geoData.results[0].name,
          waypoints: []
        };
      }
    }

    const fbRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        destinationName
      )}&count=1&language=en&format=json`
    );
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      if (fbData.results && fbData.results.length > 0) {
        return {
          lat: fbData.results[0].latitude,
          lon: fbData.results[0].longitude,
          resolvedName: fbData.results[0].name,
          waypoints: []
        };
      }
    }

    return { lat: 22.5726, lon: 88.3639, resolvedName: destinationName, waypoints: [] };
  }

  function buildForecastMap(dailyObj, sourceType) {
    const map = new Map();
    const times = dailyObj?.time || [];
    const maxArr = dailyObj?.temperature_2m_max || [];
    const minArr = dailyObj?.temperature_2m_min || [];
    const codeArr = dailyObj?.weather_code || [];
    const rainArr = dailyObj?.precipitation_probability_max || [];
    const precipSumArr = dailyObj?.precipitation_sum || [];

    for (let i = 0; i < times.length; i++) {
      const rainProb =
        rainArr[i] !== undefined && rainArr[i] !== null
          ? Math.round(rainArr[i])
          : precipSumArr[i] > 5
          ? 70
          : precipSumArr[i] > 0.5
          ? 35
          : 10;
      const code = codeArr[i] ?? 1;
      map.set(times[i], {
        date: times[i],
        max: Math.round(maxArr[i] ?? 26),
        min: Math.round(minArr[i] ?? 16),
        code,
        rain: rainProb,
        meta: wmoToWeatherMeta(code),
        sourceType
      });
    }
    return map;
  }

  function shiftIsoYear(isoDate, deltaYears) {
    const dt = new Date(`${isoDate}T00:00:00`);
    dt.setFullYear(dt.getFullYear() + deltaYears);
    return toIsoDate(dt);
  }

  async function fetchWeatherForDestination(destinationName, startDateStr, daysCount) {
    const coords = await resolveDestinationCoords(destinationName);
    const tripDates = getTripDateList(startDateStr, daysCount);
    const waypoints = (coords.waypoints || []).slice(0, 6);

    const allPoints = [
      { title: coords.resolvedName, lat: coords.lat, lon: coords.lon, isMain: true },
      ...waypoints.map((wp) => ({
        title: wp.title,
        note: wp.note,
        lat: wp.coords[0],
        lon: wp.coords[1],
        isMain: false
      }))
    ];

    const latsParam = allPoints.map((p) => p.lat.toFixed(4)).join(",");
    const lonsParam = allPoints.map((p) => p.lon.toFixed(4)).join(",");

    let forecastItems = [];
    let archiveItems = [];
    let liveSuccess = false;

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latsParam}&longitude=${lonsParam}` +
        `&current=temperature_2m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&forecast_days=16&timezone=Asia%2FKolkata`;
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        forecastItems = Array.isArray(raw) ? raw : [raw];
        liveSuccess = forecastItems.length > 0;
      }
    } catch (_) {
      liveSuccess = false;
    }

    // Check if any trip dates lie outside the 16-day live forecast window
    const mainForecastMap = liveSuccess
      ? buildForecastMap(forecastItems[0]?.daily, "live")
      : new Map();
    const missingDates = tripDates.filter((d) => !mainForecastMap.has(d));

    if (missingDates.length > 0) {
      try {
        const archStart = shiftIsoYear(tripDates[0], -1);
        const archEnd = shiftIsoYear(tripDates[tripDates.length - 1], -1);
        const archUrl =
          `https://archive-api.open-meteo.com/v1/archive?latitude=${latsParam}&longitude=${lonsParam}` +
          `&start_date=${archStart}&end_date=${archEnd}` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FKolkata`;
        const archRes = await fetch(archUrl);
        if (archRes.ok) {
          const rawArch = await archRes.json();
          archiveItems = Array.isArray(rawArch) ? rawArch : [rawArch];
        }
      } catch (_) {
        archiveItems = [];
      }
    }

    function buildPointDays(pointIdx, pointObj) {
      const fMap = forecastItems[pointIdx]
        ? buildForecastMap(forecastItems[pointIdx].daily, "live")
        : new Map();
      const aMap = archiveItems[pointIdx]
        ? buildForecastMap(archiveItems[pointIdx].daily, "historical")
        : new Map();

      return tripDates.map((iso, idx) => {
        if (fMap.has(iso)) return fMap.get(iso);
        const prevYearIso = shiftIsoYear(iso, -1);
        if (aMap.has(prevYearIso)) {
          const hist = aMap.get(prevYearIso);
          return { ...hist, date: iso };
        }
        return buildSeasonalDay(pointObj.lat, pointObj.title || destinationName, iso, idx);
      });
    }

    const mainDays = buildPointDays(0, allPoints[0]);
    const hasLiveTripDays = mainDays.some((d) => d.sourceType === "live");
    const hasHistoricalDays = mainDays.some((d) => d.sourceType === "historical");
    const currentRaw = forecastItems[0]?.current;

    const waypointWeather = allPoints.slice(1).map((pt, idx) => {
      const ptDays = buildPointDays(idx + 1, pt);
      const ptCurrent = forecastItems[idx + 1]?.current;
      return {
        title: pt.title,
        note: pt.note || "",
        coords: [pt.lat, pt.lon],
        currentTemp: ptCurrent ? Math.round(ptCurrent.temperature_2m) : ptDays[0]?.max ?? 24,
        currentMeta: ptCurrent
          ? wmoToWeatherMeta(ptCurrent.weather_code)
          : ptDays[0]?.meta ?? wmoToWeatherMeta(1),
        days: ptDays
      };
    });

    return {
      location: coords.resolvedName,
      currentTemp: currentRaw ? Math.round(currentRaw.temperature_2m) : mainDays[0]?.max ?? 24,
      currentMeta: currentRaw
        ? wmoToWeatherMeta(currentRaw.weather_code)
        : mainDays[0]?.meta ?? wmoToWeatherMeta(1),
      beyond16Days: !hasLiveTripDays,
      sourceType: hasLiveTripDays ? "live" : hasHistoricalDays ? "historical" : "seasonal",
      days: mainDays,
      waypointWeather
    };
  }

  global.WIMT_API = {
    escapeHtml,
    getApiKey,
    saveApiKey,
    isProxyDisabledError,
    getGuideCacheKey,
    getCachedGuide,
    setCachedGuide,
    parseGeminiJsonWithRetry,
    generateGuideWithGemini,
    askAnandaWithGemini,
    fetchWeatherForDestination
  };
})(window);
