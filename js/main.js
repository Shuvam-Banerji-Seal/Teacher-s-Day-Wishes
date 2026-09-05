/* main.js - orchestrator for the Teacher's Day experience.
   Flow: loading (3D flowers+ribbons) -> gesture -> audio unlock
         -> envelope scene -> click envelope -> open -> letter */
import { createStage } from './stage.js';
import { buildLoadingScene } from './loading-scene.js';
import { buildEnvelopeScene } from './envelope-scene.js';
import { AudioBus } from './audio.js';
import { personalize } from './geo.js';

const $ = (sel) => document.querySelector(sel);

const els = {
  loader: $('#loader'),
  progressFill: $('#progressFill'),
  progressPct: $('#progressPct'),
  openBtn: $('#openBtn'),
  sceneUi: $('#sceneUi'),
  muteBtn: $('#muteBtn'),
  hint: $('#hint'),
  letterOverlay: $('#letterOverlay'),
  replayBtn: $('#replayBtn'),
  greetingSlot: $('#greetingSlot'),
};

const state = {
  entered: false,
  envelopeOpened: false,
  audio: new AudioBus('assets/audio/song.m4a'),
};

/* ── progress: assets we truly load ── */
const REAL_STEPS = ['three.js', 'audio', 'fonts', 'scene'];
let realDone = 0;
function bumpProgress(label) {
  realDone++;
  const pct = Math.min(100, Math.round((realDone / REAL_STEPS.length) * 100));
  els.progressFill.style.width = pct + '%';
  els.progressPct.textContent = pct + '%';
  if (pct >= 100) revealOpenBtn();
}
function revealOpenBtn() {
  if (state.entered) return;
  els.openBtn.classList.remove('hidden');
  els.openBtn.focus({ preventScroll: true });
}

/* fonts */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => bumpProgress('fonts'));
} else {
  setTimeout(() => bumpProgress('fonts'), 300);
}

/* audio preload */
state.audio.preload().then(() => bumpProgress('audio')).catch(() => bumpProgress('audio'));

/* build stage + both scenes */
const stage = createStage(document.getElementById('stage'));
buildLoadingScene(stage);
const envelopeScene = buildEnvelopeScene(stage);
stage.activate('loading');   // start rendering the loading scene
bumpProgress('scene');

/* debug handle for testing (harmless in prod) */
window.__stage = stage;
window.__envelopeScene = envelopeScene;

/* three.js itself is already imported by this point */
bumpProgress('three.js');

/* geo personalization (async, non-blocking) */
personalize((data) => {
  if (data && data.city) {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    els.greetingSlot.textContent = part + ' from ' + data.city + ', ' + data.country + ' — dear Teachers,';
    const geoLine = $('#geoLine');
    const geoEmoji = $('#geoEmoji');
    if (geoLine && geoEmoji) {
      geoEmoji.textContent = data.flag || '🌍';
      geoLine.innerHTML =
        'This wish traveled through the internet to reach <strong>' +
        data.city + (data.region ? ', ' + data.region : '') +
        '</strong> — ' + data.country +
        ' <span style="opacity:.65">(' + data.ip + ')</span>. ' +
        'Wherever you are, my teachers\u2019 lessons travel with me.';
    }
  }
});

/* gesture -> unlock audio + enter envelope scene */
els.openBtn.addEventListener('click', () => {
  if (state.entered) return;
  state.entered = true;
  state.audio.play().catch(() => {});
  els.loader.classList.add('hidden');
  els.sceneUi.classList.remove('hidden');
  envelopeScene.enter();
});

/* envelope opened -> show letter overlay after the 3D unfold completes (~3.4s) */
envelopeScene.onOpen(() => {
  if (state.envelopeOpened) return;
  state.envelopeOpened = true;
  els.hint.classList.add('gone');
  setTimeout(() => {
    els.letterOverlay.classList.remove('hidden');
  }, 3300);
});

/* replay */
els.replayBtn.addEventListener('click', () => {
  els.letterOverlay.classList.add('hidden');
  state.envelopeOpened = envelopeScene.reset();
  els.hint.classList.remove('gone');
});

/* mute toggle */
els.muteBtn.addEventListener('click', () => {
  const muted = state.audio.toggleMute();
  els.muteBtn.textContent = muted ? '🔇' : '🔊';
  els.muteBtn.title = muted ? 'Unmute the song' : 'Mute the song';
});
