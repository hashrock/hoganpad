var canv = document.querySelector("canvas");
var ctx = canv.getContext("2d");
var gridColor = "#cccccc";
var selectedColor = "#006600";
var white = "#ffffff";
var gridSize = 20;

var h = canv.clientHeight;
var w = canv.clientWidth;
var gridX = Math.floor(w / gridSize);
var gridY = Math.floor(h / gridSize);
var sx = 0;
var sy = 0;

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
    ctx.strokeRect(x * gridSize + 0.5, y * gridSize + 0.5, gridSize, gridSize);
}

function draw(ctx) {
    for (var i = 0; i < gridY; i++) {
        for (var j = 0; j < gridX; j++) {
            drawCell(ctx, j, i);
        }
    }
    drawCursor(ctx, sx, sy);
}

window.onkeydown = function(e) {
    switch (e.keyCode) {
        case 37: //left
            sx += -1;
            sy += 0;
            break;
        case 38: //up
            sx += 0;
            sy += -1;
            break;
        case 39: //right
            sx += 1;
            sy += 0;
            break;
        case 40: //down
            sx += 0;
            sy += 1;
            break;
        default:
            break;
    }
    sx = sx > 0 ? sx : 0;
    sx = sx < gridX - 1 ? sx : gridX - 1;
    sy = sy > 0 ? sy : 0;
    sy = sy < gridY - 1 ? sy : gridY - 1;
    clear(ctx, w, h);
    draw(ctx);
}
function clear(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
}

draw(ctx);
