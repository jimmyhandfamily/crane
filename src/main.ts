import { WebGLRenderer, Clock, SRGBColorSpace, Vector3 } from "three";
import { createCraneScene } from "./scene/createScene";
import { initHud, setLoadMeter, setPayTease, setRole, setTitle } from "./ui/hud";
import { getCareerState } from "./career/careerStub";
import {
  initCraneControls,
  getCraneInput,
  consumeGrabPress,
  consumeCabToggle,
  HOOK_EMPTY_MASS_KG,
  SWAY_WARN_ANGLE,
} from "./crane";
import { ATTACH_DISTANCE } from "./loads";
import { createCabCameraToggle } from "./camera/cabCamera";

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
  crane: {
    setAttachedLoadMass(kg: number): void;
    physics: { getSwayAngle(): number; getLoadMass(): number };
  },
  loads: { attached: { massKg: number } | null }
): void {
  const kg = loads.attached?.massKg ?? 0;
  crane.setAttachedLoadMass(kg);
  const swingHigh =
    kg > 0 && crane.physics.getSwayAngle() > SWAY_WARN_ANGLE;
  setLoadMeter(kg, swingHigh);
}

function rankLabel(rank: string): string {
  return rank === "Junior" ? "Junior Operator" : rank;
}

function boot(): void {
  const canvas = document.getElementById("renderCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #renderCanvas");
  }

  const career = getCareerState();
  const objective = career.lesson2Complete
    ? "Lessons complete — keep practicing grab & place."
    : career.lesson1Complete
      ? `Lesson 2: place crates on Pad A ${career.padAPlaced ? "✓" : "○"} and Pad B ${career.padBPlaced ? "✓" : "○"} (both required).`
      : "Pick up a crate and place it on Pad A";

  initHud({
    title: career.title,
    role: rankLabel(career.rank),
    objective,
    showPayTease: true,
  });

  const payStub = career.lesson2Complete
    ? "Lesson 2 complete — both pads"
    : career.lesson1Complete
      ? "Lesson 1 complete — session pay"
      : "Pay unlocks later — stub";
  setPayTease(career.dayRate, payStub);
  setTitle(career.title);
  setRole(rankLabel(career.rank));

  const hintEl = document.getElementById("hud-hint");
  if (hintEl) {
    hintEl.textContent =
      "A/D slew · W/S trolley · R/F hoist · Space grab/release · C cab cam · Drag orbit · Scroll zoom";
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
    yardGates,
    dustPuffs,
    craneParts,
  } = createCraneScene(renderer, canvas);

  const cabCam = createCabCameraToggle(camera, controls, craneParts);

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
    if (consumeCabToggle()) {
      cabCam.toggle();
    }
    loads.update(crane.parts, crane.physics);
    // Swing warning each frame while loaded
    const kg = loads.attached?.massKg ?? 0;
    const swingHigh =
      kg > 0 && crane.physics.getSwayAngle() > SWAY_WARN_ANGLE;
    setLoadMeter(kg, swingHigh);

    blobShadows.update(crane.parts, loads);
    ambientTraffic.update(dt);
    yardGates.update(ambientTraffic.getTruckPoses(), dt);
    yardDressing.update(dt);
    dustPuffs.update(dt);
    cabCam.update();
    if (!cabCam.isCab()) {
      controls.update();
    }
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
    `[Crane] Three.js ready — attach≤${ATTACH_DISTANCE}m, cab+gates+excavator+dust+junior, rank=${career.rank}, L1=${career.lesson1Complete}, L2=${career.lesson2Complete}`
  );
}

boot();
