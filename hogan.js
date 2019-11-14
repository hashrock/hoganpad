const canv = document.querySelector("canvas");
const ctx = canv.getContext("2d");
const gridColor = "#cccccc";
const selectedColor = "#006600";
const selectedBackColor = "rgba(0,0,0,0.1)";
const white = "#ffffff";
const fontColor = "#000000";
const gridSize = 20;

const h = canv.clientHeight;
const w = canv.clientWidth;
const gridX = Math.floor(w / gridSize);
const gridY = Math.floor(h / gridSize);

const selectionMode = false;
let isCellModified = false;

//x0, y0, x1, y1
class Selection {
  constructor() {
    this.sx = 0;
    this.sy = 0;
    this.startx = -1;
    this.starty = -1;
    this.selectionMode = false;
  }

  set(x, y) {
    this.sx = x;
    this.sy = y;
  }

  selectionStart() {
    this.startx = this.sx;
    this.starty = this.sy;
    this.selectionMode = true;
  }

  selectionEnd() {
    this.selectionMode = false;
  }

  getInfo() {
    const x0 = this.startx;
    const y0 = this.starty;
    const x1 = this.sx;
    const y1 = this.sy;
    const x = x0 < x1 ? x0 : x1;
    const y = y0 < y1 ? y0 : y1;
    const w = Math.abs(x0 - x1) + 1;
    const h = Math.abs(y0 - y1) + 1;
    return {
      x: x,
      y: y,
      w: w,
      h: h,
      multiple: h > 1 || y > 1
    };
  }

  move(rx, ry) {
    this.sx += rx;
    this.sy += ry;
    if (!this.selectionMode) {
      this.startx = this.sx;
      this.starty = this.sy;
    }

    this.sx = this.sx > 0 ? this.sx : 0;
    this.sx = this.sx < gridX - 1 ? this.sx : gridX - 1;
    this.sy = this.sy > 0 ? this.sy : 0;
    this.sy = this.sy < gridY - 1 ? this.sy : gridY - 1;
  }
}

const selection = new Selection();

const alignPixel = 0.5;

function drawCursorRange(x, y, w, h) {
  ctx.strokeStyle = selectedColor;
  ctx.lineWidth = 2;
  const handleSize = 5;
  const handleOffset = 2;
  ctx.strokeRect(x * gridSize, y * gridSize, w * gridSize, h * gridSize);

  if (w > 1 || h > 1) {
    const backgroundMargin = 1;
    ctx.fillStyle = selectedBackColor;
    ctx.fillRect(
      x * gridSize + backgroundMargin,
      y * gridSize + backgroundMargin,
      w * gridSize - backgroundMargin * 2,
      h * gridSize - backgroundMargin * 2
    );
  }

  const rectStartX = (x + w) * gridSize - handleSize + handleOffset;
  const rectStartY = (y + h) * gridSize - handleSize + handleOffset;

  ctx.fillStyle = white;
  ctx.fillRect(rectStartX - 1, rectStartY - 1, handleSize + 2, handleSize + 2);
  ctx.fillStyle = selectedColor;
  ctx.fillRect(rectStartX, rectStartY, handleSize, handleSize);
}

function drawCursor(ctx, selection) {
  const info = selection.getInfo();
  drawCursorRange(info.x, info.y, info.w, info.h);
}

function drawCell(ctx, x, y) {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(
    x * gridSize + alignPixel,
    y * gridSize + alignPixel,
    gridSize,
    gridSize
  );
}

function draw(ctx) {
  for (let i = 0; i < gridY; i++) {
    for (let j = 0; j < gridX; j++) {
      drawCell(ctx, j, i);
    }
  }
}

function updateTextField() {
  hiddenInput.focus();
  hiddenInput.value = "";
}

function getTextField() {
  return hiddenInput.value;
}

function showTextField(selection) {
  const input = hiddenInput;
  input.style.opacity = 1;
  input.style.left = selection.sx * gridSize + "px";
  input.style.top = selection.sy * gridSize + "px";
}
function hideTextField() {
  const input = hiddenInput;
  input.style.opacity = 0;
  input.style.left = "-100px";
  input.style.top = "-100px";
}

canv.onmousedown = e => {
  overwriteCell(getTextField(), selection);
  hideTextField();
  updateTextField();

  selection.set(
    Math.floor(e.offsetX / gridSize),
    Math.floor(e.offsetY / gridSize)
  );
  selection.selectionStart();
  clear(ctx, w, h);
  draw(ctx);
  drawTexts(ctx, texts);
  drawCursor(ctx, selection);
};

