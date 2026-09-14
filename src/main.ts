import { WebGLRenderer, Clock, SRGBColorSpace } from "three";
import { createCraneScene } from "./scene/createScene";
import { initHud, setLoadMeter } from "./ui/hud";
import { getCareerState, getPayTeaseLabel } from "./career/careerStub";
import {
  initCraneControls,
  getCraneInput,
  consumeGrabPress,
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

  const payEl = document.getElementById("hud-pay");
  if (payEl) {
    payEl.innerHTML = `${getPayTeaseLabel()}<div class="stub">Pay unlocks later — stub</div>`;
  }

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

  function frame(): void {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);

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
    `[Crane] Three.js grab/place ready — attach≤${ATTACH_DISTANCE}m, mild sway + load meter, ambient traffic + workers, rank=${career.rank}`
  );
}

boot();
