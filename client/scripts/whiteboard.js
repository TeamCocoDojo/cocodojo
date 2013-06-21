var Drawing = function (type, options) {
  this.type = type;
  this.options = options;
  this.attrs = {}
  this.data = {};
  this.init();
  return this;
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
Drawing.prototype.cursor = function(paper, x, y, color){
  paper.setStart();
  color = color || (function(m,s,c){return (c ? arguments.callee(m,s,c-1) : '#') +
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
WhiteboardCanvas.prototype.adjustMousePosition = function(x, y){

  x -= this.paper.canvas.offsetLeft + $("#whiteboard-container").offset().left;
  y -= this.paper.canvas.offsetTop +  $("#whiteboard-container").offset().top;
  return {x: x, y:y};
};

WhiteboardCanvas.prototype.init = function(){
  var me = this;
  var dbQuery = Whiteboard.find({codeSessionId: Session.get("codeSessionId")});
  this.initCursor();
  dbQuery.observeChanges({
    added: function(id, fields){
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
    },
    removed: function(id){
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
    var position = me.adjustMousePosition(x, y);
    if (!line.hasOwnProperty("element")) {
      line.element = new Drawing("line", [this.paper, line.x, line.y, position.x, position.y]);
    }
    else {
      line.element.updateAttrs("path", "M" + line.x + "," + line.y + "L" + position.x + "," + position.y);
    }
  }, function(x, y, event){
    //Drag Starg;
    line = me.adjustMousePosition(x, y);
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
      randomLine.pts.push(me.adjustMousePosition(x, y));
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
      me.adjustMousePosition(x, y)
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
    drawingId: id.toHexString(),
    codeSessionId: Session.get("codeSessionId"),
    data: drawingObj.stringify()
  });
};
WhiteboardCanvas.prototype.initCursor = function(){
  this.cursors = {};
  var me = this;
  var cursorQuery = WhiteboardCursor.find({codeSessionId: Session.get("codeSessionId")});
  cursorQuery.observe({
    changed: function( cursorObj, oldCursorObj){
      if(cursorObj._id === Session.get("userSession")) return;
      var location = me.adjustMousePosition(cursorObj.x, cursorObj.y); 
      if(me.cursors[cursorObj._id] === undefined){
        user = SessionUsers.findOne({_id: cursorObj._id});
        me.cursors[cursorObj._id] = new Drawing("cursor", [me.paper, location.x, location.y]);
        me.cursors[cursorObj._id].updateAttrs("fill", user.userColor );
      }
      else{
        me.cursors[cursorObj._id].updateAttrs("cx",location.x);
        me.cursors[cursorObj._id].updateAttrs("cy",location.y);
      }
    },
    removed: function(cursorObj){
      if(me.cursors[cursorObj._id] !== undefined){
        me.cursors[cursorObj._id].remove();
        delete me.cursors[cursorObj._id];
      }
    }
  });
  var userQuery = SessionUsers.find({codeSessionId: Session.get("codeSessionId")});
  userQuery.observe({
    removed: function(user){
      WhiteboardCursor.remove({_id: user._id});
    } 
  });
  this.background.mousemove(function(event, x, y){
    cursor = WhiteboardCursor.findOne({_id: Session.get("userSession")});
    if(cursor === null){
      WhiteboardCursor.insert({
        _id: Session.get("userSession"),
        codeSessionId: Session.get("codeSessionId"),
        x: 0,
        y: 0
      });
    }
    else{
      WhiteboardCursor.update({_id: Session.get("userSession")},{$set: 
                              {x: x, y: y}
      });
    }
  });
};
WhiteboardCanvas.prototype.clean = function(){
  for(var drawingId in this.drawings){
    Whiteboard.remove(new Meteor.Collection.ObjectID(drawingId), function(){
    });
  }
  this.drawings = {};
  this.paper.clear();
  this.background = this.paper.rect(0, 0, this.width, this.height).attr({fill:"white", stroke:"white"});
};

Template.whiteboard.rendered = function () {
  var whiteboard = new WhiteboardCanvas("canvas", "100%", 482);
  $("#lineButton").click(function(x, y, event){
    whiteboard.drawLineListener();
  });
  $("#randomLineButton").click(function(){
    whiteboard.drawRandomLineListener();
  });
  $("#trashButton").click(function(){
    whiteboard.clean();
  });

  $('#wb-pin-btn').click(function(){
    $('#whiteboard-container').toggleClass('pinned');
  });
  $('.wb-btn').click(function(){
    $('.wb-btn').removeClass('active');
    $(this).addClass('active');
  });

};
