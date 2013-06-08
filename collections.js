CodeSession = new Meteor.Collection("codeSession");
if (Meteor.isClient) {
  this.cocodojo = this.cocodojo || {};
  this.cocodojo.CodeSession = CodeSession;
}
