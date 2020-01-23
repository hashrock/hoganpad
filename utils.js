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