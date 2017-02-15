var Template = require("webpack/lib/Template");

var OriginalSource = require("webpack/lib/OriginalSource");
var RawSource = require("webpack/lib/RawSource");
var WebpackMissingModule = require("webpack/lib/dependencies/WebpackMissingModule");

var constant = require('./constant');

module.exports = {
	return : function(dependencyTemplates, outputOptions, requestShortener, chunk) {
		var str = "throw new Error('Externals not supported');";
		var request = this.request;
		if(typeof request === "object") request = request[this.type];
		switch(this.type) {
			case "this":
			case "window":
			case "global":
				if(Array.isArray(request)) {
					str = "(function() { module.exports = " + this.type + request.map(function(r) {
						return "[" + JSON.stringify(r) + "]";
					}).join("") + "; }());";
				} else
					str = "(function() { module.exports = " + this.type + "[" + JSON.stringify(request) + "]; }());";
				break;
			case "commonjs":
			case "commonjs2":
				if(Array.isArray(request)) {
					str = "module.exports = require(" + JSON.stringify(request[0]) + ")" + request.slice(1).map(function(r) {
						return "[" + JSON.stringify(r) + "]";
					}).join("") + ";";
				} else
					str = "module.exports = require(" + JSON.stringify(request) + ");";
				break;
			case "amd":
			case "umd":
			case "umd2":
				str = "";
				if(this.optional) {
					str += "if(typeof __WEBPACK_EXTERNAL_MODULE_" + this.id + "__ === 'undefined') {" + WebpackMissingModule.moduleCode(request) + "}\n";
				}
				var hash = chunk.hash;
				var moduleArgName = "__WEBPACK_EXTERNAL_MODULE_" + this.id + "__";
				str += "\n"+ moduleArgName +" = __WEBPACK_EXTERNALS_" + hash + "['"+ moduleArgName +"'];\n";
				str += "if("+ moduleArgName + "." + constant.external_assert + ") { "+ moduleArgName +" = "+ moduleArgName +"." + constant.external_constructor + "(); };\n";
				str += "module.exports = "+ moduleArgName +";\n";
				break;
			default:
				str = "";
				if(this.optional) {
					str += "if(typeof " + request + " === 'undefined') {" + WebpackMissingModule.moduleCode(request) + "}\n";
				}
				str += "module.exports = " + request + ";";
				break;
		}
		if(this.useSourceMap) {
			return new OriginalSource(str, this.identifier());
		} else {
			return new RawSource(str);
		}
	};
}