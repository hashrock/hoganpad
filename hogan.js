var canv = document.querySelector("canvas");
var ctx = canv.getContext("2d");
var gridColor = "#cccccc";
var gridSize = 20;

var h = canv.clientHeight;
var w = canv.clientWidth;
var gridX = Math.floor(w / gridSize);
var gridY = Math.floor(h / gridSize);

function drawCell(ctx, x, y){
    ctx.strokeStyle = gridColor;
    ctx.strokeRect(x * gridSize + 0.5, y * gridSize + 0.5, gridSize, gridSize);
}

function draw(ctx){
    for(var i = 0; i < gridY; i++){
        for(var j = 0; j < gridX; j++){
            drawCell(ctx, j, i);
        }
    }
}

console.log(w, h);

draw(ctx);
