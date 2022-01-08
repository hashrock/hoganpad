<template>
  <g v-if="item.type === 'box'">
    <rect
      :x="(item.x) * gridSize + 0.5"
      :y="(item.y) * gridSize + 0.5"
      :width="item.width * gridSize"
      :height="item.height * gridSize"
      class="box"
      :filter="filter"
    ></rect>
    <text
      dominant-baseline="central"
      :text-anchor="textAnchor"
      :x="x"
      :y="(item.y + item.height / 2) * gridSize"
    >{{ text }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["item", "gridSize"],
  computed: {
    filter() {
      if (this.item.x !== (this.item.x | 0) || this.item.y !== (this.item.y | 0)) {
        return "url(#dropshadow)"
      }
    },
    anchorLeft() {
      return this.item.text.charAt(0) === ":";
    },
    anchorRight() {
      return this.item.text.charAt(this.item.text.length - 1) === ":";
    },
    textAnchor() {
      if (this.anchorLeft) {
        return "start";
      }
      if (this.anchorRight) {
        return "end";
      }
      return "middle";
    },
    text() {
      if (this.anchorLeft) {
        return this.item.text.slice(1);
      }
      if (this.anchorRight) {
        return this.item.text.slice(0, -1);
      }
      return this.item.text;
    },
    x() {
      if (this.anchorLeft) {
        return this.item.x * this.gridSize + this.gridSize / 4;
      }
      if (this.anchorRight) {
        return (
          (this.item.x + this.item.width) * this.gridSize - this.gridSize / 4
        );
      }

      return (this.item.x + this.item.width / 2) * this.gridSize;
    }
  }
})
</script>

<style>
</style>