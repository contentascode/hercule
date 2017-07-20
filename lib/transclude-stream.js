'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = Transcluder;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _duplexer = require('duplexer2');

var _duplexer2 = _interopRequireDefault(_duplexer);

var _through2Get = require('through2-get');

var _through2Get2 = _interopRequireDefault(_through2Get);

var _regexpStreamTokenizer = require('regexp-stream-tokenizer');

var _regexpStreamTokenizer2 = _interopRequireDefault(_regexpStreamTokenizer);

var _resolveStream = require('./resolve-stream');

var _resolveStream2 = _interopRequireDefault(_resolveStream);

var _inflateStream = require('./inflate-stream');

var _inflateStream2 = _interopRequireDefault(_inflateStream);

var _indentStream = require('./indent-stream');

var _indentStream2 = _interopRequireDefault(_indentStream);

var _config = require('./config');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
* Input stream: string
*
* Output stream: string
*/

var DEFAULT_OPTIONS = {
  input: 'link',
  output: 'content',
};

function Transcluder(opt, linkPaths) {
  var options = _lodash2.default.merge({}, DEFAULT_OPTIONS, opt);
  var source = options.source;

  function token(match) {
    return (0, _config.defaultToken)(match, options);
  }

  function separator(match) {
    return (0, _config.defaultSeparator)(match);
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
  var resolver = new _resolveStream2.default(source, linkPaths);
  var inflater = new _inflateStream2.default(
    { linkRegExp: options.linkRegExp, linkMatch: options.linkMatch },
    linkPaths
  );
  var indenter = new _indentStream2.default();
  var stringify = (0, _through2Get2.default)('content');

  tokenizer.pipe(resolver).pipe(inflater).pipe(indenter).pipe(stringify);

  var transcluder = (0, _duplexer2.default)(tokenizer, stringify);

  resolver.on('error', function(err) {
    transcluder.emit('error', err);
    resolver.end();
  });

  inflater.on('error', function(err) {
    transcluder.emit('error', err);
    inflater.end();
  });

  return transcluder;
}
//# sourceMappingURL=transclude-stream.js.map
