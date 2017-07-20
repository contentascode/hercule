'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = InflateStream;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _duplexer = require('duplexer2');

var _duplexer2 = _interopRequireDefault(_duplexer);

var _regexpStreamTokenizer = require('regexp-stream-tokenizer');

var _regexpStreamTokenizer2 = _interopRequireDefault(_regexpStreamTokenizer);

var _resolveStream = require('./resolve-stream');

var _resolveStream2 = _interopRequireDefault(_resolveStream);

var _trimStream = require('./trim-stream');

var _trimStream2 = _interopRequireDefault(_trimStream);

var _local = require('./inflaters/local');

var _local2 = _interopRequireDefault(_local);

var _http = require('./inflaters/http');

var _http2 = _interopRequireDefault(_http);

var _config = require('./config');

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

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}

/**
* Input stream: object
* - link (object, required)
*   - href (string, required)
*   - hrefType (enum, required)
* - parents (array, required)
* - references (array, required)
*
* Output stream: object
* - chunk (string, required)
*
* Input and output properties can be altered by providing options
*/

var DEFAULT_OPTIONS = {
  input: 'link',
  output: 'content',
};

function InflateStream(opt, linkPaths) {
  var options = _lodash2.default.merge({}, DEFAULT_OPTIONS, opt);

  function inflateDuplex(chunk, link) {
    var resolver = new _resolveStream2.default(link.href, linkPaths);
    var inflater = new InflateStream();
    var trimmer = new _trimStream2.default();

    function token(match) {
      return _lodash2.default.merge(
        (0, _config.defaultToken)(match, options, chunk.indent),
        {
          relativePath: _path2.default.dirname(link.href),
          references: [].concat(_toConsumableArray(chunk.references)),
          parents: [link.href].concat(_toConsumableArray(chunk.parents)),
        }
      );
    }

    function separator(match) {
      return _lodash2.default.merge((0, _config.defaultSeparator)(match), {
        indent: chunk.indent,
      });
    }

    var tokenizerOptions = {
      leaveBehind: '' + _config.WHITESPACE_GROUP,
      token: token,
      separator: separator,
    };
    var tokenizer = (0, _regexpStreamTokenizer2.default)(
      tokenizerOptions,
      options.linkRegExp || _config.linkRegExp
    );

    trimmer.pipe(tokenizer).pipe(resolver).pipe(inflater);

    return (0, _duplexer2.default)({ objectMode: true }, trimmer, inflater);
  }

  // eslint-disable-next-line consistent-return
  function transform(chunk, encoding, cb) {
    var _this = this;

    var link = chunk[options.input];
    var parents = chunk.parents;
    var self = this;
    var input = void 0;

    if (!link) {
      this.push(chunk);
      return cb();
    }

    if (_lodash2.default.includes(parents, link.href)) {
      this.push(chunk);
      this.emit('error', {
        msg: 'Circular dependency detected',
        path: link.href,
      });
      return cb();
    }

    if (
      _lodash2.default.includes(
        _lodash2.default.values(_config.LINK_TYPES),
        link.hrefType
      ) === false
    ) {
      this.push(chunk);
      return cb();
    }

    if (link.hrefType === _config.LINK_TYPES.STRING) {
      this.push(
        _lodash2.default.assign(
          chunk,
          _defineProperty({}, options.output, link.href)
        )
      );
      return cb();
    }

    // Inflate local or remote file streams
    var inflater = inflateDuplex(chunk, link);
    if (link.hrefType === _config.LINK_TYPES.LOCAL)
      input = _local2.default.call(this, link.href, chunk, cb);
    if (link.hrefType === _config.LINK_TYPES.HTTP)
      input = _http2.default.call(this, link.href, chunk, cb);

    inflater
      .on('readable', function inputReadable() {
        var content = void 0;
        while ((content = this.read()) !== null) {
          self.push(content);
        }
      })
      .on('error', function(err) {
        _this.emit('error', err);
        cb();
      })
      .on('end', function() {
        return cb();
      });

    input.pipe(inflater);
  }

  return _through2.default.obj(transform);
}
//# sourceMappingURL=inflate-stream.js.map
