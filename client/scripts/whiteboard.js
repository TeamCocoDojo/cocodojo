var Drawing = function (type, options) {
  this.type = type;
  this.options = options;
  this.attrs = {}
  this.data = {};
  this.init();
  return this;
};

Drawing.adjustMousePosition = function(paper, x, y){

  x -= paper.canvas.offsetLeft + $("#whiteboard-container").offset().left;
  y -= paper.canvas.offsetTop +  $("#whiteboard-container").offset().top;
  return {x: x, y:y};
};

Drawing.prototype.init = function () {
  this.element = this[this.type].apply(this, this.options);
  if (this.element == null) return;

  // connect sub object to the Drawing object
  this.element.data("mother", this);
};

Drawing.prototype.stringify = function () {
  var obj = {};
  obj.type = this.type;
  obj.attrs = {};
  for (var key in this.attrs) {
    obj.attrs[key] = this.attrs[key];
  }
  obj.options = [];
  for (var i = 1; i < this.options.length; i++) {
    obj.options.push(this.options[i]);
  }
  return JSON.stringify(obj);
};

Drawing.prototype.updateAttrs = function (key, value) {
  this.element.attr(key, value);
  this.attrs[key] = value;
  return this;
};

Drawing.prototype.remove = function () {
  this.element.remove();
  delete this;
};

Drawing.prototype.line = function (paper, startX, startY, endX, endY) {
  paper.setStart();
  var path = "M" + startX + "," + startY + "L" + endX + "," + endY;
  paper.path("M" + startX + "," + startY + "L" + endX + "," + endY).attr({"stroke-width":3});
  return paper.setFinish();
};

Drawing.prototype.randomLine = function(paper, pts){
  paper.setStart();
  var path = "";
  for(var i = 0; i < pts.length; i++){
    if (i==0) path += "M" + pts[i].x + "," + pts[i].y;
    else{
      path += "L"+pts[i].x + "," + pts[i].y;
    }
  }
  paper.path(path);
  return paper.setFinish();
};
Drawing.prototype.cursor = function(paper, x, y){
  paper.setStart();
  var color = (function(m,s,c){return (c ? arguments.callee(m,s,c-1) : '#') +
    s[m.floor(m.random() * s.length)]})(Math,'0123456789ABCDEF',5);
  paper.circle(x, y, 5).attr({fill: color});
  //paper.path("M" + (x+5) + "," + (y+5) + "L" + (x+10) + "," + (y+10));
  return paper.setFinish();
};

function WhiteboardCanvas(elementId, width, height){
  this.width = width;
  this.height = height;
  this.paper = Raphael(document.getElementById(elementId), width, height);
  this.background = this.paper.rect(0, 0, width, height).attr({fill:"white", stroke:"white"});
  this.drawings = {};
  this.init();
};

WhiteboardCanvas.prototype.init = function(){
  var me = this;
  var dbQuery = Whiteboard.find({codeSessionId: Session.get("codeSessionId"), type:"drawing"});
  this.initCursor();
  dbQuery.observeChanges({
    added: function(id, fields){
      console.log("added event detected");
      if (me.drawings[fields.drawingId] !== undefined) return;
      var graphData = JSON.parse(fields.data);
      graphData.options.splice(0, 0, me.paper);
      var drawing = new Drawing(graphData.type, graphData.options);
      for (var key in graphData.attrs) {
        drawing.updateAttrs(key, graphData.attrs[key]);
      }
      me.drawings[fields.drawingId] = drawing;
    },
    changed: function(id, fields){
      console.log("changed event detected");
    },
    removed: function(id){
      console.log("removed event detected");
      if (me.drawings[id.toHexString()] === undefined) return; 
      me.drawings[id.toHexString()].remove();
    }
  });
};

