<script setup>
import Canvas from "./components/Canvas.vue";
import { ref, computed, watch } from "vue";
import {
  onKeyStroke,
  useWindowSize,
  useElementSize,
  useMouseInElement,
  useEventListener,
} from "@vueuse/core";

const { width, height } = useWindowSize();

const framesContainer = ref(null);
const canvasEl = ref(null);

const { width: framesContainerWidth, height: framesContainerHeight } =
  useElementSize(framesContainer);

const framesN = ref(0);
const selectedFrame = ref(undefined);

const size = computed(() => {
  const maxH = width.value > height.value ? 80 : framesContainerHeight.value;

  const maxW = framesContainerWidth.value / framesN.value;
  return Math.min(maxW, maxH);
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

const densitySliderContainer = ref(null);
const density = ref(50);
const maxDensity = 300;
const scrubbing = ref(false);
const pendingDensity = ref(50);

const { elementX, elementWidth } = useMouseInElement(densitySliderContainer);

useEventListener("mouseup", () => (scrubbing.value = false), { passive: true });

useEventListener("touchend", () => (scrubbing.value = false), {
  passive: true,
});

watch([scrubbing, elementX], () => {
  const progress = Math.max(
    0,
    Math.min(1, elementX.value / elementWidth.value)
  );

  pendingDensity.value = progress * maxDensity;

  if (scrubbing.value) {
    density.value = pendingDensity.value;
  }
});
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
        @click.stop="sample"
        v-show="samplingMode"
      />
    </div>

    <div class="density">
      <p>Density: {{ Math.round(density) }}</p>
      <div ref="densitySliderContainer" class="density-slider-container">
        <div
          @mousedown="scrubbing = true"
          @touchstart.passive="scrubbing = true"
          class="density-slider"
          :class="{ scrubbing }"
        >
          <div :style="{ width: `${(density / maxDensity) * 100}%` }"></div>
        </div>
      </div>
    </div>
  </div>

  <Canvas
    :samplingMode
    v-model:framesN="framesN"
    v-model:selectedFrame="selectedFrame"
    :uiFrameSize="size"
    :density="density"
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
    position: relative;
    z-index: 1;
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
      cursor: pointer;

      &:not(:last-child) {
        border-right: none;
      }

      &.selected {
        background: rgba(255, 255, 255, 0.2);
      }

      @media (hover: hover) {
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
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
          height: 2px;
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
    position: relative;
    z-index: 1;

    @media (hover: hover) {
      &:hover {
        opacity: 0.8;
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .density {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--m);
    width: calc(100% - var(--l) * 2);
    position: absolute;
    bottom: var(--2xl);
    left: 50%;
    transform: translateX(-50%);

    p {
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      border-radius: var(--m);
      padding: var(--m);
    }
  }

  .density-slider-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s);

    height: var(--l);

    @media (hover: hover) {
      &:hover {
        .density-slider {
          height: var(--l);
        }
      }
    }
  }

  .density-slider {
    width: 100%;
    height: var(--m);
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border-radius: var(--m);
    position: relative;
    cursor: pointer;
    height: var(--m);
    transition: height 150ms ease-in-out;

    div {
      height: 100%;
      background: var(--white);
      border-radius: var(--m);
    }

    &.scrubbing {
      height: var(--l);
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

    .frames-container {
      width: 100vh;
      position: absolute;
      top: 72px;
      left: 50%;
      transform: translateX(-50%);
    }

    .density {
      bottom: var(--l);
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

    .density {
      opacity: 0;
    }
  }
}
</style>