canv.onmousemove = e => {
  if (selection.selectionMode) {
    selection.set(
      Math.floor(e.offsetX / gridSize),
      Math.floor(e.offsetY / gridSize)
    );
    clear(ctx, w, h);
    draw(ctx);
    drawTexts(ctx, texts);
    drawCursor(ctx, selection);
  }
};

canv.onmouseup = e => {
  selection.selectionEnd();
  updateTextField();
};

document.oncopy = e => {
  console.log(e);
  e.preventDefault();
};
document.onpaste = e => {
  console.log(e);
  e.preventDefault();
};

canv.ondblclick = () => {
  const input = hiddenInput;
  input.value = getCellValue(selection);
  showTextField(selection);
  input.focus();
};

function clearCell(sx, sy) {
  let matched = -1;
  texts.forEach((item, idx) => {
    if (item.x === sx && item.y === sy) {
      matched = idx;
    }
  });
  if (matched >= 0) {
    texts.splice(matched, 1);
  }
}

function getCellValue(selection) {
  for (const item of texts) {
    if (item.x === selection.sx && item.y === selection.sy) {
      return item.text;
    }
  }

  return "";
}

function overwriteCell(text, selection) {
  if (isCellModified) {
    clearCell(selection.x, selection.y);
    if (selection.w > 1 || selection.h > 1) {
      texts.push({
        type: "box",
        width: selection.w,
        height: selection.h,
        x: selection.x,
        y: selection.y,
        text: text
      });
    } else {
      texts.push({
        type: "text",
        x: selection.x,
        y: selection.y,
        text: text
      });
    }
    isCellModified = false;
  }
}

function moveCursor(rx, ry) {
  overwriteCell(getTextField(), selection.getInfo());
  selection.move(rx, ry);
  hideTextField();
  updateTextField();
}

window.onkeydown = e => {
  switch (e.keyCode) {
    case 37: //left
      moveCursor(-1, 0);
      break;
    case 38: //up
      moveCursor(0, -1);
      break;
    case 39: //right
      moveCursor(1, 0);
      break;
    case 40: //down
      moveCursor(0, 1);
      break;
    case 46: //delete
      const info = selection.getInfo();
      for (let j = 0; j < info.h; j++) {
        for (let i = 0; i < info.w; i++) {
          clearCell(info.x + i, info.y + j);
        }
      }
      break;
    case 13: //enter
      moveCursor(0, 1);
      break;
    case 16: //shift
      selection.selectionStart();
      break;
    case 91: //ctrl
      break;
    case 113: //F2
      const input = hiddenInput;
      input.value = getCellValue(selection);
      showTextField(selection);
      break;
    default:
      isCellModified = true;
      showTextField(selection);
      break;
  }
  clear(ctx, w, h);
  draw(ctx);
  drawTexts(ctx, texts);
  drawCursor(ctx, selection);
};

window.onkeyup = e => {
  switch (e.keyCode) {
    case 16: //shift
      selection.selectionEnd();
      break;
    default:
      break;
  }
};

function clear(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

function drawText(ctx, option) {
  ctx.font = `${option.style ? option.style : "normal"} 14px arial`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = fontColor;
  ctx.fillText(
    option.text,
    (option.x + 0.1) * gridSize,
    (option.y + 0.5) * gridSize + alignPixel
  );
}
function drawBox(ctx, option) {
  ctx.save();
  ctx.strokeWidth = "2px";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  ctx.fillRect(
    option.x * gridSize,
    option.y * gridSize,
    option.width * gridSize,
    option.height * gridSize
  );
  ctx.strokeRect(
    option.x * gridSize + 0.5,
    option.y * gridSize + 0.5,
    option.width * gridSize,
    option.height * gridSize
  );
  ctx.font = `${option.style ? option.style : "normal"} 14px arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = fontColor;
  ctx.fillText(
    option.text,
    (option.x + 0.1) * gridSize + (option.width * gridSize) / 2,
    option.y * gridSize + alignPixel + (option.height * gridSize) / 2
  );
  ctx.restore();
}

function drawTexts(ctx, objs) {
  objs.forEach(item => {
    if (item.type === "text") {
      drawText(ctx, item);
    }
    if (item.type === "box") {
      drawBox(ctx, item);
    }
  });
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

draw(ctx);
drawTexts(ctx, texts);
drawCursor(ctx, selection);

const hiddenInput = document.querySelector(".hogan__hiddeninput");
hiddenInput.focus();
