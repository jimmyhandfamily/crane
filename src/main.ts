import { Engine } from "@babylonjs/core";
import { createCraneScene } from "./scene/createScene";
import { initHud } from "./ui/hud";
import { getCareerState, getPayTeaseLabel } from "./career/careerStub";
import { initCraneControls, getCraneInput } from "./crane";

function boot(): void {
  const canvas = document.getElementById("renderCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #renderCanvas");
  }

  // Career stub (no progression yet)
  const career = getCareerState();
  initHud({
    title: "Training Yard",
    role: career.rank,
    objective: "Practice slew, trolley, and hoist. No loads yet.",
    showPayTease: true,
  });

  const payEl = document.getElementById("hud-pay");
  if (payEl) {
    payEl.innerHTML = `${getPayTeaseLabel()}<div class="stub">Pay unlocks later — stub</div>`;
  }

  const hintEl = document.getElementById("hud-hint");
  if (hintEl) {
    hintEl.textContent =
      "A/D slew · W/S trolley · R/F hoist · Drag orbit · Scroll zoom";
  }

  initCraneControls();

  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    adaptToDeviceRatio: true,
  });

  const { scene, crane } = createCraneScene(engine, canvas);

  engine.runRenderLoop(() => {
    const dt = engine.getDeltaTime() / 1000;
    crane.applyInput(getCraneInput(), dt);
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });

  console.info(
    `[Crane M1] Kinematic controls ready — rank=${career.rank}, A/D slew, W/S trolley, R/F hoist`
  );
}

boot();
