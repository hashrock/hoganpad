const height = 1020;
const width = 700;
const gridSize = 20;
const gridX = Math.floor(width / gridSize);
const gridY = Math.floor(height / gridSize);
const selectionMode = false;
let isCellModified = false;
let isCellEditing = false;

function range(max) {
  return [...new Array(max).keys()];
}
const texts = [
  {
    x: 1,
    y: 1,
    type: "text",
    text: "Excel方眼紙だよ",
    style: "bold"
  },
  {
    x: 2,
    y: 2,
    type: "box",
    width: 10,
    height: 2,
    text: "箱だよ"
  }
];


new Vue({
  el: "#app",
  data() {
    return {
      width: width,
      height: height,
      selection: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 1
      },
      mouseDown: false,
      shiftDown: false,
      items: texts,
      gridSize: gridSize
    };
  },
  computed: {
    selectionMode() {
      return this.mouseDown || this.shiftDown;
    }
  },
  methods: {
    moveSelection(x, y) {
      this.selection.x1 = x;
      this.selection.y1 = y;
      this.selection.x2 = x;
      this.selection.y2 = y;
    },
    moveSelectionRelative(x, y, event) {
      if (this.shiftDown) {
        this.moveSelectionEnd(this.selection.x1 + x, this.selection.y1 + y);
      } else {
        this.moveSelection(this.selection.x1 + x, this.selection.y1 + y);
      }
    },
    moveSelectionEnd(x, y) {
      this.selection.x1 = x;
      this.selection.y1 = y;
    },
    onPointerDown(e) {
      e.target.setPointerCapture(e.pointerId);
      this.moveSelection(
        Math.floor(e.offsetX / gridSize),
        Math.floor(e.offsetY / gridSize)
      );
      this.mouseDown = true;
    },
    onPointerMove(e) {
      if (this.selectionMode) {
        this.moveSelectionEnd(
          Math.floor(e.offsetX / gridSize),
          Math.floor(e.offsetY / gridSize)
        );
      }
    },
    onPointerUp() {
      this.mouseDown = false;
    }
  },
  mounted() {}
});
