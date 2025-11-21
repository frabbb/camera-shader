<script setup>
import { ref, watch, defineProps, onMounted } from "vue";
import p5 from "p5";
import testImageUrl from "@/assets/test.jpg"; // Import the image
import testShaderVertSrc from "@/assets/shaders/shader.vert";
import testShaderFragSrc from "@/assets/shaders/shader.frag";

const container = ref(null);

const p = new p5((p) => p);
let canvas;
let camera = { width: 0, height: 0 };
let capture;
let shader;
let frame;
let texture;
let density = 100;
let ratio = 1;

const preload = async () => {
  const promises = [
    new Promise((resolve) => {
      shader = p.createShader(testShaderVertSrc, testShaderFragSrc);
      resolve();
    }),

    new Promise((resolve) => {
      p.loadImage(testImageUrl, (i) => {
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
  });

  ratio = p.width / p.height;
};

p.draw = () => {
  if (!camera.width || !camera.height) return;

  const windowRatio = p.windowWidth / p.windowHeight;
  const cameraRatio = camera.width / camera.height;

  const source = {
    x:
      cameraRatio > windowRatio
        ? (camera.width - camera.height * windowRatio) / 2
        : 0,
    y:
      cameraRatio > windowRatio
        ? 0
        : (camera.height - camera.width / windowRatio) / 2,
    width:
      cameraRatio > windowRatio ? camera.height * windowRatio : camera.width,
    height:
      cameraRatio > windowRatio ? camera.height : camera.width / windowRatio,
  };

  p.image(
    capture,
    -p.width / 2,
    -p.height / 2,
    p.width,
    p.height,
    source.x,
    source.y,
    source.width,
    source.height
  );

  frame = capture;

  if (!shader) return;

  p.shader(shader);
  shader.setUniform("uTexture", frame);
  shader.setUniform("uGradientTexture", texture);
  shader.setUniform("uDensity", density);
  shader.setUniform("uRatio", ratio);

  const viewportY = Math.min(p.height / (p.width / cameraRatio), 1.0);
  const viewportX = Math.min(p.width / (p.height * cameraRatio), 1.0);

  shader.setUniform("uViewportX", viewportX);
  shader.setUniform("uViewportY", viewportY);

  p.rect(0, 0, 0, 0);
};
</script>

<template>
  <div class="canvas-container" ref="container"></div>
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

video {
  transform: scaleX(-1);
}

.canvas-container {
  z-index: 1;
}
</style>
