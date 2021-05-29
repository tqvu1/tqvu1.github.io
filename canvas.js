const ctx = canvas.getContext("2d");
const Point2 = (x,y) => ({x,y});  // creates a point
const Line = (p1,p2,dist) => ({p1,p2,dist});
const setStyle = (style) => eachOf(Object.keys(style), key => { ctx[key] = style[key] } );
const eachOf = (array, callback) => {var i = 0; while (i < array.length && callback(array[i],i ++) !== true ); };


const list = {
    items : null,
    add(item) { this.items.push(item); return item },
    eachItem(callback) { 
        var i = 0;
        while(i < this.items.length){
             callback(this.items[i],i++);
        }
    }
}
function createList(extend){
    return Object.assign({},list,{items : []},extend);
}
// this will extend the points list
function getClosestPoint(from ,minDist) {
    var closestPoint;
    this.eachItem(point => {
        const dist = Math.hypot(from.x - point.x, from.y - point.y);
        if(dist < minDist){
            closestPoint = point;
            minDist = dist;
        }
    });
    return closestPoint;
}
function getOtherPointInLine(closestLine, closestPoint) {
  if (points.items[closestLine.p1].x === closestPoint.x && points.items[closestLine.p1].y === closestPoint.y) {
    return points.items[closestLine.p2];
  } else {
    return points.items[closestLine.p1];
  }
}
function measure(pointFrom, pointTo) {
  const a = Math.abs(pointFrom.x - pointTo.x);
  const b = Math.abs(pointFrom.y - pointTo.y);
  const c = Math.sqrt( a*a + b*b );
  return Math.round(c);
}
function distanceLineFromPoint(line,point){
    const lx = points.items[line.p1].x;
    const ly = points.items[line.p1].y;
    const v1x = points.items[line.p2].x - lx;
    const v1y = points.items[line.p2].y - ly;
    const v2x = point.x - lx;
    const v2y = point.y - ly;
    // get unit dist of closest point
    const u = (v2x * v1x + v2y * v1y)/(v1y * v1y + v1x * v1x);
    if(u >= 0 && u <= 1){  // is the point on the line
        return Math.hypot(lx + v1x * u - point.x, ly + v1y * u - point.y);
    } else if ( u < 0 ) {  // point is before start
        return Math.hypot(lx - point.x, ly - point.y);
    }
    // point is after end of line
    return Math.hypot(points.items[line.p2].x - point.x, points.items[line.p2].y - point.y);
}
// this will extend the lines list
function getClosestline(from ,minDist) {
    var closestLine;
    this.eachItem(line => {
        const dist = distanceLineFromPoint(line,from);
        if(dist < minDist){
            closestLine = line;
            minDist = dist;
        }
    });
    return closestLine;
}
function drawPoint(point){
    ctx.moveTo(point.x,point.y);
    ctx.rect(point.x - 2,point.y - 2, 4,4);
}
function drawLine(line){
    ctx.moveTo(points.items[line.p1].x,points.items[line.p1].y);
    ctx.lineTo(points.items[line.p2].x,points.items[line.p2].y);
}
function drawLines(){ this.eachItem(line => drawLine(line)) }
function drawPoints(){this.eachItem(point => drawPoint(point)) }

const points = createList({
  getClosest : getClosestPoint,
  draw : drawPoints,
});
const lines = createList({
  getClosest : getClosestline,
  draw : drawLines,
});
const mouse  = {x : 0, y : 0, button : false, drag : false, dragStart : false, dragEnd : false, dragStartX : 0, dragStartY : 0}
function mouseEvents(e){
	mouse.x = e.pageX;
	mouse.y = e.pageY;
	const lb = mouse.button;
	mouse.button = e.type === "mousedown" ? true : e.type === "mouseup" ? false : mouse.button;
	if(lb !== mouse.button){
		if(mouse.button){
			mouse.drag = true;
			mouse.dragStart = true;
			mouse.dragStartX = mouse.x;
			mouse.dragStartY = mouse.y;
		}else{
			mouse.drag = false;
			mouse.dragEnd = true;
		}
	}
}
["down","up","move"].forEach(name => document.addEventListener("mouse" + name, mouseEvents));
// short cut vars 
var w = canvas.width;
var h = canvas.height;
var cw = w / 2;  // center 
var ch = h / 2;
var globalTime;
var closestLine;
var closestPoint;
var pointDrag; // true is dragging a point else dragging a line
var dragOffsetX;
var dragOffsetY;
var cursor;
var toolTip = '';
var helpCount = 0;
const minDist = 20;
const lineStyle = {
  lineWidth : 3,
  strokeStyle : "green",
}
const pointStyle = {
  lineWidth : 1,
  strokeStyle : "blue",
}
const highlightStyle = {
  lineWidth : 3,
  strokeStyle : "red",
}
const font = {
  font : "bold 40px arial",
  fillStyle : "black",
  textAlign : "center",

}


