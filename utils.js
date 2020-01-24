Vue.component("hogan-grid", {
  props: ["width", "height"],
  template: `
      <g>
        <line
        v-for="(line, index) in vlines"
        :x1="line"
        :y1="0"
        :x2="line"
        :y2="height"
      ></line>
      <line
        v-for="(line, index) in hlines"
        :x1="0"
        :y1="line"
        :x2="width"
        :y2="line"
      ></line>
      </g>
    `,
  computed: {
    vlines() {
      return range(this.width / 20).map(i => i * 20 + 0.5);
    },
    hlines() {
      return range(this.height / 20).map(i => i * 20 + 0.5);
    }
  }
});

Vue.component("hogan-selection", {
  props: ["selection"],
  template: `
  <rect
    :x="selectionScreen.x"
    :y="selectionScreen.y"
    :height="selectionScreen.h"
    :width="selectionScreen.w"
    class="selection"
  ></rect>
    `,
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
        x: this.selectionWidth.x * gridSize + 0.5,
        y: this.selectionWidth.y * gridSize + 0.5,
        w: this.selectionWidth.w * gridSize,
        h: this.selectionWidth.h * gridSize
      };
    }
  }
});

function computeSelection(selection) {
  return {
    left: selection.x1 <= selection.x2 ? selection.x1 : selection.x2,
    top: selection.y1 <= selection.y2 ? selection.y1 : selection.y2,
    right: selection.x1 > selection.x2 ? selection.x1 : selection.x2,
    bottom: selection.y1 > selection.y2 ? selection.y1 : selection.y2,
    w: Math.abs(selection.x1 - selection.x2) + 1,
    h: Math.abs(selection.y1 - selection.y2) + 1
  };
}
