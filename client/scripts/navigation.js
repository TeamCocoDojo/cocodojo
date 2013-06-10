Template.navigation.events = {
  'click #username-navlink': function(e) {
    var newUsername = window.prompt("Set Username", Session.get("username"));
    if(newUsername != null && $.trim(newUsername) != ""){
      Session.set("username", newUsername);
      localStorage['username'] = newUsername;
    }
  }
}

Template.navigation.rendered = function() {
  $(".navbar-inner img").click(function(e) {
    e.stopPropagation();
  });
}
