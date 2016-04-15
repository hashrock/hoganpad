var canv = document.querySelector("canvas");
var ctx = canv.getContext("2d");
var gridColor = "#cccccc";
var selectedColor = "#006600";
var white = "#ffffff";
var fontColor = "#000000";
var gridSize = 20;

var h = canv.clientHeight;
var w = canv.clientWidth;
var gridX = Math.floor(w / gridSize);
var gridY = Math.floor(h / gridSize);
var sx = 0;
var sy = 0;

//x0, y0, x1, y1
var Selection = function(){
    this.sx = 0;
    this.sy = 0;
    this.sw = 1;
    this.sh = 1;
}

Selection.prototype.set = function(x, y){
    this.sx = x;
    this.sy = y;
    this.sw = 1;
    this.sh = 1;
}

Selection.prototype.move = function(rx, ry){
    this.sx += rx;
    this.sy += ry;
    this.sw = 1;
    this.sh = 1;

    this.sx = this.sx > 0 ? this.sx : 0;
    this.sx = this.sx < gridX - 1 ? this.sx : gridX - 1;
    this.sy = this.sy > 0 ? this.sy : 0;
    this.sy = this.sy < gridY - 1 ? this.sy : gridY - 1;
}

var selection = new Selection();

var alignPixel = 0.5;

function drawCursor(ctx, selection) {
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
    var handleSize = 5;
    var handleOffset = 2;
    ctx.strokeRect(selection.sx * gridSize, selection.sy * gridSize, gridSize, gridSize);

    var rectStartX = (selection.sx + 1) * gridSize - handleSize + handleOffset;
    var rectStartY = (selection.sy + 1) * gridSize - handleSize + handleOffset;

    ctx.fillStyle = white;
    ctx.fillRect(rectStartX - 1,rectStartY - 1,handleSize + 2,handleSize + 2);
    ctx.fillStyle = selectedColor;
    ctx.fillRect(rectStartX, rectStartY, handleSize, handleSize);
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
    overwriteCell(getTextField(), selection);
    hideTextField();
    updateTextField();    
    sx = Math.floor(e.offsetX / gridSize);
    sy = Math.floor(e.offsetY / gridSize);
    clear(ctx, w, h);
    draw(ctx);
    drawTexts(ctx, texts);
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
    if(text.length > 0){
        clearCell(x, y);
        texts.push({
            x: x,
            y: y,
            text: text
        })
    }
}


window.onkeydown = function(e) {
    switch (e.keyCode) {
        case 37: //left
            overwriteCell(getTextField(), selection.sx, selection.sy);
            selection.move(-1, 0);
            hideTextField();
            updateTextField();
            break;
        case 38: //up
            overwriteCell(getTextField(), selection.sx, selection.sy);
            selection.move(0, -1);
            hideTextField();
            updateTextField();
            break;
        case 39: //right
            overwriteCell(getTextField(), selection.sx, selection.sy);
            selection.move(1, 0);
            hideTextField();
            updateTextField();
            break;
        case 40: //down
            overwriteCell(getTextField(), selection.sx, selection.sy);
            selection.move(0, 1);
            hideTextField();
            updateTextField();
            break;
        case 46: //delete
            clearCell(selection.sx, selection.sy);
            break;            
        case 13: //enter
            overwriteCell(getTextField(), selection.sx, selection.sy);
            selection.move(0, 1);
            hideTextField();
            updateTextField();
            break;
        case 113: //F2
            var input = hiddenInput;
            input.value = getCellValue(selection);
            showTextField(selection);
            break;
        default:
            showTextField(selection);
            break;
    }

    

    
    clear(ctx, w, h);
    draw(ctx);
    drawTexts(ctx, texts);
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
