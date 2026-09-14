import { Engine } from "@babylonjs/core";
import { createCraneScene } from "./scene/createScene";
import { initHud } from "./ui/hud";
import { getCareerState, getPayTeaseLabel } from "./career/careerStub";

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
    objective: "Look around the yard. Get a feel for the crane.",
    showPayTease: true,
  });

  const payEl = document.getElementById("hud-pay");
  if (payEl) {
    payEl.innerHTML = `${getPayTeaseLabel()}<div class="stub">Pay unlocks later — stub</div>`;
  }

  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    adaptToDeviceRatio: true,
  });

  const { scene } = createCraneScene(engine, canvas);

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });

  console.info(
    `[Crane M0] Training yard ready — rank=${career.rank}, yard=100m, crane≈40m`
  );
}

boot();
