Template.navigation.events = {
  'click #username-navlink': function(e) {
    var newUsername = window.prompt("Set Username", Session.get("username"));
    if(newUsername != null && $.trim(newUsername) != ""){
      Meteor.call('renameUser', Session.get("codeSessionId"), Session.get("userId"), newUsername);
      Session.set("username", newUsername);
      localStorage['username'] = newUsername;
    }
  },

  'click #logout': function(e) {
    Meteor.logout();
  }
}

