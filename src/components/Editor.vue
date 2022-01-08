<script lang="ts">

const height = 1020;
const width = 700;
const gridSize = 20;
const gridX = Math.floor(width / gridSize);
const gridY = Math.floor(height / gridSize);
const selectionMode = false;
let isCellModified = false;
let hiddenInput: null | HTMLInputElement = null;

interface Item {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: "text" | "box";
  style? : string;
}


const examples: Item[] = [
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
import { defineComponent } from "vue";
import { Selection, ComputedSelection, computeSelection } from "../utils"

interface Point {
  x: number
  y: number
}

export default defineComponent({
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
      } as Selection,
      mouseDown: false,
      shiftDown: false,
      items: [] as Item[],
      gridSize: gridSize,
      isCellEditing: false,
      editingValue: "",
      tabOffset: null as Point | null,
      itemPreview: null as Item | null,
      moveTarget: null as Item | null,
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
      const selectionComputed = this.selectionComputed as ComputedSelection;
      const gridSize = this.gridSize as number;

      return {
        top: `${selectionComputed.top * gridSize}px `,
        left: `${selectionComputed.left * gridSize}px`,
      };
    },
    selectionComputed(): ComputedSelection {
      return computeSelection(this.selection);
    },
    editingItem(): Item | null {
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
    },
    editingItemIndex() {
      const items: Item[] = this.items;
      const editingItem = this.editingItem as Item;
      return items.indexOf(editingItem);
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
          this.shiftDown = true;
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
    onKeyUp(e: KeyboardEvent) {
      switch (e.keyCode) {
        case 16: //shift
          this.shiftDown = false;
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
    moveSelection(x: number, y: number) {
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
      if(this.editingItem == null){
        return;
      }
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
    moveSelectionRelative(x: number, y: number) {
      if (this.shiftDown) {
        this.moveSelectionEnd(this.selection.x1 + x, this.selection.y1 + y);
      } else {
        this.moveSelection(this.selection.x1 + x, this.selection.y1 + y);
      }
    },
    moveSelectionEnd(x: number, y: number) {
      this.selection.x1 = x;
      this.selection.y1 = y;
    },
    onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);
      this.moveSelection(
        Math.floor(e.offsetX / gridSize),
        Math.floor(e.offsetY / gridSize)
      );
      if (this.editingItem) {
        this.adjustSelectionAtEditingItem()
      }
      this.mouseDown = true
    },
    onPointerMove(e: PointerEvent) {
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
    onPointerDownTab(ev: PointerEvent) {
      const target = ev.target as HTMLElement;
      target.setPointerCapture(ev.pointerId);
      this.moveTarget = this.editingItem
      this.tabOffset = { x: ev.offsetX, y: ev.offsetY }
      if(this.editingItem){
        this.itemPreview = { ...this.editingItem }
      }
    },
    onPointerMoveTab(ev: PointerEvent) {
      if (this.moveTarget && this.itemPreview && this.tabOffset) {
        this.itemPreview.x = this.moveTarget.x + Math.round((ev.offsetX - this.tabOffset.x) / 20 * 2) / 2
        this.itemPreview.y = this.moveTarget.y + Math.round((ev.offsetY - this.tabOffset.y) / 20 * 2) / 2
      }
    },
    onPointerUpTab(ev: PointerEvent) {
      if(this.moveTarget && this.itemPreview && this.tabOffset){
        this.moveTarget.x = this.itemPreview.x
        this.moveTarget.y = this.itemPreview.y
        this.selection.x1 = this.moveTarget.x
        this.selection.y1 = this.moveTarget.y
        this.selection.x2 = this.moveTarget.x + this.moveTarget.width - 1
        this.selection.y2 = this.moveTarget.y + this.moveTarget.height - 1
      }

      this.moveTarget = null
      this.itemPreview = null
      this.tabOffset = null

      this.saveItems()
    },
    focusInput() {
      const hiddenInput = this.$refs.hiddenInput as HTMLInputElement;
      hiddenInput.focus();
    },
    commitEditing() {
      if (this.editingValue === "") {
        this.removeHere()
        return
      }

      if (this.editingItem) {
        this.editingItem.text = this.editingValue;
      } else {
        // get max items id
        let maxId = 0;
        for (const item of this.items) {
          if (item.id > maxId) {
            maxId = item.id;
          }
        }

        if (this.selectionComputed.w > 1 || this.selectionComputed.h > 1) {
          this.addItem({
            id: maxId + 1,
            type: "box",
            width: this.selectionComputed.w,
            height: this.selectionComputed.h,
            x: this.selectionComputed.left,
            y: this.selectionComputed.top,
            text: this.editingValue
          })
        } else {
          this.addItem({
            id: maxId + 1,
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
    addItem(item: Item) {
      this.items.push(item)
      this.saveItems()
    },
    showTextField(selection: Selection) {
      const input = hiddenInput;
      if(input){
        input.style.opacity = "1";
        input.style.left = selection.sx * gridSize + "px";
        input.style.top = selection.sy * gridSize + "px";
      }
      this.isCellEditing = true;
    },
    hideTextField() {
      const input = hiddenInput;
      if(input){
        input.style.opacity = "0";
        input.style.left = "-100px";
        input.style.top = "-100px";
      }
      this.isCellEditing = false;
    },
    saveItems() {
      window.localStorage.setItem("hoganpad__items", JSON.stringify(this.items));
    }
  },
  mounted() {
    const items = window.localStorage.getItem("hoganpad__items");
    if (items !== null) {
      this.items = JSON.parse(items);
    } else {
      this.items = examples
    }

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.focusInput()

    hiddenInput = this.$refs.hiddenInput as HTMLInputElement;
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
})
</script>

<template>
  <div id="app">
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
