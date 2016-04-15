var canv = document.querySelector("canvas");
var ctx = canv.getContext("2d");
var gridColor = "#cccccc";
var selectedColor = "#006600";
var selectedBackColor = "rgba(0,0,0,0.1)";
var white = "#ffffff";
var fontColor = "#000000";
var gridSize = 20;

var h = canv.clientHeight;
var w = canv.clientWidth;
var gridX = Math.floor(w / gridSize);
var gridY = Math.floor(h / gridSize);

var selectionMode = false;
var isCellModified = false;

//x0, y0, x1, y1
var Selection = function(){
    this.sx = 0;
    this.sy = 0;
    this.startx = -1;
    this.starty = -1;
    this.selectionMode = false;
}


Selection.prototype.set = function(x, y){
    this.sx = x;
    this.sy = y;
}

Selection.prototype.selectionStart = function(){
    this.startx = this.sx;
    this.starty = this.sy;
    this.selectionMode = true;
}
Selection.prototype.selectionEnd = function(){
    this.selectionMode = false;
}

Selection.prototype.getInfo = function(){
    var x0 = this.startx;
    var y0 = this.starty;
    var x1 = this.sx;
    var y1 = this.sy;
    var x = x0 < x1 ? x0 : x1;
    var y = y0 < y1 ? y0 : y1;
    var w = Math.abs(x0 - x1) + 1;
    var h = Math.abs(y0 - y1) + 1;
    return {
        x: x,
        y: y,
        w: w,
        h: h,
        multiple: (h > 1 || y > 1)
    }
}

Selection.prototype.move = function(rx, ry){
    this.sx += rx;
    this.sy += ry;
    if(!this.selectionMode){
        this.startx = this.sx;
        this.starty = this.sy;
    }

    this.sx = this.sx > 0 ? this.sx : 0;
    this.sx = this.sx < gridX - 1 ? this.sx : gridX - 1;
    this.sy = this.sy > 0 ? this.sy : 0;
    this.sy = this.sy < gridY - 1 ? this.sy : gridY - 1;
}

var selection = new Selection();

var alignPixel = 0.5;


function drawCursorRange(x, y, w, h){
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
    var handleSize = 5;
    var handleOffset = 2;
    ctx.strokeRect(x * gridSize, y * gridSize, w * gridSize, h * gridSize);

    if(w > 1 || h > 1){
        var backgroundMargin = 1;
        ctx.fillStyle = selectedBackColor;
        ctx.fillRect(
            x * gridSize + backgroundMargin,
            y * gridSize + backgroundMargin,
            w * gridSize - backgroundMargin * 2,
            h * gridSize - backgroundMargin * 2);
    }

    var rectStartX = (x + w) * gridSize - handleSize + handleOffset;
    var rectStartY = (y + h) * gridSize - handleSize + handleOffset;

    ctx.fillStyle = white;
    ctx.fillRect(rectStartX - 1,rectStartY - 1,handleSize + 2,handleSize + 2);
    ctx.fillStyle = selectedColor;
    ctx.fillRect(rectStartX, rectStartY, handleSize, handleSize);
}

function drawCursor(ctx, selection) {
    var info = selection.getInfo();
    drawCursorRange(info.x, info.y, info.w, info.h);
}

function drawCell(ctx, x, y) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x * gridSize + alignPixel, y * gridSize + alignPixel, gridSize, gridSize);
}

function draw(ctx) {
    for (var i = 0; i < gridY; i++) {
        for (var j = 0; j < gridX; j++) {
            drawCell(ctx, j, i);
        }
    }
    drawCursor(ctx, selection);
}


function updateTextField(){
    hiddenInput.focus();
    hiddenInput.value = "";
}

function getTextField(){
    return hiddenInput.value;
}

function showTextField(selection){
    var input = hiddenInput;
    input.style.opacity = 1;
    input.style.left = selection.sx * gridSize + "px";
    input.style.top = selection.sy * gridSize + "px";
}
function hideTextField(){
    var input = hiddenInput;
    input.style.opacity = 0;
    input.style.left = "-100px";
    input.style.top = "-100px";
}

canv.onmousedown = function(e){
    overwriteCell(getTextField(), selection.sx, selection.sy);
    hideTextField();
    updateTextField();    

    selection.set(Math.floor(e.offsetX / gridSize), Math.floor(e.offsetY / gridSize))
    selection.selectionStart();
    clear(ctx, w, h);
    draw(ctx);
    drawTexts(ctx, texts);
}

canv.onmousemove = function(e){
    if(selection.selectionMode){
        selection.set(Math.floor(e.offsetX / gridSize), Math.floor(e.offsetY / gridSize))
        clear(ctx, w, h);
        draw(ctx);
        drawTexts(ctx, texts);
    }
}

canv.onmouseup = function(e){
    selection.selectionEnd();
    updateTextField();
}

document.oncopy = function(e){
    console.log(e);
    e.preventDefault();
}
document.onpaste = function(e){
    console.log(e);
    e.preventDefault();
}

canv.ondblclick = function(){
    var input = hiddenInput;
    input.value = getCellValue(selection);
    showTextField(selection);
    input.focus();
}

function clearCell(sx, sy){
    var matched = -1;
    texts.forEach(function(item, idx){
        if(item.x === sx && item.y === sy){
            matched = idx;
        }
    })
    if(matched >= 0){
        texts.splice(matched, 1);
    }
}

function getCellValue(selection){
    for(var i = 0; i < texts.length; i++){
        var item = texts[i];
        if(item.x === selection.sx && item.y === selection.sy){
            return item.text;
        }
    }
    return "";
}

function overwriteCell(text, x, y){
    if(isCellModified){
        clearCell(x, y);
        texts.push({
            x: x,
            y: y,
            text: text
        })
        isCellModified = false;
    }
}

function moveCursor(rx, ry){
    overwriteCell(getTextField(), selection.sx, selection.sy);
    selection.move(rx, ry);
    hideTextField();
    updateTextField();
}


window.onkeydown = function(e) {
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
            var info = selection.getInfo();
            for(var j = 0; j < info.h; j++){
                for(var i = 0; i < info.w; i++){
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
            var input = hiddenInput;
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
}

window.onkeyup = function(e) {
    switch (e.keyCode) {
        case 16: //shift
            selection.selectionEnd();
            break;
        default:
            break;
    }
}

function clear(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
}

function drawText(ctx, option){
    ctx.font = "14px arial";
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fontColor;
    ctx.fillText(option.text, (option.x + 0.1) * gridSize, (option.y + 0.5) * gridSize + alignPixel);
}

function drawTexts(ctx, objs){
    objs.forEach(function(item){
        drawText(ctx, item);
    })
}

var texts = [
    {
        x: 1,
        y: 1,
        text: "Excel方眼紙だよ"
    }
]


draw(ctx);
drawTexts(ctx, texts);

var hiddenInput = document.querySelector(".hogan__hiddeninput");
hiddenInput.focus();
