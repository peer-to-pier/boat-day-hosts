define([
'parse'
], function(Parse){
	var FileHolderModel = Parse.Object.extend("FileHolder", {

		defaults: {
			file: null,
			host: null,
			order: null, 
			expiryDate: null
		}
 
	});
	return FileHolderModel;
});