<script setup>
import { ref, watch, defineProps, onMounted } from "vue";
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
});

const container = ref(null);

const p = new p5((p) => p);
let canvas;
let camera = { width: 0, height: 0 };
let capture;
let shader;
let texture;
let density = 50;
let ratio = 1;
let steps = 4;

let graphics;
let frameSize = 400;
let framesN = 0;
let selectedFrame = 0;

const preload = async () => {
  const promises = [
    new Promise((resolve) => {
      shader = p.createShader(testShaderVertSrc, testShaderFragSrc);
      resolve();
    }),

    new Promise((resolve) => {
      p.loadImage(textureUrl, (i) => {
        texture = i;
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

  capture = p.createCapture(p.VIDEO, { flipped: true }, () => {
    camera.width = capture.elt.videoWidth;
    camera.height = capture.elt.videoHeight;
    camera.ratio = camera.width / camera.height;
  });

  ratio = p.width / p.height;
  graphics = p.createGraphics(frameSize, frameSize);
};

p.draw = () => {
  if (!camera.width || !camera.height) return;

  p.clear();

  if (props.samplingMode) {
    p.resetShader();
    const side = Math.min(p.width, p.height);
    p.stroke(255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(0, 0, side, side);

    let frameUiSize = 80;

    p.push();
    p.translate((-frameUiSize * framesN) / 2, -p.height / 2 + 72);
    p.image(graphics, 0, 0, frameUiSize * framesN, frameUiSize);
    p.pop();
  } else {
    p.noStroke();
    p.fill(255);

    if (shader) {
      p.shader(shader);
      shader.setUniform("uTexture", capture);
      shader.setUniform("uGradientTexture", framesN > 0 ? graphics : texture);
      shader.setUniform("uDensity", density);
      shader.setUniform("uRatio", ratio);
      shader.setUniform("uSteps", framesN > 0 ? framesN : steps);

      const viewportY = Math.min(p.height / (p.width / camera.ratio), 1.0);
      const viewportX = Math.min(p.width / (p.height * camera.ratio), 1.0);

      shader.setUniform("uViewportX", viewportX);
      shader.setUniform("uViewportY", viewportY);

      p.rect(0, 0, 0, 0);
    }
  }
};
function sample() {
  addFrame();

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
    selectedFrame * frameSize,
    0,
    frameSize,
    frameSize,
    x,
    y,
    side,
    side
  );

  selectedFrame++;
}

function addFrame() {
  framesN++;

  const newGraphics = p.createGraphics(frameSize * framesN, frameSize);
  newGraphics.image(graphics, 0, 0, graphics.width, graphics.height);
  graphics = newGraphics;
}

onKeyStroke(" ", (e) => {
  if (props.samplingMode) {
    sample();
  }
});
</script>

<template>
  <div class="canvas-container" ref="container">
    <button class="camera-button" v-show="samplingMode" @click="sample" />
  </div>
</template>

<style>
canvas {
  /* opacity: 0.5; */
}

.camera-button {
  width: var(--2xl);
  height: var(--2xl);
  background-color: var(--white);
  border-radius: 50%;
  outline: 2px solid var(--white);
  outline-offset: 1px;
  cursor: pointer;
  position: absolute;
  z-index: 1;
  bottom: var(--2xl);
  left: 50%;
  transform: translateX(-50%);

  @media (hover: hover) {
    &:hover {
      opacity: 0.8;
    }
  }

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
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

video {
  transform: scaleX(-1);
}

.canvas-container {
  z-index: 1;
}
</style>
