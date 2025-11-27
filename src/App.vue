<script setup>
import { ref, watch, defineProps, onMounted } from "vue";
import { onKeyStroke } from "@vueuse/core";

import Canvas from "./components/Canvas.vue";

const samplingMode = ref(true);

onKeyStroke("Tab", (e) => {
  e.preventDefault();
  samplingMode.value = !samplingMode.value;
});
</script>

<template>
  <div class="switcher" :class="{ 'sampling-mode': samplingMode }">
    <button @click="samplingMode = true">Sample</button>
    <button @click="samplingMode = false">Capture</button>
    <div class="bg"></div>
  </div>
  <Canvas :samplingMode />
</template>

<style scoped lang="postcss">
.switcher {
  position: fixed;
  top: var(--l);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  display: flex;
  height: var(--2xl);
  padding: var(--s);
  z-index: 2;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: var(--m);
  position: relative;

  button {
    width: 100%;
    padding: var(--s) var(--m);
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    height: 100%;
    display: grod;
    place-items: center;
    cursor: pointer;
    border-radius: var(--m);
    transition: background 150ms ease-in-out;

    @media (hover: hover) {
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .bg {
    position: absolute;
    z-index: -1;
    left: var(--s);
    width: calc(50% - var(--s));
    height: calc(100% - var(--s) * 2);
    background: var(--white);
    border-radius: var(--m);
    transform: translateX(100%);
    transition: transform 150ms ease-in-out;
  }

  &.sampling-mode {
    .bg {
      transform: translateX(0);
    }
  }
}
</style>
