'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = inflate;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function inflate(link, chunk, cb) {
  var _this = this;

  return _fs2.default
    .createReadStream(link, { encoding: 'utf8' })
    .on('error', function(err) {
      _this.push(chunk);
      _this.emit(
        'error',
        _lodash2.default.merge(err, { msg: 'Could not read file' })
      );
      cb();
    });
}
//# sourceMappingURL=local.js.map
