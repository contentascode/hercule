'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = IndentStream;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

/**
* Indents each line of a chunk by the provided indent amount
*
* Input stream: (object)
* - content (string, required)
* - indent (string, optional) - String to be appended to the start of each line.
*
* Output stream: (object)
* - content (string)
*/

var DEFAULT_OPTIONS = {
  input: 'content',
  output: 'content',
  indent: 'indent',
};

function IndentStream(opt) {
  var options = _lodash2.default.merge({}, DEFAULT_OPTIONS, opt);

  function transform(chunk, encoding, cb) {
    var indent = _lodash2.default.get(chunk, options.indent);
    var content = _lodash2.default.get(chunk, options.input);

    if (!indent) {
      this.push(chunk);
      return cb();
    }

    content = content.replace(/\n/g, '\n' + indent);
    var output = _lodash2.default.assign(
      chunk,
      _defineProperty({}, options.output, content)
    );

    this.push(output);
    return cb();
  }

  return _through2.default.obj(transform);
}
//# sourceMappingURL=indent-stream.js.map
