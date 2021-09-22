const height = 1020;
const width = 700;
const gridSize = 20;
const gridX = Math.floor(width / gridSize);
const gridY = Math.floor(height / gridSize);
const selectionMode = false;
let isCellModified = false;

function range(max) {
  return [...new Array(max).keys()];
}
const texts = [
  {
    x: 1,
    y: 1,
    height: 1,
    width: 1,
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
      gridSize: gridSize,
      isCellEditing: false,
      editingValue: "",
      tabOffset: null,
      itemPreview: null
    };
  },
  computed: {
    selectionMode() {
      return this.mouseDown || this.shiftDown;
    },
    inputPosition() {
      return {
        top: `${this.selectionComputed.top * this.gridSize}px `,
        left: `${this.selectionComputed.left * this.gridSize}px`
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
    onKeyDown(e) {
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
          this.moveNextLine();
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
      }
      this.editingValue = "";
    },
    moveNextLine() {
      if (this.isCellEditing) {
        this.commitEditing();
        this.isCellEditing = false;
        this.focusCanvas();
      }
      const height = this.selectionComputed.h;
      const width = this.selectionComputed.w;
      const nextline = this.selectionComputed.top + height;

      this.selection.x1 = this.selectionComputed.left;
      this.selection.y1 = nextline;
      this.selection.x2 = this.selectionComputed.left + width - 1;
      this.selection.y2 = nextline + height - 1;

      this.editingValue = this.editingItem ? this.editingItem.text : "";
    },
    moveSelection(x, y) {
      if (this.isCellEditing) {
        this.commitEditing();
        this.isCellEditing = false;
        this.focusCanvas();
      }
      this.selection.x1 = x;
      this.selection.y1 = y;
      this.selection.x2 = x;
      this.selection.y2 = y;

      this.editingValue = this.editingItem ? this.editingItem.text : "";
    },
    adjustSelectionAtEditingItem(){
      this.selection.x1 = this.editingItem.x;
      this.selection.y1 = this.editingItem.y;
      this.selection.x2 = this.editingItem.x + this.editingItem.width - 1;
      this.selection.y2 = this.editingItem.y + this.editingItem.height - 1;
    },
    moveSelectionUp(){
      this.moveSelectionRelative(0, -1)
      if(this.editingItem){
        this.moveSelectionRelative(0, -this.editingItem.height + 1)
      }
      if(this.editingItem){
        this.adjustSelectionAtEditingItem()
      }
    },
    moveSelectionDown(){
      // TODO: editingItemがある状態で下に動くと、editingItemのheight分動く
      if(this.editingItem){
        this.moveSelectionRelative(0, this.editingItem.height)
      }else{
        this.moveSelectionRelative(0, 1)
      }
      if(this.editingItem){
        this.adjustSelectionAtEditingItem()
      }
    },
    moveSelectionLeft(){
      this.moveSelectionRelative(-1, 0)
      if(this.editingItem){
        this.moveSelectionRelative(-this.editingItem.width + 1, 0)
      }
      if(this.editingItem){
        this.adjustSelectionAtEditingItem()
      }
    },
    moveSelectionRight(){
      // TODO: editingItemがある状態で右に動くと、editingItemのwidth分動く
      if(this.editingItem){
        this.moveSelectionRelative(this.editingItem.width, 0)
      }else{
        this.moveSelectionRelative(1, 0)
      }
      if(this.editingItem){
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
      if(this.editingItem){
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
    },
    onPointerDownTab(ev){
      ev.target.setPointerCapture(ev.pointerId);
      this.moveTarget = this.editingItem
      this.tabOffset = {x: ev.offsetX, y: ev.offsetY}
      this.itemPreview = {...this.editingItem}
    },
    onPointerMoveTab(ev){
      if(this.moveTarget){
        this.itemPreview.x = this.moveTarget.x + Math.round((ev.offsetX - this.tabOffset.x) / 20 * 2) / 2
        this.itemPreview.y = this.moveTarget.y +Math.round((ev.offsetY - this.tabOffset.y) / 20 * 2) / 2
      }
    },
    onPointerUpTab(ev){
      this.moveTarget.x = this.itemPreview.x
      this.moveTarget.y = this.itemPreview.y
      this.moveTarget = null
      this.itemPreview = null
      this.tabOffset = null
    },
    focusInput() {
      this.$refs.hiddenInput.focus();
    },
    focusCanvas() {
      this.$refs.canvas.focus();
    },
    commitEditing() {
      if (this.editingItem) {
        this.editingItem.text = this.editingValue;
      } else {
        if (this.selectionComputed.w > 1 || this.selectionComputed.h > 1) {
          this.items.push({
            type: "box",
            width: this.selectionComputed.w,
            height: this.selectionComputed.h,
            x: this.selectionComputed.left,
            y: this.selectionComputed.top,
            text: this.editingValue
          });
        } else {
          this.items.push({
            type: "text",
            x: this.selectionComputed.left,
            y: this.selectionComputed.top,
            width: 1,
            height: 1,
            text: this.editingValue
          });
        }
      }
    }
  },
  mounted() { }
});
