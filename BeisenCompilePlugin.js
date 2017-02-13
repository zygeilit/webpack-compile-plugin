var fs = require('fs');
var ConcatSource = require("webpack-sources/lib/ConcatSource");
var OriginalSource = require("webpack-sources").OriginalSource;
var PrefixSource = require("webpack-sources").PrefixSource;

function BeisenCompilerPlugin(options) {};

BeisenCompilerPlugin.prototype.generateModulesPreloaderID = function() {
    return 'BeisenOptimizedModules' + (new Date()).getTime();
}

BeisenCompilerPlugin.prototype.apply = function(compiler) {
    var self = this;

    compiler.plugin("compile", function(params) {

         compiler.plugin("this-compilation", function(compilation) {
        
            switch(this.options.output.libraryTarget) {
                case 'umd':
                case 'umd2':
                    var CusUMDLibrary = require("./CustomUMDLibrary");
                    var output = compiler.options.output;
                    compilation.apply(
                        new CusUMDLibrary(
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

module.exports = BeisenCompilerPlugin;









