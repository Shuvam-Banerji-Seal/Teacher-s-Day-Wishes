/* ═══════════════════════════════════════════════════════════
   envelope-scene.js — the 3D envelope + letter.
   All custom geometry, no external textures.
   Open sequence (master timeline, ~3.4s):
     0.0–0.5  seal glows & cracks
     0.5–1.1  flap rotates back 180°
     1.1–1.9  letter slides up out of envelope
     1.9–2.6  letter top unfolds upward
     2.6–3.4  settle + camera focus
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { makeFlower } from './flowers.js';
import { makePetalField, updatePetalField } from './petals.js';

export function buildEnvelopeScene(stage) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x101426, 0.045);
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
  const camHome = new THREE.Vector3(0, 0.6, 7.5);
  camera.position.copy(camHome);
  camera.lookAt(0, 0, 0);

  /* ── lights (r155+ physical lighting: intensities ~π× legacy) ── */
  scene.add(new THREE.AmbientLight(0xfff2dd, 1.7));
  const key = new THREE.DirectionalLight(0xffe6b3, 4.2);
  key.position.set(3, 5, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe88fa2, 2.6);
  rim.position.set(-5, 2, 4);
  scene.add(rim);
  const under = new THREE.PointLight(0xd4a24c, 2.5, 12);
  under.position.set(0, -2.5, 2);
  scene.add(under);

  /* ═══ envelope construction ═══ */
  const envelope = new THREE.Group();
  const W = 2.6, H = 1.7, D = 0.14;

  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf7ead2, roughness: 0.85, metalness: 0.02 });
  const paperBackMat = paperMat.clone();
  paperBackMat.color = new THREE.Color(0xefdfc2);

  // back panel
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), paperBackMat);
  back.position.z = -D / 2;
  envelope.add(back);

  // front panel
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), paperMat);
  front.position.z = D / 2;
  envelope.add(front);

  // subtle inner border on the front
  const border = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.92, H * 0.9),
    new THREE.MeshBasicMaterial({ color: 0xc9a86a, transparent: true, opacity: 0.3 })
  );
  border.position.z = D / 2 + 0.002;
  envelope.add(border);

  // bottom fold (trapezoid rising to center)
  const foldShape = new THREE.Shape();
  foldShape.moveTo(-W / 2, -H / 2);
  foldShape.lineTo(W / 2, -H / 2);
  foldShape.lineTo(0, H / 2 - 0.3);
  foldShape.closePath();
  const bottomFold = new THREE.Mesh(new THREE.ShapeGeometry(foldShape), paperMat);
  bottomFold.position.z = D / 2 + 0.004;
  envelope.add(bottomFold);

  // left fold (triangle)
  const leftShape = new THREE.Shape();
  leftShape.moveTo(-W / 2, -H / 2);
  leftShape.lineTo(-W / 2, H / 2);
  leftShape.lineTo(0, 0);
  leftShape.closePath();
  const leftFold = new THREE.Mesh(new THREE.ShapeGeometry(leftShape), paperMat);
  leftFold.position.z = D / 2 + 0.003;
  envelope.add(leftFold);

  // right fold (triangle)
  const rightShape = new THREE.Shape();
  rightShape.moveTo(W / 2, -H / 2);
  rightShape.lineTo(W / 2, H / 2);
  rightShape.lineTo(0, 0);
  rightShape.closePath();
  const rightFold = new THREE.Mesh(new THREE.ShapeGeometry(rightShape), paperMat);
  rightFold.position.z = D / 2 + 0.003;
  envelope.add(rightFold);

  /* ── flap (hinged at top edge, front face) ──
     Closed: flap lies on the front face pointing DOWN (triangle
     apex at bottom-center). Opening: rotates back 180°. */
  const flapGroup = new THREE.Group();
  flapGroup.position.set(0, H / 2, D / 2); // hinge: top edge of FRONT face
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-W / 2, 0);
  flapShape.lineTo(W / 2, 0);
  flapShape.lineTo(0, -H * 0.62); // apex points down toward seal
  flapShape.closePath();
  const flap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), paperMat);
  flap.position.z = 0.006; // just above front face
  flapGroup.add(flap);
  envelope.add(flapGroup);

  /* ── wax seal ── */
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.06, 24),
    new THREE.MeshStandardMaterial({
      color: 0xc95f77, roughness: 0.35, metalness: 0.15,
      emissive: 0xc95f77, emissiveIntensity: 0.35,
    })
  );
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, -0.204, D / 2 + 0.03); // aligned with flap apex
  envelope.add(seal);

  // gold star on the seal
  const starShape = new THREE.Shape();
  const starPts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.12 : 0.05;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    starPts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  starShape.setFromPoints(starPts);
  const star = new THREE.Mesh(
    new THREE.ShapeGeometry(starShape),
    new THREE.MeshStandardMaterial({
      color: 0xd4a24c, emissive: 0xd4a24c, emissiveIntensity: 0.6,
      roughness: 0.3, metalness: 0.7,
    })
  );
  star.position.set(0, -0.204, D / 2 + 0.065);
  envelope.add(star);

  envelope.rotation.x = -0.12;
  scene.add(envelope);

  /* ═══ the letter ═══ */
  const letter = new THREE.Group();
  const LW = W * 0.92, LH = H * 0.88;

  const letterMat = new THREE.MeshStandardMaterial({
    color: 0xfdf6e9, roughness: 0.9, side: THREE.DoubleSide,
  });

  /* letter top face texture: "Happy Teacher's Day" */
  const topCnv = document.createElement('canvas');
  topCnv.width = 512; topCnv.height = 256;
  const topCtx = topCnv.getContext('2d');
  topCtx.fillStyle = '#fdf6e9';
  topCtx.fillRect(0, 0, 512, 256);
  topCtx.fillStyle = '#a94e63';
  topCtx.font = 'italic 40px "Cormorant Garamond", Georgia, serif';
  topCtx.textAlign = 'center';
  topCtx.fillText('Happy', 256, 90);
  topCtx.fillText("Teacher's Day", 256, 140);
  topCtx.fillStyle = '#d4a24c';
  topCtx.font = '30px serif';
  topCtx.fillText('🌸', 256, 200);
  const topTex = new THREE.CanvasTexture(topCnv);
  topTex.colorSpace = THREE.SRGBColorSpace;
  const letterTopMat = new THREE.MeshStandardMaterial({
    map: topTex, roughness: 0.9, side: THREE.DoubleSide,
  });

  // redraw the top texture too once fonts load
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      topCtx.clearRect(0, 0, 512, 256);
      topCtx.fillStyle = '#fdf6e9';
      topCtx.fillRect(0, 0, 512, 256);
      topCtx.fillStyle = '#a94e63';
      topCtx.font = 'italic 40px "Cormorant Garamond", Georgia, serif';
      topCtx.textAlign = 'center';
      topCtx.fillText('Happy', 256, 90);
      topCtx.fillText("Teacher's Day", 256, 140);
      topCtx.fillStyle = '#d4a24c';
      topCtx.font = '30px serif';
      topCtx.fillText('🌸', 256, 200);
      topTex.needsUpdate = true;
    });
  }

  // bottom half (fixed)
  const letterBase = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH / 2), letterMat);
  letterBase.position.y = -LH / 4;
  letter.add(letterBase);

  // top half (unfolds) — mesh offset in z to avoid z-fighting when folded
  const letterTop = new THREE.Group();
  const letterTopMesh = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH / 2), letterTopMat);
  letterTopMesh.position.set(0, LH / 4, 0.006);
  letterTop.add(letterTopMesh);
  letter.add(letterTop);

  // "Dear Teachers," front face via canvas texture (with baked script lines)
  const cnv = document.createElement('canvas');
  cnv.width = 512; cnv.height = 256;
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#fdf6e9';
  ctx.fillRect(0, 0, 512, 256);
  // baked decorative script lines
  ctx.strokeStyle = 'rgba(185,141,95,.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(80, 176 + i * 18);
    ctx.lineTo(432, 176 + i * 18);
    ctx.stroke();
  }
  ctx.fillStyle = '#a94e63';
  ctx.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Dear Teachers,', 256, 96);
  ctx.fillStyle = '#7a5c44';
  ctx.font = 'italic 30px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('with love…', 256, 150);
  const letterTex = new THREE.CanvasTexture(cnv);
  letterTex.colorSpace = THREE.SRGBColorSpace;
  const letterFront = new THREE.Mesh(
    new THREE.PlaneGeometry(LW, LH / 2),
    new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.9, side: THREE.DoubleSide })
  );
  letterFront.position.set(0, -LH / 4, 0.004);
  letter.add(letterFront);

  // redraw canvas textures once webfonts are ready (avoid fallback serif)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ctx.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = '#a94e63';
      ctx.textAlign = 'center';
      ctx.clearRect(0, 0, 512, 256);
      ctx.fillStyle = '#fdf6e9';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = 'rgba(185,141,95,.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(80, 176 + i * 18);
        ctx.lineTo(432, 176 + i * 18);
        ctx.stroke();
      }
      ctx.fillStyle = '#a94e63';
      ctx.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('Dear Teachers,', 256, 96);
      ctx.fillStyle = '#7a5c44';
      ctx.font = 'italic 30px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('with love…', 256, 150);
      letterTex.needsUpdate = true;
      topTex.needsUpdate = true;
    });
  }

  letter.scale.set(0.98, 0.98, 1);
  letterTop.rotation.x = -Math.PI; // start folded down (fits inside envelope)
  envelope.add(letter);

  /* ═══ ambient petals + motes ═══ */
  const petalField = makePetalField(40, 8);
  scene.add(petalField);

  const moteGeo = new THREE.BufferGeometry();
  const moteCount = 120;
  const motePos = new Float32Array(moteCount * 3);
  const moteSeed = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (Math.random() - 0.5) * 16;
    motePos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    motePos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    moteSeed[i] = Math.random() * Math.PI * 2;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xffe6b3, size: 0.05, transparent: true, opacity: 0.8,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(motes);

  /* ═══ corner flowers ═══ */
  const cornerFlowers = [];
  const flowerPalette = [0xe88fa2, 0xf2b8c6, 0xd98aa0, 0xc95f77];
  const cornerPositions = [
    [-3.4, 1.8, -1.2], [3.4, 1.8, -1.2], [-3.4, -1.6, -1.2], [3.4, -1.6, -1.2],
  ];
  cornerPositions.forEach((p, i) => {
    const f = makeFlower({ petalCount: 7, color: flowerPalette[i % 4], petalLen: 0.55, layers: 2 });
    f.position.set(p[0], p[1], p[2]);
    f.rotation.z = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    f.userData.setBloom(0.75);
    scene.add(f);
    cornerFlowers.push(f);
  });

  /* ═══ interaction ═══ */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let opened = false;
  let openT = 0;
  let hovering = false;
  let interactive = false;      // true only while envelope scene is active
  const onOpenCallbacks = [];
  function fireOpen() { for (const cb of onOpenCallbacks) cb(); }

  function isUiEvent(e) {
    // ignore pointer events that originate from buttons/overlays
    return !!(e.target && e.target.closest &&
      e.target.closest('button, a, .letter-paper, .top-bar'));
  }

  function setPointer(e) {
    pointer.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
  }

  function onClick(e) {
    if (!interactive || opened || isUiEvent(e)) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([envelope], true);
    if (hits.length > 0) {
      opened = true;
      fireOpen();
    }
  }

  function onMove(e) {
    if (!interactive || opened || isUiEvent(e)) { 
      if (hovering) { hovering = false; document.body.style.cursor = 'default'; }
      return; 
    }
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([envelope], true);
    hovering = hits.length > 0;
    document.body.style.cursor = hovering ? 'pointer' : 'default';
  }

  window.addEventListener('pointerdown', onClick);
  window.addEventListener('pointermove', onMove);

  /* ═══ open-sequence phases ═══ */
  function sealPhase(p) {
    seal.scale.setScalar(1 - p * 0.15);
    seal.material.emissiveIntensity = 0.35 + Math.sin(p * Math.PI) * 1.2;
    star.rotation.z = p * Math.PI;
  }
  function flapPhase(p) {
    flapGroup.rotation.x = -p * Math.PI * 1.25; // opens back & away from letter path
    if (p > 0.25) {
      // seal cracks off: falls, spins, fades
      const fp = (p - 0.25) / 0.75;
      seal.position.y = -0.204 - fp * fp * 1.8;
      seal.position.z = D / 2 + 0.03 + fp * 0.25;
      seal.rotation.z = fp * 2.5;
      seal.material.transparent = true;
      seal.material.opacity = 1 - fp;
      star.visible = false;
    }
  }
  function risePhase(p) {
    letter.position.y = p * (H * 0.75);
    letter.position.z = p * 0.1;
    camera.position.z = camHome.z + p * 0.6;
  }
  function unfoldPhase(p) {
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    letterTop.rotation.x = -(1 - eased) * Math.PI; // -π (folded) → 0 (open)
    letter.position.y = H * 0.75 + p * 0.5;
    camera.position.z = camHome.z + 0.6 - p * 1.5;
    camera.position.y = camHome.y + p * 0.4;
  }
  function settlePhase(p) {
    letter.position.y = H * 0.75 + 0.5 + Math.sin((p * Math.PI) / 2) * 0.15;
    camera.position.z = camHome.z - 0.9 - p * 0.3;
  }

  const PHASES = [
    { start: 0.0, end: 0.5, fn: sealPhase },
    { start: 0.5, end: 1.1, fn: flapPhase },
    { start: 1.1, end: 1.9, fn: risePhase },
    { start: 1.9, end: 2.6, fn: unfoldPhase },
    { start: 2.6, end: 3.4, fn: settlePhase },
  ];

  /* ═══ update loop ═══ */
  stage.register('envelope', {
    scene, camera,
    update(dt, t) {
      const floatY = Math.sin(t * 1.2) * 0.06;
      envelope.position.y = floatY;
      envelope.rotation.z = Math.sin(t * 0.8) * 0.02;
      envelope.rotation.y = Math.sin(t * 0.5) * 0.04;

      key.intensity = hovering && !opened ? 4.2 + Math.sin(t * 6) * 0.8 : 4.2;

      if (opened && openT < 3.4) {
        openT += dt;
        for (const ph of PHASES) {
          if (openT >= ph.start) {
            const local = THREE.MathUtils.clamp((openT - ph.start) / (ph.end - ph.start), 0, 1);
            ph.fn(local);
          }
        }
      }

      // camera always aims at a target that rises gently as the letter emerges
      if (opened) {
        const focus = THREE.MathUtils.clamp((openT - 1.1) / 1.5, 0, 1);
        camera.lookAt(0, 0.4 * focus, 0);
      }

      updatePetalField(petalField, dt, t);

      const pos = moteGeo.attributes.position;
      for (let i = 0; i < moteCount; i++) {
        let y = pos.getY(i) + dt * 0.18;
        if (y > 5) y = -5;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(t * 0.4 + moteSeed[i]) * dt * 0.12);
      }
      pos.needsUpdate = true;

      for (const f of cornerFlowers) {
        const target = opened ? 1 : 0.75;
        const cur = f.userData.bloomT ?? 0.75;
        const next = cur + (target - cur) * Math.min(dt * 2, 1);
        f.userData.setBloom(next);
        f.userData.bloomT = next;
        f.rotation.z += dt * 0.05;
      }
    },
    onResize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
  });

  return {
    enter() {
      interactive = true;
      stage.activate('envelope');
    },
    /** Programmatically trigger the open sequence (keyboard access). */
    openViaKeyboard() {
      if (!interactive || opened) return;
      opened = true;
      fireOpen();
    },
    reset() {
      opened = false;
      openT = 0;
      interactive = true;
      hovering = false;
      document.body.style.cursor = 'default';
      seal.visible = true;
      star.visible = true;
      seal.scale.setScalar(1);
      seal.material.emissiveIntensity = 0.35;
      seal.material.transparent = false;
      seal.material.opacity = 1;
      seal.position.set(0, -0.204, D / 2 + 0.03);
      seal.rotation.z = 0;
      flapGroup.rotation.x = 0;
      letter.position.set(0, 0, 0);
      letterTop.rotation.x = -Math.PI;
      camera.position.copy(camHome);
      camera.lookAt(0, 0, 0);
      return false; // envelopeOpened state
    },
    onOpen(cb) { onOpenCallbacks.push(cb); },
  };
}
