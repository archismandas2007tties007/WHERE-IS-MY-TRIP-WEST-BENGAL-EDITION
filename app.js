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
    computeTripPlan,
    getBuiltInWeather
  } = global.WIMT_DATA;

  const { escapeHtml } = global.WIMT_API;

  const THEME_KEY = "wimt_theme";
  const LANG_KEY = "wimt_lang";

  const state = {
    lang: "en",
    view: "plan", // plan | blueprint | map | ananda | about
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
  function syncPlanLiveBadge() {
    const el = $("plan-live-badge-text");
    if (!el) return;
    const from = (state.inputs.startCity || "Kolkata").trim() || "Kolkata";
    const to = (state.inputs.destination || "Darjeeling").split(" (")[0];
    const d = Math.min(14, Math.max(1, Number(state.inputs.days) || 5));
    el.textContent = `${from} → ${to} · ${d}d`;
  }

  function renderDestinationGroups() {
    const container = $("destination-groups-container");
    container.innerHTML = DESTINATION_GROUPS.map(
      (grp) => `
      <div>
        <div class="text-[10.5px] font-bold uppercase tracking-wider mb-1.5" style="color:var(--text-muted)">${escapeHtml(grp.group)}</div>
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
    const dt = new Date(`${start}T00:00:00`);
    if (!Number.isNaN(dt.getTime())) {
      dt.setDate(dt.getDate() + (days - 1));
      $("return-date-label").textContent = dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } else {
      $("return-date-label").textContent = formatShortDate(start, days - 1);
    }
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
    syncPlanLiveBadge();
  }

  function setStartingCity(city) {
    state.inputs.startCity = city;
    $("input-origin").value = city;
    document.querySelectorAll("#origin-chips .choice-chip").forEach((btn) => {
      btn.classList.toggle("active-forest", btn.dataset.value.toLowerCase() === city.trim().toLowerCase());
    });
    syncPlanLiveBadge();
  }

  function setDestination(dest) {
    state.inputs.destination = dest;
    $("input-destination").value = dest;
    document.querySelectorAll(".dest-chip").forEach((btn) => {
      btn.classList.toggle("active-forest", btn.dataset.dest === dest);
    });
    syncPlanLiveBadge();
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
    ["plan", "blueprint", "map", "ananda", "about"].forEach((v) => {
      $(`view-${v}`).classList.toggle("hidden", v !== viewName);
    });
    document.querySelectorAll(".bottom-nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });
    const headerAboutBtn = $("btn-header-about");
    if (headerAboutBtn) {
      headerAboutBtn.classList.toggle("active-forest", viewName === "about");
    }
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

    const builtInW = getBuiltInWeather(inp.destination, inp.startDate, plan.days);
    $("bp-summary-title").textContent = `${inp.startCity} → ${inp.destination.split(" (")[0]} • ${
      plan.days
    } Days • ${plan.totalTravelers} Travelers • ${tierLabel}`;
    $("bp-summary-sub").textContent = `0 API Keys • Expected Weather: ${builtInW.days[0].max}°/${builtInW.days[0].min}°C (${builtInW.currentMeta.label}) · Best: ${builtInW.bestSeason}`;
    if ($("bp-hero-weather")) {
      $("bp-hero-weather").textContent = `${builtInW.days[0].max}° / ${builtInW.days[0].min}°C ${builtInW.currentMeta.label}`;
    }
    if ($("bp-hero-season")) {
      $("bp-hero-season").textContent = `Best: ${builtInW.bestSeason}`;
    }

    // ---------- TAB 1 (FIRST): BUDGET & SMART TIPS ----------
    const capVal = Number(inp.budgetCap) || 0;
    let capBanner = "";
    if (capVal > 0) {
      const diff = capVal - plan.grandTotalGroup;
      capBanner =
        diff >= 0
          ? `<div class="p-3 rounded-xl text-xs font-semibold flex items-center gap-2" style="background:var(--forest-soft); color:var(--on-forest-soft)">
              <span class="material-symbols-outlined text-[17px]">check_circle</span>
              <span>Within your ${formatINR(capVal)} group budget cap (${formatINR(diff)} buffer remaining).</span>
            </div>`
          : `<div class="p-3 rounded-xl text-xs font-semibold flex items-center gap-2" style="background:var(--terracotta-soft); color:var(--on-terracotta-soft)">
              <span class="material-symbols-outlined text-[17px]">info</span>
              <span>Estimated total exceeds your ${formatINR(capVal)} cap by ${formatINR(Math.abs(diff))} — check Scenic priority or Budget stays below.</span>
            </div>`;
    }

    const barColors = ["#1c4e3a", "#003725", "#a53c1a", "#f3a149"];
    const totalGroupBudget = Math.max(1, plan.grandTotalGroup || 1);
    const stackedBarHtml = plan.budgetRows
      .map((r, idx) => {
        const pct = Math.max(4, Math.round((r.group / totalGroupBudget) * 100));
        return `<div class="h-full" style="width:${pct}%; background:${barColors[idx % barColors.length]};" title="${escapeHtml(r.category)}: ${pct}%"></div>`;
      })
      .join("");

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
      <li class="wb-subcard-low flex items-start gap-2.5 text-xs sm:text-sm">
        <span class="mt-2 w-2 h-2 rounded-full flex-shrink-0" style="background:var(--terracotta)"></span>
        <span style="color:var(--text)">${escapeHtml(tip)}</span>
      </li>`
      )
      .join("");

    $("bp-budget").innerHTML = `
      <div class="wb-card space-y-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="icon-box-forest">
              <span class="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div class="min-w-0">
              <h2 class="font-semibold text-base truncate">Estimated Budget</h2>
              <p class="text-xs" style="color:var(--text-muted)">${escapeHtml(tierLabel)} • ${plan.totalTravelers} travelers</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0" style="background:var(--surface-container); color:var(--text-muted)">INR (₹)</span>
        </div>

        ${capBanner}

        <div class="w-full h-2.5 rounded-full overflow-hidden flex gap-0.5" style="background:var(--surface-container)">
          ${stackedBarHtml}
        </div>

        <div class="w-full overflow-x-auto">
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
                <td class="num">${formatINR(plan.grandTotalGroup)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="wb-card space-y-3.5">
        <div class="flex items-center gap-2.5">
          <div class="icon-box-terracotta">
            <span class="material-symbols-outlined text-[20px]">lightbulb</span>
          </div>
          <div>
            <h3 class="font-semibold text-base">${escapeHtml(getTranslation(L, "smartTipsTitle"))}</h3>
            <p class="text-xs" style="color:var(--text-muted)">Local ways to stretch your ${formatINR(plan.grandTotalGroup)} budget</p>
          </div>
        </div>
        <ul class="space-y-2 list-none p-0 m-0">${tipsHtml}</ul>
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

    // ---------- TAB 3: DAY-TO-DAY ITINERARY (WITH WEATHER FOR EVERY DAY) ----------
    renderItineraryDaysTab(plan, inp, builtInW);

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
    const cleanDest = destName.split(" (")[0];
    $("map-title").textContent = `${cleanDest} — Route & Waypoints`;
    const waypointTitles = (meta.waypoints || []).map((w) => w.title);
    if ($("map-route-sub")) {
      $("map-route-sub").textContent = waypointTitles.length ? waypointTitles.join(" → ") : meta.region;
    }
    if ($("waypoint-text")) {
      $("waypoint-text").textContent = "Tap any map pin to preview waypoint highlights";
    }
    if ($("waypoint-meta")) {
      $("waypoint-meta").textContent = `${(meta.waypoints || []).length} stops`;
    }

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
      html: `<div style="background:#a53c1a;width:15px;height:15px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.38);"></div>`,
      iconSize: [15, 15],
      iconAnchor: [7, 7]
    });

    (meta.waypoints || []).forEach((wp) => {
      const m = global.L.marker(wp.coords, { icon: pinIcon }).addTo(state.mapInstance);
      m.bindPopup(`<strong>${escapeHtml(wp.title)}</strong><br/><span style="font-size:11px">${escapeHtml(wp.note)}</span>`);
      m.on("click", () => {
        if ($("waypoint-text")) {
          $("waypoint-text").textContent = `${wp.title} — ${wp.note}`;
        }
      });
      state.mapMarkers.push(m);
    });

    if (meta.route && meta.route.length > 1) {
      state.mapPolyline = global.L.polyline(meta.route, { color: "#003725", weight: 3.5, dashArray: "7,6" }).addTo(state.mapInstance);
      state.mapInstance.fitBounds(state.mapPolyline.getBounds(), { padding: [24, 24] });
    }
  }

  function renderItineraryDaysTab(plan, inp, weatherData) {
    const wDays = (weatherData && weatherData.days) || [];
    $("bp-days").innerHTML = plan.daysList
      .map((txt, i) => {
        const dw = wDays[i] || wDays[wDays.length - 1];
        const weatherPill = dw
          ? `<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-1.5" style="background:var(--surface-container);">
              <span class="material-symbols-outlined text-[15px]" style="color:var(--forest)">${escapeHtml(dw.meta.symbol)}</span>
              <span class="tabular-nums">${dw.max}° / ${dw.min}°C</span>
              <span style="color:var(--text-muted)">· ${escapeHtml(dw.meta.label)}</span>
              <span style="color:var(--text-muted)">· 💧 ${dw.rain}%</span>
            </div>`
          : "";

        return `
          <div class="wb-card flex gap-3 items-start">
            <div class="px-3 py-2 rounded-xl text-center flex-shrink-0" style="background:var(--forest-soft); color:var(--on-forest-soft)">
              <div class="text-xs font-bold">Day ${i + 1}</div>
              <div class="text-[10px] font-medium">${escapeHtml(formatShortDate(inp.startDate, i))}</div>
            </div>
            <div class="min-w-0 flex-1">
              ${weatherPill}
              <p class="text-xs sm:text-sm leading-relaxed">${escapeHtml(txt)}</p>
            </div>
          </div>`;
      })
      .join("");
  }

  function renderWeatherUI(w, builtInMeta) {
    const labelSuffix = w.source === "builtin" ? "Built-in Climate" : "Live Forecast";
    $("weather-note-pill").innerHTML = `<span class="material-symbols-outlined text-[16px]">${escapeHtml(
      w.currentMeta.symbol
    )}</span><span>${w.currentTemp}°C • ${escapeHtml(w.currentMeta.label)} (${labelSuffix})</span>`;

    $("weather-strip").innerHTML = (w.days || [])
      .slice(0, 5)
      .map(
        (d) => `
      <div class="wb-subcard !p-2 sm:!p-2.5 flex flex-col items-center gap-1 text-center">
        <div class="text-[10px] sm:text-[11px] font-semibold" style="color:var(--text-muted)">${escapeHtml(formatShortDate(d.date, 0))}</div>
        <span class="material-symbols-outlined text-[21px]" style="color:var(--forest)">${escapeHtml(d.meta.symbol)}</span>
        <div class="text-xs font-bold tabular-nums leading-tight">${d.max}° <span class="font-normal" style="color:var(--text-muted)">${d.min}°</span></div>
        <div class="text-[10px] font-semibold tabular-nums" style="color:var(--forest)">💧 ${d.rain}%</div>
      </div>`
      )
      .join("");

    if ($("weather-advice") && builtInMeta) {
      $("weather-advice").innerHTML = `
        <div class="flex items-start gap-2.5">
          <span class="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0" style="color:var(--terracotta)">calendar_month</span>
          <div class="min-w-0">
            <div class="font-semibold text-xs">Best Season</div>
            <div class="text-xs mt-0.5" style="color:var(--text-muted)">${escapeHtml(builtInMeta.bestSeason)}</div>
          </div>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0" style="color:var(--forest)">backpack</span>
          <div class="min-w-0">
            <div class="font-semibold text-xs">Packing Tip</div>
            <div class="text-xs mt-0.5" style="color:var(--text-muted)">${escapeHtml(builtInMeta.packingTip)}</div>
          </div>
        </div>
      `;
    }
  }

  function loadWeather(destName, startDate, days) {
    // Purely built-in 12-month West Bengal weather database (0 APIs, 0 network calls)
    const builtIn = getBuiltInWeather(destName, startDate, days);
    renderWeatherUI(builtIn, builtIn);
    if (state.planResult) renderItineraryDaysTab(state.planResult, state.inputs, builtIn);
  }

  // ==================== ANANDA OFFLINE SMART ASSISTANT (0 API KEYS) ====================
  function resetAnanda() {
    state.anandaHistory = [{ role: "assistant", text: getTranslation(state.lang, "anandaWelcome") }];
    renderAnandaFeed();
  }

  function renderAnandaFeed() {
    const feed = $("ananda-feed");
    feed.innerHTML = state.anandaHistory
      .map((m) => {
        if (m.role === "user") {
          return `
            <div class="flex items-end justify-end gap-2">
              <div class="max-w-[82%] px-3.5 py-2.5 rounded-xl rounded-tr-sm text-xs sm:text-sm text-white shadow-sm" style="background:var(--forest)">
                ${escapeHtml(m.text)}
              </div>
            </div>`;
        }

        const cardsHtml = (m.cards || [])
          .map(
            (c) => `
            <div class="p-2.5 rounded-lg space-y-1 shadow-sm" style="background:var(--surface-lowest)">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-xs sm:text-sm">${escapeHtml(c.title)}</span>
                ${c.badge ? `<span class="status-pill-forest !text-[10px]">${escapeHtml(c.badge)}</span>` : ""}
              </div>
              <div class="flex items-center gap-1.5 text-[11px]" style="color:var(--text-muted)">
                <span class="material-symbols-outlined text-[14px]">schedule</span>
                <span>${escapeHtml(c.meta)}</span>
              </div>
              ${
                c.tags && c.tags.length
                  ? `<div class="flex flex-wrap gap-1 pt-0.5">${c.tags
                      .map(
                        (tg) =>
                          `<span class="px-2 py-0.5 rounded text-[10px] font-semibold" style="background:var(--surface-container); color:var(--text)">${escapeHtml(tg)}</span>`
                      )
                      .join("")}</div>`
                  : ""
              }
            </div>`
          )
          .join("");

        return `
          <div class="flex items-start gap-2.5">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm" style="background:var(--terracotta)">আ</div>
            <div class="flex flex-col gap-1 max-w-[88%]">
              <div class="p-3.5 rounded-xl rounded-tl-sm shadow-sm space-y-2.5 text-xs sm:text-sm" style="background:var(--surface-container); color:var(--text)">
                <p class="m-0 leading-relaxed">${escapeHtml(m.text)}</p>
                ${cardsHtml}
                ${m.footer ? `<p class="m-0 text-[11px]" style="color:var(--text-muted)">${escapeHtml(m.footer)}</p>` : ""}
              </div>
              <span class="text-[10px] font-semibold px-1" style="color:var(--text-muted)">Ananda · Offline Cache</span>
            </div>
          </div>`;
      })
      .join("");
    feed.scrollTop = feed.scrollHeight;
  }

  function answerAnandaOffline(query) {
    const plan = state.planResult || computeTripPlan(state.inputs);
    const dest = state.inputs.destination;
    const d = plan.destData;
    const q = query.toLowerCase();

    if (q.includes("train") || q.includes("rail") || q.includes("bus") || q.includes("cab") || q.includes("price") || q.includes("ticket") || q.includes("suburban")) {
      const trainCards = (d.trains || []).slice(0, 2).map((t) => ({
        title: `${t.name} (${t.number})`,
        badge: t.highlightFare,
        meta: `${t.timing} · ${t.route}`,
        tags: t.classes ? t.classes.split("/").slice(0, 3).map((s) => s.trim()) : []
      }));
      const topBus = (d.busesAndCabs || [])[0];
      return {
        text: `Here are the top rail options for ${dest.split(" (")[0]}:`,
        cards: trainCards,
        footer: topBus ? `Road / Cab option: ${topBus.mode} (${topBus.price}). Open Transit & Stays for IRCTC links.` : ""
      };
    }
    if (q.includes("hotel") || q.includes("stay") || q.includes("room") || q.includes("review")) {
      const stayCards = (d.stays || []).map((s) => ({
        title: s.name,
        badge: `${s.rating} ★`,
        meta: `${s.location} · ${s.reviews} reviews`,
        tags: [`${formatINR(s.pricePerNight)}/night`, s.badge]
      }));
      return {
        text: `Top Google-reviewed stays in ${dest.split(" (")[0]}:`,
        cards: stayCards
      };
    }
    if (q.includes("budget") || q.includes("cost") || q.includes("total") || q.includes("tip")) {
      return {
        text: `Estimated Total for ${plan.totalTravelers} travelers (${plan.days}d, ${plan.rooms} room): ${formatINR(plan.grandTotalGroup)} (${formatINR(plan.grandTotalPP)}/person).`,
        footer: `Top tip: ${(plan.smartTips || [])[0]}`
      };
    }
    if (q.includes("weather") || q.includes("climate") || q.includes("temp") || q.includes("rain") || q.includes("cold") || q.includes("wear") || q.includes("pack")) {
      const w = getBuiltInWeather(dest, state.inputs.startDate, plan.days);
      const day0 = w.days[0];
      return {
        text: `Weather in ${w.location} around ${formatShortDate(state.inputs.startDate, 0)}: ${day0.max}°/${day0.min}°C (${day0.meta.label}, ~${day0.rain}% rain chance).`,
        footer: `Best season: ${w.bestSeason}. Tip: ${w.packingTip}`
      };
    }
    if (q.includes("food") || q.includes("eat") || q.includes("veg")) {
      return {
        text: `Top ${state.inputs.foodPref} picks in ${dest.split(" (")[0]}: ${plan.foodList.slice(0, 3).join(" • ")}`
      };
    }
    return {
      text: `Nomoshkar! Your ${plan.days}-day ${dest.split(" (")[0]} trip is ready (${formatINR(plan.grandTotalGroup)} total). Ask about train timings, stays & ratings, weather, or food picks!`
    };
  }

  function handleAnandaSend(raw) {
    const text = String(raw || "").trim();
    if (!text) return;
    $("ananda-input").value = "";
    const reply = answerAnandaOffline(text);
    state.anandaHistory.push({ role: "user", text });
    state.anandaHistory.push({ role: "assistant", text: reply.text, cards: reply.cards, footer: reply.footer });
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

  function renderAboutScreen() {
    const capsHtml = (ABOUT_INFO.capabilities || [])
      .map(
        (c) => `
      <div class="wb-subcard !p-2.5 flex items-center gap-2 text-xs">
        <span class="material-symbols-outlined text-[17px]" style="color:var(--terracotta)">${escapeHtml(c.icon)}</span>
        <span class="font-medium">${escapeHtml(c.label)}</span>
      </div>`
      )
      .join("");

    const statsHtml = (ABOUT_INFO.whyUseStats || [])
      .map(
        (st) => `
      <div class="wb-subcard !p-3">
        <div class="font-serif-head text-2xl font-medium tabular-nums" style="color:var(--forest)">${escapeHtml(st.value)}</div>
        <div class="text-xs font-bold mt-0.5">${escapeHtml(st.label)}</div>
        <div class="text-[11px] mt-1 leading-snug" style="color:var(--text-muted)">${escapeHtml(st.sub)}</div>
      </div>`
      )
      .join("");

    const reasonsHtml = (ABOUT_INFO.whyUseReasons || [])
      .map(
        (r, idx) => `
      <div class="wb-subcard-low flex items-start gap-2.5">
        <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style="background:var(--forest-soft); color:var(--on-forest-soft)">${idx + 1}</span>
        <div>
          <div class="font-bold text-xs sm:text-sm">${escapeHtml(r.title)}</div>
          <p class="text-xs mt-0.5 leading-relaxed" style="color:var(--text-muted)">${escapeHtml(r.desc)}</p>
        </div>
      </div>`
      )
      .join("");

    const projectsHtml = (ABOUT_INFO.projects || [])
      .map(
        (p) => `
      <div class="wb-subcard">
        <div class="flex items-center justify-between gap-2 mb-1">
          <h4 class="font-bold text-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]" style="color:var(--forest)">${escapeHtml(p.icon)}</span>
            <span>${escapeHtml(p.title)}</span>
          </h4>
          <span class="status-pill-terracotta !text-[10px]">${escapeHtml(p.badge)}</span>
        </div>
        <p class="text-xs" style="color:var(--text-muted)">${escapeHtml(p.desc)}</p>
      </div>`
      )
      .join("");

    $("view-about").innerHTML = `
      <!-- Platform Blueprint Card -->
      <div class="wb-card space-y-3">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--terracotta)">Platform Blueprint</span>
          <h2 class="font-serif-head text-2xl font-bold mt-0.5">Where is my trip</h2>
          <p class="text-sm font-semibold mt-0.5" style="color:var(--forest)">${escapeHtml(ABOUT_INFO.tagline)}</p>
        </div>
        <p class="text-xs sm:text-sm leading-relaxed" style="color:var(--text-muted)">${escapeHtml(ABOUT_INFO.note)}</p>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--border)]">
          ${capsHtml}
        </div>

        <div class="wb-subcard flex items-start gap-2 text-xs" style="color:var(--text-muted)">
          <span class="material-symbols-outlined text-[17px] flex-shrink-0" style="color:var(--terracotta)">info</span>
          <span><strong>Accuracy &amp; Verification Notice:</strong> ${escapeHtml(ABOUT_INFO.accuracyNotice)}</span>
        </div>
      </div>

      <!-- Why Use Where is my trip? (Reasons + Backing Statistics) -->
      <div class="wb-card space-y-3.5">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-widest" style="color:var(--terracotta)">Evidence &amp; Impact</span>
          <h3 class="font-serif-head text-xl font-bold mt-0.5">Why People Should Use Where is my trip</h3>
          <p class="text-xs mt-1" style="color:var(--text-muted)">Backed by official Ministry of Tourism &amp; West Bengal Tourism Department figures alongside our zero-API offline architecture:</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">${statsHtml}</div>
        <div class="space-y-2 pt-1">${reasonsHtml}</div>
      </div>

      <!-- About the Creator Card (with Picture & Phone Copy) -->
      <div class="wb-card space-y-3.5">
        <div class="flex items-center gap-3.5">
          <div class="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-[var(--terracotta)]/30 bg-[var(--forest-soft)] flex items-center justify-center shadow-sm">
            <img
              src="${escapeHtml(ABOUT_INFO.avatarUrl)}"
              alt="${escapeHtml(ABOUT_INFO.creatorName)}"
              class="w-full h-full object-cover object-top"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <span class="hidden w-full h-full items-center justify-center text-base font-bold" style="color:var(--forest)">AD</span>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] font-bold uppercase tracking-wider" style="color:var(--terracotta)">Lead Developer &amp; Designer</span>
            <h3 class="font-serif-head text-lg font-bold truncate">${escapeHtml(ABOUT_INFO.creatorName)}</h3>
            <p class="text-xs" style="color:var(--text-muted)">${escapeHtml(ABOUT_INFO.creatorRole)}</p>
            <p class="text-xs font-semibold mt-0.5">${escapeHtml(ABOUT_INFO.institution)}</p>
          </div>
        </div>

        <div class="wb-subcard flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-xs">
            <span class="material-symbols-outlined text-[18px]" style="color:var(--forest)">phone</span>
            <span>Phone / WhatsApp: <strong>${escapeHtml(ABOUT_INFO.phone)}</strong></span>
          </div>
          <button id="btn-copy-phone" type="button" class="btn-forest !py-1.5 !px-3 text-xs">
            <span class="material-symbols-outlined text-[14px]">content_copy</span>
            <span id="copy-phone-label">Copy</span>
          </button>
        </div>

        <div class="space-y-2.5">
          <span class="text-[11px] font-bold uppercase tracking-wider block">Featured Innovations</span>
          ${projectsHtml}
        </div>
      </div>
    `;

    $("btn-copy-phone")?.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ABOUT_INFO.phone).then(() => {
          $("copy-phone-label").textContent = "Copied!";
          setTimeout(() => {
            if ($("copy-phone-label")) $("copy-phone-label").textContent = "Copy";
          }, 1800);
        });
      }
    });
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
    renderAboutScreen();

    // Header actions
    $("header-home-btn").addEventListener("click", () => switchView("plan"));
    $("btn-header-about").addEventListener("click", () => switchView("about"));
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
        const meta = DESTINATIONS[state.inputs.destination] || DESTINATIONS["Darjeeling"];
        if ($("waypoint-text") && meta && meta.waypoints) {
          $("waypoint-text").textContent = `Route fitted: ${meta.waypoints.map((w) => w.title).join(" → ")}`;
        }
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

    // About Screen triggers
    $("btn-open-about").addEventListener("click", () => switchView("about"));

    // Apply saved/URL language and precompute initial plan silently (zero API keys)
    applyLanguage(state.lang);
    buildGuide({ openBlueprint: false });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
