# where is my trip — West Bengal Smart Tourist & Cultural Guide

An A-to-Z responsive single-page travel and cultural guide built exclusively for **West Bengal, India** (prices in `₹`, distances in `km`).

## Key Architecture Highlights
- **Single-Call Gemini 2.5 Flash Lite**: Generates `reach[]`, `local[]`, `stay[3]`, `days[N]`, `landmarks[5]`, `food[5]`, `gems[3]`, `dos[5]`, and `donts[5]` in **1 request** (`thinkingBudget: 0`, `responseMimeType: "application/json"`, `temperature: 0.4`, `maxOutputTokens: 3500`, 25s timeout).
- **Instant Local Caching**: Cached in `localStorage` by `(startCity, destination, days, budget, priority, startMonth)` so repeat queries load instantly with zero API calls.
- **Instant Built-in Bengal Routes**: Includes curated offline routes & popular West Bengal corridors (Kolkata, Darjeeling & Kalimpong, Sundarbans, Shantiniketan, Bishnupur, Murshidabad, Dooars, Digha & Mandarmani, Purulia, Kurseong & Mirik, Sandakphu, Mayapur, Cooch Behar, Bakkhali, Tarapith, Lava-Lolegaon).
- **Zero-API Essentials**: Hardcoded 6-phrase Bengali Phrasebook, hardcoded About section, browser GPS Haversine city matching, and Open-Meteo parallel weather forecast.
- **Ananda Chatbot**: Sends only a compact trip summary + last 4–5 messages (`maxOutputTokens: 400`, answers `< 140` words), with send disabled while pending.

## Running Locally
Open `index.html` directly in any browser or serve the folder with any static HTTP server.
Configure your Gemini API key either via the in-app **Set API Key** button (saved in `localStorage`) or by copying `config.example.js` to `config.js`.
