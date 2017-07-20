'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = TrimStream;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
* Trims new line at EOF to allow a file to be transcluded inline.
* Multiple transclusions immediately before the end of file can also
* result excessive new lines accumulating.
*
* Input stream: (string)
*
* Output stream: (string)
*/

function TrimStream() {
  var inputBuffer = '';

  function transform(chunk, encoding, cb) {
    var input = chunk.toString('utf8');

    // Combine buffer and new input
    inputBuffer = inputBuffer.concat(input);

    // Return everything but the last character
    var output = inputBuffer.slice(0, -1);
    inputBuffer = inputBuffer.slice(-1);

    this.push(output);
    return cb();
  }

  function flush(cb) {
    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer !== '') {
      inputBuffer = inputBuffer.replace(/\n$/, '');
      this.push(inputBuffer);
    }

    this.push(null);
    return cb();
  }

  return _through2.default.obj(transform, flush);
}
//# sourceMappingURL=trim-stream.js.map