// main update function
function update(timer){
    cursor = "crosshair";
    // toolTip = helpCount < 2 ? "Click drag to create a line" : "";
    globalTime = timer;
    ctx.setTransform(1,0,0,1,0,0); // reset transform
    ctx.globalAlpha = 1;           // reset alpha
	if(w !== innerWidth || h !== innerHeight){
		cw = (w = canvas.width = innerWidth) / 2;
		ch = (h = canvas.height = innerHeight) / 2;
	}else{
		ctx.clearRect(0,0,w,h);
	}
  if(mouse.drag=== false){
    closestLine = undefined;
    closestPoint = points.getClosest(mouse,minDist);
    if(closestPoint === undefined){
       closestLine = lines.getClosest(mouse,minDist);
    }
    if(closestPoint || closestLine){
       // toolTip = "Click drag to move " + (closestPoint ? "point" : "line");     
       cursor = "move";
    }
  }
  if(mouse.dragStart){
    if(closestPoint){
      dragOffsetX = closestPoint.x - mouse.x;
      dragOffsetY =  closestPoint.y - mouse.y;
      pointDrag = true;
    
    }else if( closestLine){
      dragOffsetX = points.items[closestLine.p1].x - mouse.x;
      dragOffsetY = points.items[closestLine.p1].y - mouse.y;
      pointDrag = false;
      toolTip = closestLine.dist;
    
    } else {
      points.add(Point2(mouse.x,mouse.y));
      closestPoint = points.add(Point2(mouse.x,mouse.y));
      closestLine = lines.add(Line(points.items.length-2,points.items.length-1));
      dragOffsetX = 0;
      dragOffsetY = 0;
      pointDrag = true;
      helpCount += 1;
      
    }
    mouse.dragStart = false;
  
  }else if(mouse.drag){
      cursor = 'none';
      if(pointDrag){
        closestPoint.x = mouse.x + dragOffsetX;
        closestPoint.y = mouse.y + dragOffsetY;

        let closestLine = lines.getClosest(mouse, minDist);
        let otherPointInLine = getOtherPointInLine(closestLine, closestPoint);
        let dist = measure(closestPoint, otherPointInLine);
        closestLine.dist = dist;
        toolTip = dist;
      }else{
        const dx = mouse.x- mouse.dragStartX;
        const dy = mouse.y -mouse.dragStartY;
        mouse.dragStartX = mouse.x;
        mouse.dragStartY = mouse.y;
        points.items[closestLine.p1].x +=  dx;
        points.items[closestLine.p1].y +=  dy;
        points.items[closestLine.p2].x +=  dx;
        points.items[closestLine.p2].y +=  dy;   
      }
  }else{
  
  
  }
  // draw all points and lines
  setStyle(lineStyle);
  ctx.beginPath();
  lines.draw();
  ctx.stroke();
  setStyle(pointStyle);
  ctx.beginPath();
  points.draw();
  ctx.stroke();

  // draw highlighted point or line
  setStyle(highlightStyle);
  ctx.beginPath();
  if(closestLine){ 
    drawLine(closestLine) 
  }
  if(closestPoint){ 
    drawPoint(closestPoint) 
  }
  
  ctx.stroke();
      
  setStyle(font);
  ctx.fillText(toolTip,cw,50);
  
  canvas.style.cursor = cursor;
  requestAnimationFrame(update);
}
requestAnimationFrame(update);
