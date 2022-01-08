<script lang="ts">
import { computeSelection } from "../utils";

const height = 1020;
const width = 700;
const gridSize = 20;
const gridX = Math.floor(width / gridSize);
const gridY = Math.floor(height / gridSize);
const selectionMode = false;
let isCellModified = false;
let handle: unknown = null;

const examples = [
  {
    id: 0,
    x: 1,
    y: 1,
    height: 1,
    width: 1,
    type: "text",
    text: "Excel方眼紙だよ",
    style: "bold"
  },
  {
    id: 1,
    x: 2,
    y: 2,
    type: "box",
    width: 10,
    height: 2,
    text: "箱だよ"
  }
];

import HoganGrid from "./HoganGrid.vue";
import HoganItemBox from "./HoganItemBox.vue";
import HoganItemText from "./HoganItemText.vue";
import HoganSelection from "./HoganSelection.vue";

export default {
  el: "#app",
  components: {
    HoganGrid,
    HoganItemBox,
    HoganItemText,
    HoganSelection
  },
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
      items: [],
      gridSize: gridSize,
      isCellEditing: false,
      editingValue: "",
      tabOffset: null,
      itemPreview: null
    };
  },
  computed: {
    selectionMode(): boolean {
      return this.mouseDown || this.shiftDown;
    },
    inputPosition() {
      if (!this.isCellEditing) {
        return {
          top: "-100px",
          left: "-100px",
          opacity: 0
        }
      }
      return {
        top: `${this.selectionComputed.top * this.gridSize}px `,
        left: `${this.selectionComputed.left * this.gridSize}px`,
      };
    },
    selectionComputed() {
      return computeSelection(this.selection);
    },
    editingItemIndex() {
      return this.items.indexOf(this.editingItem);
    },
    editingItem() {
      // 編集中アイテム
      // カーソルがあれば自動的に編集中になる
      for (const item of this.items) {
        if (
          item.x <= this.selection.x1 &&
          this.selection.x1 <= item.x + item.width - 1 &&
          item.y <= this.selection.y1 &&
          this.selection.y1 <= item.y + item.height - 1
        ) {
          return item;
        }
      }
      return null;
    }
  },
  methods: {
    onKeyDown(e: KeyboardEvent) {
      switch (e.keyCode) {
        case 37: //left
          break;
        case 38: //up
          break;
        case 39: //right
          break;
        case 40: //down
          break;
        case 46: //delete
          this.removeHere();
          break;
        case 13: //enter
          // this.moveNextLine();
          break;
        case 16: //shift
          break;
        case 91: //ctrl
          break;
        case 113: //F2
          this.editHere();
          break;
        default:
          this.editHere();
          break;
      }
    },
    editHere() {
      this.isCellEditing = true;
      this.$nextTick(() => {
        this.focusInput();
      });
    },
    removeHere() {
      //TODO 範囲削除
      if (this.editingItemIndex >= 0) {
        this.items.splice(this.editingItemIndex, 1);
        this.saveItems()
      }
      this.editingValue = "";
    },
    moveNextLine() {
      if (this.isCellEditing) {
        this.commitEditing();
        this.isCellEditing = false;
      }
      const height = this.selectionComputed.h;
      const width = this.selectionComputed.w;
      const nextline = this.selectionComputed.top + height;

      this.selection.x1 = this.selectionComputed.left;
      this.selection.y1 = nextline;
      this.selection.x2 = this.selectionComputed.left + width - 1;
      this.selection.y2 = nextline + height - 1;

      this.editingValue = this.editingItem ? this.editingItem.text : "";
      this.editHere()
    },
    moveSelection(x, y) {
      if (this.isCellEditing) {
        this.commitEditing();
        this.isCellEditing = false;
      }
      this.selection.x1 = x;
      this.selection.y1 = y;
      this.selection.x2 = x;
      this.selection.y2 = y;

      this.editingValue = this.editingItem ? this.editingItem.text : "";
    },
    adjustSelectionAtEditingItem() {
      this.selection.x1 = this.editingItem.x;
      this.selection.y1 = this.editingItem.y;
      this.selection.x2 = this.editingItem.x + this.editingItem.width - 1;
      this.selection.y2 = this.editingItem.y + this.editingItem.height - 1;
    },
    moveSelectionUp() {
      this.moveSelectionRelative(0, -1)
      if (this.editingItem) {
        this.moveSelectionRelative(0, -this.editingItem.height + 1)
      }
      if (this.editingItem) {
        this.adjustSelectionAtEditingItem()
      }
    },
    moveSelectionDown() {
      // TODO: editingItemがある状態で下に動くと、editingItemのheight分動く
      if (this.editingItem) {
        this.moveSelectionRelative(0, this.editingItem.height)
      } else {
        this.moveSelectionRelative(0, 1)
      }
      if (this.editingItem) {
        this.adjustSelectionAtEditingItem()
      }
    },
    moveSelectionLeft() {
      this.moveSelectionRelative(-1, 0)
      if (this.editingItem) {
        this.moveSelectionRelative(-this.editingItem.width + 1, 0)
      }
      if (this.editingItem) {
        this.adjustSelectionAtEditingItem()
      }
    },
    moveSelectionRight() {
      // TODO: editingItemがある状態で右に動くと、editingItemのwidth分動く
      if (this.editingItem) {
        this.moveSelectionRelative(this.editingItem.width, 0)
      } else {
        this.moveSelectionRelative(1, 0)
      }
      if (this.editingItem) {
        this.adjustSelectionAtEditingItem()
      }
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
      if (this.editingItem) {
        this.adjustSelectionAtEditingItem()
      }
      this.mouseDown = true
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
      this.focusInput()
    },
    onPointerDownTab(ev) {
      ev.target.setPointerCapture(ev.pointerId);
      this.moveTarget = this.editingItem
      this.tabOffset = { x: ev.offsetX, y: ev.offsetY }
      this.itemPreview = { ...this.editingItem }
    },
    onPointerMoveTab(ev) {
      if (this.moveTarget) {
        this.itemPreview.x = this.moveTarget.x + Math.round((ev.offsetX - this.tabOffset.x) / 20 * 2) / 2
        this.itemPreview.y = this.moveTarget.y + Math.round((ev.offsetY - this.tabOffset.y) / 20 * 2) / 2
      }
    },
    onPointerUpTab(ev) {
      this.moveTarget.x = this.itemPreview.x
      this.moveTarget.y = this.itemPreview.y
      this.selection.x1 = this.moveTarget.x
      this.selection.y1 = this.moveTarget.y
      this.selection.x2 = this.moveTarget.x + this.moveTarget.width - 1
      this.selection.y2 = this.moveTarget.y + this.moveTarget.height - 1

      this.moveTarget = null
      this.itemPreview = null
      this.tabOffset = null

      this.saveItems()
    },
    focusInput() {
      this.$refs.hiddenInput.focus();
    },
    commitEditing() {
      if (this.editingValue === "") {
        this.removeHere()
        return
      }

      if (this.editingItem) {
        this.editingItem.text = this.editingValue;
      } else {
        if (this.selectionComputed.w > 1 || this.selectionComputed.h > 1) {
          this.addItem({
            type: "box",
            width: this.selectionComputed.w,
            height: this.selectionComputed.h,
            x: this.selectionComputed.left,
            y: this.selectionComputed.top,
            text: this.editingValue
          })
        } else {
          this.addItem({
            type: "text",
            x: this.selectionComputed.left,
            y: this.selectionComputed.top,
            width: 1,
            height: 1,
            text: this.editingValue
          })
        }
      }
    },
    addItem(item) {
      this.items.push(item)
      this.saveItems()
    },
    showTextField(selection) {
      const input = hiddenInput;
      input.style.opacity = 1;
      input.style.left = selection.sx * gridSize + "px";
      input.style.top = selection.sy * gridSize + "px";
      isCellEditing = true;
    },
    hideTextField() {
      const input = hiddenInput;
      input.style.opacity = 0;
      input.style.left = "-100px";
      input.style.top = "-100px";
      isCellEditing = false;
    },
    saveItems() {
      window.localStorage.setItem("hoganpad__items", JSON.stringify(this.items));
    }
  },
  mounted() {
    const items = window.localStorage.getItem("hoganpad__items", JSON.stringify(this.items));
    if (items !== null) {
      this.items = JSON.parse(items);
    } else {
      this.items = examples
    }

    handle = window.addEventListener("keydown", this.onKeyDown);
    this.focusInput()
  },
  beforeDestroy() {
    window.removeEventListener("keydown", handle);
  }
}
</script>

