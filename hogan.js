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

var alignPixel = 0.5;

function drawCursor(ctx, x, y) {
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
    var handleSize = 5;
    var handleOffset = 2;
    ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);

    var rectStartX = (x + 1) * gridSize - handleSize + handleOffset;
    var rectStartY = (y + 1) * gridSize - handleSize + handleOffset;

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
    drawCursor(ctx, sx, sy);
}


function updateTextField(){
    var input = document.querySelector("input");
    input.focus();
    input.value = "";
}

function getTextField(){
    return document.querySelector("input").value;
}

function showTextField(sx, sy){
    var input = document.querySelector("input");
    input.style.opacity = 1;
    input.style.left = sx * gridSize + "px";
    input.style.top = sy * gridSize + "px";
}
function hideTextField(){
    var input = document.querySelector("input");
    input.style.opacity = 0;
}


window.onkeydown = function(e) {
    switch (e.keyCode) {
        case 37: //left
            sx += -1;
            sy += 0;
            hideTextField();
            updateTextField();
            break;
        case 38: //up
            sx += 0;
            sy += -1;
            hideTextField();
            updateTextField();
            break;
        case 39: //right
            sx += 1;
            sy += 0;
            hideTextField();
            updateTextField();
            break;
        case 40: //down
            sx += 0;
            sy += 1;
            hideTextField();
            updateTextField();
            break;
        case 13: //enter
            var input = getTextField();
            if(input.length > 0){
                texts.push({
                    x: sx,
                    y: sy,
                    text: input
                })
            }
            sx += 0;
            sy += 1;
            hideTextField();
            updateTextField();
            break;
        default:
            showTextField(sx, sy);
            break;
    }
    sx = sx > 0 ? sx : 0;
    sx = sx < gridX - 1 ? sx : gridX - 1;
    sy = sy > 0 ? sy : 0;
    sy = sy < gridY - 1 ? sy : gridY - 1;
    

    
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

var input = document.querySelector("input");
input.focus();
