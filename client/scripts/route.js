var CocoDojoRouter = Backbone.Router.extend({
  routes: {
    ":session_id": "dojo",
    ":session_id/sync": "sync"
  },
  dojo: function(codeSessionId) {
    Session.set("codeSessionId", new Meteor.Collection.ObjectID(codeSessionId));
  },
});
Router = new CocoDojoRouter;