<template>
  <div id="app" @keydown.shift="shiftDown = true" @keyup.shift="shiftDown = false">
    <svg
      ref="canvas"
      class="a4"
      width="700"
      height="1020"
      viewBox="0 0 700 1020"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @dblclick="editHere"
    >
      <defs>
        <filter id="dropshadow" x="0" y="0" width="200%" height="200%">
          <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3" />
          <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
          <feComponentTransfer in="blurOut" result="alphaOut">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="alphaOut" mode="normal" />
        </filter>
      </defs>
      <hogan-grid :width="width" :height="height" />
      <g v-for="item in items" :key="item.id">
        <hogan-item-text :item="item" :grid-size="gridSize" />
        <hogan-item-box :item="item" :grid-size="gridSize" />
      </g>
      <rect
        v-if="editingItem"
        :x="selection.x1 * 20 - 10"
        :y="selection.y1 * 20"
        :height="25"
        :width="10"
        class="selection__tab"
        @pointerdown.stop="onPointerDownTab"
        @pointermove.stop="onPointerMoveTab"
        @pointerup.stop="onPointerUpTab"
      />
      <hogan-selection ref="selection" :selection="selection" />
      <hogan-item-box v-if="itemPreview" class="preview" :item="itemPreview" :grid-size="gridSize" />
    </svg>
    <form @submit.prevent="moveNextLine">
      <input
        v-model="editingValue"
        class="hogan__hiddeninput"
        ref="hiddenInput"
        type="text"
        style="position: absolute; z-index: 100; top: -100px; left: -100px;"
        :style="inputPosition"
        @keydown.down.prevent="moveSelectionDown"
        @keydown.up.prevent="moveSelectionUp"
        @keydown.left.prevent="moveSelectionLeft"
        @keydown.right.prevent="moveSelectionRight"
      />
    </form>
  </div>
