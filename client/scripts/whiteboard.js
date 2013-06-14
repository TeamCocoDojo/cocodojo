Template.whiteboard.codeSession = function () {
    var codeSessionId = Session.get("codeSessionId");
    return CodeSession.findOne({_id:codeSessionId});
};

var codeSessionHandle = null;

Deps.autorun(function () {
    var codeSessionId = Session.get('codeSessionId');
    if (codeSessionId) {
        codeSessionHandle = Meteor.subscribe('codeSession', codeSessionId);
    }
    else {
        codeSessionHandle = null;
    }
});


var Drawing = function (type, options) {
    this.type = type;
    this.options = options;
    this.attrs = {}
    this.data = {};
    this.init();
    return this;
}

Drawing.prototype.init = function () {
    this.element = this[this.type].apply(this, this.options);
    if (this.element == null) return;

    // connect sub object to the Drawing object
    this.element.data("mother", this);

    //add listeners
    this.element.drag(function (dx, dy, x, y, event) {
        dx = this.data["adjust_position"].x + dx;
        dy = this.data["adjust_position"].y + dy;
        this.element.transform("t" + dx + "," + dy);
        this.data["dx"] = dx;
        this.data["dy"] = dy;
    }, function () {
        this.data["adjust_position"] = (!this.data.hasOwnProperty("dx")) ? {x:0, y:0} : {x:this.data["dx"], y:this.data["dy"]};

    }, null, this, this);
    this.element.dblclick(function () {
    }, this);
}
Drawing.prototype.simplify = function () {
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
    return obj;
}
Drawing.prototype.line = function (paper, startX, startY, endX, endY) {
    paper.setStart();
    paper.path("M" + startX + "," + startY + "L" + endX + "," + endY).attr({"stroke-width":3});

    return paper.setFinish();
}
Drawing.prototype.randomLine = function(paper, pts){
    paper.setStart();
    var path = "";
    for(var i = 0; i < pts.length; i++){
        if(i==0) path += "M" + pts[i].x + "," + pts[i].y;
        else{
            path += "L"+pts[i].x + "," + pts[i].y;
        }
    }
    paper.path(path);
    return paper.setFinish();
}
Drawing.prototype.getData = function (key) {
    return this.data[key];
}

Drawing.prototype.updateAttrs = function (key, value) {
    this.element.attr(key, value);
    this.attrs[key] = value;
    return this;
}
Drawing.prototype.remove = function () {
    this.element.remove();
    delete this;
}

Template.whiteboard.rendered = function () {

    var width = "100%";
    var height = 482;
    var dataRef = new Firebase('https://sean-firebase.firebaseio.com/');
    var paper = Raphael(document.getElementById("canvas"), width, height);

    var background = paper.rect(0, 0, width, height).attr({fill:"white", stroke:"white"});


    var drawGraph = function (snapshot) {
        var graphobj = snapshot.val();
        graphobj.options.splice(0, 0, paper);
        var drawing = new Drawing(graphobj.type, graphobj.options);
        for (var key in graphobj.attrs) {
            drawing.updateAttrs(key, graphobj.attrs[key]);
        }
    };

    dataRef.on('child_added', drawGraph);

    var line = null;
    var lastDate = new Date();
    $("#lineButton").click(function (event) {

        line = null;
        background.drag(function (dx, dy, x, y, event) {
            x -= paper.canvas.offsetLeft;
            y -= paper.canvas.offsetTop;
            if (!line.hasOwnProperty("element")) {
                line.element = new Drawing("line", [paper, line.x, line.y, x, y]);
            }
            else {
                line.element.updateAttrs("path", "M" + line.x + "," + line.y + "L" + x + "," + y);
            }
        }, function (x, y, event) {
            //drag Start

            x -= paper.canvas.offsetLeft;
            y -= paper.canvas.offsetTop;
            line = {x:x, y:y};
        }, function (x, y, event) {

            var newPushRef = dataRef.push();
            newPushRef.set(line.element.simplify());
        });
    });

    var deleteHandler = function (event) {
        paper.forEach(function (el2) {
            el2.unclick(deleteHandler);
            el2.unhover(highlightHandler, unHighlightHandler);
        });
        this.data("mother").element.g.remove();
        this.data("mother").remove();
    };

    var highlightHandler = function () {
        this.data("mother").element.g = this.data("mother").element.glow({
            color:"#0FF",
            width:100
        });
    };
    var unHighlightHandler = function () {
        this.data("mother").element.g.remove();
    };
    
    $("#trashButton").click(function (event) {
        paper.clear();
        background = paper.rect(0, 0, width, height).attr({fill:"white", stroke:"white"});
        dataRef.remove();
    });

    dataRef.on('child_removed', function() {
        paper.clear();
        background = paper.rect(0, 0, width, height).attr({fill:"white", stroke:"white"});
    });

}