var CocoDojoRouter = Backbone.Router.extend({
  routes: {
    ":session_id": "dojo",
    ":session_id/sync": "sync"
  },
  dojo: function(codeSessionId) {
    Session.set("codeSessionId", codeSessionId);
  },
});
Router = new CocoDojoRouter;
Meteor.startup(function () {
  Backbone.history.start({pushState: true});
  $(document).ready(function() {
    if (window.location.pathname == "/") {
      var codeSessionId = CodeSession.insert({name: "New Dojo"});
      Router.navigate(codeSessionId, false);
    }
  }); 
});

