<template>
  <g>
    <line v-for="(line, index) in vlines" :key="index" :x1="line" :y1="0" :x2="line" :y2="height"></line>
    <line v-for="(line, index) in hlines" :key="index" :x1="0" :y1="line" :x2="width" :y2="line"></line>
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { range } from "../utils"

export default defineComponent({
  props: ["width", "height"],
  computed: {
    vlines() {
      return range(this.width / 20).map(i => i * 20 + 0.5);
    },
    hlines() {
      return range(this.height / 20).map(i => i * 20 + 0.5);
    }
  }
})
</script>
