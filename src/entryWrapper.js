var constant = require('./constant');

module.exports = function(opts) {

	var modules = opts['externalModules'] || [];

    for (var i = 0; i < modules.length; i++) {

    	var obj = {};
    	obj[constant.external_constructor] = modules[i].value;
        obj[constant.external_assert] = true;

        window[modules[i].name] = obj;
    }
}