WhiteboardCanvas.prototype.drawLineListener = function(event){
  var line = null;
  var me = this;
  this.background.drag(function(dx, dy, x, y , event){
    //During dragging;
    var position = Drawing.adjustMousePosition(this.paper, x, y);
    if (!line.hasOwnProperty("element")) {
      line.element = new Drawing("line", [this.paper, line.x, line.y, position.x, position.y]);
    }
    else {
      line.element.updateAttrs("path", "M" + line.x + "," + line.y + "L" + position.x + "," + position.y);
    }
  }, function(x, y, event){
    //Drag Starg;
    line = Drawing.adjustMousePosition(this.paper,x, y);
  }, function(x, y, event){
    //Finish Drag
    var lineId = me.addToMongo(line.element);
    me.background.undrag();
  });
};
WhiteboardCanvas.prototype.drawRandomLineListener = function(event){
  var randomLine = null;
  var me = this;
  this.background.drag(function(dx,dy,x,y,event){
    //During dragging
    if (!randomLine.hasOwnProperty("element")){
      randomLine.element = new Drawing("randomLine", [me.paper, randomLine.pts]);
    }
    else{
      randomLine.pts.push(Drawing.adjustMousePosition(me.paper, x, y));
      var path = "";
      for(var i=0;i<randomLine.pts.length; i++){
        if (i==0){
          path += "M" +randomLine.pts[i].x + "," + randomLine.pts[i].y;
        }
        else{
          path += "L" +randomLine.pts[i].x + "," + randomLine.pts[i].y;
        }
      }
      randomLine.element.updateAttrs("path", path);
    }
  }, function(x,y, event){
    //drag Start
    randomLine = {pts: [
      Drawing.adjustMousePosition(me.paper, x, y)
    ]};
  },function(x,y,event){
    //drag End
    me.addToMongo(randomLine.element);
    me.background.undrag();

  });
};

WhiteboardCanvas.prototype.addToMongo = function(drawingObj){
  var id = new Meteor.Collection.ObjectID();
  this.drawings[id.toHexString()] = drawingObj;
  Whiteboard.insert({
    _id: id,
    type: "drawing",
    drawingId: id.toHexString(),
    codeSessionId: Session.get("codeSessionId"),
    data: drawingObj.stringify()
  });
};
WhiteboardCanvas.prototype.initCursor = function(){
  this.cursors = {};
  var me = this;
  var dbQuery = Whiteboard.find({codeSessionId: Session.get("codeSessionId"), type:"cursor"});
  dbQuery.observeChanges({
    added: function(id, cursorObj){
      console.log("current user" + Session.get("userSession"));
      console.log("cursor added:" + cursorObj.userSessionId);
      if(Session.get("userSession") ===  cursorObj.userSessionId) return;
      me.cursors[cursorObj.userSessionId] = new Drawing("cursor", [me.paper, cursorObj.x, cursorObj.y]);
      console.log("create cursor");
      console.log(me.cursors);
    },
    changed: function(id, cursorObj){
      //console.log("cursor changed");
      if(Session.get("userSession") ===  cursorObj.userSessionId) return;
      var location = Drawing.adjustMousePosition(me.paper, cursorObj.x, cursorObj.y); 
      //console.log(me.cursors);
      //me.cursors[cursorObj.userSessionId].updateAttrs("cx",location.x);
      //me.cursors[cursorObj.userSessionId].updateAttrs("cy",location.y);
    },
    removed: function(id, fields){
      console.log("cursor removed");
    }
  });
  console.log(Session.get("userSession"));
  Whiteboard.insert({
    _id: Session.get("userSession"),
    codeSessionId: Session.get("codeSessionId"),
    userSessionId: Session.get("userSession"),
    type: "cursor",
    x: 0,
    y: 0
  });
  this.background.mousemove(function(event, x, y){
    console.log("mouseMove");
    Whiteboard.update({_id: Session.get("userSession")},{$set: 
      {x: x, y: y}
    });
  });
};
WhiteboardCanvas.prototype.clean = function(){
  for(var drawingId in this.drawings){
    console.log(drawingId);
    console.log(typeof drawingId);
    Whiteboard.remove(new Meteor.Collection.ObjectID(drawingId), function(){
      console.log("removed");
    });
  }
  this.drawings = {};
  this.paper.clear();
  this.background = this.paper.rect(0, 0, this.width, this.height).attr({fill:"white", stroke:"white"});
};

Template.whiteboard.rendered = function () {
  var whiteboard = new WhiteboardCanvas("canvas", "100%", 482);
  var lastDate = new Date();
  whiteboard.background.dblclick(function(event, x, y){
    var location = Drawing.adjustMousePosition(whiteboard.paper, x, y);
    new Drawing("cursor", [whiteboard.paper, location.x, location.y]); 
  });
  $("#lineButton").click(function(x, y, event){
    whiteboard.drawLineListener();
  });
  $("#randomLineButton").click(function(){
    whiteboard.drawRandomLineListener();
  });
  $("#trashButton").click(function(){
    whiteboard.clean();
  });
};
