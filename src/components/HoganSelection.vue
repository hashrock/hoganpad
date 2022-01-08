<template>
  <rect
    :x="selectionScreen.x"
    :y="selectionScreen.y"
    :height="selectionScreen.h"
    :width="selectionScreen.w"
    class="selection"
  ></rect>
</template>

<script lang="ts">
const gridSize = 20;

export default {
  props: ["selection"],
  computed: {
    selectionWidth() {
      return {
        x:
          this.selection.x1 <= this.selection.x2
            ? this.selection.x1
            : this.selection.x2,
        y:
          this.selection.y1 <= this.selection.y2
            ? this.selection.y1
            : this.selection.y2,
        w: Math.abs(this.selection.x1 - this.selection.x2) + 1,
        h: Math.abs(this.selection.y1 - this.selection.y2) + 1
      };
    },
    selectionScreen() {
      return {
        x: this.selectionWidth.x * gridSize,
        y: this.selectionWidth.y * gridSize,
        w: this.selectionWidth.w * gridSize,
        h: this.selectionWidth.h * gridSize
      };
    }
  }
}
</script>

<style>
</style>