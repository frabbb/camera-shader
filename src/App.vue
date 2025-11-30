<script setup>
import Canvas from "./components/Canvas.vue";
import { ref, computed, watch, onMounted } from "vue";
import {
  onKeyStroke,
  useWindowSize,
  useElementSize,
  onClickOutside,
} from "@vueuse/core";

const { width, height } = useWindowSize();

const framesContainer = ref(null);
const canvasEl = ref(null);

const { width: framesContainerWidth, height: framesContainerHeight } =
  useElementSize(framesContainer);

const framesN = ref(0);
const selectedFrame = ref(undefined);

const size = computed(() => {
  const maxW = framesContainerWidth.value / framesN.value;
  return Math.min(maxW, framesContainerHeight.value);
});

const samplingMode = ref(true);

onKeyStroke("Tab", (e) => {
  e.preventDefault();
  samplingMode.value = !samplingMode.value;
});

const sample = () => {
  canvasEl.value.sample();
  selectedFrame.value = undefined;
};

const handleFrameClick = (i) => {
  if (selectedFrame.value === i) {
    canvasEl.value.removeFrame(i);
    selectedFrame.value = undefined;
  } else {
    selectedFrame.value = i;
  }
};
</script>

<template>
  <div
    class="ui"
    @click="selectedFrame = undefined"
    :class="{ horizontal: width > height, 'sampling-mode': samplingMode }"
  >
    <div class="switcher" @click.stop>
      <button @click.stop="samplingMode = true">Sample</button>
      <button @click.stop="samplingMode = false">Capture</button>
      <div class="bg"></div>
    </div>

    <div
      class="frames-container"
      :style="{ '--size': `${size}px` }"
      ref="framesContainer"
      @click="selectedFrame = undefined"
    >
      <div class="frames" ref="framesEl">
        <div
          v-for="i in framesN"
          :key="i"
          class="frame"
          @click.stop="handleFrameClick(i)"
          :class="{ selected: i === selectedFrame }"
        >
          <div class="cross" v-show="i === selectedFrame">
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="square"></div>

    <div class="camera-button-container">
      <button
        class="camera-button"
        v-show="samplingMode"
        @click.stop="sample"
      />
    </div>
  </div>

  <Canvas
    :samplingMode
    v-model:framesN="framesN"
    v-model:selectedFrame="selectedFrame"
    :uiFrameSize="size"
    ref="canvasEl"
  />
</template>

<style scoped lang="postcss">
.ui {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: var(--l);
  width: 100%;
  height: 100%;
  padding: var(--l);
  z-index: 2;
  height: 100svh;
  justify-content: space-between;

  .frames-container {
    flex: 1;
    display: flex;
    justify-content: center;
    overflow: hidden;
    opacity: 0;
    transition: opacity 150ms ease-in-out;
  }

  .frames {
    display: flex;
    justify-content: center;
    overflow: hidden;
    width: fit-content;

    .frame {
      width: var(--size);
      height: var(--size);
      border: 1px solid var(--white);
      position: relative;

      &:not(:last-child) {
        border-right: none;
      }

      &.selected {
        background: rgba(255, 255, 255, 0.2);
      }

      .cross {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        gap: var(--s);

        div {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 50%;
          height: 1px;
          background: var(--white);
        }

        div:first-child {
          transform: translate(-50%, -50%) rotate(45deg);
        }

        div:last-child {
          transform: translate(-50%, -50%) rotate(-45deg);
        }
      }
    }
  }

  .square {
    width: 100%;
    aspect-ratio: 1/1;
    border: 1px solid var(--white);
    border-radius: var(--l);
    opacity: 0;
    transition: opacity 150ms ease-in-out;
  }

  .switcher {
    position: relative;
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
      color: var(--black);

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
  }

  .camera-button-container {
    height: calc(50svh - var(--l) - 50vw);
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }

  .camera-button {
    width: var(--2xl);
    height: var(--2xl);
    background-color: var(--white);
    border-radius: 50%;
    outline: 2px solid var(--white);
    outline-offset: 1px;
    cursor: pointer;

    @media (hover: hover) {
      &:hover {
        opacity: 0.8;
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &.horizontal {
    height: 100%;

    .square {
      position: absolute;
      top: 0;
      height: 100%;
      width: auto;
      left: 50%;
      transform: translateX(-50%);
    }
  }

  &.sampling-mode {
    .bg {
      transform: translateX(0);
    }

    .frames-container {
      opacity: 1;
    }

    .square {
      opacity: 1;
    }
  }
}
</style>
