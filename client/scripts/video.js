Template.video.rendered = function () {
  var apiKey = "31556702";
  var sessionId = "2_MX4zMTU1NjcwMn4xMjcuMC4wLjF-RnJpIEp1biAwNyAxNDoyOToxMiBQRFQgMjAxM34wLjkwNjI3NzN-";
  var token = "T1==cGFydG5lcl9pZD0zMTU1NjcwMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz1hY2E0NDhlZTU0NTQwNTc1MzE4YjZhZjhhMTQ0ODc3NTY1ZWQwYjQ5OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR6TVRVMU5qY3dNbjR4TWpjdU1DNHdMakYtUm5KcElFcDFiaUF3TnlBeE5Eb3lPVG94TWlCUVJGUWdNakF4TTM0d0xqa3dOakkzTnpOLSZjcmVhdGVfdGltZT0xMzcxMjMzMjg0Jm5vbmNlPTAuNDc5NDcxODI5MzMzMjg0NDcmZXhwaXJlX3RpbWU9MTM3MzgyNTI4MyZjb25uZWN0aW9uX2RhdGE9";

  var session;
  var publisher;
  var subscribers = {};
  var VIDEO_WIDTH = 320;
  var VIDEO_HEIGHT = 240;

  TB.addEventListener("exception", exceptionHandler);

    // Un-comment the following to set automatic logging:
    // TB.setLogLevel(TB.DEBUG);

  if (TB.checkSystemRequirements() != TB.HAS_REQUIREMENTS) {
    alert("You don't have the minimum requirements to run this application."
      + "Please upgrade to the latest version of Flash.");
  } else {
    session = TB.initSession(sessionId);  // Initialize session

    // Add event listeners to the session
    session.addEventListener('sessionConnected', sessionConnectedHandler);
    session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
    session.addEventListener('connectionCreated', connectionCreatedHandler);
    session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
    session.addEventListener('streamCreated', streamCreatedHandler);
    session.addEventListener('streamDestroyed', streamDestroyedHandler);
  }

  //--------------------------------------
  //  LINK CLICK HANDLERS
  //--------------------------------------

  $("#connectLink").click(function (event) {
    // connect
    session.connect(apiKey, token);
  });

  $("#disconnectLink").click(function (event) {
    // disconnect
    session.disconnect();
    hide('disconnectLink');
    hide('publishLink');
    hide('unpublishLink');
  });

  $("#publishLink").click(function (event) {
    // start publishing
    if (!publisher) {
      var parentDiv = document.getElementById("myCamera");
      var publisherDiv = document.createElement('div'); // Create a div for the publisher to replace
      publisherDiv.setAttribute('id', 'opentok_publisher');
      parentDiv.appendChild(publisherDiv);
      var publisherProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT};
      publisher = TB.initPublisher(apiKey, publisherDiv.id, publisherProps);  // Pass the replacement div id and properties
      session.publish(publisher);
      show('unpublishLink');
      hide('publishLink');
    }
  });

  $("#unpublishLink").click(function (event) {
    // stop publishing
    if (publisher) {
      session.unpublish(publisher);
    }
    publisher = null;

    show('publishLink');
    hide('unpublishLink');
  });
}

var tokboxRouter = Backbone.Router.extend({

  routes:{
   ":session_id":"dojo"
 },
 dojo:function (codeSessionId) {
   Session.set("codeSessionId", codeSessionId);
 },
 setCodeSession:function (codeSessionId) {
   this.navigate(codeSessionId, true);
 }
});
Router = new tokboxRouter;























//--------------------------------------
//  OPENTOK EVENT HANDLERS
//--------------------------------------

function sessionConnectedHandler(event) {
  // Subscribe to all streams currently in the Session
  console.log("streams length is:" + event.streams.length);
  for (var i = 0; i < event.streams.length; i++) {
    addStream(event.streams[i]);
  }
  show('disconnectLink');
  show('publishLink');
  hide('connectLink');
}

function streamCreatedHandler(event) {
  // Subscribe to the newly created streams
  for (var i = 0; i < event.streams.length; i++) {
    addStream(event.streams[i]);
  }
}

function streamDestroyedHandler(event) {
  // This signals that a stream was destroyed. Any Subscribers will automatically be removed.
  // This default behaviour can be prevented using event.preventDefault()
}

function sessionDisconnectedHandler(event) {
  // This signals that the user was disconnected from the Session. Any subscribers and publishers
  // will automatically be removed. This default behaviour can be prevented using event.preventDefault()
  publisher = null;

  show('connectLink');
  hide('disconnectLink');
  hide('publishLink');
  hide('unpublishLink');
}

function connectionDestroyedHandler(event) {
  // This signals that connections were destroyed
}

function connectionCreatedHandler(event) {
  // This signals new connections have been created.
}

/*
If you un-comment the call to TB.setLogLevel(), above, OpenTok automatically displays exception event messages.
*/
function exceptionHandler(event) {
  alert("Exception: " + event.code + "::" + event.message);
}

//--------------------------------------
//  HELPER METHODS
//--------------------------------------

function addStream(stream) {
  // Check if this is the stream that I am publishing, and if so do not publish.
  if (stream.connection.connectionId == session.connection.connectionId) {
    return;
  }
  var subscriberDiv = document.createElement('div'); // Create a div for the subscriber to replace
  subscriberDiv.setAttribute('id', stream.streamId); // Give the replacement div the id of the stream as its id.
  document.getElementById("subscribers").appendChild(subscriberDiv);
  var subscriberProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT};
  subscribers[stream.streamId] = session.subscribe(stream, subscriberDiv.id, subscriberProps);
}

function show(id) {
  document.getElementById(id).style.display = 'block';
}

function hide(id) {
  document.getElementById(id).style.display = 'none';
}