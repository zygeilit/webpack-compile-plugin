
function WebpackCompilePlugin(options) {};

WebpackCompilePlugin.prototype.apply = function(compiler) {
    var self = this;

    // 在compile事件之后绑定’this-compilation‘事件
    // 用意是：在所有webpack内部组件绑定完’this-compilation‘事件之后，再绑定自定义的’this-compilation‘事件
    compiler.plugin("compile", function(params) {

         compiler.plugin("this-compilation", function(compilation) {
        
            // 所有的打包后文件都会调用’this-compilation‘事件，比如: html-webpack-plugin 插件，和 cass loader
            // 判断只有umd时，再使用自定义的’MainTemplate‘，目标是：把需要使用自定义‘MainTemplate’的打包文件限制在chunkJs和mainJs里
            // todo 可能限制不够严格， 但目前 talent-libs, ethos, generate-talentUI 项目使用此组件正常
            switch(this.options.output.libraryTarget) {
                case 'umd':
                case 'umd2':
                    var UmdMainTemplatePlugin = require("./UmdMainTemplatePlugin");
                    var output = compiler.options.output;
                    compilation.apply(
                        new UmdMainTemplatePlugin(
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

module.exports = WebpackCompilePlugin;
