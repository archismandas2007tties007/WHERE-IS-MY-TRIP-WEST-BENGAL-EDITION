/* ==========================================================================
   where is my trip — Complete Zero-API-Key West Bengal Database
   All 21 destinations, trains (incl. Suburban EMU for Sundarbans & Hooghly),
   buses, cabs, Google-reviewed stays, budget math, smart tips, phrasebook & About.
   ========================================================================== */

(function (global) {
  "use strict";

  const STARTING_CITIES = [
    { name: "Kolkata", lat: 22.5726, lon: 88.3639, hub: "Howrah / Sealdah / CCU", extraTransitPerPerson: 0, extraDaysNote: "" },
    { name: "Siliguri", lat: 26.7271, lon: 88.3953, hub: "NJP / Bagdogra (IXB)", extraTransitPerPerson: 0, extraDaysNote: "Starting from North Bengal hub Siliguri/NJP." },
    { name: "New Delhi", lat: 28.6139, lon: 77.2090, hub: "NDLS / DEL Airport", extraTransitPerPerson: 4200, extraDaysNote: "Add Delhi–Kolkata/Bagdogra Rajdhani/Flight leg (~₹4,200–₹9,500 return)." },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777, hub: "CSMT / BOM Airport", extraTransitPerPerson: 4800, extraDaysNote: "Add Mumbai–Kolkata/Bagdogra Rail/Flight leg (~₹4,800–₹11,000 return)." },
    { name: "Bengaluru", lat: 12.9716, lon: 77.5946, hub: "SMVB / BLR Airport", extraTransitPerPerson: 4600, extraDaysNote: "Add Bengaluru–Kolkata/Bagdogra Rail/Flight leg (~₹4,600–₹10,500 return)." }
  ];

  const DESTINATION_GROUPS = [
    {
      group: "City & Heritage",
      items: [
        "Kolkata",
        "Hooghly Heritage Trail (Chandannagar, Serampore, Bandel, Imambara, Tarakeswar)",
        "Murshidabad",
        "Malda (Gour & Pandua)",
        "Cooch Behar"
      ]
    },
    {
      group: "Hills",
      items: [
        "Darjeeling",
        "Kalimpong",
        "Kurseong & Mirik",
        "Lava-Lolegaon-Rishop",
        "Sandakphu-Phalut",
        "Sittong & Takdah"
      ]
    },
    {
      group: "Forests",
      items: [
        "Dooars (Jaldapara, Gorumara, Lataguri, Buxa)",
        "Sundarbans (Gosaba, Sajnekhali, Bonnie Camp)"
      ]
    },
    {
      group: "Rural & Arts",
      items: [
        "Shantiniketan & Birbhum",
        "Bishnupur",
        "Purulia",
        "Jhargram & Mukutmanipur"
      ]
    },
    {
      group: "Coastal",
      items: [
        "Digha",
        "Mandarmani",
        "Tajpur & Shankarpur",
        "Bakkhali-Fraserganj & Henry's Island"
      ]
    }
  ];

  // Helper to construct concise destination records cleanly
  function makeTrain(number, name, route, timing, freq, classes, highlightFare, note) {
    return { number, name, route, timing, freq, classes, highlightFare, note };
  }

  function makeStay(tier, badge, name, rating, reviews, location, pricePerNight, summary, bullets) {
    return {
      tier,
      badge,
      name,
      rating,
      reviews,
      location,
      pricePerNight,
      summary,
      bullets,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " West Bengal")}`
    };
  }

  const DESTINATIONS = {
    "Kolkata": {
      lat: 22.5726, lon: 88.3639, region: "Presidency",
      route: [[22.5855, 88.3468], [22.5448, 88.3426], [22.5744, 88.3639], [22.6534, 88.3576]],
      waypoints: [
        { title: "Howrah Bridge & Flower Market", coords: [22.5855, 88.3468], note: "Iconic cantilever bridge & dawn flower market" },
        { title: "Victoria Memorial & Maidan", coords: [22.5448, 88.3426], note: "Makrana marble museum & green lawns" },
        { title: "College Street Boi Para", coords: [22.5744, 88.3639], note: "Indian Coffee House & book stalls" },
        { title: "Dakshineswar Kali Temple", coords: [22.6534, 88.3576], note: "Navaratna temple & Belur ferry ghat" }
      ],
      trains: [
        makeTrain("EMU / Circular", "Sealdah–Howrah–Ballygunge Suburban", "Sealdah (SDAH) ↔ Howrah / Ballygunge / Dakshineswar", "04:30 AM – 11:45 PM (Every 15 min)", "Daily Suburban", "EMU II (₹10) / Monthly Pass (₹100)", "₹10", "Fastest cheap urban rail ring connecting North & South Kolkata."),
        makeTrain("Blue & Green", "Kolkata Metro Rail", "Dakshineswar ↔ Esplanade ↔ Howrah Maidan / Salt Lake", "06:50 AM – 10:00 PM (Every 6–10 min)", "Daily", "Token / Smart Card (₹10–₹30)", "₹20", "India's first Metro including underwater Hooghly tunnel to Howrah Maidan.")
      ],
      busesAndCabs: [
        { mode: "WBTC AC Volvo Airport–Esplanade (VS1/AC39)", price: "₹50–₹75", note: "45–60 min from CCU Airport to Park Street / Howrah" },
        { mode: "Heritage Tramway (Gariahat / Esplanade)", price: "₹7", note: "Slow nostalgic ride across Maidan and Ballygunge" },
        { mode: "Yellow Taxi / App Cab (Uber, Ola, Yatri Sathi)", price: "₹120–₹320", note: "Per 5–10 km hop; use Yatri Sathi for flat govt rates" },
        { mode: "Hooghly River Ferry (Babughat–Howrah–Belur)", price: "₹6–₹15", note: "Avoids bridge jams with golden-hour river skyline views" }
      ],
      stays: [
        makeStay("budget", "Backpacker · Value Pick", "Broadway Hotel & Heritage Stay", "4.2", "1,450+", "Chandni Chowk Metro, Central Kolkata (0.8 km from Esplanade)", 1650, "1930s Art-Deco icon with spacious rooms and quick Metro access.", ["1 min walk to Chandni Chowk Metro", "Old-world teak furniture & dining", "Easy access to New Market & College St"]),
        makeStay("boutique", "Heritage Boutique · Best Tier Match", "The Astor Hotel Kolkata", "4.4", "3,800+", "Shakespeare Sarani, Park Street (1.1 km from Victoria Memorial)", 4200, "Classic 1905 boutique hotel in the heart of Park Street dining.", ["Walkable to Maidan & Park Street Metro", "Renowned Kebabs & Bengali breakfast", "Quiet courtyard rooms away from traffic"]),
        makeStay("luxury", "Heritage Luxury · Upgrade Pick", "The Oberoi Grand Kolkata", "4.8", "6,500+", "Jawaharlal Nehru Road, Esplanade (0.5 km from New Market)", 12500, "The 'Grande Dame of Chowringhee' offering colonial colonnades & spa.", ["Iconic palm-fringed courtyard pool", "24-hour butler & heritage walk", "Steps from Indian Museum & Maidan"])
      ],
      budgetBase: { transportPP: 600, foodPerDay: 650, localPerDay: 350, permitsPerTrip: 250 },
      smartTips: [
        "Use Kolkata Metro Smart Card or Yatri Sathi app instead of un-metered street cabs to save 30–40%.",
        "Take the ₹15 Hooghly ferry between Dakshineswar and Belur Math rather than paying ₹300+ for road detours.",
        "Plan Victoria Memorial & Indian Museum on Tue–Sun (both galleries are closed on Mondays)."
      ],
      daysPool: [
        "Morning Mullick Ghat Flower Market & Hooghly ferry to Belur Math; afternoon Princep Ghat & Victoria Memorial.",
        "Morning North Kolkata walk: Kumartuli idol workshops, Marble Palace & College Street Coffee House; evening Park Street.",
        "Morning Dakshineswar Kali Temple via Metro; afternoon Indian Museum & St. Paul's Cathedral; sunset at Rabindra Sarobar.",
        "Morning Jorasanko Thakur Bari (Tagore's home) & Sovabazar Rajbari; evening Eco Park & Biswa Bangla Gate.",
        "Morning Tiretti Bazaar Chinatown breakfast & Bow Barracks; afternoon South Park Street Cemetery & Kalighat."
      ],
      landmarks: [
        "Victoria Memorial (Maidan, ₹50): White Makrana marble museum and reflection pools.",
        "Howrah Bridge & Flower Market (Free): Iconic cantilever bridge above Asia's busiest flower market.",
        "Jorasanko Thakur Bari (₹30): Rabindranath Tagore's ancestral mansion and galleries.",
        "Dakshineswar & Belur Math (₹15 ferry): Twin spiritual icons along the Hooghly.",
        "Indian Museum (₹75): Oldest museum in India housing Ashokan pillars and Egyptian galleries."
      ],
      food: {
        veg: ["Kochuri & Chholar Dal at Maharani / Putiram (₹60)", "Shukto, Aloo Posto & Dhokar Dalna thali at 6 Ballygunge Place (₹350)", "Street Phuchka near Vivekananda Park (₹40)", "Nolen Gur Sandesh & Baked Rasogolla at Balaram Mullick (₹80)", "Indian Coffee House cutlet & infusion (₹110)"],
        nonveg: ["Kolkata Mutton Biryani with Aloo at Shiraz / Arsalan (₹280)", "Kosha Mangsho & Luchi at Golbari Shyambazar (₹360)", "Bhetki Fish Fry & Kabiraji at Mitra Cafe (₹190)", "Shorshe Ilish & Chingri Malai Curry at Kasturi (₹480)", "Double Chicken Kathi Roll at Kusum / Nizam's (₹140)"]
      },
      gems: [
        "Tiretti Bazaar (6:30–8:30 AM): Old Chinatown dawn breakfast stalls serving handmade momos & fish-ball soup.",
        "South Park Street Cemetery (1767): Quiet tree-shaded colonial obelisks right off bustling Park Street.",
        "Kumartuli Clay Workshops: Narrow lanes where master artisans sculpt Durga Puja idols all year."
      ],
      dos: ["Carry ₹10–₹50 notes for ferries, trams & phuchkas.", "Use Metro during office rush hours (9–11 AM, 5–8 PM).", "Book Victoria Memorial & Science City tickets online on weekends.", "Remove shoes before entering temple inner courtyards.", "Visit College Street book market before 6 PM."],
      donts: ["Avoid Mondays for Indian Museum and Victoria Memorial.", "Do not photograph inside Marble Palace or Kalighat sanctums.", "Avoid unlicensed touts outside Howrah & Sealdah gates.", "Do not drink untreated tap water.", "Do not board trams from the wrong side on busy intersections."]
    },

    "Hooghly Heritage Trail (Chandannagar, Serampore, Bandel, Imambara, Tarakeswar)": {
      lat: 22.8850, lon: 88.3680, region: "Hooghly Riverfront",
      route: [[22.5839, 88.3426], [22.7520, 88.3420], [22.8671, 88.3674], [22.9045, 88.3935], [22.8878, 88.0156]],
      waypoints: [
        { title: "Howrah Terminal", coords: [22.5839, 88.3426], note: "Board Howrah–Bandel or Tarakeswar suburban EMU" },
        { title: "Serampore Danish Tavern & St. Olav's", coords: [22.7520, 88.3420], note: "Restored 1786 Danish colony & Serampore College" },
        { title: "Chandannagar French Strand", coords: [22.8671, 88.3674], note: "Institut de Chandernagor & Sacred Heart Church" },
        { title: "Bandel Church & Hooghly Imambara", coords: [22.9045, 88.3935], note: "1599 Basilica & grand 1861 Shia Imambara clock tower" },
        { title: "Tarakeswar Temple", coords: [22.8878, 88.0156], note: "Historic 18th-century Shiva shrine on Tarakeswar branch" }
      ],
      trains: [
        makeTrain("37211–37289", "Howrah – Bandel EMU Local (Mainline)", "Howrah (HWH) → Serampore (SRP) → Chandannagar (CGR) → Bandel (BDC)", "04:00 AM – 11:55 PM (Every 12–15 min)", "Daily Suburban", "EMU II (₹10–₹15) / First Class (₹85–₹105)", "₹10", "Stops at Serampore (30m), Chandannagar (45m), Chinsurah & Bandel (60m)."),
        makeTrain("37301–37349", "Howrah – Tarakeswar EMU Local", "Howrah (HWH) → Sheoraphuli → Singur → Tarakeswar (TAK)", "04:15 AM – 11:30 PM (Every 20–25 min)", "Daily Suburban", "EMU II (₹15) / First Class (₹115)", "₹15", "Direct 1h 25m suburban train to Tarakeswar Baba Taraknath Temple."),
        makeTrain("37911–37927", "Howrah – Katwa / Kalna EMU via Bandel", "Howrah (HWH) → Bandel → Guptipara → Ambika Kalna", "Every 45–60 min", "Daily Suburban", "EMU II (₹20)", "₹20", "Ideal add-on for Kalna 108 Shiva Temples & terracotta shrines."),
        makeTrain("13187 / 13177", "Sealdah – Rampurhat / Jangipur Express (via Bandel)", "Sealdah (SDAH) → Naihati → Bandel (BDC)", "Morning & Afternoon", "Daily", "2S (₹55) / CC (₹265)", "₹55", "Alternative link from North Kolkata via Jubilee Rail Bridge to Bandel.")
      ],
      busesAndCabs: [
        { mode: "Electric Toto (Serampore / Chandannagar / Bandel Loop)", price: "₹20–₹30 (short) / ₹450–₹600 (4h tour)", note: "Best way to connect Bandel Church, Imambara & Strand" },
        { mode: "Hooghly / Chinsurah Launch Ferry", price: "₹8–₹12", note: "Crosses between Chinsurah / Chandannagar & Naihati / Barrackpore" },
        { mode: "Private Full-Day AC Sedan from Kolkata", price: "₹2,400–₹3,200", note: "Covers Serampore, Chandannagar, Bandel & Hangseswari in one loop" }
      ],
      stays: [
        makeStay("budget", "Riverside Budget · Value Pick", "Hotel Hooghly & Chinsurah Guest House", "4.1", "410+", "Near Chinsurah Station & Imambara (0.9 km from Strand)", 1450, "Clean AC rooms close to Hooghly Imambara and Bandel Junction.", ["Walkable to Hooghly Imambara ghat", "Easy toto access to Bandel Church", "Homestyle Bengali meals on request"]),
        makeStay("boutique", "Danish Heritage · Best Tier Match", "The Denmark Tavern & Hotel Serampore", "4.5", "1,650+", "Serampore Riverfront, opp. St. Olav's Church (1.0 km from Serampore Stn)", 4200, "Faithfully restored 1786 Danish riverside tavern with museum-grade rooms.", ["View of Hooghly River & St. Olav's", "Famous Danish & Bengali fusion kitchen", "Steps from 1818 Serampore College"]),
        makeStay("luxury", "Colonial Luxury · Upgrade Pick", "The Rajbari Bawali / Vedic Village Retreat", "4.6", "2,900+", "Greater Kolkata River & Resort Belt (45–60 min cab)", 8800, "Restored zamindari courtyard luxury with pool and heritage dining.", ["Restored 300-year-old palace courtyard", "Curated Bengali thali & river excursions", "Ideal for weekend luxury travelers"])
      ],
      budgetBase: { transportPP: 180, foodPerDay: 500, localPerDay: 280, permitsPerTrip: 100 },
      smartTips: [
        "Buy an UTS mobile app EMU ticket (₹10–₹15) on Howrah–Bandel locals to skip station ticket queues completely.",
        "Combine Serampore (Danish), Chandannagar (French) & Bandel (Portuguese/Mughal) in one north-bound train loop; save Tarakeswar for an early morning trip.",
        "Visit Hooghly Imambara before 4:30 PM and Chandannagar Strand at sunset when fairy lights switch on."
      ],
      daysPool: [
        "Morning Howrah–Serampore EMU: tour 1786 Danish Tavern, St. Olav's Church & Serampore College Carey Library; afternoon Chandannagar French Strand & Museum.",
        "Morning Bandel Church (1599), Hooghly Imambara clock tower & Hangseswari Temple (Bansberia); sunset ferry by the ghats.",
        "Early Howrah–Tarakeswar EMU local for Baba Taraknath Temple & Haripal rural markets; return via Sheoraphuli."
      ],
      landmarks: [
        "Chandannagar Strand & Institut de Chandernagor (₹20): French colonial promenade & museum.",
        "The Denmark Tavern & St. Olav's Church (Serampore): Restored 18th-century Danish heritage.",
        "Bandel Basilica (1599): Oldest Christian church in Bengal with riverside balcony.",
        "Hooghly Imambara (Chinsurah, ₹10): Grand 1861 marble-courtyard Shia monument & sundial.",
        "Hangseswari Temple (Bansberia): Rare 13-spired lotus-bud architecture."
      ],
      food: {
        veg: ["Jalbhara Sandesh at Surya Kumar Modak, Chandannagar (₹35)", "Bengali thali & Danish pastries at Serampore Denmark Tavern (₹350)", "Tarakeswar temple prasad & Kachori-Aloor Dom (₹70)", "Luchi-Chholar Dal near Bandel More (₹60)", "Chilled Gondhoraj lime soda along Strand (₹30)"],
        nonveg: ["Chicken/Fish Cutlet & Roast at Denmark Tavern Serampore (₹380)", "Bhetki Fry & Chowmein at Chandannagar Strand kiosks (₹140)", "Rohu Kalia & rice thali near Chinsurah Court (₹180)", "Prawn Malaikari at heritage riverside eateries (₹360)", "Evening Egg Mughlai Paratha near Bandel Station (₹90)"]
      },
      gems: [
        "William Carey Botanical & Library Museum (Serampore College): Rare 1800s first-print Bengali & Sanskrit books.",
        "Itachuna Rajbari (Khanyan, 18 km from Bandel): Shooting spot of Bollywood's 'Lootera' with mud cottages.",
        "Sacred Heart Church & Patal Bari (Chandannagar): Underground riverfront rooms admired by Rabindranath Tagore."
      ],
      dos: ["Check EMU local train platforms 1–8 at Howrah New/Old Complex.", "Dress modestly inside Bandel Basilica and Hooghly Imambara.", "Try Surya Modak's original Jalbhara Talshash Sandesh in Chandannagar.", "Carry ₹10–₹50 notes for totos and ferries.", "Visit Bansberia Hangseswari & Ananta Basudeba terracotta temples together."],
      donts: ["Avoid Chandannagar Strand during Monday museum off-days if visiting Institut de Chandernagor.", "Do not drive large cars into narrow Serampore bazaar lanes — use totos.", "Avoid peak 9–10:30 AM weekday office locals if traveling with heavy luggage.", "Do not photograph inside active prayer rooms of Imambara.", "Do not miss the last Bandel–Howrah evening locals after 10:30 PM."]
    },

    "Darjeeling": {
      lat: 27.0410, lon: 88.2663, region: "Eastern Himalayas",
      route: [[22.5726, 88.3639], [26.7271, 88.3953], [26.8845, 88.2741], [27.0410, 88.2663]],
      waypoints: [
        { title: "Kolkata (Sealdah / Howrah)", coords: [22.5726, 88.3639], note: "Overnight mail or morning Vande Bharat" },
        { title: "New Jalpaiguri (NJP) / Siliguri", coords: [26.7271, 88.3953], note: "Base station for hill shared jeeps & DHR" },
        { title: "Kurseong Tea Ridge", coords: [26.8845, 88.2741], note: "Makaibari & Castleton tea gardens" },
        { title: "Darjeeling Mall & Tiger Hill", coords: [27.0410, 88.2663], note: "2,042m Queen of Hills & Kanchenjunga sunrise" }
      ],
      trains: [
        makeTrain("12343 / 12344", "Darjeeling Mail", "Sealdah (SDAH) → New Jalpaiguri (NJP) / Haldibari", "10:05 PM – 08:00 AM (9h 55m)", "Daily", "SL (₹350) / 3A (₹940) / 2A (₹1,340) / 1A (₹2,250)", "₹940", "Classic overnight train; morning arrival at NJP aligns directly with hill Sumos and DHR Toy Train."),
        makeTrain("12377 / 12378", "Padatik Express", "Sealdah (SDAH) → New Jalpaiguri (NJP)", "11:20 PM – 09:15 AM (9h 55m)", "Daily", "SL (₹365) / 3A (₹980) / 2A (₹1,395) / 1A (₹2,340)", "₹980", "Convenient late-night departure from Sealdah; reliable morning arrival at NJP."),
        makeTrain("13147 / 13148", "Uttar Banga Express", "Sealdah (SDAH) → New Cooch Behar (via NJP)", "07:40 PM – 07:30 AM (11h 50m)", "Daily", "SL (₹370) / 3A (₹990) / 2A (₹1,420)", "₹990", "Early-evening option reaching NJP in time for sunrise uphill transfers."),
        makeTrain("22301 / 22302", "Howrah – NJP Vande Bharat Express", "Howrah (HWH) → New Jalpaiguri (NJP)", "05:55 AM – 01:25 PM (7h 30m)", "Daily except Wed", "CC (₹1,565) / EC (₹2,825)", "₹1,565", "Fastest daytime train; includes onboard meals and arrives NJP early afternoon."),
        makeTrain("52540 / Joy Ride", "Darjeeling Himalayan Railway (Toy Train)", "NJP → Darjeeling (7.5h) / Darjeeling ↔ Ghum Joyride (2h)", "09:15 AM & 10:30 AM Joyrides", "Daily", "Diesel FC (₹1,000) / Steam FC (₹1,500)", "₹1,000", "UNESCO World Heritage mountain rail passing Batasia Loop & Ghum.")
      ],
      busesAndCabs: [
        { mode: "Shared Sumo / Bolero (NJP / Siliguri → Darjeeling)", price: "₹280–₹350 / seat", note: "2.5–3 hrs via Rohini or Pankhabari; departs outside NJP Gate" },
        { mode: "Private Cab / Innova (NJP / Bagdogra → Darjeeling)", price: "₹2,800–₹3,800", note: "Door-to-door hill transfer for up to 6 travelers" },
        { mode: "NBSTC Rocket / Private Volvo (Kolkata → Siliguri)", price: "₹780–₹1,450", note: "Overnight 11h bus from Esplanade to Tenzing Norgay Terminal" },
        { mode: "Local Sightseeing Cab (Tiger Hill + 7 Points)", price: "₹2,400–₹3,500 / day", note: "Fixed syndicate rates from Darjeeling Motor Stand" }
      ],
      stays: [
        makeStay("budget", "Homestay · Value Pick", "Revolver / Ging Tea Valley Homestay", "4.6", "680+", "Gandhi Road / Lebong Valley (0.6 km from Chowrasta)", 1850, "Warm Gorkha & Lepcha family hospitality with mountain valley views.", ["Heated blankets & home-cooked momos", "Walkable to Mall Road cafes", "Great solo & backpacker vibe"]),
        makeStay("boutique", "Heritage Boutique · Best Tier Match", "Central Heritage Resort & Spa (A Sterling Resort)", "4.3", "1,900+", "Robertson Road (0.4 km from Chowrasta)", 3400, "Old-world colonial architecture close to Chowrasta without steep uphill climbs for families.", ["1905 Victorian wood-panelled lounge", "5-minute level walk to Mall Road", "In-house fireplace dining"]),
        makeStay("luxury", "Heritage Luxury · Upgrade Pick", "MAYFAIR Hill Resort Darjeeling", "4.7", "4,200+", "The Mall, Opposite Governor House (0.7 km from Chowrasta)", 11500, "Iconic luxury splurge offering manicured Himalayan grounds and colonial warmth.", ["Former Maharaja of Nazargunj summer house", "Heated suites & landscaped cedar gardens", "Library, spa & mountain-view terrace"])
      ],
      budgetBase: { transportPP: 1900, foodPerDay: 850, localPerDay: 650, permitsPerTrip: 1850 },
      smartTips: [
        "Book 12343 Darjeeling Mail 3A seats 60 days ahead to avoid Tatkal surcharges.",
        "Share a reserved cab from NJP Siliguri Junction stand or take pre-paid WBTC/Sumo counters rather than unverified touts.",
        "Book the DHR Joy Ride (Darjeeling–Ghum–Darjeeling) online on IRCTC at least 3 weeks prior for diesel/steam slots."
      ],
      daysPool: [
        "Arrive NJP/Bagdogra; 3-hour uphill drive via Kurseong tea slopes; sunset stroll along Chowrasta & Mall Road.",
        "04:00 AM Tiger Hill Kanchenjunga sunrise, Ghum Monastery, Batasia Loop & Padmaja Naidu Himalayan Zoo + HMI.",
        "10:30 AM DHR Toy Train Joy Ride & Happy Valley Tea Estate tasting; afternoon Peace Pagoda & Observatory Hill.",
        "Day trip to Mirik Sumendu Lake & Pashupati border viewpoint or Lepchajagat pine forest.",
        "Morning Nathmulls first-flush tea shopping & Glenary's breakfast; scenic descent to NJP for evening train."
      ],
      landmarks: [
        "Tiger Hill (11 km, ₹50 entry): Famous sunrise deck overlooking Kanchenjunga and Everest.",
        "Batasia Loop & War Memorial (₹30): Spiral UNESCO railway garden.",
        "Padmaja Naidu Zoological Park & HMI (₹110): Red panda, snow leopard & Everest climbing museum.",
        "Happy Valley Tea Estate (₹100 tour): 1854 orthodox tea tasting.",
        "Japanese Peace Pagoda & Ghum Monastery (Free): Serene hilltop shrines."
      ],
      food: {
        veg: ["Steamed Veg Momos & Thukpa at Kunga Restaurant (₹150)", "Cinnamon Rolls & Hot Chocolate at Glenary's Bakery (₹320)", "First-flush Muscatel Tea tasting at Nathmulls (₹180)", "Aloo Dum & Wai-Wai Bhel at Chowrasta stalls (₹70)", "Veg Tibetan Tingmo & Tofu Shapta at Dekevas (₹220)"],
        nonveg: ["Pork/Chicken Momos & Gyathuk soup at Kunga (₹190)", "Full English Breakfast & Sausage platter at Keventer's terrace (₹420)", "Chicken Thukpa & Shapaley at Laden La Road eateries (₹180)", "Sizzlers & Himalayan Trout at Joey's Pub / Shangri-La (₹550)", "Darjeeling Beef/Chicken Chilli Fry with noodles (₹260)"]
      },
      gems: [
        "Lepchajagat (19 km): Mist-soaked pine forest reserve with unobstructed Kanchenjunga ridge views.",
        "Tinchuley & Takdah (32 km): Quiet heritage forest bungalows and orange orchards.",
        "Mahakal Temple & Observatory Hill: Ancient hillside shrine draped in prayer flags."
      ],
      dos: ["Pack thermal layers & windproof jacket year-round.", "Book Tiger Hill cab & DHR Joy Ride early.", "Carry cash for shared jeeps & tea kiosks.", "Walk Mall Road gently on Day 1 to acclimatize to 2,042m altitude.", "Buy GI-tagged Darjeeling tea from certified estates."],
      donts: ["Do not feed wild monkeys near Observatory Hill.", "Do not expect kitchens open past 8:45 PM.", "Avoid monsoon peak (July–Aug) landslide weeks if flexible.", "Do not litter on tea slopes.", "Avoid un-syndicated touts quoting inflated cab rates at NJP."]
    },

    "Kalimpong": {
      lat: 27.0594, lon: 88.4695, region: "Kalimpong Hills",
      route: [[26.7271, 88.3953], [27.0594, 88.4695], [27.0847, 88.6611]],
      waypoints: [
        { title: "Siliguri / NJP", coords: [26.7271, 88.3953], note: "Board Sevoke–Teesta highway jeep" },
        { title: "Teesta Bazar & Lovers Meet", coords: [27.0220, 88.4260], note: "Teesta & Rangeet confluence" },
        { title: "Kalimpong Deolo & Durpin", coords: [27.0594, 88.4695], note: "Monasteries, nurseries & colonial estates" }
      ],
      trains: [
        makeTrain("12343 / 12377", "Darjeeling Mail / Padatik Express", "Sealdah (SDAH) → New Jalpaiguri (NJP)", "10:05 PM / 11:20 PM → Morning", "Daily", "SL (₹365) / 3A (₹980) / 2A (₹1,395)", "₹980", "Reach NJP by 9 AM, then 2.5h scenic drive along Teesta River to Kalimpong."),
        makeTrain("22301", "Howrah – NJP Vande Bharat", "Howrah (HWH) → NJP", "05:55 AM – 01:25 PM (7h 30m)", "Except Wed", "CC (₹1,565) / EC (₹2,825)", "₹1,565", "Daytime express connection.")
      ],
      busesAndCabs: [
        { mode: "Shared Sumo (Siliguri Junction → Kalimpong)", price: "₹250–₹300 / seat", note: "2.5 hrs via Sevoke & Teesta Bazar" },
        { mode: "Private Cab (NJP / IXB → Kalimpong)", price: "₹2,800–₹3,500", note: "Direct scenic drive along NH-10" },
        { mode: "Local Sightseeing Cab (Deolo + Durpin + Nurseries)", price: "₹2,200–₹2,800 / day", note: "Covers 8 core Kalimpong points" }
      ],
      stays: [
        makeStay("budget", "Homestay · Value Pick", "Deki Lodge / Kalimpong Homestay", "4.4", "520+", "Upper Cart Road (0.8 km from Main Market)", 1600, "Quiet garden homestay with homemade Tibetan & Nepali meals.", ["Warm hosts & rooftop valley view", "Easy walk to Haat Bazaar", "Great budget comfort"]),
        makeStay("boutique", "Govt Heritage · Best Tier Match", "WBTDCL Morgan House Tourist Lodge", "4.3", "1,480+", "Singamari Cantonment Ridge (3 km from Market)", 3400, "1930s British stone mansion surrounded by manicured lawns and Kanchenjunga views.", ["Iconic colonial architecture", "Peaceful golf-course fringe", "Heritage dining room"]),
        makeStay("luxury", "Hill Resort · Upgrade Pick", "Sinclairs Retreat Kalimpong", "4.5", "1,850+", "6th Mile, Rishi Road (3.5 km from Town)", 7800, "Sprawling hillside resort with valley-facing cottages and pool.", ["Panoramic Teesta valley views", "Spa & landscaped gardens", "Family-friendly spacious rooms"])
      ],
      budgetBase: { transportPP: 1800, foodPerDay: 750, localPerDay: 550, permitsPerTrip: 450 },
      smartTips: [
        "Stop at Lovers Meet Viewpoint (Peshok) when transferring between Kalimpong and Darjeeling to see the emerald Rangeet meet the Teesta.",
        "Buy authentic Kalimpong Lollipop cheese & sourdough directly from Kalimpong Cheese Co-operative near Main Road."
      ],
      daysPool: [
        "Arrive NJP; drive along Teesta River & Coronation Bridge to Kalimpong; evening stroll at Haat Bazaar.",
        "Morning Deolo Hill Park & Science Centre; afternoon Zang Dhok Palri Monastery, Pine View Cactus Nursery & Dr. Graham's Homes.",
        "Morning Morgan House lawn & Mangal Dham; optional Pedong / Delo adventure before return to NJP."
      ],
      landmarks: ["Deolo Hill (₹20)", "Zang Dhok Palri Phodang Monastery", "Morgan House Colonial Mansion", "Pine View Cactus Nursery (₹30)", "Durpin Dara & Dr. Graham's Homes"],
      food: { veg: ["Kalimpong Lollipop Cheese & sourdough (₹180)", "Veg Momos & Thukpa at King Thai / Gompu's (₹150)", "Ginger honey lemon tea & cakes at Art Cafe (₹220)", "Gorkha Dal-Bhat-Tarkari (₹190)", "Rhododendron squash (₹120)"], nonveg: ["Pork/Chicken Sekuwa & Thukpa (₹240)", "Chicken Shapaley & chili sauce (₹160)", "Himalayan Grilled Fish at Sinclairs (₹480)", "Tibetan Beef/Chicken Shyaphaley (₹210)", "Momos at Kalimpong Bazaar (₹140)"] },
      gems: ["Pedong & Sillery Gaon (22 km)", "Munsong Cinchona Plantations", "Teesta White-Water Rafting stretch at Melli"],
      dos: ["Visit Wednesdays/Saturdays for lively Kalimpong Haat Bazaar.", "Carry light woolens.", "Spin monastery prayer wheels clockwise."],
      donts: ["Avoid travelling NH-10 during heavy monsoon landslides.", "Do not pluck exotic orchids inside nurseries."]
    },

    "Kurseong & Mirik": {
      lat: 26.8826, lon: 88.2775, region: "Darjeeling Foothills",
      route: [[26.7271, 88.3953], [26.8826, 88.2775], [26.8902, 88.1869]],
      waypoints: [
        { title: "Siliguri / NJP", coords: [26.7271, 88.3953], note: "Base junction for Rohini Road" },
        { title: "Kurseong & Makaibari", coords: [26.8826, 88.2775], note: "Eagle's Crag & 1859 tea estate" },
        { title: "Mirik Sumendu Lake", coords: [26.8902, 88.1869], note: "Pine lakeside bridge & orange orchards" }
      ],
      trains: [
        makeTrain("12343 / 12377", "Darjeeling Mail / Padatik Express", "Sealdah (SDAH) → NJP", "10:05 PM / 11:20 PM → Morning", "Daily", "SL (₹365) / 3A (₹980)", "₹980", "Kurseong is just 1h 15m uphill from NJP via Rohini Road."),
        makeTrain("52541", "DHR Toy Train (NJP → Kurseong)", "NJP → Sukna → Kurseong", "09:15 AM – 12:30 PM", "Daily", "First Class (₹800)", "₹800", "Scenic narrow-gauge ride through Mahananda Wildlife Sanctuary.")
      ],
      busesAndCabs: [
        { mode: "Shared Jeep (Siliguri → Kurseong / Mirik)", price: "₹150–₹200 / seat", note: "1.5 hrs uphill" },
        { mode: "Private Cab (NJP / IXB → Kurseong / Mirik)", price: "₹2,000–₹2,600", note: "Closest hill stations to Bagdogra Airport (42 km)" }
      ],
      stays: [
        makeStay("budget", "Tea Homestay · Value Pick", "Makaibari Tea Estate Homestay", "4.7", "430+", "Makaibari, Kurseong (3 km from Town)", 1800, "Stay inside the world's first organic tea garden with estate families.", ["Fresh first-flush tea every morning", "Walk right through tea bushes", "Authentic Nepali home meals"]),
        makeStay("boutique", "Heritage Boutique · Best Tier Match", "Cochrane Place Hotel Kurseong", "4.4", "1,120+", "Pankhabari Road, Kurseong", 4400, "Restored 19th-century colonial bungalow known as the 'Land of White Orchids'.", ["Tea-themed rooms & bakery", "Valley mist views from verandah", "Short walk to DHR Kurseong Station"]),
        makeStay("luxury", "Lakeside / Tea · Upgrade Pick", "Taj Chia Kutir Resort & Spa (Makaibari)", "4.8", "1,600+", "Makaibari Tea Estate, Kurseong", 16500, "Ultra-luxury hillside tea resort overlooking rolling Kurseong valleys.", ["Private tea estate trails", "Heated pool & Jiva Spa", "Fine Himalayan dining"])
      ],
      budgetBase: { transportPP: 1650, foodPerDay: 700, localPerDay: 450, permitsPerTrip: 300 },
      smartTips: ["Bagdogra Airport (IXB) is just 42 km from Mirik & Kurseong — ideal for 2–3 day weekend hill trips."],
      daysPool: ["Arrive NJP/IXB; drive up Rohini Road to Kurseong; visit Eagle's Crag & Netaji Subhas Bose Museum (Giddapahar).", "Morning Makaibari Tea Estate tour & Ambootia Shiv Mandir; drive via Tingling Viewpoint to Mirik Sumendu Lake.", "Morning pine walk around Mirik Lake & Bokar Monastery; descend cleanly to NJP/IXB."],
      landmarks: ["Sumendu Lake & Pine Bridge (Mirik)", "Makaibari Tea Estate (1859)", "Eagle's Crag Viewpoint (Kurseong)", "Netaji Museum Giddapahar", "Bokar Ngedon Chokhor Ling Monastery"],
      food: { veg: ["Makaibari organic silver-tips tea (₹150)", "Veg Momos by Mirik lakeside (₹100)", "Cheese toast & coffee at Cochrane Place (₹280)"], nonveg: ["Chicken Thukpa & roasted pork at Mirik (₹180)", "Kurseong bazaar spicy Alu-Mimi & chicken fry (₹130)"] },
      gems: ["Dowhill Eco Park & Victoria Boys' School pine trail", "Bagora Air Force Ridge (2,180m)", "Simana Border Viewpoint"],
      dos: ["Take a morning walk across Mirik's Indreni Pull rainbow bridge.", "Carry light raincoat — Kurseong receives quick mountain mist."],
      donts: ["Avoid boating during sudden Mirik thunderstorms.", "Do not litter pine forests at Dowhill."]
    },

    "Lava-Lolegaon-Rishop": {
      lat: 27.0847, lon: 88.6611, region: "Kalimpong Pine Forests",
      route: [[26.7271, 88.3953], [26.8667, 88.7167], [27.0847, 88.6611]],
      waypoints: [
        { title: "NJP / New Mal Jn", coords: [26.7271, 88.3953], note: "Railhead via Gorubathan" },
        { title: "Lava Monastery & Neora Gate", coords: [27.0847, 88.6611], note: "2,350m misty pine town" },
        { title: "Lolegaon Canopy Walk & Rishop", coords: [27.0185, 88.5642], note: "180m suspended tree-top walkway" }
      ],
      trains: [
        makeTrain("13149 / 13150", "Kanchankanya Express", "Sealdah (SDAH) → New Mal Junction (NMZ)", "08:35 PM – 09:30 AM (12h 55m)", "Daily", "SL (₹385) / 3A (₹1,020) / 2A (₹1,460)", "₹1,020", "Best railhead: New Mal Jn is just 55 km from Lava via scenic Gorubathan."),
        makeTrain("12343 / 12377", "Darjeeling Mail / Padatik", "Sealdah → NJP", "Night → Morning", "Daily", "3A (₹980)", "₹980", "Via Kalimpong road (105 km).")
      ],
      busesAndCabs: [
        { mode: "Private SUV / Bolero (NJP or New Mal Jn → Lava/Rishop)", price: "₹3,200–₹4,200", note: "Steep mountain grades require SUVs" },
        { mode: "Point-to-point Cab (Lava ↔ Lolegaon / Rishop)", price: "₹1,800–₹2,500", note: "4x4 or Sumo needed for Rishop" }
      ],
      stays: [
        makeStay("budget", "Eco Homestay · Value Pick", "Rishop Pine View Homestay", "4.5", "340+", "Upper Rishop Ridge (2,591m)", 1600, "Cozy wooden homestay facing 300-degree Kanchenjunga peaks.", ["Bonfire & organic hill meals", "Zero traffic — peaceful pine trails", "Direct Kanchenjunga window views"]),
        makeStay("boutique", "Forest Lodge · Best Tier Match", "WBFDC Lava & Lolegaon Nature Resort", "4.3", "920+", "Lava Pine Forest / Lolegaon Canopy Park", 3200, "Official West Bengal Forest Corp cottages nestled inside towering pines.", ["Walkable to Lava Monastery", "Right beside Lolegaon Canopy Walk", "Safe, spacious wooden cottages"]),
        makeStay("luxury", "Boutique Villa · Upgrade Pick", "Kalimpong / Lava Heritage Eco Retreat", "4.5", "410+", "Charkhole / Kalimpong-Lava Corridor", 6800, "Private valley cottages with bonfire decks and curated forest walks.", ["Heated luxury suites", "Guided birdwatching in Neora Valley", "Panoramic sunrise terrace"])
      ],
      budgetBase: { transportPP: 2100, foodPerDay: 650, localPerDay: 700, permitsPerTrip: 350 },
      smartTips: ["Get off at New Mal Junction (Kanchankanya Express) instead of NJP to cut road travel to Lava in half via Gorubathan."],
      daysPool: [
        "Arrive New Mal Jn / NJP; climb via Gorubathan & Patharjhora tea gardens to Lava; visit Lava Monastery.",
        "Morning hike or jeep to Tiffin Dara Sunrise Point & Rishop pine ridges; afternoon Changey Falls.",
        "Drive to Lolegaon for the 180m suspended Canopy Walk & Jhandi Dara sunset before returning."
      ],
      landmarks: ["Lolegaon Canopy Walk (₹40)", "Lava Kagyu Thekchen Ling Monastery", "Tiffin Dara & Rishop (2,591m)", "Changey Falls (400m cascade)", "Neora Valley Interpretation Centre"],
      food: { veg: ["Hot Momos & Wai-Wai soup (₹90)", "Organic millet roti, gundruk & local greens thali (₹200)"], nonveg: ["Smoked pork/chicken curry with rice at Rishop homestays (₹280)", "Steaming chicken thukpa (₹150)"] },
      gems: ["Kolakham Village & Neora Valley birding trails", "Charkhole Ridge", "Rachela Pass trekking base"],
      dos: ["Carry strong flashlights & warm woolens (electricity can dip in mist).", "Book WBFDC cottages ahead on wbfdc.com."],
      donts: ["Avoid low-clearance sedans on steep rocky Rishop roads.", "Do not hike into Neora Valley core without a forest guide."]
    },

    "Sandakphu-Phalut": {
      lat: 27.1059, lon: 88.0018, region: "Singalila Ridge (3,636m)",
      route: [[26.7271, 88.3953], [26.9882, 88.1243], [27.1059, 88.0018]],
      waypoints: [
        { title: "NJP / Siliguri", coords: [26.7271, 88.3953], note: "Base hub to Manebhanjan" },
        { title: "Manebhanjan & Tumling", coords: [26.9882, 88.1243], note: "Singalila Land Rover gate (2,970m)" },
        { title: "Sandakphu Summit", coords: [27.1059, 88.0018], note: "Highest peak of West Bengal (3,636m)" }
      ],
      trains: [
        makeTrain("12343 / 12377", "Darjeeling Mail / Padatik Express", "Sealdah → NJP", "Night → Morning", "Daily", "SL (₹365) / 3A (₹980)", "₹980", "Transfer 3 hrs from NJP to Manebhanjan via Mirik or Sukhiapokhri.")
      ],
      busesAndCabs: [
        { mode: "Shared Cab (NJP → Manebhanjan)", price: "₹350–₹450 / seat", note: "3 hrs via Sukhiapokhri" },
        { mode: "Vintage 1950s Land Rover Charter (Manebhanjan → Sandakphu)", price: "₹6,500–₹8,000 (2–3 day round trip)", note: "Shared by 5–6 trekkers (~₹1,300/person); only authorized mountain 4x4s" },
        { mode: "Singalila Guide (Mandatory for Trekkers)", price: "₹1,000–₹1,200 / day", note: "Required at Manebhanjan Forest Checkpost" }
      ],
      stays: [
        makeStay("budget", "Trekker Hut · Value Pick", "GTA Trekkers Hut / Tumling Lodge", "4.4", "610+", "Tumling & Sandakphu Ridge", 1200, "Simple timber mountain huts with extra quilts & steaming ginger tea.", ["Meals & hot water included in packages", "Direct Sleeping Buddha sunrise outside door", "True Himalayan trekker camaraderie"]),
        makeStay("boutique", "Mountain Lodge · Best Tier Match", "Hotel Sherpa Chalet / Sunrise Hotel Sandakphu", "4.5", "780+", "Sandakphu Top (3,636m)", 2800, "Warmest wood-insulated rooms at Bengal's highest summit.", ["Best unobstructed Everest–Kanchenjunga views", "Hearty Dal-Bhat & Tibetan bread", "Helpful summit acclimatization hosts"]),
        makeStay("luxury", "Base Resort · Upgrade Pick", "Chitrey / Taj Chia Kutir (Pre/Post Trek)", "4.7", "900+", "Manebhanjan / Kurseong Base", 9500, "Warm luxury recovery before or after the 3,636m Singalila ridge.", ["Hot showers & spa recovery", "Organic tea meals", "Seamless NJP transfer"])
      ],
      budgetBase: { transportPP: 2400, foodPerDay: 650, localPerDay: 1400, permitsPerTrip: 600 },
      smartTips: [
        "Carry original Passport/Voter ID/Aadhaar — Singalila route crosses along the open India–Nepal ridge at Tumling & Kalipokhri.",
        "Best clear-sky months for Everest + Kanchenjunga 'Sleeping Buddha' are Oct–Dec & Mar–Apr."
      ],
      daysPool: [
        "Arrive NJP; drive 3 hrs to Manebhanjan/Chitrey; stay overnight to acclimatize at 2,134m.",
        "Ascend via Land Rover or trek to Tumling (2,970m) through rhododendron groves.",
        "Continue past Gairibas & Kalipokhri sacred black lake up the steep switchbacks to Sandakphu (3,636m).",
        "05:15 AM Golden Sleeping Buddha dawn (Everest, Lhotse, Makalu & Kanchenjunga); optional trek toward Phalut or descend to Srikhola.",
        "Morning descent via Rimbick / Manebhanjan back to NJP for overnight train."
      ],
      landmarks: ["Sandakphu Summit (3,636m)", "Tumling & Tonglu Meadows", "Kalipokhri Sacred Lake", "Singalila National Park Red Panda Zone", "Phalut Tri-Junction Ridge"],
      food: { veg: ["Hot Wai-Wai soup, Tingmo & Dal-Bhat at mountain huts (₹180)", "Yak cheese & butter tea at Kalipokhri (₹100)"], nonveg: ["Chicken Thukpa & garlic soup for altitude warmth (₹220)", "Egg curry & rice at Tumling lodges (₹240)"] },
      gems: ["Srikhola River Valley", "Gurdum Village", "Rhododendron blooms in April"],
      dos: ["Hire an authorized guide at Manebhanjan.", "Pack -5°C down jacket, gloves, headlamps & power banks.", "Hydrate steadily with garlic soup."],
      donts: ["Never trek solo without permits in Singalila National Park.", "Avoid heavy exertion on Day 1 above 3,000m."]
    },

    "Sittong & Takdah": {
      lat: 26.9425, lon: 88.3932, region: "Kurseong–Darjeeling Offbeat",
      route: [[26.7271, 88.3953], [26.9425, 88.3932], [27.0345, 88.3562]],
      waypoints: [
        { title: "Siliguri / NJP", coords: [26.7271, 88.3953], note: "2h drive via Sevoke–Rambhi" },
        { title: "Sittong Orange Village", coords: [26.9425, 88.3932], note: "Riyong River & winter orange orchards" },
        { title: "Takdah & Tinchuley", coords: [27.0345, 88.3562], note: "Heritage British bungalows & orchid center" }
      ],
      trains: [
        makeTrain("12343 / 12377 / 22301", "Darjeeling Mail / Padatik / Vande Bharat", "Kolkata → NJP", "Night or Morning", "Daily", "3A (₹980) / CC (₹1,565)", "₹980", "2-hour cab ride from NJP via Rambhi/Mongpoo.")
      ],
      busesAndCabs: [
        { mode: "Private Cab (NJP → Sittong / Takdah)", price: "₹2,400–₹3,000", note: "Covers Mongpoo Rabindra Museum en route" },
        { mode: "Shared Jeep (Siliguri → Takdah / Rambhi)", price: "₹180–₹250 / seat", note: "Departs from Siliguri Junction" }
      ],
      stays: [
        makeStay("budget", "Orange Homestay · Value Pick", "Sittong Lepcha Orange Homestay", "4.6", "410+", "Upper Sittong (52 km from NJP)", 1550, "Family-run homestay surrounded by fruiting orange trees in Nov–Jan.", ["Organic garden-to-table meals", "Riyong river walk", "Peaceful hammock balconies"]),
        makeStay("boutique", "Colonial Bungalow · Best Tier Match", "Takdah Heritage Colonial Bungalow #12", "4.6", "670+", "Takdah Cantt (28 km from Darjeeling)", 3800, "1905 stone British officer's bungalow framed by cedar & pine trees.", ["Original fireplace & timber floors", "Private manicured lawn", "Walk to Takdah Orchid Centre"]),
        makeStay("luxury", "Tea Luxury · Upgrade Pick", "Glenburn Tea Estate (Nearby)", "4.9", "820+", "Rungli Rungliot Valley", 18000, "World-renowned boutique tea plantation estate with guided river picnics.", ["All-inclusive gourmet meals", "Private tea tasting", "Kanchenjunga verandah"])
      ],
      budgetBase: { transportPP: 1850, foodPerDay: 650, localPerDay: 550, permitsPerTrip: 250 },
      smartTips: ["Visit Sittong between mid-November and January when entire hillsides turn bright orange with Mandarin harvests."],
      daysPool: ["Arrive NJP; drive via Sevoke & Mongpoo (Tagore's summer house) to Sittong orange village.", "Morning Namthing Pokhari (Himalayan Salamander lake) & Ahaldara Sunrise Point; shift to Takdah.", "Explore Takdah Orchid Centre, Hanging Bridge & Tinchuley; descend to NJP."],
      landmarks: ["Ahaldara 360° Viewpoint", "Namthing Pokhari Lake", "Mongpoo Rabindra Bhavana", "Takdah Heritage Bungalows & Orchid Centre", "Tinchuley Monastery"],
      food: { veg: ["Fresh Sittong orange juice & momos (₹100)", "Home-cooked Nepali Dal-Bhat & squash (₹180)"], nonveg: ["Country chicken curry & bonfire snacks at homestays (₹280)"] },
      gems: ["Riyong Khola crystal stream", "Rungli Rungliot Tea Garden", "Lamahatta Eco Park"],
      dos: ["Book Takdah Bungalow well ahead for winter weekends.", "Ask hosts for orange orchard walks."],
      donts: ["Do not pluck oranges without farmer permission.", "Avoid steep wet trails around Namthing Pokhari in mist."]
    },

    "Dooars (Jaldapara, Gorumara, Lataguri, Buxa)": {
      lat: 26.7500, lon: 88.9500, region: "Himalayan Foothills",
      route: [[22.5726, 88.3639], [26.7271, 88.3953], [26.7500, 88.9500], [26.6494, 89.2981]],
      waypoints: [
        { title: "Sealdah / Howrah", coords: [22.5726, 88.3639], note: "Board Kanchankanya or Padatik Express" },
        { title: "New Mal Jn / NJP", coords: [26.7271, 88.3953], note: "Coronation Bridge over Teesta River" },
        { title: "Gorumara & Lataguri", coords: [26.7500, 88.9500], note: "Rhino watchtowers & Murti River" },
        { title: "Jaldapara & Buxa", coords: [26.6494, 89.2981], note: "Elephant grass savannah & Bhutan border" }
      ],
      trains: [
        makeTrain("13149 / 13150", "Kanchankanya Express", "Sealdah (SDAH) → New Mal Jn / Madarihat / Alipurduar", "08:35 PM – 09:30 AM (NMZ) / 11:15 AM (MDT)", "Daily", "SL (₹385) / 3A (₹1,020) / 2A (₹1,460)", "₹1,020", "Direct scenic Dooars forest rail line passing Mahananda, Gorumara & Jaldapara."),
        makeTrain("12377 / 12378", "Padatik Express", "Sealdah → NJP / New Alipurduar", "11:20 PM – 09:15 AM (NJP)", "Daily", "SL (₹365) / 3A (₹980) / 2A (₹1,395)", "₹980", "Ideal for Lataguri via Sevoke Coronation Bridge."),
        makeTrain("13147 / 13148", "Uttar Banga Express", "Sealdah → NJP / New Cooch Behar", "07:40 PM – 07:30 AM", "Daily", "3A (₹990)", "₹990", "Early morning arrival for morning safaris.")
      ],
      busesAndCabs: [
        { mode: "NBSTC Bus (Siliguri → Lataguri / Madarihat / Alipurduar)", price: "₹110–₹220", note: "Runs hourly along NH-17 tea-garden highway" },
        { mode: "Forest Gypsy Jeep Safari (Gorumara / Jaldapara)", price: "₹2,400–₹3,600 / jeep (up to 6 pax)", note: "Includes forest entry permit & guide" },
        { mode: "Full-Day SUV Hire (Lataguri–Samsing–Suntalekhola)", price: "₹2,800–₹3,500 / day", note: "Covers mountain foothill streams & tea estates" }
      ],
      stays: [
        makeStay("budget", "Nature Homestay · Value Pick", "Lataguri / Murti River Homestay", "4.3", "490+", "Lataguri Bazaar (1.2 km from Gorumara Gate)", 1650, "Clean forest-fringe rooms right beside Gorumara safari ticket counter.", ["Walkable to Lataguri Safari Counter", "Fresh Boroli fish & Bengali meals", "Quiet garden seating"]),
        makeStay("boutique", "Forest Resort · Best Tier Match", "WBTDCL Murti Tourist Resort (Banani)", "4.4", "1,620+", "Murti Riverbank, Chalsa (9 km from Lataguri)", 3200, "Iconic forest-edge cottages overlooking the pebble-strewn Murti River.", ["Frequent wild peacock & deer sightings", "Evening tribal folk dance", "Spacious family cottages"]),
        makeStay("luxury", "Tea & Jungle · Upgrade Pick", "Sinclairs Retreat Dooars / Baradighi Bungalow", "4.5", "2,100+", "Chalsa Hilltop, Dooars", 8500, "Sprawling 20-acre hillside tea-country resort with pool and watchtower deck.", ["Panoramic Himalayan foothill views", "Pool, spa & safari desk", "Luxury colonial heritage wing"])
      ],
      budgetBase: { transportPP: 1950, foodPerDay: 750, localPerDay: 850, permitsPerTrip: 1200 },
      smartTips: [
        "Gorumara, Jaldapara & Buxa National Parks remain CLOSED every year from June 16 to September 15.",
        "Board Kanchankanya Express straight to New Mal Jn (Lataguri) or Madarihat (Jaldapara) to avoid Siliguri highway cab costs."
      ],
      daysPool: [
        "Arrive New Mal Jn / NJP; cross Coronation Bridge to Murti/Lataguri; afternoon Chapramari Watchtower safari.",
        "06:00 AM Gorumara National Park jeep safari (Medla/Jatraprasad); afternoon Samsing, Suntalekhola & Rocky Island.",
        "Shift to Jaldapara (Madarihat) for afternoon Chilapata rainforest ruins (Nal Rajar Garh).",
        "06:00 AM Jaldapara one-horned rhino safari; afternoon Bindu/Jhalong or Buxa Tiger Reserve foothills.",
        "Morning tea estate walk & local souvenir tea before evening Kanchankanya Express return."
      ],
      landmarks: ["Gorumara National Park", "Jaldapara Wildlife Sanctuary", "Samsing & Suntalekhola", "Buxa Fort & Jayanti Riverbed", "Sevoke Coronation Bridge"],
      food: { veg: ["Aloo Posto, Musur Dal & seasonal Dooars greens (₹180)", "Garden-fresh CTC & green tea (₹30)", "Steamed Veg Momos at Chalsa (₹100)"], nonveg: ["North Bengal Boroli river-fish curry (₹340)", "Bamboo-shoot chicken thali at Samsing (₹260)", "Mutton Kosha at Murti resorts (₹390)"] },
      gems: ["Bindu & Jhalong (India–Bhutan river border)", "Totopara indigenous hamlet", "Chilapata Ramganga Tree & ruins"],
      dos: ["Carry original Aadhaar/Passport for safari permits.", "Wear olive/brown/beige tones on watchtowers.", "Slow down on NH-17 elephant crossings at dusk."],
      donts: ["Never stop cars to feed or selfie-pose near wild elephants.", "Avoid June 16 – Sept 15 if your goal is jungle safaris.", "No flash photography on safaris."]
    },

    "Sundarbans (Gosaba, Sajnekhali, Bonnie Camp)": {
      lat: 21.9497, lon: 88.9007, region: "South 24 Parganas Delta",
      route: [[22.5726, 88.3639], [22.3364, 88.6477], [22.1867, 88.8045], [21.9497, 88.9007]],
      waypoints: [
        { title: "Sealdah South Terminal", coords: [22.5675, 88.3705], note: "Board Canning / Namkhana suburban EMU" },
        { title: "Canning Railhead", coords: [22.3364, 88.6477], note: "1h 15m EMU from Sealdah (₹15)" },
        { title: "Godkhali Ferry Ghat", coords: [22.1867, 88.8045], note: "Main boat boarding hub for Gosaba & Pakhiralay" },
        { title: "Sajnekhali & Bonnie Camp", coords: [21.9497, 88.9007], note: "Tiger reserve watchtowers & canopy walk" }
      ],
      trains: [
        makeTrain("34512–34556", "Sealdah – Canning Suburban EMU Local", "Sealdah South (SDAH) → Ballygunge → Sonarpur → Canning (CG)", "04:05 AM – 11:30 PM (Every 35–45 min)", "Daily Suburban", "EMU II (₹15 Single / ₹30 Return)", "₹15", "Fastest & cheapest 1h 15m rail link to Canning; catch shared auto/magic outside Canning Stn to Godkhali Ghat."),
        makeTrain("34792–34798", "Sealdah – Namkhana Suburban EMU Local", "Sealdah South (SDAH) → Baruipur → Kakdwip → Namkhana", "05:10 AM – 10:15 PM (Every 60–90 min)", "Daily Suburban", "EMU II (₹25 Single)", "₹25", "Ideal suburban route for western Sundarbans, Raidighi/Bonnie Camp boats & Bakkhali."),
        makeTrain("34712–34744", "Sealdah – Lakshmikantapur EMU Local", "Sealdah South → Baruipur → Lakshmikantapur / Mathurapur", "04:40 AM – 11:00 PM (Every 30–40 min)", "Daily Suburban", "EMU II (₹20 Single)", "₹20", "Connects directly via Raidighi auto (35 min, ₹40) to Bonnie Camp / Kalash Island boat launches.")
      ],
      busesAndCabs: [
        { mode: "Shared Auto / Magic Van (Canning Stn → Godkhali Ghat)", price: "₹50–₹70 / seat", note: "45-minute rural ride along the Matla embankment" },
        { mode: "WBTC / Private Bus (Science City / Esplanade → Godkhali / Dhamakhali)", price: "₹95–₹150", note: "Direct 3h road link via Basanti Highway" },
        { mode: "Private AC Cab (Kolkata → Godkhali Ghat Round Trip)", price: "₹2,800–₹3,800", note: "Wait/drop near Basanti Bridge" },
        { mode: "Motorized Tourist Safari Boat Charter (With Guide)", price: "₹3,800–₹5,500 / day", note: "Split across 6–15 travelers (~₹500–₹900 pp/day) + ₹120 Forest Permit" }
      ],
      stays: [
        makeStay("budget", "Eco Cottage · Value Pick", "Pakhiralay / Dayapur Village Eco Homestay", "4.3", "420+", "Pakhiralay Island (opp. Sajnekhali)", 1600, "Clean mud-plastered village cottages with fresh creek-boat pick-up.", ["Home-cooked Bengali meals included options", "Quiet solar-lit garden", "Boatman & guide arranged directly"]),
        makeStay("boutique", "Sanctuary Lodge · Best Tier Match", "WBTDCL Sajnekhali Tourist Lodge", "4.2", "1,350+", "Sajnekhali Island (inside Reserve Gate)", 2900, "Government eco-lodge sitting steps from the Sajnekhali watchtower & museum.", ["Right next to permit office", "Private mangrove jetty", "Solar AC cottages"]),
        makeStay("luxury", "Eco Resort · Upgrade Pick", "Sundarban Tiger Camp (Dayapur)", "4.6", "1,850+", "Dayapur Island (10 min boat from Sajnekhali)", 6200, "Premier wildlife cottages featuring Baul folk evenings and private boats.", ["Naturalist-led creek safaris", "Bono Bibi cultural theatre", "AC heritage cottages & buffet"])
      ],
      budgetBase: { transportPP: 220, foodPerDay: 700, localPerDay: 900, permitsPerTrip: 650 },
      smartTips: [
        "Take the ₹15 Sealdah–Canning EMU local at 06:15 AM + ₹60 shared auto to reach Godkhali by 8:30 AM — saves ₹2,500+ vs private Kolkata cabs!",
        "Carry original Aadhaar/Passport for Sajnekhali Range Office forest boat permits (₹120 Indians / ₹1,200 Foreigners).",
        "For Bonnie Camp & Kalash Island (less crowded western delta), use the Sealdah–Lakshmikantapur EMU (₹20) via Raidighi."
      ],
      daysPool: [
        "Board early Sealdah–Canning EMU (₹15) → Godkhali Ghat → boat transfer to Pakhiralay; sunset walk at Hamilton Bungalow, Gosaba.",
        "Full-day mangrove cruise: Sajnekhali Watchtower & Mangrove Museum, Sudhanyakhali Watchtower & 500m Dobanki Canopy Walk.",
        "Morning creek loop through Pirkhali & Panchamukhani 5-river junction (or Bonnie Camp tower); return Godkhali by 4 PM for Canning EMU."
      ],
      landmarks: ["Sajnekhali Watchtower & Crocodile Pond", "Dobanki 500m Canopy Walk", "Sudhanyakhali Watchtower", "Bonnie Camp Watchtower (Highest in Delta)", "Gosaba Hamilton Sahib Bungalow"],
      food: { veg: ["Mochar Ghonto, Shukto & warm dal-rice onboard boats (₹220)", "Beguni, Aloor Chop & ginger tea on upper deck (₹60)", "Winter Nolen Gur Payesh (₹80)"], nonveg: ["Estuarine Chingri Malai Curry & Bhetki Fry onboard (₹380)", "Mud Crab Masala & Desi Murgir Jhol at Pakhiralay (₹420)", "Hilsa & Rohu river curry (₹350)"] },
      gems: ["Bonnie Camp & Kalash Island turtle nesting beaches", "Bono Bibi Pala village folk drama", "Netidhopani 400-year-old forest temple ruins"],
      dos: ["Bring binoculars, mosquito repellent & original photo ID.", "Keep voices quiet on creek decks to spot tigers & kingfishers.", "Travel Oct–Mar for pleasant tides."],
      donts: ["Never toss plastic bottles into tidal creeks.", "Never step onto muddy banks outside fenced watchtowers.", "Avoid monsoon swells (July–mid-Sept)."]
    },

    "Murshidabad": {
      lat: 24.1802, lon: 88.2676, region: "Bhagirathi Banks",
      route: [[22.5726, 88.3639], [23.4038, 88.5025], [24.1802, 88.2676]],
      waypoints: [
        { title: "Kolkata / Sealdah", coords: [22.5726, 88.3639], note: "Board Hazarduari / Bhagirathi Express" },
        { title: "Krishnanagar City Jn", coords: [23.4038, 88.5025], note: "Clay dolls & Sarbhaja sweet hub" },
        { title: "Hazarduari & Lalbagh", coords: [24.1802, 88.2676], note: "1,000-door palace, Imambara & Katra Mosque" }
      ],
      trains: [
        makeTrain("13113 / 13114", "Hazarduari Express", "Kolkata (KOAA) → Krishnanagar → Berhampore → Murshidabad (MBB)", "06:50 AM – 10:45 AM (3h 55m)", "Daily", "2S (₹115) / CC (₹390)", "₹115", "Ideal day-tripper express arriving Lalbagh mid-morning."),
        makeTrain("13103 / 13104", "Bhagirathi Express", "Sealdah (SDAH) → Berhampore (BPC) → Murshidabad (MBB)", "06:20 PM – 10:15 PM (3h 55m)", "Daily", "2S (₹115) / CC (₹390)", "₹115", "Evening express returning early morning to Sealdah."),
        makeTrain("31911–31927", "Sealdah – Lalgola MEMU / Passenger", "Sealdah → Ranaghat → Plassey → Murshidabad → Lalgola", "Morning, Noon & Evening", "Daily", "MEMU II (₹45–₹55)", "₹50", "Ultra-budget suburban/MEMU connection along the Bhagirathi.")
      ],
      busesAndCabs: [
        { mode: "WBTC / SBSTC Bus (Esplanade → Berhampore)", price: "₹190–₹340", note: "4.5–5 hrs via NH-12" },
        { mode: "Horse-Drawn Tanga / Electric Toto (Full Lalbagh Heritage Tour)", price: "₹550–₹800 / day", note: "Covers Hazarduari, Katra, Motijheel, Kathgola & Nashipur" },
        { mode: "Bhagirathi Country Ferry (Hazarduari Ghat ↔ Khoshbagh)", price: "₹10", note: "10-minute boat ride to Siraj-ud-Daulah's mausoleum" }
      ],
      stays: [
        makeStay("budget", "Town Lodge · Value Pick", "Hotel Manjusha / Samrat Berhampore", "4.1", "690+", "Lalbagh / Berhampore Court (1.5 km from Hazarduari)", 1450, "Clean budget AC rooms close to Hazarduari Ghat & rail station.", ["Easy toto access to all monuments", "Fresh local Bengali & Mughlai meals", "Budget-friendly family rooms"]),
        makeStay("boutique", "Royal Rajbari · Best Tier Match", "Cossimbazar Palace of the Roys (Rajbari)", "4.6", "1,120+", "Cossimbazar, Berhampore (6 km from Hazarduari)", 5200, "Stay inside genuine 18th-century zamindari rooms with antique courtyards.", ["Private palace heritage tour included", "Lush royal gardens & silk lore", "Authentic Nawabi & Bengali feasts"]),
        makeStay("luxury", "Heritage Haveli · Upgrade Pick", "Bari Kothi Heritage Hotel (Azimganj)", "4.8", "740+", "Azimganj Bhagirathi Riverfront (across from Lalbagh)", 11500, "Restored 1780s Jain Sheherwali riverside mansion offering royal experiences.", ["High-tea on Bhagirathi boat", "Restored Belgian glass & grand halls", "Zero-waste Sheherwali gourmet dining"])
      ],
      budgetBase: { transportPP: 300, foodPerDay: 550, localPerDay: 350, permitsPerTrip: 200 },
      smartTips: [
        "Hazarduari Palace Museum is CLOSED every Friday — always check the day before booking Hazarduari Express.",
        "Take the ₹10 country ferry across the Bhagirathi before 5:00 PM to visit Khoshbagh mango orchards."
      ],
      daysPool: [
        "Board 06:50 AM Hazarduari Express; tour Hazarduari Palace, Nizamat Imambara & Wasif Manzil; sunset boat ride to Khoshbagh.",
        "Morning Katra Mosque, Jahan Kosha Cannon & Motijheel; afternoon Kathgola Palace Gardens & Jagat Seth's House.",
        "Visit Cossimbazar Rajbari, Dutch Cemetery & Murshidabad silk weaving looms before evening return."
      ],
      landmarks: ["Hazarduari Palace Museum (₹25)", "Nizamat Imambara", "Katra Mosque (1724)", "Khoshbagh Mausoleum", "Kathgola Palace & Jain Temple"],
      food: { veg: ["Berhampore's legendary Chhanabora & Manoharshahi (₹50)", "Vegetarian Sheherwali/Bengali thali (₹240)"], nonveg: ["Murshidabadi Chicken Biryani & Shahi Rezala (₹260)", "Bhagirathi river-fish curry at riverside dhabas (₹220)"] },
      gems: ["Azimganj Bari Kothi", "Jagat Seth's Underground Treasury", "Jahan Kosha 7-ton Mughal Cannon"],
      dos: ["Dress modestly at Katra Mosque & Khoshbagh.", "Buy GI-tagged Murshidabad silk scarves directly from weavers."],
      donts: ["Never plan Hazarduari Palace Museum on Fridays.", "Phones/cameras are barred inside Hazarduari galleries — use cloakrooms."]
    },

    "Malda (Gour & Pandua)": {
      lat: 25.0108, lon: 88.1411, region: "North-Central Sultanate Bengal",
      route: [[22.5726, 88.3639], [25.0108, 88.1411], [24.8510, 88.1330]],
      waypoints: [
        { title: "Howrah / Kolkata", coords: [22.5726, 88.3639], note: "Board Shatabdi, Gour or Vande Bharat" },
        { title: "Malda Town (MLDT)", coords: [25.0108, 88.1411], note: "Base town for Gour & Pandua" },
        { title: "Gour (Dakhil Darwaza) & Adina Mosque", coords: [24.8510, 88.1330], note: "14th–16th century Sultanate terracotta ruins" }
      ],
      trains: [
        makeTrain("12041 / 12042", "Howrah – NJP Shatabdi Express", "Howrah (HWH) → Bolpur → Malda Town (MLDT)", "02:25 PM – 07:05 PM (4h 40m)", "Mon–Sat", "CC (₹980) / EC (₹1,950)", "₹980", "Superfast afternoon arrival into Malda Town."),
        makeTrain("13153 / 13154", "Gour Express", "Sealdah (SDAH) → Malda Town (MLDT)", "10:15 PM – 06:15 AM (8h)", "Daily", "SL (₹235) / 3A (₹620) / 2A (₹890)", "₹620", "Overnight sleeper arriving right at dawn for Gour monuments."),
        makeTrain("22301", "Howrah – NJP Vande Bharat", "Howrah → Malda Town (MLDT)", "05:55 AM – 10:25 AM (4h 30m)", "Except Wed", "CC (₹1,050)", "₹1,050", "Fastest morning arrival.")
      ],
      busesAndCabs: [
        { mode: "Private AC Cab (Gour + Adina Pandua Full-Day Circuit)", price: "₹2,000–₹2,600 / day", note: "Gour is 16 km south and Pandua is 20 km north of Malda Town" },
        { mode: "NBSTC Bus (Kolkata Esplanade → Malda)", price: "₹380–₹650", note: "7.5h highway coach" }
      ],
      stays: [
        makeStay("budget", "Town Hotel · Value Pick", "Hotel Kalinga / Continental Malda", "4.0", "850+", "Rathbari More, Malda (1.5 km from MLDT)", 1450, "Central AC rooms near bus & auto stands.", ["Walkable to mango market", "Easy cab hire to Gour", "Clean family rooms"]),
        makeStay("boutique", "Heritage Lodge · Best Tier Match", "WBTDCL Amrapali Tourist Lodge Malda", "4.2", "980+", "English Bazar, Malda (2 km from MLDT)", 2600, "Spacious garden lodge named after Malda's famed mangoes.", ["Quiet lawn setting", "Restaurant & parking", "Good base for Gour & Pandua"]),
        makeStay("luxury", "Business Comfort · Upgrade Pick", "Golden Park Resort & Hotel Malda", "4.3", "1,400+", "NH-12 Bypass, Malda", 4800, "Modern resort-style property with pool and conference dining.", ["Best swimming pool in Malda", "Multi-cuisine dining", "Quick highway exit to Adina"])
      ],
      budgetBase: { transportPP: 1100, foodPerDay: 550, localPerDay: 650, permitsPerTrip: 150 },
      smartTips: ["Visit Gour (south) in the morning and Adina Mosque / Pandua (north) in the afternoon in a single cab loop."],
      daysPool: ["Arrive Malda; explore Gour Sultanate capital: Baroduari Mosque, Dakhil Darwaza, Firoz Minar & Lottan Mosque.", "Morning drive north to Pandua: massive 1375 Adina Mosque, Eklakhi Mausoleum & Adina Deer Park; evening Malda Museum."],
      landmarks: ["Adina Mosque (1375 CE, ₹25)", "Baroduari (Bara Sona) Mosque", "Dakhil Darwaza (1425 CE)", "Firoz Minar", "Lottan & Qadam Rasul Mosques"],
      food: { veg: ["Malda Fazli, Langra & Himsagar mangoes (May–July)", "Raskadam & Kansat mango sweets (₹80)"], nonveg: ["Mahananda river fish thali & Mughlai chicken (₹240)"] },
      gems: ["Chika Mosque & Ramkeli Chaitanya shrine", "Jagjivanpur Buddhist Monastery excavation site"],
      dos: ["Wear walking shoes — Gour ruins span serene mango orchards.", "Try authentic Raskadam sweets near Rathbari."],
      donts: ["Avoid peak June afternoon heat without sun hats.", "Do not climb crumbling 15th-century minar stairs."]
    },

    "Cooch Behar": {
      lat: 26.3242, lon: 89.4450, region: "North Bengal Heritage",
      route: [[22.5726, 88.3639], [26.7271, 88.3953], [26.3242, 89.4450]],
      waypoints: [
        { title: "Kolkata / Sealdah", coords: [22.5726, 88.3639], note: "Overnight Padatik or Teesta Torsa" },
        { title: "New Cooch Behar (NCB)", coords: [26.3242, 89.4450], note: "5 km from Cooch Behar Rajbari" }
      ],
      trains: [
        makeTrain("12377 / 12378", "Padatik Express", "Sealdah (SDAH) → New Cooch Behar (NCB)", "11:20 PM – 11:45 AM (12h 25m)", "Daily", "SL (₹405) / 3A (₹1,075) / 2A (₹1,540)", "₹1,075", "Best comfortable overnight AC train straight to New Cooch Behar."),
        makeTrain("13147 / 13148", "Uttar Banga Express", "Sealdah → New Cooch Behar (NCB)", "07:40 PM – 09:45 AM (14h)", "Daily", "SL (₹395) / 3A (₹1,050)", "₹1,050", "Arrives conveniently before lunch."),
        makeTrain("13141 / 13142", "Teesta Torsa Express", "Sealdah → New Cooch Behar (NCB)", "02:40 PM – 06:15 AM", "Daily", "SL (₹375) / 3A (₹1,010)", "₹1,010", "Day-plus-night run reaching early morning.")
      ],
      busesAndCabs: [
        { mode: "Electric Toto (New Cooch Behar Stn → Rajbari / Sagar Dighi)", price: "₹30–₹50", note: "15-minute town ride" },
        { mode: "NBSTC AC Bus (Siliguri → Cooch Behar)", price: "₹180–₹280", note: "3.5 hrs via Jalpaiguri/Dhupguri" }
      ],
      stays: [
        makeStay("budget", "Town Stay · Value Pick", "Hotel Royal Palace / Ellora Cooch Behar", "4.1", "720+", "Sagar Dighi / Biswa Singha Rd", 1500, "Clean town hotel steps from Sagar Dighi & Madan Mohan Temple.", ["Walkable to Rajbari lawns", "Budget AC rooms", "Good Bengali thalis"]),
        makeStay("boutique", "Heritage Boutique · Best Tier Match", "Hotel Yuvraj / Poddar Residency", "4.3", "890+", "Near Rajbari Gate, Cooch Behar", 3100, "Modern boutique stay overlooking the planned royal avenues.", ["5 min walk to Cooch Behar Palace", "Spacious family suites", "Easy transfers to Rasikbil"]),
        makeStay("luxury", "Eco Resort · Upgrade Pick", "The Reserve Gorumara / Chilapata Eco Resort (Nearby)", "4.4", "650+", "Cooch Behar–Alipurduar Forest Corridor", 5800, "Combine royal Cooch Behar with nearby Chilapata jungle resorts.", ["Forest-edge cottages", "Private safaris arranged", "Peaceful nature retreat"])
      ],
      budgetBase: { transportPP: 2100, foodPerDay: 550, localPerDay: 350, permitsPerTrip: 150 },
      smartTips: ["Cooch Behar Palace Museum is closed on Fridays; pair Cooch Behar with nearby Rasikbil Bird Sanctuary & Chilapata."],
      daysPool: ["Arrive NCB; tour grand 1887 Cooch Behar Rajbari Palace, Durbar Hall, Madan Mohan Temple & sunset around Sagar Dighi.", "Morning Baneshwar Shiva Temple (ancient giant tortoises) & Rasikbil Bird Sanctuary; evening Shitalpati craft bazaar."],
      landmarks: ["Cooch Behar Rajbari Palace (1887, ₹25)", "Madan Mohan Temple", "Sagar Dighi Lake", "Baneshwar Shiva Temple & Tortoise Pond", "Rasikbil Bird Sanctuary"],
      food: { veg: ["Sitalpati bazaar sweets, Chomchom & Curd-Chira (₹80)", "Rajbanshi vegetarian pelka greens thali (₹160)"], nonveg: ["Torsha river Boroli & Shol fish curry (₹260)", "Duck egg & country chicken curry (₹280)"] },
      gems: ["Gosanimari Kamateswari Ruins", "Sitalpati woven cool-mat artisan villages"],
      dos: ["Walk the symmetrical 19th-century Sagar Dighi heritage square.", "Check Palace Museum Friday closure."],
      donts: ["Do not feed or disturb the sacred tortoises at Baneshwar Pond.", "Photography prohibited inside palace museum galleries."]
    },

    "Shantiniketan & Birbhum": {
      lat: 23.6792, lon: 87.6836, region: "Birbhum Rarh",
      route: [[22.5726, 88.3639], [23.2324, 87.8615], [23.6792, 87.6836]],
      waypoints: [
        { title: "Howrah / Sealdah", coords: [22.5726, 88.3639], note: "2h 15m Shantiniketan Express" },
        { title: "Bolpur Shantiniketan", coords: [23.6792, 87.6836], note: "Visva-Bharati, Sonajhuri Haat & Kopai River" }
      ],
      trains: [
        makeTrain("12337 / 12338", "Shantiniketan Express", "Howrah (HWH) → Bardhaman → Bolpur Shantiniketan (BHP)", "10:10 AM – 12:25 PM (2h 15m)", "Daily", "2S (₹105) / CC (₹365)", "₹105", "Most punctual morning train into Bolpur."),
        makeTrain("13015 / 13016", "Kaviguru Express", "Howrah (HWH) → Bolpur (BHP) → Rampurhat", "10:40 AM – 01:50 PM", "Daily", "2S (₹90) / CC (₹340)", "₹90", "Budget daytime chair-car express."),
        makeTrain("22301", "Howrah – NJP Vande Bharat", "Howrah → Bolpur Shantiniketan (BHP)", "05:55 AM – 07:45 AM (1h 50m)", "Except Wed", "CC (₹620)", "₹620", "Fastest morning hop into Shantiniketan.")
      ],
      busesAndCabs: [
        { mode: "Electric Toto (Full-Day Bolpur Heritage Loop)", price: "₹600–₹850 / day (or ₹20–₹40 short hop)", note: "Covers Ashram, Sonajhuri, Kopai, Amar Kutir & Deer Park" },
        { mode: "Bicycle Rental (Shyambati / Prantik)", price: "₹120 / day", note: "Ideal for shaded Visva-Bharati avenues" }
      ],
      stays: [
        makeStay("budget", "Artist Stay · Value Pick", "WBTDCL Shantiniketan Lodge / Ratanpally Stay", "4.2", "1,150+", "Ratanpally, near Visva-Bharati Gate", 1800, "Peaceful leafy grounds walking distance to Tagore's Ashram.", ["Quiet academic campus vibe", "Fresh Bengali breakfast", "Quick toto access"]),
        makeStay("boutique", "Mud Resort · Best Tier Match", "The Creek Boutique Resort / Rangabitan", "4.4", "1,380+", "Prantik / Goalpara, near Kopai River", 4200, "Santhal-inspired terracotta & mud-cottage resort amidst greenery.", ["Evenings with live Baul folk singers", "Terracotta artwork interiors", "Close to Sonajhuri forest"]),
        makeStay("luxury", "Heritage Estate · Upgrade Pick", "Mohor Kutir / Camellia Resort & Spa", "4.5", "1,950+", "Ballavpur / Sriniketan Road", 8400, "Luxury wellness cottages with pool, spa & curated Birbhum folk nights.", ["Swimming pool & lawns", "Kantha-art suites", "Gourmet Bengali dining"])
      ],
      budgetBase: { transportPP: 250, foodPerDay: 600, localPerDay: 350, permitsPerTrip: 120 },
      smartTips: ["Visva-Bharati campus & Rabindra Bhavana Museum are CLOSED every Wednesday — plan Thu–Tue.", "Saturday & Sunday afternoons host the liveliest Sonajhuri Khoai Haat under sal trees."],
      daysPool: [
        "Arrive Bolpur; visit Visva-Bharati Ashram, Upasana Griha stained-glass hall & Rabindra Bhavana; sunset at Kopai River.",
        "Morning Amar Kutir craft co-op & Ballavpur Deer Park; afternoon Sonajhuri Khoai Haat with live Baul singers.",
        "Morning Kala Bhavana outdoor Ramkinkar Baij sculptures, Surul Zamindar Bari & Kankalitala Shakti Peeth."
      ],
      landmarks: ["Rabindra Bhavana & Uttarayan (₹70)", "Upasana Griha (1863)", "Sonajhuri Forest & Khoai Haat", "Kala Bhavana Open-Air Sculptures", "Amar Kutir Craft Co-operative"],
      food: { veg: ["Shukto, Posto & Chhanar Dalna thali at Shakuntala / Kasahara (₹260)", "Clay-cup masala cha & Aloor Chop (₹40)", "Kankalitala Pera (₹100)"], nonveg: ["Santhal forest-style chicken & rice at Sonajhuri (₹190)", "Pabda/Chingri Bengali thali at Kasahara (₹420)"] },
      gems: ["Kopai River at Goalpara", "Surul Zamindar Bari", "Srijani Shilpagram folk village"],
      dos: ["Tip Baul singers generously under Sonajhuri trees.", "Buy genuine Kantha sarees from rural women artisans."],
      donts: ["Never plan Uttarayan / Rabindra Bhavana on Wednesdays.", "Do not disturb open-air Patha Bhavana classes."]
    },

    "Bishnupur": {
      lat: 23.0754, lon: 87.3242, region: "Bankura Mallabhum",
      route: [[22.5726, 88.3639], [22.8277, 87.9780], [23.0754, 87.3242]],
      waypoints: [
        { title: "Howrah / Shalimar", coords: [22.5726, 88.3639], note: "Rupasi Bangla / Aranyak Express" },
        { title: "Joypur Sal Forest", coords: [22.8277, 87.9780], note: "Sal forest corridor" },
        { title: "Bishnupur Terracotta Temples", coords: [23.0754, 87.3242], note: "Rasmancha, Jor Bangla & Panchmura" }
      ],
      trains: [
        makeTrain("12883 / 12884", "Rupasi Bangla Express", "Santragachi / Howrah → Bishnupur (VSU) → Purulia", "06:25 AM – 09:48 AM (3h 23m)", "Daily", "2S (₹115) / CC (₹380)", "₹115", "Best morning train for same-day temple exploration."),
        makeTrain("12885 / 12886", "Aranyak Express", "Shalimar (SHM) → Bishnupur (VSU) → Bhojudih", "07:45 AM – 11:15 AM", "Mon–Sat", "2S (₹115) / CC (₹380)", "₹115", "Comfortable daytime AC Chair Car option."),
        makeTrain("12827 / 12828", "Howrah – Purulia Express", "Howrah → Kharagpur → Bishnupur (VSU)", "04:50 PM – 08:15 PM", "Daily", "2S (₹115) / CC (₹380)", "₹115", "Evening connection returning early morning.")
      ],
      busesAndCabs: [
        { mode: "Electric Toto (Full Malla Temple Heritage Loop)", price: "₹500–₹700 / 4 hrs", note: "Covers Rasmancha, Jor Bangla, Shyam Rai, Dalmadal & Lalbandh" },
        { mode: "Shared Auto to Panchmura Terracotta Horse Village (23 km)", price: "₹45–₹60 / seat", note: "Direct rural craft route" },
        { mode: "SBSTC Bus (Esplanade Kolkata → Bishnupur)", price: "₹170–₹240", note: "4h via Arambagh & Joypur Forest" }
      ],
      stays: [
        makeStay("budget", "Govt Lodge · Value Pick", "WBTDCL Bishnupur Tourist Lodge", "4.2", "1,240+", "Opposite Lalbandh & Dalmadal Road", 1950, "Heritage state lodge walking distance to the terracotta clusters.", ["Shaded garden lawn", "AC rooms & authentic Bengali meals", "Totos stationed at gate"]),
        makeStay("boutique", "Forest Resort · Best Tier Match", "Banalata Resort (Joypur Forest)", "4.4", "2,100+", "Joypur Sal Forest (12 km from Bishnupur)", 3800, "Scenic farm & sal-forest cottages with pond boating & organic kitchen.", ["Lush orchard & deer park nearby", "Calm village atmosphere", "Great for families"]),
        makeStay("luxury", "Heritage Stay · Upgrade Pick", "The Courtyard House / Annapurna Heritage", "4.5", "450+", "Bishnupur / Mukutmanipur Circuit", 6500, "Curated boutique suites blending terracotta aesthetics with modern comfort.", ["Guided weaver & potter tours", "Spacious suites", "Private cab transfers"])
      ],
      budgetBase: { transportPP: 250, foodPerDay: 450, localPerDay: 350, permitsPerTrip: 100 },
      smartTips: ["Buy the ₹25 ASI combo ticket at Rasmancha — it covers all major protected terracotta monuments in Bishnupur."],
      daysPool: [
        "Morning arrival; tour Rasmancha (1600 CE), Jor Bangla, Shyam Rai & Dalmadal Cannon; sunset at Lalbandh lake.",
        "Morning Madanmohan Temple & Tantipara Baluchari weavers; afternoon Panchmura village for iconic terracotta horses."
      ],
      landmarks: ["Rasmancha (₹25 ASI)", "Jor Bangla Temple (1655)", "Shyam Rai Pancharatna Temple", "Dalmadal Cannon", "Panchmura Potter Village"],
      food: { veg: ["Posto Bora, Biulir Dal & Jhuri Aloo Bhaja thali (₹180)", "Mecha Sandesh (gram-flour fudge, ₹30)"], nonveg: ["Country chicken curry & rice near Lalbandh (₹250)"] },
      gems: ["Dashabatar Taash hand-painted playing card workshop", "Garh Darwaza laterite fort gates", "Joypur Forest watchtower"],
      dos: ["Photograph terracotta carvings at 7–10 AM or 4–5 PM.", "Buy Silk Mark-certified Baluchari sarees from Tantipara."],
      donts: ["Never touch or scratch 17th-century baked clay panels.", "Avoid flash inside dim sanctums."]
    },

    "Purulia": {
      lat: 23.2089, lon: 86.1200, region: "Chota Nagpur Fringe",
      route: [[22.5726, 88.3639], [23.3322, 86.3616], [23.2089, 86.1200]],
      waypoints: [
        { title: "Howrah / Santragachi", coords: [22.5726, 88.3639], note: "Rupasi Bangla / Lalmati Express" },
        { title: "Purulia Junction (PRR)", coords: [23.3322, 86.3616], note: "Gateway to Ayodhya Hills" },
        { title: "Ayodhya Hills, Marble Lake & Charida", coords: [23.2089, 86.1200], note: "Chhau masks & waterfalls" }
      ],
      trains: [
        makeTrain("12883 / 12884", "Rupasi Bangla Express", "Santragachi → Kharagpur → Bishnupur → Purulia (PRR)", "06:25 AM – 11:45 AM (5h 20m)", "Daily", "2S (₹135) / CC (₹465)", "₹135", "Comfortable daytime arrival into Purulia."),
        makeTrain("12827 / 12828", "Howrah – Purulia Express", "Howrah (HWH) → Purulia (PRR)", "04:50 PM – 10:10 PM", "Daily", "2S (₹135) / CC (₹465)", "₹135", "Evening superfast link."),
        makeTrain("12865 / 12866", "Lalmati Express", "Howrah → Adra → Purulia (PRR)", "08:30 AM – 01:45 PM", "Tue, Fri", "2S (₹135) / CC (₹465)", "₹135", "Scenic morning route via Bankura–Adra.")
      ],
      busesAndCabs: [
        { mode: "Private SUV / Bolero (Ayodhya Hills Full-Day Circuit)", price: "₹2,200–₹3,000 / day", note: "Covers Upper/Lower Dam, Marble Lake, Bamni Falls & Charida" },
        { mode: "Shared Jeep / Auto (Purulia / Barabhum → Baghmundi)", price: "₹60–₹100", note: "Base town for Charida Chhau mask village" }
      ],
      stays: [
        makeStay("budget", "Hill Homestay · Value Pick", "Palash Bitan / Baghmundi Eco Homestay", "4.3", "390+", "Baghmundi Foothills / Ayodhya Hilltop", 1500, "Simple hilltop homestays near Charida Chhau artisans.", ["Bonfires in winter", "Local Santhali folk dance on request", "Fresh village meals"]),
        makeStay("boutique", "Hill Resort · Best Tier Match", "Kushal Palli Resort (Ayodhya Hills)", "4.4", "1,650+", "Ayodhya Hilltop, Purulia", 4500, "Sprawling hilltop resort surrounded by Palash forests & trekking trails.", ["Swimming pool & lawn", "Chhau dance cultural evenings", "Easy access to Marble Lake"]),
        makeStay("luxury", "Nature Villa · Upgrade Pick", "Kushal Palli Luxury Villas / Pearl Tree", "4.5", "1,200+", "Ayodhya Hills / Purulia Town", 7800, "Private luxury cottages overlooking the Chota Nagpur hills.", ["Private balcony views", "Multi-cuisine restaurant", "Guided waterfall treks"])
      ],
      budgetBase: { transportPP: 300, foodPerDay: 500, localPerDay: 700, permitsPerTrip: 100 },
      smartTips: ["Visit in March for fiery red Palash blooms across Ayodhya Hills, or Oct–Feb for roaring Bamni & Turga waterfalls."],
      daysPool: [
        "Arrive Purulia; drive to Baghmundi & Charida Village (Chhau mask workshops) and Pakhipahar painted hill.",
        "Full-day Ayodhya Hills loop: Upper & Lower Dam, Marble Lake, Bamni Falls, Turga Falls & Mayur Pahar sunset.",
        "Morning Murguma Dam or Joychandi Pahar rock hill before return train from Purulia/Adra."
      ],
      landmarks: ["Charida Chhau Mask Village", "Marble Lake (Abandoned Quarry)", "Bamni & Turga Waterfalls", "Upper & Lower Dam (Ayodhya)", "Joychandi Pahar & Murguma Dam"],
      food: { veg: ["Dehati Dal, Aloo Posto & Jhal Muri (₹140)", "Fresh mahua/palash honey & sweets"], nonveg: ["Purulia Country Chicken (Desi Murgi) & rice (₹260)"] },
      gems: ["Deulghata 11th-century stone temples", "Garh Panchakot ruins at Panchet Hill"],
      dos: ["Buy hand-painted Chhau masks directly from Charida artisans.", "Wear sturdy grip shoes for Bamni Falls steps."],
      donts: ["Avoid swimming inside deep Marble Lake quarry waters.", "Do not litter waterfall steps."]
    },

    "Jhargram & Mukutmanipur": {
      lat: 22.4550, lon: 86.9970, region: "Jangalmahal Sal Forests",
      route: [[22.5726, 88.3639], [22.4550, 86.9970], [22.9612, 86.7875]],
      waypoints: [
        { title: "Howrah Junction", coords: [22.5726, 88.3639], note: "Ispat / Steel / Janshatabdi Express" },
        { title: "Jhargram Rajbari & Belpahari", coords: [22.4550, 86.9970], note: "Sal forests, Chilkigarh & Kanak Durga" },
        { title: "Mukutmanipur Kangsabati Dam", coords: [22.9612, 86.7875], note: "Second-largest earthen dam in India" }
      ],
      trains: [
        makeTrain("12871 / 12872", "Ispat Express", "Howrah (HWH) → Kharagpur → Jhargram (JGM)", "06:55 AM – 09:30 AM (2h 35m)", "Daily", "2S (₹105) / CC (₹350)", "₹105", "Fastest morning train straight to Jhargram."),
        makeTrain("12813 / 12814", "Steel Express", "Howrah → Jhargram (JGM)", "05:30 PM – 08:05 PM (2h 35m)", "Daily", "2S (₹105) / CC (₹350)", "₹105", "Evening superfast return/outbound."),
        makeTrain("12883", "Rupasi Bangla (for Mukutmanipur via Bankura)", "Santragachi → Bankura (BQA)", "06:25 AM – 10:25 AM", "Daily", "2S (₹120)", "₹120", "From Bankura, take 1.5h bus/auto (55 km) to Mukutmanipur Dam.")
      ],
      busesAndCabs: [
        { mode: "Electric Toto / Auto (Jhargram Rajbari & Chilkigarh)", price: "₹450–₹650 / half-day", note: "Covers Kanak Durga forest temple & Deer Park" },
        { mode: "Private SUV (Belpahari–Kakrajhor–Khandarani Lake)", price: "₹2,200–₹2,800 / day", note: "Sal forest hills & tribal villages" },
        { mode: "Boat Ride on Mukutmanipur Dam to Bonpukuria Deer Park", price: "₹400–₹700 / boat", note: "Shared across 6–8 visitors" }
      ],
      stays: [
        makeStay("budget", "Forest Stay · Value Pick", "WBFDC Jhargram / Mukutmanipur Tourist Complex", "4.2", "920+", "Jhargram Sal Forest / Dam View", 1800, "State forest cottages amidst tall sal trees.", ["Peaceful nature setting", "Easy safari/cab arrangements", "Affordable AC cottages"]),
        makeStay("boutique", "Heritage Palace · Best Tier Match", "Jhargram Palace Heritage Resort", "4.5", "1,400+", "Jhargram Rajbari Complex (2 km from Stn)", 4200, "Stay inside the grand 1931 Indo-Saracenic palace of the Malla Deb royals.", ["Royal museum wing & gardens", "Classic heritage suites", "Warm palace hospitality"]),
        makeStay("luxury", "Dam Resort · Upgrade Pick", "Peerless Resort Mukutmanipur", "4.4", "1,100+", "Kangsabati Dam Waterfront", 5900, "Lakefront resort overlooking the vast Kangsabati–Kumari confluence.", ["Sunset reservoir views", "Swimming pool & lawns", "Tribal cultural evenings"])
      ],
      budgetBase: { transportPP: 250, foodPerDay: 500, localPerDay: 550, permitsPerTrip: 100 },
      smartTips: ["Combine Jhargram + Belpahari on Ispat Express, or Bankura + Mukutmanipur on Rupasi Bangla Express."],
      daysPool: [
        "Morning Ispat Express to Jhargram; tour Jhargram Rajbari, Kanak Durga Temple (Chilkigarh) & Junglemahal Zoo.",
        "Day trip to Belpahari, Ghagra Waterfall, Khandarani Lake & Laljal caves.",
        "Drive north to Mukutmanipur Kangsabati Dam for sunset boat ride & Ambikanagar crafts."
      ],
      landmarks: ["Jhargram Rajbari Palace", "Chilkigarh Kanak Durga Temple & Medicinal Forest", "Mukutmanipur Kangsabati Dam", "Khandarani Lake & Ghagra Falls", "Rameshwar Temple (Gopiballavpur)"],
      food: { veg: ["Sal-leaf thali with Posto & Sabzi (₹150)", "Fresh jalebi & ghugni at Jhargram market (₹40)"], nonveg: ["Jangalmahal country chicken & rice (₹240)", "Fresh Kangsabati dam rui/katla curry (₹220)"] },
      gems: ["Kakrajhor Forest Hills", "Kendua Bird Sanctuary", "Silda Sabai-grass craft clusters"],
      dos: ["Respect sacred grove conservation rules around Chilkigarh.", "Carry mosquito repellent in sal forests."],
      donts: ["Avoid venturing deep into forest roads after dark.", "Do not litter waterfall rocks."]
    },

    "Digha": {
      lat: 21.6266, lon: 87.5074, region: "Purba Medinipur Coast",
      route: [[22.5726, 88.3639], [22.2872, 87.9254], [21.6266, 87.5074]],
      waypoints: [
        { title: "Howrah Junction", coords: [22.5726, 88.3639], note: "Tamralipta / Kandari Express" },
        { title: "New Digha & Old Digha", coords: [21.6266, 87.5074], note: "Casuarina seawall, Aquarium & Mohana" }
      ],
      trains: [
        makeTrain("12857 / 12858", "Tamralipta Express", "Howrah (HWH) → Mecheda → Contai → Digha (DGHA)", "06:45 AM – 10:05 AM (3h 20m)", "Daily", "2S (₹105) / CC (₹355)", "₹105", "Most popular morning train reaching New Digha by 10 AM."),
        makeTrain("22897 / 22898", "Kandari Express", "Howrah (HWH) → Digha (DGHA)", "02:25 PM – 05:50 PM (3h 25m)", "Daily", "2S (₹105) / CC (₹355)", "₹105", "Convenient afternoon train returning at 6:25 PM."),
        makeTrain("12847 / 12848", "Howrah – Digha AC Superfast", "Howrah → Digha (DGHA)", "11:10 AM – 02:25 PM", "Daily", "CC (₹355) / EC (₹680)", "₹355", "Fully air-conditioned midday express."),
        makeTrain("38801 / EMU", "Panskura – Digha EMU Local", "Panskura (PKU) → Tamluk → Contai → Digha", "Morning & Evening", "Daily Suburban", "EMU II (₹25)", "₹25", "Ultra-budget suburban feeder from Midnapore/Howrah line.")
      ],
      busesAndCabs: [
        { mode: "SBSTC / WBTC AC Volvo Bus (Esplanade Kolkata → Digha)", price: "₹380–₹450", note: "4.5h via Kolaghat & Contai; non-AC ₹180" },
        { mode: "Battery Toto (Old Digha ↔ New Digha / Udaipur)", price: "₹20–₹100", note: "Full local circuit ₹450" },
        { mode: "Private Sedan (Kolkata ↔ Digha)", price: "₹3,500–₹4,500", note: "Via NH-16 & NH-116" }
      ],
      stays: [
        makeStay("budget", "Seaside Lodge · Value Pick", "WBTDCL Digha Tourist Lodge (Saikatabas)", "4.1", "1,850+", "Old Digha / Sea Hawk Gate", 1800, "Clean state-run rooms steps from the promenade.", ["Spacious grounds & parking", "Family-friendly canteen", "Direct beach walk"]),
        makeStay("boutique", "Beachfront Boutique · Best Tier Match", "Hotel Coral / Cygnett Inn Sea View", "4.3", "2,400+", "New Digha (0.2 km from Beach)", 3600, "Modern resort hotel with swimming pool near New Digha.", ["Swimming pool & kids play zone", "Fresh seafood restaurant", "5-minute walk to New Digha sea"]),
        makeStay("luxury", "Luxury Resort · Upgrade Pick", "The Oasis / Le Roi Digha", "4.4", "1,650+", "New Digha Station Road", 6800, "Upscale family resort with pool, spa & buffet dining.", ["Closest luxury property to Digha Station", "Large pool & banquet lawns", "AC suites with balconies"])
      ],
      budgetBase: { transportPP: 250, foodPerDay: 650, localPerDay: 250, permitsPerTrip: 80 },
      smartTips: ["Confirm whole fish rates per piece before frying at New Digha / Mohana stalls.", "Swim only at New Digha flagged zones during low-to-mid tide."],
      daysPool: [
        "Morning Tamralipta Express to Digha; check in, visit New Digha Beach, Marine Aquarium & Biswa Bangla Park.",
        "Sunrise walk along Old Digha seawall; visit Digha Mohana fish auction, Talsari tidal creek & Udaipur Beach."
      ],
      landmarks: ["New Digha & Old Digha Promenade", "Digha Marine Aquarium (₹20)", "Amarabati Park & Ropeway", "Mohana Fish Auction & Estuary", "Udaipur & Talsari Beaches"],
      food: { veg: ["Digha Khaja, Kaju Barfi & Chilled Daab (₹50)", "Bengali thali at Kolaghat en route (₹240)"], nonveg: ["Fresh fried Pomfret, Bhetki & Crab Masala (₹320)", "Prawn Pakora at sunset stalls (₹150)"] },
      gems: ["Talsari palm-fringed creek (10 km)", "Junput Sea Dyke (40 km)", "Dheusagar Wave Park"],
      dos: ["Wake at 5:30 AM for Bay of Bengal sunrise.", "Check tide charts before entering the sea."],
      donts: ["Do not bathe in deep water near Old Digha boulders.", "Avoid leaving plastic wrappers on the sand."]
    },

    "Mandarmani": {
      lat: 21.6625, lon: 87.7024, region: "Purba Medinipur Coast",
      route: [[22.5726, 88.3639], [21.7850, 87.7420], [21.6625, 87.7024]],
      waypoints: [
        { title: "Howrah / Kolkata", coords: [22.5726, 88.3639], note: "Train to Contai / Chaulkhola bus" },
        { title: "Contai / Chaulkhola Crossing", coords: [21.7850, 87.7420], note: "25 min auto to Mandarmani beach" },
        { title: "Mandarmani 13-km Shoreline", coords: [21.6625, 87.7024], note: "Red ghost crabs & beach cottages" }
      ],
      trains: [
        makeTrain("12857 / 22897", "Tamralipta / Kandari Express", "Howrah → Contai (KATI) / Ramnagar (RMRB)", "06:45 AM / 02:25 PM → 3h", "Daily", "2S (₹100) / CC (₹340)", "₹100", "Get off at Contai or Ramnagar; hire auto/cab 22 km to Mandarmani."),
        makeTrain("38801", "Panskura – Digha EMU Local", "Panskura → Contai → Ramnagar", "Morning & Evening", "Daily", "EMU II (₹20)", "₹20", "Low-cost suburban rail connection.")
      ],
      busesAndCabs: [
        { mode: "SBSTC / Volvo Bus (Kolkata → Chaulkhola Crossing)", price: "₹200–₹420", note: "4h drive; catch waiting auto/cab (₹200) for final 12 km" },
        { mode: "Auto / Toto (Chaulkhola → Mandarmani Resorts)", price: "₹180–₹250 / vehicle", note: "25-minute coastal village road" },
        { mode: "Private Sedan (Kolkata ↔ Mandarmani)", price: "₹4,200–₹5,200", note: "Direct door-to-beach resort" }
      ],
      stays: [
        makeStay("budget", "Beach Cottage · Value Pick", "Sana Beach Resort / Sea View Cottages", "4.1", "950+", "Mandarmani Beachfront (1.5 km from Dadanpatrabar)", 2100, "Clean seaside cottages with direct lawn access to the sand.", ["Steps from Bay of Bengal tide", "Fresh crab & fish curries", "Pocket-friendly family rooms"]),
        makeStay("boutique", "Beachfront Boutique · Best Tier Match", "Viceroy Beach & Spa Resort / Candlewood", "4.3", "2,100+", "Mandarmani Seafront", 4200, "Private beachfront boutique stay with swimming pool and sea-facing rooms.", ["Pool overlooking coconut palms", "Direct private beach gate", "Evening seafood grill"]),
        makeStay("luxury", "Luxury Sea Resort · Upgrade Pick", "The Sana Beach / Aqua Marina Resort", "4.5", "2,800+", "Mandarmani Prime Beachfront", 8900, "Luxury oceanfront pool villas ideal for families and couples.", ["Infinity-style pool & spa", "Private ocean-breeze suites", "Multi-cuisine dining"])
      ],
      budgetBase: { transportPP: 320, foodPerDay: 750, localPerDay: 280, permitsPerTrip: 0 },
      smartTips: ["Book a hotel with a private pool as high-tide swells can limit sea bathing.", "Driving vehicles onto Mandarmani beach sand is strictly banned by NGT."],
      daysPool: [
        "Arrive via Contai/Chaulkhola; check into beachfront resort, sunset walk along the 13-km hard sand beach.",
        "Morning red-crab trail near Champa River estuary; pool afternoon & fresh beach seafood BBQ.",
        "Sunrise walk & quick visit to neighboring Tajpur or Shankarpur fishing harbour before return."
      ],
      landmarks: ["Mandarmani 13-km Flat Shoreline", "Champa River Estuary (Mohana)", "Red Ghost Crab Colonies", "Dadanpatrabar Fishing Hamlet", "Nearby Tajpur Casuarina Belt"],
      food: { veg: ["Sher-e-Punjab Kolaghat paneer/dal stop (₹250)", "Coconut water & veg fried rice (₹180)"], nonveg: ["Whole roasted Pomfret, Jumbo Prawns & Crab Curry (₹450)"] },
      gems: ["Quiet eastern estuary sandbars at dawn", "Mandarmani fishing net hauls at 6 AM"],
      dos: ["Walk softly around red crab burrows.", "Carry strong sunblock and flip-flops."],
      donts: ["NEVER drive cars or bikes onto the beach sand.", "Do not swim after dark."]
    },

    "Tajpur & Shankarpur": {
      lat: 21.6468, lon: 87.6140, region: "Purba Medinipur Coast",
      route: [[22.5726, 88.3639], [21.6468, 87.6140]],
      waypoints: [
        { title: "Howrah / Kolkata", coords: [22.5726, 88.3639], note: "Train to Ramnagar or Balisai bus" },
        { title: "Tajpur & Shankarpur", coords: [21.6468, 87.6140], note: "Quiet casuarina lagoons & fishing trawlers" }
      ],
      trains: [
        makeTrain("12857 / 22897", "Tamralipta / Kandari Express", "Howrah → Ramnagar (RMRB)", "06:45 AM / 02:25 PM → 3h 10m", "Daily", "2S (₹100) / CC (₹345)", "₹100", "Get down at Ramnagar (just before Digha); 15-min toto to Tajpur or Shankarpur.")
      ],
      busesAndCabs: [
        { mode: "SBSTC Bus (Esplanade → Balisai Crossing)", price: "₹190–₹400", note: "15-min toto from Balisai to Tajpur beach (₹120)" },
        { mode: "Battery Toto (Tajpur ↔ Shankarpur Harbour)", price: "₹150–₹220", note: "Quiet 6-km coastal village road" }
      ],
      stays: [
        makeStay("budget", "Beach Camp · Value Pick", "Tajpur Eco Camp / Mallika Resort", "4.2", "610+", "Tajpur Casuarina Forest (0.3 km from Beach)", 1650, "Peaceful rustic cottages tucked under whispering casuarina trees.", ["Quiet uncrowded coastline", "Fresh catch cooked to order", "Hammocks & bonfire"]),
        makeStay("boutique", "Coastal Lodge · Best Tier Match", "WBTDCL Shankarpur Matshyagandha / Tajpur Retreat", "4.3", "980+", "Shankarpur Harbour / Tajpur Road", 3200, "Comfortable AC cottages close to the colorful fishing trawler harbour.", ["Short walk to golden-hour trawlers", "Calm family lawns", "Easy hop to Mandarmani"]),
        makeStay("luxury", "Pool Resort · Upgrade Pick", "Abasar / Sonar Bangla Tajpur", "4.4", "1,250+", "Tajpur Main Beach Road", 6400, "Resort-style property with pool, sea-breeze balconies & family amenities.", ["Large swimming pool", "Quick beach walk", "Multi-cuisine restaurant"])
      ],
      budgetBase: { transportPP: 250, foodPerDay: 600, localPerDay: 220, permitsPerTrip: 0 },
      smartTips: ["Visit Shankarpur Fishing Harbour at 6:30 AM to watch hundreds of colourful wooden trawlers unload morning catch."],
      daysPool: ["Arrive Ramnagar/Balisai; walk through Tajpur's dense casuarina forest to the quiet red-crab beach.", "Sunrise at Shankarpur Fishing Harbour; afternoon lagoon stroll & sunset crab shacks."],
      landmarks: ["Tajpur Casuarina Forest & Lagoon", "Shankarpur Fishing Harbour", "Red Ghost Crab Beach", "Ramnagar Salt Pans"],
      food: { veg: ["Hot chai & crispy beguni at lagoon shacks (₹60)", "Bengali veg thali (₹180)"], nonveg: ["Freshly landed Bhetki Fry, Prawn Pakora & Pomfret (₹280)"] },
      gems: ["Empty tidal creeks between Tajpur and Mandarmani", "Dawn boat auctions at Shankarpur"],
      dos: ["Bring a torch for unlit casuarina trails after dusk."],
      donts: ["Never leave bottles in the casuarina grove."]
    },

    "Bakkhali-Fraserganj & Henry's Island": {
      lat: 21.5646, lon: 88.2597, region: "Namkhana Delta Coast",
      route: [[22.5726, 88.3639], [21.7662, 88.2321], [21.5646, 88.2597]],
      waypoints: [
        { title: "Sealdah South", coords: [22.5675, 88.3705], note: "Board Namkhana suburban EMU" },
        { title: "Namkhana Bridge", coords: [21.7662, 88.2321], note: "2h 30m EMU (₹25)" },
        { title: "Bakkhali, Fraserganj & Henry's Island", coords: [21.5646, 88.2597], note: "Mangrove boardwalk & quiet coast" }
      ],
      trains: [
        makeTrain("34792–34798", "Sealdah – Namkhana Suburban EMU Local", "Sealdah South (SDAH) → Baruipur → Kakdwip → Namkhana (NMKA)", "05:10 AM – 10:15 PM (Every 60–90 min)", "Daily Suburban", "EMU II (₹25 Single)", "₹25", "Direct suburban rail right up to Namkhana; auto/bus takes 35 min over Hatania-Doania Bridge to Bakkhali.")
      ],
      busesAndCabs: [
        { mode: "WBTC / SBSTC Bus (Esplanade Kolkata → Bakkhali)", price: "₹140–₹260", note: "4h via Diamond Harbour & Namkhana Bridge" },
        { mode: "Shared Magic / Toto (Namkhana Stn → Bakkhali)", price: "₹40–₹60 / seat", note: "35-minute coastal highway ride" },
        { mode: "Toto Loop (Bakkhali + Fraserganj Windmills + Henry's Island)", price: "₹350–₹500", note: "Covers all 3 spots comfortably" }
      ],
      stays: [
        makeStay("budget", "Fisheries Stay · Value Pick", "Sundari / Mangrove Guest House Henry's Island", "4.2", "680+", "Henry's Island (3 km from Bakkhali)", 1400, "State Fisheries Development guest house surrounded by brackish fisheries & mangroves.", ["Watchtower inside complex", "Fresh fishery fish meals", "Quiet mangrove boardwalk"]),
        makeStay("boutique", "Govt Beach Lodge · Best Tier Match", "WBTDCL Bakkhali Tourist Lodge (Balutot)", "4.2", "1,420+", "Bakkhali Beach Road (0.2 km from Sea)", 2400, "Classic state lodge steps from Bakkhali's gentle shoreline.", ["Lush lawn & parking", "Steps to sunrise beach", "Clean AC family rooms"]),
        makeStay("luxury", "Beach Hotel · Upgrade Pick", "Hotel Babylon / Amarabati Bakkhali", "4.3", "890+", "Bakkhali Main Promenade", 4600, "Modern AC resort rooms with sea-breeze balconies & pool.", ["Multi-cuisine Bengali seafood", "Kids play garden", "Easy beach access"])
      ],
      budgetBase: { transportPP: 160, foodPerDay: 500, localPerDay: 220, permitsPerTrip: 50 },
      smartTips: ["Take the ₹25 Sealdah–Namkhana EMU + ₹40 magic van to reach Bakkhali for under ₹70 one-way!"],
      daysPool: [
        "Morning Sealdah–Namkhana EMU (₹25); arrive Bakkhali, visit Crocodile Park, Fraserganj Windmills & sunset on the hard-sand beach.",
        "Morning walk through Henry's Island wooden mangrove boardwalk & climb the watchtower overlooking the Bay of Bengal; afternoon return."
      ],
      landmarks: ["Henry's Island Mangrove Boardwalk & Watchtower (₹20)", "Bakkhali Hard-Sand Beach", "Fraserganj Fishing Harbour & Windmills", "Bakkhali Crocodile Breeding Centre (₹15)", "Jambu Dwip Boat View"],
      food: { veg: ["Hot Jhalmuri, Chai & Bengali veg thali (₹140)"], nonveg: ["Fresh Henry's Island fishery Bhetki, Parshe & Crab fry (₹240)"] },
      gems: ["Fraserganj deserted British bungalow ruins", "Kiran Beach (Kirandwip)"],
      dos: ["Climb Henry's Island watchtower early morning for panoramic mangrove-sea views."],
      donts: ["Avoid walking too far on isolated sandbars during rising tide.", "Do not litter mangrove boardwalks."]
    }
  };

  // Fill complete structured data for remaining Hills/Forests/Rural/Coastal aliases if not explicitly listed above
  // (All 21 items in DESTINATION_GROUPS are explicitly present above! Verify exact keys.)

  // Hardcoded 6-phrase Bengali Phrasebook (Zero Gemini calls)
  const BENGALI_PHRASEBOOK = [
    { bengali: "নমস্কার", roman: "Nomoshkar", phonetic: "No-mosh-kar", tag: "Greeting", meaning: "Hello / Respectful greeting" },
    { bengali: "কেমন আছেন?", roman: "Kemon achhen?", phonetic: "Ke-mon aa-chhen", tag: "Polite Query", meaning: "How are you?" },
    { bengali: "এটার দাম কত?", roman: "Etar daam koto?", phonetic: "Eh-tar daam ko-to", tag: "Shopping", meaning: "How much does this cost?" },
    { bengali: "খুব ভালো", roman: "Khub bhalo", phonetic: "Khoob bha-lo", tag: "Compliment", meaning: "Very good / Wonderful" },
    { bengali: "স্টেশনটা কোথায়?", roman: "Station-ta kothay?", phonetic: "Station-ta ko-thai", tag: "Directions", meaning: "Where is the station?" },
    { bengali: "ধন্যবাদ", roman: "Dhonnobad", phonetic: "Dhon-no-baad", tag: "Gratitude", meaning: "Thank you very much" }
  ];

  // Hardcoded About Data
  const ABOUT_INFO = {
    creatorName: "Archisman Das",
    creatorRole: "1st-semester Information Technology (IT) student",
    institution: "Government College of Engineering and Textile Technology, Serampore (GCETTS)",
    phone: "7003544868",
    note: "Where is my trip was built exclusively for West Bengal travelers so you get real suburban EMU trains (Sundarbans & Hooghly Heritage Trail), express IRCTC fares, bus & cab prices, Google-reviewed stays, multi-language support (English, Bangla, Hindi, Danish, Spanish, Portuguese), and instant budget breakdowns — completely offline-ready without needing any API key.",
    projects: [
      { title: "Smart Rider Helmet", badge: "IoT & Safety", icon: "sports_motorsports", desc: "Two-wheeler safety ecosystem integrating alcohol breathalyzer interlocking, crash accelerometer telemetry, and automated GPS distress alerts." },
      { title: "Where is my trip", badge: "West Bengal Guide", icon: "travel_explore", desc: "Zero-API-key database-powered West Bengal cultural, rail, budget, weather & map companion." }
    ]
  };

  // ==================== DETERMINISTIC BUDGET & GUIDE ENGINE (0 API KEYS) ====================
  function computeTripPlan(inputs) {
    const destData = DESTINATIONS[inputs.destination] || DESTINATIONS["Darjeeling"];
    const startCityObj = STARTING_CITIES.find((c) => c.name === inputs.startCity) || STARTING_CITIES[0];

    const adults = Math.max(1, Number(inputs.adults) || 1);
    const children = Math.max(0, Number(inputs.children) || 0);
    const infants = Math.max(0, Number(inputs.infants) || 0);
    const seniors = Math.max(0, Number(inputs.seniors) || 0);
    const totalTravelers = adults + children + infants + seniors;
    const payingTravelers = adults + seniors + children * 0.65;
    const rooms = Math.max(1, Math.ceil((adults + seniors + children * 0.5) / 2));

    const days = Math.min(14, Math.max(1, Number(inputs.days) || 3));
    const nights = Math.max(1, days - 1);

    // Tier multipliers
    const tierKey = inputs.budgetTier || "mid"; // budget | mid | luxury
    const stayByTier =
      destData.stays.find((s) => s.tier === (tierKey === "budget" ? "budget" : tierKey === "luxury" ? "luxury" : "boutique")) ||
      destData.stays[1] ||
      destData.stays[0];

    const priorityMult = inputs.priority === "fastest" ? 1.45 : inputs.priority === "scenic" ? 0.78 : 1.0;
    const base = destData.budgetBase || { transportPP: 1200, foodPerDay: 650, localPerDay: 450, permitsPerTrip: 400 };

    const transportGroup = Math.round(
      ((base.transportPP * 2 * priorityMult) + startCityObj.extraTransitPerPerson) * payingTravelers
    );
    const accommodationGroup = Math.round(stayByTier.pricePerNight * nights * rooms);
    const foodMult = tierKey === "budget" ? 0.72 : tierKey === "luxury" ? 1.55 : 1.0;
    const foodGroup = Math.round(base.foodPerDay * foodMult * days * payingTravelers);
    const localMult = inputs.priority === "scenic" ? 0.75 : inputs.priority === "fastest" ? 1.3 : 1.0;
    const localGroup = Math.round(base.localPerDay * localMult * days * Math.max(1, payingTravelers * 0.7));
    const permitsGroup = Math.round(base.permitsPerTrip * payingTravelers);

    const subtotal = transportGroup + accommodationGroup + foodGroup + localGroup + permitsGroup;
    const contingencyGroup = Math.round(subtotal * 0.1);
    const grandTotalGroup = subtotal + contingencyGroup;
    const grandTotalPP = Math.round(grandTotalGroup / Math.max(1, totalTravelers));

    const budgetRows = [
      {
        category: `Transport (${inputs.startCity} ↔ ${inputs.destination.split(" (")[0]} + transfers)`,
        pp: Math.round(transportGroup / totalTravelers),
        group: transportGroup
      },
      {
        category: `Accommodation (${nights} ${nights === 1 ? "night" : "nights"} × ${rooms} ${rooms === 1 ? "room" : "rooms"} @ ${stayByTier.name})`,
        pp: Math.round(accommodationGroup / totalTravelers),
        group: accommodationGroup
      },
      {
        category: `Food & Dining (${inputs.foodPref || "No preference"} · ${days} days)`,
        pp: Math.round(foodGroup / totalTravelers),
        group: foodGroup
      },
      {
        category: `Local Transit (Cabs, totos, ferries & sightseeing)`,
        pp: Math.round(localGroup / totalTravelers),
        group: localGroup
      },
      {
        category: `Entry Fees & Permits`,
        pp: Math.round(permitsGroup / totalTravelers),
        group: permitsGroup
      },
      {
        category: `10% Contingency Buffer`,
        pp: Math.round(contingencyGroup / totalTravelers),
        group: contingencyGroup
      }
    ];

    // Build adapted days (1..14)
    const daysList = [];
    const pool = destData.daysPool || [];
    for (let i = 0; i < days; i++) {
      let line = pool[i % pool.length] || `Explore ${inputs.destination} local heritage and markets.`;
      if (i >= pool.length) {
        line = `Slow-paced cultural day in ${inputs.destination}: revisit favorite viewpoints, local crafts & relaxed dining.`;
      }
      if (inputs.accessibilityNote && i === 0) {
        line += ` [Pace Note: ${inputs.accessibilityNote}]`;
      }
      daysList.push(line);
    }

    // Select food list honoring diet preference
    const foodObj = destData.food || { veg: [], nonveg: [] };
    let foodList = [];
    if (inputs.foodPref === "Vegetarian" || inputs.foodPref === "Jain") {
      foodList = foodObj.veg.slice();
    } else if (inputs.foodPref === "Pescatarian") {
      foodList = [...foodObj.nonveg.filter((f) => /fish|ilish|chingri|pomfret|bhetki|crab|boroli|trout/i.test(f)), ...foodObj.veg];
    } else if (inputs.foodPref === "Non-vegetarian") {
      foodList = [...foodObj.nonveg, ...foodObj.veg];
    } else {
      foodList = [...foodObj.nonveg.slice(0, 3), ...foodObj.veg.slice(0, 2)];
    }

    const tips = destData.smartTips.slice();
    if (startCityObj.extraDaysNote) tips.unshift(startCityObj.extraDaysNote);
    if (inputs.travelStyle === "Family with kids" || seniors > 0) {
      tips.push("With kids or seniors (60+), prioritize pre-booked AC 3A/CC rail and central stays to avoid steep uphill walks.");
    }

    return {
      destData,
      totalTravelers,
      rooms,
      nights,
      days,
      budgetRows,
      grandTotalPP,
      grandTotalGroup,
      smartTips: tips,
      daysList,
      foodList,
      bestStayTier: stayByTier.tier
    };
  }

  global.WIMT_DATA = {
    STARTING_CITIES,
    DESTINATION_GROUPS,
    DESTINATIONS,
    BENGALI_PHRASEBOOK,
    ABOUT_INFO,
    computeTripPlan
  };
})(window);
