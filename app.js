/* ==========================================================================
   where is my trip — Zero-API-Key Controller (Plan, Blueprint, Map, Ananda)
   ========================================================================== */

(function (global) {
  "use strict";

  const { getTranslation } = global.WIMT_I18N;
  const {
    STARTING_CITIES,
    DESTINATION_GROUPS,
    DESTINATIONS,
    BENGALI_PHRASEBOOK,
    ABOUT_INFO,
    computeTripPlan
  } = global.WIMT_DATA;

  const { escapeHtml, fetchWeatherForDestination } = global.WIMT_API;

  const THEME_KEY = "wimt_theme";
  const LANG_KEY = "wimt_lang";

  const state = {
    lang: "en",
    view: "plan", // plan | blueprint | map | ananda
    bpTab: "bp-budget", // Budget & Smart Tips FIRST!
    stayFilter: "all",
    inputs: {
      startCity: "Kolkata",
      destination: "Darjeeling",
      startDate: "",
      days: 5,
      adults: 2,
      children: 1,
      infants: 0,
      seniors: 0,
      travelStyle: "Family with kids",
      budgetTier: "mid",
      budgetCap: "",
      priority: "comfort",
      interests: ["Food", "Photography"],
      foodPref: "No preference",
      accessibilityNote: ""
    },
    planResult: null,
    mapInstance: null,
    mapMarkers: [],
    mapPolyline: null,
    weatherReqId: 0,
    anandaHistory: []
  };

  const $ = (id) => document.getElementById(id);

  // ==================== DATE & CURRENCY FORMATTERS ====================
  function getTodayIso(offsetDays = 0) {
    const dt = new Date();
    dt.setDate(dt.getDate() + offsetDays);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
      dt.getDate()
    ).padStart(2, "0")}`;
  }

  function getNextSaturdayIso() {
    const dt = new Date();
    const diff = (6 - dt.getDay() + 7) % 7 || 7;
    return getTodayIso(diff);
  }

  function formatShortDate(isoStr, addDays = 0) {
    const dt = new Date(`${isoStr}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return isoStr;
    dt.setDate(dt.getDate() + addDays);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function formatINR(num) {
    return "₹" + Number(Math.round(num || 0)).toLocaleString("en-IN");
  }

  // ==================== THEME & LANGUAGE ====================
  function applyTheme(theme) {
    const dark = theme === "dark";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
    $("theme-icon").textContent = dark ? "light_mode" : "dark_mode";
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch (_) {}
  }

  function applyLanguage(langCode) {
    state.lang = langCode;
    try {
      localStorage.setItem(LANG_KEY, langCode);
    } catch (_) {}
    $("lang-select").value = langCode;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = getTranslation(langCode, el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = getTranslation(langCode, el.dataset.i18nPlaceholder);
    });

    if (state.planResult) {
      renderBlueprintAll();
    }
    if (state.anandaHistory.length <= 1) {
      resetAnanda();
    }
  }

  // ==================== PLAN FORM RENDER & SYNC ====================
  function renderDestinationGroups() {
    const container = $("destination-groups-container");
    container.innerHTML = DESTINATION_GROUPS.map(
      (grp) => `
      <div>
        <div class="text-xs font-semibold mb-1.5" style="color:var(--text-muted)">${escapeHtml(grp.group)}</div>
        <div class="flex flex-wrap gap-2">
          ${grp.items
            .map((item) => {
              const active = item === state.inputs.destination;
              return `<button type="button" class="choice-chip dest-chip ${
                active ? "active-forest" : ""
              }" data-dest="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
            })
            .join("")}
        </div>
      </div>`
    ).join("");
  }

  function syncReturnDate() {
    const start = state.inputs.startDate || getTodayIso();
    const days = Math.min(14, Math.max(1, Number(state.inputs.days) || 1));
    $("return-date-label").textContent = formatShortDate(start, days - 1);
  }

  function syncTravelersUI() {
    const { adults, children, infants, seniors } = state.inputs;
    $("count-adults").textContent = adults;
    $("count-children").textContent = children;
    $("count-infants").textContent = infants;
    $("count-seniors").textContent = seniors;

    const total = adults + children + infants + seniors;
    const rooms = Math.max(1, Math.ceil((adults + seniors + children * 0.5) / 2));
    $("total-travelers-val").textContent = total;
    $("est-rooms-val").textContent = rooms;
  }

  function syncDurationUI(days) {
    const clamped = Math.min(14, Math.max(1, Number(days) || 5));
    state.inputs.days = clamped;
    $("input-days-custom").value = clamped;
    document.querySelectorAll(".dur-chip").forEach((btn) => {
      btn.classList.toggle("active-forest", Number(btn.dataset.days) === clamped);
    });
    syncReturnDate();
  }

  function setStartingCity(city) {
    state.inputs.startCity = city;
    $("input-origin").value = city;
    document.querySelectorAll("#origin-chips .choice-chip").forEach((btn) => {
      btn.classList.toggle("active-forest", btn.dataset.value.toLowerCase() === city.trim().toLowerCase());
    });
  }

  function setDestination(dest) {
    state.inputs.destination = dest;
    $("input-destination").value = dest;
    document.querySelectorAll(".dest-chip").forEach((btn) => {
      btn.classList.toggle("active-forest", btn.dataset.dest === dest);
    });
  }

  // ==================== GPS MATCHING ====================
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function handleGps() {
    const note = $("gps-note");
    if (!navigator.geolocation) {
      note.textContent = "GPS unavailable. Please choose a city chip.";
      return;
    }
    note.textContent = "Detecting nearest starting city...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let best = STARTING_CITIES[0];
        let minD = Infinity;
        for (const c of STARTING_CITIES) {
          const d = haversineKm(pos.coords.latitude, pos.coords.longitude, c.lat, c.lon);
          if (d < minD) {
            minD = d;
            best = c;
          }
        }
        setStartingCity(best.name);
        note.textContent = `Matched nearest hub: ${best.name} (~${Math.round(minD)} km away).`;
      },
      () => {
        note.textContent = "Location permission denied. Pick a starting city below.";
      },
      { timeout: 7000 }
    );
  }

  // ==================== VIEW & TAB NAVIGATION ====================
  function switchView(viewName) {
    state.view = viewName;
    ["plan", "blueprint", "map", "ananda"].forEach((v) => {
      $(`view-${v}`).classList.toggle("hidden", v !== viewName);
    });
    document.querySelectorAll(".bottom-nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });
    if (viewName === "map") {
      setTimeout(() => {
        if (state.mapInstance) state.mapInstance.invalidateSize();
      }, 150);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function switchBlueprintTab(tabId) {
    state.bpTab = tabId;
    document.querySelectorAll("#bp-tabs-bar .bp-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.bpTab === tabId);
    });
    document.querySelectorAll(".bp-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.id !== tabId);
    });
  }

  // ==================== RENDER BLUEPRINT TABS (BUDGET FIRST!) ====================
  function renderBlueprintAll() {
    const plan = state.planResult;
    if (!plan) return;
    const L = state.lang;
    const inp = state.inputs;
    const destData = plan.destData;

    const tierLabel =
      inp.budgetTier === "budget"
        ? "Backpacker"
        : inp.budgetTier === "luxury"
        ? "Luxury"
        : "Mid-Range";

    $("bp-summary-title").textContent = `${inp.startCity} → ${inp.destination.split(" (")[0]} • ${
      plan.days
    } Days • ${plan.totalTravelers} Travelers • ${tierLabel}`;

    // ---------- TAB 1 (FIRST): BUDGET & SMART TIPS ----------
    const capVal = Number(inp.budgetCap) || 0;
    let capBanner = "";
    if (capVal > 0) {
      const diff = capVal - plan.grandTotalGroup;
      capBanner =
        diff >= 0
          ? `<div class="p-2.5 rounded-xl text-xs font-semibold mb-3 flex items-center gap-2" style="background:var(--forest-soft); color:var(--forest)">
              <span class="material-symbols-outlined text-[17px]">check_circle</span>
              <span>Within your ${formatINR(capVal)} group budget cap (${formatINR(diff)} buffer remaining).</span>
            </div>`
          : `<div class="p-2.5 rounded-xl text-xs font-semibold mb-3 flex items-center gap-2" style="background:var(--terracotta-soft); color:var(--terracotta)">
              <span class="material-symbols-outlined text-[17px]">info</span>
              <span>Estimated total exceeds your ${formatINR(capVal)} cap by ${formatINR(Math.abs(diff))} — check Scenic priority or Budget stays below.</span>
            </div>`;
    }

    const rowsHtml = plan.budgetRows
      .map(
        (r) => `
      <tr>
        <td>${escapeHtml(r.category)}</td>
        <td class="num">${formatINR(r.pp)}</td>
        <td class="num font-semibold">${formatINR(r.group)}</td>
      </tr>`
      )
      .join("");

    const tipsHtml = plan.smartTips
      .map(
        (tip) => `
      <li class="flex items-start gap-2.5 text-xs sm:text-sm" style="color:var(--text-muted)">
        <span class="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:var(--terracotta)"></span>
        <span>${escapeHtml(tip)}</span>
      </li>`
      )
      .join("");

    $("bp-budget").innerHTML = `
      <div class="wb-card">
        ${capBanner}
        <table class="budget-table">
          <thead>
            <tr>
              <th>${escapeHtml(getTranslation(L, "catHeader"))}</th>
              <th class="num">${escapeHtml(getTranslation(L, "perPerson"))}</th>
              <th class="num">${escapeHtml(getTranslation(L, "groupTotal"))} (${plan.totalTravelers})</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td>${escapeHtml(getTranslation(L, "estTotal"))}</td>
              <td class="num">${formatINR(plan.grandTotalPP)}</td>
              <td class="num" style="color:var(--forest)">${formatINR(plan.grandTotalGroup)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="wb-card">
        <h3 class="font-semibold text-base mb-3">${escapeHtml(getTranslation(L, "smartTipsTitle"))}</h3>
        <ul class="space-y-2.5 list-none p-0 m-0">${tipsHtml}</ul>
      </div>
    `;

    // ---------- TAB 2: TRANSIT & STAYS (MATCHING SCREENSHOTS 12-14 + IRCTC LINK) ----------
    const trainsHtml = (destData.trains || [])
      .map(
        (tr) => `
      <div class="wb-card !p-3.5">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="text-xs font-semibold flex items-center gap-1.5" style="color:var(--text-muted)">
              <span class="material-symbols-outlined text-[15px]">train</span>
              <span>${escapeHtml(tr.number)}</span>
            </div>
            <h4 class="font-bold text-base mt-0.5">${escapeHtml(tr.name)}</h4>
          </div>
          <span class="font-bold text-base" style="color:var(--forest)">${escapeHtml(tr.highlightFare)}</span>
        </div>
        <p class="text-xs mt-1.5" style="color:var(--text-muted)">${escapeHtml(tr.route)} · ${escapeHtml(tr.timing)}</p>
        <div class="mt-2 pt-2 border-t border-[var(--border)] text-xs space-y-1">
          <div style="color:var(--text-muted)">${escapeHtml(tr.freq)}</div>
          <div class="font-medium">Classes: ${escapeHtml(tr.classes)}</div>
          <p class="pt-1 text-xs" style="color:var(--terracotta)">${escapeHtml(tr.note)}</p>
        </div>
      </div>`
      )
      .join("");

    const busesHtml = (destData.busesAndCabs || [])
      .map(
        (b) => `
      <div class="wb-subcard flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="font-semibold text-xs sm:text-sm">${escapeHtml(b.mode)}</div>
          <div class="text-xs mt-0.5" style="color:var(--text-muted)">${escapeHtml(b.note)}</div>
        </div>
        <span class="font-bold text-xs sm:text-sm whitespace-nowrap" style="color:var(--forest)">${escapeHtml(b.price)}</span>
      </div>`
      )
      .join("");

    const filteredStays = (destData.stays || []).filter(
      (s) => state.stayFilter === "all" || s.tier === state.stayFilter
    );

    const staysHtml = filteredStays
      .map((s) => {
        const totalCost = s.pricePerNight * plan.nights * plan.rooms;
        const isBest = s.tier === plan.bestStayTier;
        return `
        <div class="wb-card space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="text-xs font-semibold" style="color:${isBest ? "var(--forest)" : "var(--terracotta)"}">${escapeHtml(s.badge)}</div>
              <h4 class="font-bold text-base mt-0.5">${escapeHtml(s.name)}</h4>
              <p class="text-xs mt-0.5" style="color:var(--text-muted)">${escapeHtml(s.location)}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="rating-pill">${escapeHtml(s.rating)} ★</span>
              <div class="text-[11px] mt-1" style="color:var(--text-muted)">${escapeHtml(s.reviews)} ${escapeHtml(getTranslation(L, "reviewsWord"))}</div>
            </div>
          </div>

          <div class="wb-subcard !py-2.5 !px-3 flex items-center justify-between gap-2 flex-wrap">
            <span class="text-xs" style="color:var(--text-muted)">${formatINR(s.pricePerNight)} / ${escapeHtml(getTranslation(L, "roomWord"))} / ${escapeHtml(getTranslation(L, "nightWord"))}</span>
            <strong class="text-sm" style="color:var(--forest)">Total: ${formatINR(totalCost)}</strong>
          </div>

          <p class="text-xs" style="color:var(--text-muted)">${escapeHtml(s.summary)}</p>
          <ul class="space-y-1 text-xs list-none p-0 m-0">
            ${s.bullets
              .map(
                (bl) => `<li class="flex items-start gap-2"><span class="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:var(--forest)"></span><span>${escapeHtml(bl)}</span></li>`
              )
              .join("")}
          </ul>

          <div class="space-y-2 pt-1">
            <a href="${escapeHtml(s.mapsUrl)}" target="_blank" rel="noopener" class="btn-outline w-full text-xs !justify-start no-underline">
              <span class="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>${escapeHtml(getTranslation(L, "viewGoogleMaps"))}</span>
            </a>
            <button type="button" class="btn-forest !py-2 !px-3.5 text-xs btn-stay-directions">
              <span class="material-symbols-outlined text-[15px]">near_me</span>
              <span>${escapeHtml(getTranslation(L, "directions"))}</span>
            </button>
          </div>
        </div>`;
      })
      .join("");

    const nightLabel = plan.nights === 1 ? getTranslation(L, "nightWord") : getTranslation(L, "nightsWord");
    const roomLabel = plan.rooms === 1 ? getTranslation(L, "roomWord") : getTranslation(L, "roomsWord");

    $("bp-transit").innerHTML = `
      <!-- IRCTC & NTES Quick Action Banner -->
      <div class="wb-card flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 class="font-semibold text-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]" style="color:var(--forest)">confirmation_number</span>
            <span>${escapeHtml(getTranslation(L, "trainsTitle"))}</span>
          </h3>
          <p class="text-[11px] mt-0.5" style="color:var(--text-muted)">${escapeHtml(inp.startCity)} → ${escapeHtml(inp.destination)}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a href="https://www.irctc.co.in/nget/train-search" target="_blank" rel="noopener" class="btn-forest !py-1.5 !px-3 text-xs no-underline">
            <span>${escapeHtml(getTranslation(L, "irctcBtn"))}</span>
            <span class="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
          <a href="https://enquiry.indianrail.gov.in/" target="_blank" rel="noopener" class="btn-outline !py-1.5 !px-3 text-xs no-underline">
            <span>${escapeHtml(getTranslation(L, "ntesBtn"))}</span>
          </a>
        </div>
      </div>

      <div class="space-y-3">${trainsHtml}</div>

      <div class="wb-card space-y-2.5">
        <h3 class="font-semibold text-sm flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px]" style="color:var(--terracotta)">directions_bus</span>
          <span>${escapeHtml(getTranslation(L, "busesCabsTitle"))}</span>
        </h3>
        <div class="space-y-2">${busesHtml}</div>
      </div>

      <!-- Where to Stay -->
      <div class="space-y-3 pt-1">
        <div>
          <h3 class="font-bold text-base flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[19px]" style="color:var(--forest)">apartment</span>
            <span>${escapeHtml(getTranslation(L, "whereToStay"))}</span>
          </h3>
          <p class="text-xs mt-0.5" style="color:var(--text-muted)">
            ${escapeHtml(getTranslation(L, "stayCalcNote"))} ${plan.rooms} ${escapeHtml(roomLabel)} × ${plan.nights} ${escapeHtml(nightLabel)}. Ratings &amp; prices from local West Bengal database.
          </p>
        </div>

        <div class="flex flex-wrap gap-2" id="stay-filter-bar">
          <button type="button" class="choice-chip stay-filter-btn ${state.stayFilter === "all" ? "active-terracotta" : ""}" data-filter="all">${escapeHtml(getTranslation(L, "filterAll"))}</button>
          <button type="button" class="choice-chip stay-filter-btn ${state.stayFilter === "budget" ? "active-terracotta" : ""}" data-filter="budget">${escapeHtml(getTranslation(L, "filterBudget"))}</button>
          <button type="button" class="choice-chip stay-filter-btn ${state.stayFilter === "boutique" ? "active-terracotta" : ""}" data-filter="boutique">${escapeHtml(getTranslation(L, "filterBoutique"))}</button>
          <button type="button" class="choice-chip stay-filter-btn ${state.stayFilter === "luxury" ? "active-terracotta" : ""}" data-filter="luxury">${escapeHtml(getTranslation(L, "filterLuxury"))}</button>
        </div>

        <div class="space-y-3">${staysHtml}</div>
      </div>
    `;

    // Wire stay filter & directions
    $("stay-filter-bar")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".stay-filter-btn");
      if (!btn) return;
      state.stayFilter = btn.dataset.filter;
      renderBlueprintAll();
    });
    $("bp-transit").querySelectorAll(".btn-stay-directions").forEach((btn) => {
      btn.addEventListener("click", () => switchView("map"));
    });

    // ---------- TAB 3: DAY-BY-DAY ROUTE ----------
    $("bp-days").innerHTML = plan.daysList
      .map(
        (txt, i) => `
      <div class="wb-card flex gap-3 items-start">
        <div class="px-2.5 py-1.5 rounded-lg text-center flex-shrink-0" style="background:var(--forest-soft); color:var(--forest)">
          <div class="text-xs font-bold">Day ${i + 1}</div>
          <div class="text-[10px]">${escapeHtml(formatShortDate(inp.startDate, i))}</div>
        </div>
        <p class="text-xs sm:text-sm">${escapeHtml(txt)}</p>
      </div>`
      )
      .join("");

    // ---------- TAB 4: LANDMARKS ----------
    $("bp-landmarks").innerHTML = (destData.landmarks || [])
      .map(
        (lm, i) => `
      <div class="wb-card flex items-start gap-2.5">
        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style="background:var(--terracotta-soft); color:var(--terracotta)">${i + 1}</span>
        <p class="text-xs sm:text-sm">${escapeHtml(lm)}</p>
      </div>`
      )
      .join("");

    // ---------- TAB 5: FOOD & HIDDEN GEMS ----------
    $("bp-food").innerHTML = `
      <div class="wb-card space-y-2.5">
        <h3 class="font-semibold text-sm">Food Picks (${escapeHtml(inp.foodPref)})</h3>
        ${plan.foodList
          .map(
            (f, i) => `<div class="wb-subcard text-xs sm:text-sm"><strong>#${i + 1}</strong> ${escapeHtml(f)}</div>`
          )
          .join("")}
      </div>
      <div class="wb-card space-y-2.5">
        <h3 class="font-semibold text-sm">Hidden Gems</h3>
        ${(destData.gems || [])
          .map((g) => `<div class="wb-subcard text-xs sm:text-sm">${escapeHtml(g)}</div>`)
          .join("")}
      </div>
    `;

    // ---------- TAB 6: ETIQUETTE & HARDCODED 6-PHRASE BANGLA PHRASEBOOK ----------
    $("bp-etiquette").innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="wb-card space-y-2">
          <h3 class="font-semibold text-sm" style="color:var(--forest)">✓ Cultural Dos</h3>
          ${(destData.dos || []).map((d) => `<p class="text-xs">• ${escapeHtml(d)}</p>`).join("")}
        </div>
        <div class="wb-card space-y-2">
          <h3 class="font-semibold text-sm" style="color:var(--terracotta)">✕ What to Avoid</h3>
          ${(destData.donts || []).map((d) => `<p class="text-xs">• ${escapeHtml(d)}</p>`).join("")}
        </div>
      </div>
      <div class="wb-card">
        <h3 class="font-semibold text-sm mb-2.5">Essential Bengali Phrasebook (6 Offline Phrases)</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${BENGALI_PHRASEBOOK.map(
            (p) => `
            <div class="wb-subcard">
              <div class="flex justify-between items-center">
                <strong class="text-base" style="color:var(--terracotta)">${escapeHtml(p.bengali)}</strong>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded" style="background:var(--forest-soft); color:var(--forest)">${escapeHtml(p.tag)}</span>
              </div>
              <div class="text-xs font-bold mt-1">${escapeHtml(p.roman)} <span class="font-normal" style="color:var(--text-muted)">(${escapeHtml(p.phonetic)})</span></div>
              <div class="text-xs mt-0.5" style="color:var(--text-muted)">${escapeHtml(p.meaning)}</div>
            </div>`
          ).join("")}
        </div>
      </div>
    `;
  }

  // ==================== MAP & WEATHER ====================
  function updateMapForDestination(destName) {
    const container = $("bengal-map");
    if (!container || typeof global.L === "undefined") return;
    const meta = DESTINATIONS[destName] || DESTINATIONS["Darjeeling"];
    $("map-title").textContent = `${destName.split(" (")[0]} — Route & Waypoints`;

    if (!state.mapInstance) {
      state.mapInstance = global.L.map("bengal-map", { zoomControl: true, scrollWheelZoom: false }).setView([meta.lat, meta.lon], 8);
      global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18
      }).addTo(state.mapInstance);
    } else {
      state.mapInstance.setView([meta.lat, meta.lon], 8);
    }

    state.mapMarkers.forEach((m) => state.mapInstance.removeLayer(m));
    state.mapMarkers = [];
    if (state.mapPolyline) {
      state.mapInstance.removeLayer(state.mapPolyline);
      state.mapPolyline = null;
    }

    const pinIcon = global.L.divIcon({
      className: "wb-pin",
      html: `<div style="background:#b84a27;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.35);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    (meta.waypoints || []).forEach((wp) => {
      const m = global.L.marker(wp.coords, { icon: pinIcon }).addTo(state.mapInstance);
      m.bindPopup(`<strong>${escapeHtml(wp.title)}</strong><br/><span style="font-size:11px">${escapeHtml(wp.note)}</span>`);
      state.mapMarkers.push(m);
    });

    if (meta.route && meta.route.length > 1) {
      state.mapPolyline = global.L.polyline(meta.route, { color: "#1c4e3a", weight: 3.5, dashArray: "6,6" }).addTo(state.mapInstance);
      state.mapInstance.fitBounds(state.mapPolyline.getBounds(), { padding: [24, 24] });
    }
  }

  async function loadWeather(destName, startDate, days) {
    const reqId = ++state.weatherReqId;
    $("weather-note-pill").textContent = "Loading...";
    $("weather-strip").innerHTML = "";
    try {
      const w = await fetchWeatherForDestination(destName, startDate, days);
      if (reqId !== state.weatherReqId) return;
      $("weather-note-pill").textContent = w.beyond16Days
        ? `${w.currentTemp}°C now • Next 5 days`
        : `${w.currentTemp}°C now • Live`;
      $("weather-strip").innerHTML = w.days
        .map(
          (d) => `
        <div class="wb-subcard">
          <div class="text-[11px] font-semibold" style="color:var(--text-muted)">${escapeHtml(formatShortDate(d.date, 0))}</div>
          <span class="material-symbols-outlined my-1 text-[20px]" style="color:var(--forest)">${d.meta.symbol}</span>
          <div class="text-xs font-bold">${d.max}° / ${d.min}°C</div>
          <div class="text-[10px]" style="color:var(--text-muted)">💧 ${d.rain}%</div>
        </div>`
        )
        .join("");
    } catch (_) {
      if (reqId !== state.weatherReqId) return;
      $("weather-note-pill").textContent = "Offline";
      $("weather-strip").innerHTML = `<div class="col-span-full text-xs py-2" style="color:var(--text-muted)">Weather forecast unavailable offline.</div>`;
    }
  }

  // ==================== ANANDA OFFLINE SMART ASSISTANT (0 API KEYS) ====================
  function resetAnanda() {
    state.anandaHistory = [{ role: "assistant", text: getTranslation(state.lang, "anandaWelcome") }];
    renderAnandaFeed();
  }

  function renderAnandaFeed() {
    const feed = $("ananda-feed");
    feed.innerHTML = state.anandaHistory
      .map((m) =>
        m.role === "user"
          ? `<div class="flex justify-end"><div class="px-3 py-2 rounded-xl text-white max-w-[85%]" style="background:var(--forest)">${escapeHtml(
              m.text
            )}</div></div>`
          : `<div class="flex items-start gap-2"><div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style="background:var(--terracotta)">আ</div><div class="px-3 py-2 rounded-xl max-w-[85%] wb-subcard">${escapeHtml(
              m.text
            )}</div></div>`
      )
      .join("");
    feed.scrollTop = feed.scrollHeight;
  }

  function answerAnandaOffline(query) {
    const plan = state.planResult || computeTripPlan(state.inputs);
    const dest = state.inputs.destination;
    const d = plan.destData;
    const q = query.toLowerCase();

    if (q.includes("train") || q.includes("rail") || q.includes("bus") || q.includes("cab") || q.includes("price") || q.includes("ticket") || q.includes("suburban")) {
      const topTrains = (d.trains || []).slice(0, 2).map((t) => `${t.number} ${t.name} (${t.highlightFare}, ${t.timing})`).join(" | ");
      const topBus = (d.busesAndCabs || [])[0];
      return `For ${dest}: Trains → ${topTrains}. Road/Cab → ${topBus ? `${topBus.mode} (${topBus.price})` : "Local cabs available"}. Check the Transit & Stays tab for the IRCTC booking link!`;
    }
    if (q.includes("hotel") || q.includes("stay") || q.includes("room") || q.includes("review")) {
      return (d.stays || [])
        .map((s) => `${s.name}: ${s.rating}★ (${s.reviews} reviews), ${formatINR(s.pricePerNight)}/night`)
        .join(" • ");
    }
    if (q.includes("budget") || q.includes("cost") || q.includes("total") || q.includes("tip")) {
      return `Estimated Total for ${plan.totalTravelers} travelers (${plan.days}d, ${plan.rooms} room): ${formatINR(plan.grandTotalGroup)} (${formatINR(plan.grandTotalPP)}/person). Top tip: ${(plan.smartTips || [])[0]}`;
    }
    if (q.includes("food") || q.includes("eat") || q.includes("veg")) {
      return `Top ${state.inputs.foodPref} picks in ${dest}: ${plan.foodList.slice(0, 3).join(" • ")}`;
    }
    return `Nomoshkar! Your ${plan.days}-day ${dest} trip is ready (${formatINR(plan.grandTotalGroup)} total). Ask about train timings, suburban EMUs, stays & Google ratings, or food picks!`;
  }

  function handleAnandaSend(raw) {
    const text = String(raw || "").trim();
    if (!text) return;
    $("ananda-input").value = "";
    state.anandaHistory.push({ role: "user", text });
    state.anandaHistory.push({ role: "assistant", text: answerAnandaOffline(text) });
    renderAnandaFeed();
  }

  // ==================== GENERATE GUIDE & SHARE LINK ====================
  function buildGuide({ openBlueprint = true } = {}) {
    state.inputs.startCity = $("input-origin").value.trim() || "Kolkata";
    state.inputs.budgetCap = $("input-budget-cap").value.trim();
    state.inputs.accessibilityNote = $("input-accessibility").value.trim();
    state.planResult = computeTripPlan(state.inputs);

    renderBlueprintAll();
    updateMapForDestination(state.inputs.destination);
    loadWeather(state.inputs.destination, state.inputs.startDate, state.inputs.days);
    resetAnanda();

    if (openBlueprint) {
      switchBlueprintTab("bp-budget"); // Grand Total FIRST!
      switchView("blueprint");
    }
  }

  function shareTripLink() {
    const params = new URLSearchParams({
      from: state.inputs.startCity,
      to: state.inputs.destination,
      days: String(state.inputs.days),
      tier: state.inputs.budgetTier,
      lang: state.lang
    });
    const url = `${location.href.split("?")[0]}?${params.toString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        document.querySelectorAll(".share-label").forEach((el) => {
          el.textContent = getTranslation(state.lang, "linkCopied");
          setTimeout(() => {
            el.textContent = getTranslation(state.lang, "shareLink");
          }, 1800);
        });
      });
    }
  }

  function renderAboutModal() {
    $("about-modal-body").innerHTML = `
      <div>
        <div class="text-sm font-bold">${escapeHtml(ABOUT_INFO.creatorName)}</div>
        <div style="color:var(--text-muted)">${escapeHtml(ABOUT_INFO.creatorRole)} · ${escapeHtml(ABOUT_INFO.institution)}</div>
        <div class="mt-1 font-semibold">Phone / WhatsApp: ${escapeHtml(ABOUT_INFO.phone)}</div>
      </div>
      <p style="color:var(--text-muted)">${escapeHtml(ABOUT_INFO.note)}</p>
      <div class="space-y-2">
        ${ABOUT_INFO.projects
          .map(
            (p) => `
          <div class="wb-subcard">
            <div class="font-bold">${escapeHtml(p.title)} <span class="text-[10px]" style="color:var(--terracotta)">(${escapeHtml(p.badge)})</span></div>
            <p class="mt-0.5" style="color:var(--text-muted)">${escapeHtml(p.desc)}</p>
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  // ==================== INIT ====================
  function init() {
    const savedTheme = localStorage.getItem(THEME_KEY) || "light";
    applyTheme(savedTheme);

    const savedLang = localStorage.getItem(LANG_KEY) || "en";
    state.lang = savedLang;

    // Read optional URL params
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("from")) state.inputs.startCity = urlParams.get("from");
    if (urlParams.get("to") && DESTINATIONS[urlParams.get("to")]) state.inputs.destination = urlParams.get("to");
    if (urlParams.get("days")) state.inputs.days = Math.min(14, Math.max(1, Number(urlParams.get("days")) || 5));
    if (urlParams.get("tier")) state.inputs.budgetTier = urlParams.get("tier");
    if (urlParams.get("lang")) state.lang = urlParams.get("lang");

    const today = getTodayIso();
    const dateInput = $("input-start-date");
    dateInput.min = today;
    dateInput.value = today;
    state.inputs.startDate = today;

    renderDestinationGroups();
    setStartingCity(state.inputs.startCity);
    setDestination(state.inputs.destination);
    syncDurationUI(state.inputs.days);
    syncTravelersUI();
    renderAboutModal();

    // Header actions
    $("header-home-btn").addEventListener("click", () => switchView("plan"));
    $("btn-theme-toggle").addEventListener("click", () =>
      applyTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
    );
    $("lang-select").addEventListener("change", (e) => applyLanguage(e.target.value));

    // Plan inputs
    $("btn-gps").addEventListener("click", handleGps);
    $("origin-chips").addEventListener("click", (e) => {
      const btn = e.target.closest(".choice-chip");
      if (btn) setStartingCity(btn.dataset.value);
    });
    $("input-origin").addEventListener("input", (e) => setStartingCity(e.target.value));

    $("destination-groups-container").addEventListener("click", (e) => {
      const btn = e.target.closest(".dest-chip");
      if (btn) setDestination(btn.dataset.dest);
    });

    dateInput.addEventListener("change", (e) => {
      state.inputs.startDate = e.target.value || today;
      syncReturnDate();
    });
    document.querySelectorAll(".quick-date-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const off = btn.dataset.offset;
        const iso = off === "saturday" ? getNextSaturdayIso() : getTodayIso(Number(off) || 1);
        dateInput.value = iso;
        state.inputs.startDate = iso;
        syncReturnDate();
      });
    });

    $("duration-row").addEventListener("click", (e) => {
      const btn = e.target.closest(".dur-chip");
      if (btn) syncDurationUI(btn.dataset.days);
    });
    $("input-days-custom").addEventListener("input", (e) => syncDurationUI(e.target.value));

    document.querySelectorAll(".stepper-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const grp = btn.dataset.group;
        const delta = Number(btn.dataset.delta);
        const minVal = grp === "adults" ? 1 : 0;
        state.inputs[grp] = Math.max(minVal, Math.min(12, state.inputs[grp] + delta));
        syncTravelersUI();
      });
    });

    $("travel-style-chips").addEventListener("click", (e) => {
      const btn = e.target.closest(".style-chip");
      if (!btn) return;
      state.inputs.travelStyle = btn.dataset.value;
      document.querySelectorAll(".style-chip").forEach((c) => c.classList.toggle("active-forest", c === btn));
    });

    $("budget-tier-cards").addEventListener("click", (e) => {
      const card = e.target.closest(".budget-card");
      if (!card) return;
      state.inputs.budgetTier = card.dataset.tier;
      document.querySelectorAll(".budget-card").forEach((c) => c.classList.toggle("active", c === card));
    });

    $("priority-cards").addEventListener("click", (e) => {
      const card = e.target.closest(".priority-card");
      if (!card) return;
      state.inputs.priority = card.dataset.priority;
      document.querySelectorAll(".priority-card").forEach((c) => c.classList.toggle("active-terracotta", c === card));
    });

    $("interests-chips").addEventListener("click", (e) => {
      const btn = e.target.closest(".interest-chip");
      if (!btn) return;
      btn.classList.toggle("active-forest");
      state.inputs.interests = Array.from(document.querySelectorAll(".interest-chip.active-forest")).map(
        (el) => el.dataset.value
      );
    });

    $("food-chips").addEventListener("click", (e) => {
      const btn = e.target.closest(".food-chip");
      if (!btn) return;
      state.inputs.foodPref = btn.dataset.value;
      document.querySelectorAll(".food-chip").forEach((c) => c.classList.toggle("active-terracotta", c === btn));
    });

    // Build / Modify / Share / Print
    $("btn-build-guide").addEventListener("click", () => buildGuide({ openBlueprint: true }));
    $("btn-modify-trip").addEventListener("click", () => switchView("plan"));
    $("btn-share-plan").addEventListener("click", shareTripLink);
    $("btn-share-bp").addEventListener("click", shareTripLink);
    $("btn-print-bp").addEventListener("click", () => window.print());

    // Blueprint Sub-Tabs
    $("bp-tabs-bar").addEventListener("click", (e) => {
      const btn = e.target.closest(".bp-tab");
      if (btn) switchBlueprintTab(btn.dataset.bpTab);
    });

    // Bottom Navigation
    document.querySelectorAll(".bottom-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.view !== "plan" && !state.planResult) {
          buildGuide({ openBlueprint: false });
        }
        switchView(btn.dataset.view);
      });
    });

    // Map Fit
    $("btn-fit-map").addEventListener("click", () => {
      if (state.mapPolyline && state.mapInstance) {
        state.mapInstance.fitBounds(state.mapPolyline.getBounds(), { padding: [24, 24] });
      }
    });

    // Ananda Offline Assistant
    $("btn-ananda-reset").addEventListener("click", resetAnanda);
    $("ananda-send").addEventListener("click", () => handleAnandaSend($("ananda-input").value));
    $("ananda-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAnandaSend($("ananda-input").value);
      }
    });
    document.querySelectorAll(".ananda-quick").forEach((btn) => {
      btn.addEventListener("click", () => handleAnandaSend(btn.textContent));
    });

    // About Modal
    $("btn-open-about").addEventListener("click", () => $("about-modal").classList.remove("hidden"));
    $("btn-close-about").addEventListener("click", () => $("about-modal").classList.add("hidden"));
    $("about-modal").addEventListener("click", (e) => {
      if (e.target.id === "about-modal") $("about-modal").classList.add("hidden");
    });

    // Apply saved/URL language and precompute initial plan silently (zero API keys)
    applyLanguage(state.lang);
    buildGuide({ openBlueprint: false });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