</template>

<style>
body {
  background: #eee;
  display: flex;
  justify-content: center;
}
.a4 {
  position: relative;
  margin: 0 auto;
  /* A4サイズに収まる最大のサイズ */
  /* 96dpiで計算 */
  /* 190mm * 270mm = 718px x 1020px */
  /* 方眼紙に合わせるため、20pxの倍数（700px）とする */
  width: 700px;
  height: 1020px;
  box-sizing: border-box;
  background: white;
}
line {
  stroke: #ddd;
}
rect.box {
  stroke: black;
  fill: white;
}
rect.selection {
  stroke: green;
  fill: rgba(255, 255, 255, 0.5);
  stroke-width: 2;
}
@media print {
  body {
    margin: 0px;
    background: white;
  }
  line {
    stroke: none;
  }
  rect.selection {
    stroke: none;
    fill: none;
  }
}
text {
  user-select: none;
}
#app {
  position: relative;
}
input {
  font-size: 14px;
  font-family: inherit;
  padding: 0 0 0 5px;
  margin: 0;
  border: none;
  outline: none;
}
svg {
  outline: none;
}
.selection__tab {
  fill: green;
  stroke: none;
  cursor: grab;
}
.selection__tab:active {
  cursor: grabbing;
}
.preview {
  opacity: 0.5;
}
</style>
