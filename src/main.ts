import { WebGLRenderer, Clock, SRGBColorSpace, Vector3 } from "three";
import { createCraneScene } from "./scene/createScene";
import { initHud, setLoadMeter, setPayTease } from "./ui/hud";
import { getCareerState } from "./career/careerStub";
import {
  initCraneControls,
  getCraneInput,
  consumeGrabPress,
  HOOK_EMPTY_MASS_KG,
} from "./crane";
import { ATTACH_DISTANCE } from "./loads";

function syncGrabButton(attached: boolean): void {
  const btn = document.getElementById("btn-grab");
  if (!btn) return;
  const label = attached ? "Release" : "Grab";
  btn.innerHTML = `${label}<span class="key">Space</span>`;
  btn.title = attached
    ? "Release load (Space)"
    : "Grab nearby load (Space)";
  btn.classList.toggle("holding", attached);
}

function syncLoadMass(
  crane: { setAttachedLoadMass(kg: number): void },
  loads: { attached: { massKg: number } | null }
): void {
  const kg = loads.attached?.massKg ?? 0;
  crane.setAttachedLoadMass(kg);
  setLoadMeter(kg);
}

function boot(): void {
  const canvas = document.getElementById("renderCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #renderCanvas");
  }

  const career = getCareerState();
  initHud({
    title: "Training Yard",
    role: career.rank,
    objective: "Pick up a crate and place it on Pad A",
    showPayTease: true,
  });

  setPayTease(career.dayRate, "Pay unlocks later — stub");

  const hintEl = document.getElementById("hud-hint");
  if (hintEl) {
    hintEl.textContent =
      "A/D slew · W/S trolley · R/F hoist · Space grab/release · Drag orbit · Scroll zoom";
  }

  initCraneControls();
  syncGrabButton(false);

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = SRGBColorSpace;

  const {
    scene,
    camera,
    controls,
    crane,
    loads,
    blobShadows,
    ambientTraffic,
    yardDressing,
  } = createCraneScene(renderer, canvas);

  syncLoadMass(crane, loads);

  const clock = new Clock();

  // Gentle ambient wind: strength 0.15–0.35 (accel-equivalent on empty hook),
  // slow direction drift — subtle empty-hook sway, much milder than old physics.
  let windT = 0;
  const windDir = new Vector3(1, 0, 0);

  function frame(): void {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);

    windT += dt;
    const windAngle = windT * 0.06;
    windDir.set(Math.cos(windAngle), 0, Math.sin(windAngle));
    const windStrength = 0.25 + 0.1 * Math.sin(windT * 0.21); // 0.15–0.35
    // setWind stores a force; scale by empty hook mass so the numeric range
    // matches ~0.15–0.35 m/s² on an empty hook (loaded = milder).
    crane.physics.setWind(windDir, windStrength * HOOK_EMPTY_MASS_KG);

    crane.applyInput(getCraneInput(), dt);
    if (consumeGrabPress()) {
      loads.tryToggleGrab(crane.parts);
      syncGrabButton(loads.attached !== null);
      syncLoadMass(crane, loads);
    }
    loads.update(crane.parts);
    blobShadows.update(crane.parts, loads);
    ambientTraffic.update(dt);
    yardDressing.update(dt);
    controls.update();
    renderer.render(scene, camera);
  }
  frame();

  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  console.info(
    `[Crane] Three.js grab/place ready — attach≤${ATTACH_DISTANCE}m, mild sway + aim highlight + gentle wind, ambient mixer, rank=${career.rank}`
  );
}

boot();
