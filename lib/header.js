'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = Header;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function Header() {
  var inputBuffer = [];

  function transform(chunk, encoding, cb) {
    if (chunk.content) inputBuffer.push(chunk);

    // The input buffer shouldn't have more than two items in it at a time
    while (inputBuffer.length > 1) {
      var header = inputBuffer[0].header;
      var content = inputBuffer[0].content;

      if (header) {
        content = _lodash2.default.replace(
          content,
          /^(#+)([^#|\n]*)/g,
          '$1' + _lodash2.default.repeat('#', header) + '$2'
        );
        inputBuffer[0].content = content;
      }
      this.push(inputBuffer.shift());
    }

    return cb();
  }

  function flush(cb) {
    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer.length > 0) this.push(inputBuffer.shift());
    this.push(null);
    return cb();
  }

  return _through2.default.obj(transform, flush);
}
//# sourceMappingURL=header.js.map
