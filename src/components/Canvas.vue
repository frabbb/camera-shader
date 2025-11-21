<script setup>
import { ref, watch, defineProps, onMounted } from "vue";
import p5 from "p5";
const container = ref(null);

const sk = new p5((p) => p);
let canvas;
let angle = 0;

window.addEventListener("resize", resize);

sk.setup = async () => {
  canvas = sk.createCanvas(sk.windowWidth, sk.windowHeight);
  container.value.appendChild(canvas.elt);
  sk.angleMode(sk.DEGREES);
  sk.rectMode(sk.CENTER);
  sk.fill(0);
};

sk.draw = () => {
  sk.background(200);
  angle += 1;
  sk.translate(sk.width / 2, sk.height / 2);
  sk.rotate(angle);
  sk.rect(0, 0, 100, 100);
};

function resize() {
  sk.resizeCanvas(sk.windowWidth, sk.windowHeight);
}
</script>

<template>
  <div class="canvas-container" ref="container"></div>
</template>

<style scoped></style>
