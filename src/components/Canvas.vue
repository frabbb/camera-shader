<script setup>
import { ref, watch, onMounted } from "vue";
import { onKeyStroke } from "@vueuse/core";

import p5 from "p5";
import textureUrl from "@/assets/gradient-1.jpg";
import testShaderVertSrc from "@/assets/shaders/shader.vert";
import testShaderFragSrc from "@/assets/shaders/shader.frag";

const props = defineProps({
  samplingMode: {
    type: Boolean,
    default: true,
  },
  density: {
    type: Number,
    default: 50,
  },
  uiFrameSize: {
    type: Number,
    default: 80,
  },
});

const isPhone = ref(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

const container = ref(null);

const p = new p5((p) => p);
let canvas;
let camera = { width: 0, height: 0 };
let capture;
let shader;
let defaultTexture;
let ratio = 1;
let defaultSteps = 4;
const maxFrames = 20;

let graphics;
let frameSize = 400;

const framesN = defineModel("framesN", {
  type: Number,
  default: 0,
});

const selectedFrame = defineModel("selectedFrame", {
  type: Number,
});

const preload = async () => {
  const promises = [
    new Promise((resolve) => {
      shader = p.createShader(testShaderVertSrc, testShaderFragSrc);
      resolve();
    }),

    new Promise((resolve) => {
      p.loadImage(textureUrl, (i) => {
        defaultTexture = i;
        resolve();
      });
    }),
  ];

  return Promise.all(promises);
};

function resize() {
  p.resizeCanvas(p.windowWidth, p.windowHeight);
  ratio = p.width / p.height;
}

p.setup = async () => {
  await preload();

  canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
  container.value.appendChild(canvas.elt);
  p.angleMode(p.DEGREES);
  p.rectMode(p.CENTER);
  p.fill(0);
  p.noStroke();

  const resizeObserver = new ResizeObserver(() => {
    resize();
  });
  resizeObserver.observe(container.value);

  capture = p.createCapture(
    p.VIDEO,
    {
      audio: false,
      ...(!isPhone.value && {
        flipped: true,
      }),
      ...(isPhone.value && {
        video: {
          facingMode: {
            exact: "environment",
          },
        },
      }),
    },
    () => {
      camera.width = capture.elt.videoWidth;
      camera.height = capture.elt.videoHeight;
      camera.ratio = camera.width / camera.height;
    }
  );

  container.value.appendChild(capture.elt);

  ratio = p.width / p.height;
  graphics = p.createGraphics(frameSize, frameSize);
};

p.draw = () => {
  if (!camera.width || !camera.height) return;

  p.clear();

  if (props.samplingMode) {
    p.resetShader();

    p.push();
    p.translate((-props.uiFrameSize * framesN.value) / 2, -p.height / 2 + 72);
    p.image(
      graphics,
      0,
      0,
      props.uiFrameSize * framesN.value,
      props.uiFrameSize
    );
    p.pop();
  } else {
    p.noStroke();
    p.fill(255);

    if (shader) {
      p.shader(shader);
      shader.setUniform("uTexture", capture);
      shader.setUniform(
        "uGradientTexture",
        framesN.value > 0 ? graphics : defaultTexture
      );
      shader.setUniform("uDensity", props.density);
      shader.setUniform("uRatio", ratio);
      shader.setUniform(
        "uSteps",
        framesN.value > 0 ? framesN.value : defaultSteps
      );

      const viewportY = Math.min(p.height / (p.width / camera.ratio), 1.0);
      const viewportX = Math.min(p.width / (p.height * camera.ratio), 1.0);

      shader.setUniform("uViewportX", viewportX);
      shader.setUniform("uViewportY", viewportY);

      p.rect(0, 0, 0, 0);
    }
  }
};

function sample() {
  if (selectedFrame.value === undefined) {
    addFrame();
  }

  let source = {
    x: camera.ratio > ratio ? (camera.width - camera.height * ratio) / 2 : 0,
    y: camera.ratio > ratio ? 0 : (camera.height - camera.width / ratio) / 2,
    width: camera.ratio > ratio ? camera.height * ratio : camera.width,
    height: camera.ratio > ratio ? camera.height : camera.width / ratio,
  };

  const side = Math.min(source.width, source.height);
  const x = source.x + (source.width - side) / 2;
  const y = source.y + (source.height - side) / 2;

  graphics.image(
    capture,
    (selectedFrame.value >= 0 ? selectedFrame.value - 1 : framesN.value) *
      frameSize,
    0,
    frameSize,
    frameSize,
    x,
    y,
    side,
    side
  );

  selectedFrame.value = undefined;
}

function removeFrame(i) {
  const newFramesN = framesN.value - 1;

  framesN.value = newFramesN;

  if (!newFramesN) {
    graphics = p.createGraphics(frameSize, frameSize);

    return;
  }

  const newGraphics = p.createGraphics(
    frameSize * (framesN.value - 1),
    frameSize
  );

  newGraphics.image(
    graphics,
    0,
    0,
    frameSize * (i - 1),
    frameSize,
    0,
    0,
    frameSize * (i - 1),
    frameSize
  );

  newGraphics.image(
    graphics,
    frameSize * (i - 1),
    0,
    frameSize * (newFramesN + 1 - i),
    frameSize,
    frameSize * i,
    0,
    frameSize * (newFramesN + 1 - i),
    frameSize
  );

  graphics = newGraphics;
}

function addFrame() {
  if (framesN.value >= maxFrames) return;

  const newFramesN = framesN.value + 1;

  const newGraphics = p.createGraphics(frameSize * newFramesN, frameSize);
  newGraphics.image(graphics, 0, 0, graphics.width, graphics.height);
  graphics = newGraphics;

  framesN.value = newFramesN;
}

onKeyStroke(" ", (e) => {
  if (props.samplingMode) {
    sample();
  }
});

onKeyStroke("Backspace", (e) => {
  if (!props.samplingMode || !framesN.value) return;

  if (selectedFrame.value !== undefined) {
    removeFrame(selectedFrame.value);
    selectedFrame.value = undefined;
  } else {
    removeFrame(framesN.value);
  }
});

defineExpose({
  sample,
  removeFrame,
});
</script>

<template>
  <div
    class="canvas-container"
    ref="container"
    :class="{ 'is-phone': isPhone }"
  ></div>
</template>

<style>
canvas {
  /* opacity: 0.5; */
}

.canvas-container,
video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.canvas-container {
  z-index: 1;

  video {
    transform: scaleX(-1);
  }

  &.is-phone {
    video {
      transform: scaleX(1);
    }
  }
}
</style>
