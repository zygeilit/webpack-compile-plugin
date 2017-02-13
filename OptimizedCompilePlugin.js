var fs = require('fs');
var ConcatSource = require("webpack-sources/lib/ConcatSource");
var OriginalSource = require("webpack-sources").OriginalSource;
var PrefixSource = require("webpack-sources").PrefixSource;

function OptimizedCompilePlugin(options) {};

OptimizedCompilePlugin.prototype.generateModulesPreloaderID = function() {
    return 'OptimizedModules' + (new Date()).getTime();
}

OptimizedCompilePlugin.prototype.apply = function(compiler) {
    var self = this;

    compiler.plugin("compile", function(params) {

         compiler.plugin("this-compilation", function(compilation) {
        
            switch(this.options.output.libraryTarget) {
                case 'umd':
                case 'umd2':
                    var CustomUMDLibrary = require("./CustomUMDLibrary");
                    var output = compiler.options.output;
                    compilation.apply(
                        new CustomUMDLibrary(
                            output.library,
                            {
                                optionalAmdExternalAsGlobal: output.libraryTarget === "umd2",
                                namedDefine: output.umdNamedDefine
                            }
                        )
                    );
                    break;
                default: break;
            }
        })
    })
};

module.exports = OptimizedCompilePlugin;
