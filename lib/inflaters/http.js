'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = inflate;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function inflate(link, chunk, cb) {
  var _this = this;

  return _request2.default.get(link).on('response', function(res) {
    if (res.statusCode !== 200) {
      _this.emit('error', { msg: res.statusMessage, path: link });
      cb();
    }
  });
}
//# sourceMappingURL=http.js.map
