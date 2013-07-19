var cocodojo = cocodojo || {};

cocodojo.util = {

	isTextFile: function (name) {
		var mimetype = MimeType.lookup(name);
  		if (mimetype.indexOf("text") != -1 || mimetype.indexOf("xml") != -1) {
    		return true;
  		}
  		return false;
	},

	isValidFileName: function (name) {

	}
};