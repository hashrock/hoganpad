<template>
  <text
    v-if="item.type === 'text'"
    :x="item.x * gridSize + gridSize / 4"
    :y="item.y * gridSize"
    dominant-baseline="text-before-edge"
    :font-size="fontSize"
  >{{ text }}</text>
</template>

<script lang="ts">
export default {
  props: ["item", "gridSize"],
  computed: {
    fontSize() {
      if (this.heading) {
        return [56, 42, 28][this.heading.level - 1];
      }
      return 14;
    },
    heading() {
      const m = this.item.text.match(/^([#]+) (.*)/);
      return m
        ? {
          level: m[1].length,
          text: m[2]
        }
        : null;
    },
    text() {
      if (this.heading) {
        return this.heading.text;
      }
      return this.item.text;
    }
  }
}
</script>

<style>
</style>