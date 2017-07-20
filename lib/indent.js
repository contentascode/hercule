'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = Indent;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function Indent() {
  var NEWLINE = '\n';
  var inputBuffer = [];

  function transform(chunk, encoding, cb) {
    if (chunk.content) inputBuffer.push(chunk);

    // The input buffer shouldn't have more than two items in it at a time
    while (inputBuffer.length > 1) {
      var indent = inputBuffer[1].indent;
      var content = inputBuffer[1].content;
      var preceededNewLine = inputBuffer[0].content.slice(-1) === NEWLINE;
      var beginsNewLine = inputBuffer[1].content.slice(0, 1) === NEWLINE;

      if (indent) {
        if (preceededNewLine && !beginsNewLine) content = indent + content;

        content = _lodash2.default.replace(
          content,
          /\n(?!\s|$)/g,
          '\n' + indent
        );
        inputBuffer[1].content = content;
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
//# sourceMappingURL=indent.js.map