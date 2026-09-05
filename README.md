# 💌 Teacher's Day Wishes

> *"The fact that I can send you a wish through a website of my own making — is because of you."*

A 3D animated Teacher's Day letter — an envelope that opens, a song that plays, flowers that bloom, and a message of gratitude written in code.

🌸 **Live site:** https://shuvam-banerji-seal.github.io/Teacher-s-Day-Wishes/

## The Experience

1. **Loading** — a 3D garden blooms behind the progress bar: procedural flowers opening petal by petal, glowing ribbon spirals, drifting light motes.
2. **The Envelope** — a hand-built 3D envelope floats in a dark, elegant space, sealed with a glowing rose wax seal. Click it.
3. **The Opening** — the seal cracks and falls away, the flap swings open, the letter slides out and unfolds in 3D.
4. **The Letter** — a parchment letter with the full message: thank you for always being there, for trusting me, for being someone to talk to about studies *and* life, for constantly inspiring — and the meta-truth that this entire website exists because my teachers taught me to write, think, code, and analyze.
5. **Personalized** — the site detects your city and country from your IP and weaves it into the greeting.
6. **The Song** — *"Teacher"* by TOMONARI SORA (theme of *Assassination Classroom: The Movie*) plays softly in the background. 🔊

## Built With

- [Three.js](https://threejs.org) (r185) — 3D envelope, letter, flowers, ribbons, petals, particles
- Vanilla JS + CSS — letter overlay, loading UI, typography
- ipwho.is / geojs.io / ipapi.co — visitor geolocation (fallback chain)
- yt-dlp — fetching the song
- Playwright — automated animation & interaction testing

## Run Locally

```bash
git clone https://github.com/Shuvam-Banerji-Seal/Teacher-s-Day-Wishes.git
cd Teacher-s-Day-Wishes
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html          — the page
css/style.css       — letter, loading UI, typography
js/
  main.js           — orchestrator (state machine, progress, personalization)
  stage.js          — shared WebGL renderer + render loop
  loading-scene.js  — 3D blooming flowers + ribbons + motes
  envelope-scene.js  — 3D envelope, flap, wax seal, unfolding letter
  flowers.js        — procedural flower geometry
  petals.js         — falling petal particle field
  audio.js          — song playback (gesture-unlocked, looped, mutable)
  geo.js            — IP → city/country personalization
assets/audio/song.m4a — "Teacher" — TOMONARI SORA
```

## Credits

- Song: **"Teacher" — TOMONARI SORA** (友成空), theme song for *Assassination Classroom: The Movie*. Video: https://youtu.be/BqFknuFhsCU
- Three.js © its authors, MIT license (vendored in `js/`)
- Fonts: Great Vibes & Cormorant Garamond (Google Fonts)

*Every petal is code. Every line is a thank-you.* 🌸
