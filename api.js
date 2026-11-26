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

  // ==================== OPEN-METEO WEATHER (NO API KEY) ====================
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

  async function resolveDestinationCoords(destinationName) {
    const known = global.WIMT_DATA.DESTINATIONS[destinationName];
    if (known) return { lat: known.lat, lon: known.lon, resolvedName: destinationName };

    const norm = normalizeSegment(destinationName);
    for (const [key, val] of Object.entries(global.WIMT_DATA.DESTINATIONS)) {
      if (normalizeSegment(key).includes(norm) || norm.includes(normalizeSegment(key))) {
        return { lat: val.lat, lon: val.lon, resolvedName: key };
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
          resolvedName: geoData.results[0].name
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
          resolvedName: fbData.results[0].name
        };
      }
    }

    return { lat: 22.5726, lon: 88.3639, resolvedName: destinationName };
  }

  async function fetchWeatherForDestination(destinationName, startDateStr, daysCount) {
    const coords = await resolveDestinationCoords(destinationName);
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&forecast_days=16&timezone=Asia%2FKolkata`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather unavailable");
    const data = await res.json();

    const dailyTimes = data?.daily?.time || [];
    const maxArr = data?.daily?.temperature_2m_max || [];
    const minArr = data?.daily?.temperature_2m_min || [];
    const codeArr = data?.daily?.weather_code || [];
    const rainArr = data?.daily?.precipitation_probability_max || [];

    const forecastByDate = new Map();
    for (let i = 0; i < dailyTimes.length; i++) {
      forecastByDate.set(dailyTimes[i], {
        date: dailyTimes[i],
        max: Math.round(maxArr[i]),
        min: Math.round(minArr[i]),
        code: codeArr[i],
        rain: rainArr[i] ?? 0,
        meta: wmoToWeatherMeta(codeArr[i])
      });
    }

    const matchedDays = [];
    const start = new Date(`${startDateStr}T00:00:00`);
    const totalDays = Math.min(Number(daysCount) || 3, 7);
    for (let d = 0; d < totalDays; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + d);
      const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate()
      ).padStart(2, "0")}`;
      if (forecastByDate.has(iso)) {
        matchedDays.push(forecastByDate.get(iso));
      }
    }

    let beyond16Days = false;
    let stripDays = matchedDays;
    if (matchedDays.length === 0) {
      beyond16Days = true;
      stripDays = dailyTimes.slice(0, 5).map((t) => forecastByDate.get(t));
    }

    return {
      location: coords.resolvedName,
      currentTemp: Math.round(data?.current?.temperature_2m ?? 0),
      currentMeta: wmoToWeatherMeta(data?.current?.weather_code ?? 0),
      beyond16Days,
      days: stripDays
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
