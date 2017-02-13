
var ConcatSource = require("webpack-core/lib/ConcatSource");
var OriginalSource = require("webpack-core/lib/OriginalSource");
var PrefixSource = require("webpack-sources").PrefixSource;
var Template = require("webpack/lib/Template");
var CustomModuleTemplate = require('./CustomModuleTemplate');

function accessorToObjectAccess(accessor) {
	return accessor.map(function(a) {
		return "[" + JSON.stringify(a) + "]";
	}).join("");
}

function accessorAccess(base, accessor) {
	accessor = [].concat(accessor);
	return accessor.map(function(a, idx) {
		a = base + accessorToObjectAccess(accessor.slice(0, idx + 1));
		if(idx === accessor.length - 1) return a;
		return a + " = " + a + " || {}";
	}).join(", ");
}

function CustomUMDLibrary(name, options) {
	this.name = name;
	this.optionalAmdExternalAsGlobal = options.optionalAmdExternalAsGlobal;
	this.namedDefine = options.namedDefine;
}

CustomUMDLibrary.prototype.apply = function(compilation) {

	var mainTemplate = compilation.mainTemplate;

	compilation.templatesPlugin("render-with-entry", function(source, chunk, hash) {
		
		if(chunk.entry) return source;

		var externals = chunk.modules.filter(function(m) {
			return m.external;
		});
		var optionalExternals = [],
			requiredExternals = [];
		if(this.optionalAmdExternalAsGlobal) {
			externals.forEach(function(m) {
				if(m.optional) {
					optionalExternals.push(m);
				} else {
					requiredExternals.push(m);
				}
			});
			externals = requiredExternals.concat(optionalExternals);
		} else {
			requiredExternals = externals;
		}

		function replaceKeys(str) {
			return mainTemplate.applyPluginsWaterfall("asset-path", str, {
				hash: hash,
				chunk: chunk
			});
		}

		function externalsDepsArray(modules) {
			return "[" + replaceKeys(modules.map(function(m) {
				return JSON.stringify(typeof m.request === "object" ? m.request.amd : m.request);
			}).join(", ")) + "]";
		}

		function externalsRootArray(modules) {
			return replaceKeys(modules.map(function(m) {
				var request = m.request;
				if(typeof request === "object") request = request.root;
				return "root" + accessorToObjectAccess([].concat(request));
			}).join(", "));
		}

		function externalsRequireArray(type) {
			return replaceKeys(externals.map(function(m) {
				var request = m.request;
				if(typeof request === "object") request = request[type];
				if(Array.isArray(request)) {
					var expr = "require(" + JSON.stringify(request[0]) + ")" + accessorToObjectAccess(request.slice(1));
				} else
					var expr = "require(" + JSON.stringify(request) + ")";
				if(m.optional) {
					expr = "(function webpackLoadOptionalExternalModule() { try { return " + expr + "; } catch(e) {} }())";
				}
				return expr;
			}).join(", "));
		}

		function externalsArguments(modules) {
			return modules.map(function(m) {
				return "__WEBPACK_EXTERNAL_MODULE_" + m.id + "__";
			}).join(", ");
		}

		function libraryName(library) {
			return JSON.stringify(replaceKeys([].concat(library).pop()));
		}

		function externalsArgumentsList(modules) {
            return modules.map(function(m) {
                return "__WEBPACK_EXTERNAL_MODULE_" + m.id + "__";
            });
        }

        function externalsGlobalArgumentsVar() {
            return "__WEBPACK_EXTERNALS_" + chunk.hash
        }

		if(optionalExternals.length > 0) {
			var amdFactory = "function webpackLoadOptionalExternalModuleAmd(" + externalsArguments(requiredExternals) + ") {\n" +
				"			return factory(" + (
					requiredExternals.length > 0 ?
					externalsArguments(requiredExternals) + ", " + externalsRootArray(optionalExternals) :
					externalsRootArray(optionalExternals)
				) + ");\n" +
				"		}";
		} else {
			var amdFactory = "factory";
		}

		var hash = compilation.hash;
		var moduleTemplate = compilation.moduleTemplate;
		var dependencyTemplates = compilation.dependencyTemplates;

		// 自定义的模块解析函数
		var cusModuleTemplate = new CustomModuleTemplate(compilation.outputOptions);

		var modules = compilation.chunkTemplate.renderChunkModules(chunk, cusModuleTemplate, dependencyTemplates, "/******/ ");
        var moduleListSource = mainTemplate.applyPluginsWaterfall("modules", modules, chunk, hash, cusModuleTemplate, dependencyTemplates);

        var externalsHeadSource = [
            "\n\n/******/ // attach entry arguments to private name-space\n",
            "\t"+ externalsGlobalArgumentsVar() +" = {};\n",
        ];

        var externalsArgList = externalsArgumentsList(externals);

        for(var i=0; i<externalsArgList.length; i++) {
            externalsHeadSource.push([
                "\t",
                externalsGlobalArgumentsVar(), "[",
                "'", externalsArgList[i], "'",
                "] = ",
                externalsArgList[i], "\n"
            ].join(''))
        }
        externalsHeadSource.push("\n/************************************************************************/\n");

		var umdWrapSource = new OriginalSource(
			"(function webpackUniversalModuleDefinition(root, factory) {\n" +
			"	if(typeof exports === 'object' && typeof module === 'object')\n" +
			"		module.exports = factory(" + externalsRequireArray("commonjs2") + ");\n" +
			"	else if(typeof define === 'function' && define.amd)\n" +
			(requiredExternals.length > 0 ?
				(this.name && this.namedDefine === true ?
					"		define(" + libraryName(this.name) + ", " + externalsDepsArray(requiredExternals) + ", " + amdFactory + ");\n" :
					"		define(" + externalsDepsArray(requiredExternals) + ", " + amdFactory + ");\n"
				) :
				(this.name && this.namedDefine === true ?
					"		define(" + libraryName(this.name) + ", [], " + amdFactory + ");\n" :
					"		define([], " + amdFactory + ");\n"
				)
			) +
			(this.name ?
				"	else if(typeof exports === 'object')\n" +
				"		exports[" + libraryName(this.name) + "] = factory(" + externalsRequireArray("commonjs") + ");\n" +
				"	else\n" +
				"		" + replaceKeys(accessorAccess("root", this.name)) + " = factory(" + externalsRootArray(externals) + ");\n" :
				"	else {\n" +
				(externals.length > 0 ?
					"		var a = typeof exports === 'object' ? factory(" + externalsRequireArray("commonjs") + ") : factory(" + externalsRootArray(externals) + ");\n" :
					"		var a = factory();\n"
				) +
				"		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];\n" +
				"	}\n"
			) +
			"})(this, function(" + externalsArguments(externals) + ") {" +
			externalsHeadSource.join('') +
			"\nreturn "

			,"webpack/universalModuleDefinition"
		);

		var modulesPreloaderID = '__Beisen_Module_PreloadID_' + new Date().getTime() + '__';

		var jsonpFunction = compilation.outputOptions.jsonpFunction || Template.toIdentifier("webpackJsonp" + (this.name || ""));
		var chunkModulesSource = new ConcatSource();
		chunkModulesSource.add(jsonpFunction + "(" + JSON.stringify(chunk.ids) + ",");
		chunkModulesSource.add(modulesPreloaderID);

		// var buf = [];
		// buf.push(mainTemplate.applyPluginsWaterfall("bootstrap", "", chunk, hash, moduleTemplate, dependencyTemplates));
		// buf.push(mainTemplate.applyPluginsWaterfall("local-vars", "", chunk, hash));
		// buf.push("");
		// buf.push("// The require function");
		// buf.push("function " + mainTemplate.requireFn + "(moduleId) {");
		// buf.push(mainTemplate.indent(mainTemplate.applyPluginsWaterfall("require", "", chunk, hash)));

		// buf.push("}");
		// buf.push("");
		// buf.push(mainTemplate.asString(mainTemplate.applyPluginsWaterfall("require-extensions", "", chunk, hash)));
		// buf.push("");
		// buf.push(mainTemplate.asString(mainTemplate.applyPluginsWaterfall("startup", "", chunk, hash)));
		// var bootstrapSource = new OriginalSource(mainTemplate.prefix(buf, " \t") + "\n", "webpack/bootstrap " + hash);

		// var modulesPreloaderID = '__Beisen_Module_PreloadID_' + new Date().getTime() + '__';

		// var moduleWrapSource = new ConcatSource();
		// moduleWrapSource.add("/******/ (function(modules) { // webpackBootstrap\n");
		// moduleWrapSource.add(new PrefixSource("/******/", bootstrapSource));
		// moduleWrapSource.add("/******/ })\n");
		// moduleWrapSource.add("/************************************************************************/\n");
		// moduleWrapSource.add("/******/ (" + modulesPreloaderID + ");");

		var concatedSource = new ConcatSource(
			"var " + modulesPreloaderID + " = ",
			moduleListSource,
			";\n\n\n",
			umdWrapSource,
			chunkModulesSource,
			")\n});"
		);

		return concatedSource;
	}.bind(this));

};

module.exports = CustomUMDLibrary;