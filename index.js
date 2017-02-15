'use strict';
var crypto = require('crypto');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var fs = require('fs');

function md5(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var plugin = function (options) {
	options = options || {base:'build', configFile:'js/seajs-config.js'};
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-seajs-rev', 'Streaming not supported'));
			return;
		}

		var seajsConfigPath = path.join(options.base, options.configFile);

		var manifest = JSON.parse(file.contents);
		var jsManifest = [];

		for(var fileName in manifest) {
			if (fileName.endsWith('.js')) {
				jsManifest.push([fileName, manifest[fileName]]);
			}
		}

		var configString = 'seajs.config({map:' + JSON.stringify(jsManifest) + '});\n'
		var seajsConfig = fs.readFileSync(seajsConfigPath, 'utf-8');

		seajsConfig = configString + seajsConfig;

		fs.writeFileSync(seajsConfigPath, seajsConfig);

		var hash = md5(seajsConfig).slice(0, 8);
		var ext = path.extname(seajsConfigPath);
		var filename = path.basename(seajsConfigPath, ext) + '-' + hash + ext;

		fs.writeFileSync(path.join(path.dirname(seajsConfigPath), filename), seajsConfig);

		manifest[path.basename(seajsConfigPath, ext)+'.js'] = filename;

		file.contents = new Buffer(JSON.stringify(manifest, null, 4));

		cb(null, file);
	});
};

module.exports = plugin;
