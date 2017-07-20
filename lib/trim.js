'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = Trim;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function Trim() {
  var NEWLINE = '\n';
  var inputBuffer = [];
  var memoContent = null;
  var memoSource = null;

  function transform(chunk, encoding, cb) {
    if (chunk.content === '') return cb();

    inputBuffer.push(chunk);

    while (inputBuffer.length > 1) {
      var nextFileIsAncestor =
        inputBuffer[1].parents &&
        _lodash2.default.includes(
          inputBuffer[0].parents,
          inputBuffer[1].source
        );
      var isFileEdge =
        inputBuffer[0].source !== inputBuffer[1].source &&
        memoSource !== inputBuffer[1].source;

      // EOF edge verify file is ending checking it isn't a parent of the next file
      if (isFileEdge && nextFileIsAncestor) {
        if (
          (inputBuffer[0].content.slice(-1) === NEWLINE ||
            memoContent === NEWLINE) &&
          inputBuffer[1].content.slice(0, 1) === NEWLINE
        ) {
          // Scenario A: transclusion at end of line since both characters are a new line
          //    remove new line from next file
          //    Edge: still be inline, can't yet push
          inputBuffer[1].content = inputBuffer[1].content.slice(1);
          memoContent = NEWLINE;
          memoSource = inputBuffer[1].source;

          if (inputBuffer[1].content === '') {
            // The token was only one character long.
            // The removed new line could either be EOF or mid-file
            inputBuffer.pop();
          }
        } else if (
          (inputBuffer[0].content.slice(-1) === NEWLINE ||
            memoContent === NEWLINE) &&
          inputBuffer[1].content.slice(0, 1) !== NEWLINE
        ) {
          // Scenario B: inline transclusion since next character is not a new line
          //   remove new line from end of file
          inputBuffer[0].content = inputBuffer[0].content.slice(0, -1);
          memoContent = null;
          memoSource = null;
        }
      } else {
        memoContent = null;
        memoSource = null;
      }

      if (inputBuffer.length > 1) {
        var out = inputBuffer.shift();
        this.push(out);
      }
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
//# sourceMappingURL=trim.js.map