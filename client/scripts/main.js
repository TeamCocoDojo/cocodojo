Meteor.startup(function () {
  $(document).ready(function() {
    $('#content').css('height', $('body').height()-62+'px');
    $(window).resize(function() {
      $('#content').css('height', $('body').height()-62+'px');
    });
  });
});

