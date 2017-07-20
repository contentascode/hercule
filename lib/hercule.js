'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.resolveString = exports.resolveLocalUrl = exports.resolveHttpUrl = undefined;

var _resolver = require('./resolver');

Object.defineProperty(exports, 'resolveHttpUrl', {
  enumerable: true,
  get: function get() {
    return _resolver.resolveHttpUrl;
  },
});
Object.defineProperty(exports, 'resolveLocalUrl', {
  enumerable: true,
  get: function get() {
    return _resolver.resolveLocalUrl;
  },
});
Object.defineProperty(exports, 'resolveString', {
  enumerable: true,
  get: function get() {
    return _resolver.resolveString;
  },
});
exports.TranscludeStream = TranscludeStream;
exports.transcludeString = transcludeString;
exports.transcludeFile = transcludeFile;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _duplexer = require('duplexer3');

var _duplexer2 = _interopRequireDefault(_duplexer);

var _through2Get = require('through2-get');

var _through2Get2 = _interopRequireDefault(_through2Get);

var _getStream = require('get-stream');

var _getStream2 = _interopRequireDefault(_getStream);

var _transclude = require('./transclude');

var _transclude2 = _interopRequireDefault(_transclude);

var _indent = require('./indent');

var _indent2 = _interopRequireDefault(_indent);

var _trim = require('./trim');

var _trim2 = _interopRequireDefault(_trim);

var _sourcemap = require('./sourcemap');

var _sourcemap2 = _interopRequireDefault(_sourcemap);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function TranscludeStream() {
  var source = arguments.length > 0 && arguments[0] !== undefined
    ? arguments[0]
    : 'input';
  var options = arguments[1];

  var outputFile = _lodash2.default.get(options, 'outputFile');
  var sourceMap = void 0;

  var transclude = new _transclude2.default(source, options);
  var indenter = new _indent2.default();
  var trim = new _trim2.default();
  var sourcemap = new _sourcemap2.default(outputFile);
  var stringify = (0, _through2Get2.default)('content');

  transclude.on('error', function() {
    return transclude.end();
  });
  sourcemap.on('sourcemap', function(generatedSourceMap) {
    return (sourceMap = generatedSourceMap);
  });

  transclude.pipe(trim).pipe(indenter).pipe(sourcemap).pipe(stringify);

  var transcluder = (0, _duplexer2.default)(
    { bubbleErrors: false },
    transclude,
    stringify
  );
  transcluder.on('end', function() {
    return transcluder.emit('sourcemap', sourceMap);
  });

  return transcluder;
}

function transcludeString() {
  for (
    var _len = arguments.length, args = Array(_len), _key = 0;
    _key < _len;
    _key++
  ) {
    args[_key] = arguments[_key];
  }

  var input = args.shift();
  var cb = args.pop();
  var _args$ = args[0],
    options = _args$ === undefined ? {} : _args$;

  var source = _lodash2.default.get(options, 'source') || 'string';

  var transclude = new TranscludeStream(source, options);
  var sourceMap = void 0;

  transclude.on('sourcemap', function(srcmap) {
    return (sourceMap = srcmap);
  });
  transclude.write(input, 'utf8');
  transclude.end();

  (0, _getStream2.default)(transclude)
    .then(function(output) {
      return cb(null, output, sourceMap);
    })
    .catch(function(err) {
      return cb(err, err.bufferedData, sourceMap);
    });
}

function transcludeFile() {
  for (
    var _len2 = arguments.length, args = Array(_len2), _key2 = 0;
    _key2 < _len2;
    _key2++
  ) {
    args[_key2] = arguments[_key2];
  }

  var input = args.shift();
  var cb = args.pop();
  var _args$2 = args[0],
    options = _args$2 === undefined ? {} : _args$2;

  var transclude = new TranscludeStream(input, options);
  var inputStream = _fs2.default.createReadStream(input, { encoding: 'utf8' });
  var sourceMap = void 0;

  transclude.on('sourcemap', function(srcmap) {
    return (sourceMap = srcmap);
  });
  inputStream.on('error', function(err) {
    return cb(err);
  });
  inputStream.pipe(transclude);

  (0, _getStream2.default)(transclude)
    .then(function(output) {
      return cb(null, output, sourceMap);
    })
    .catch(function(err) {
      return cb(err, err.bufferedData, sourceMap);
    });
}
//# sourceMappingURL=hercule.js.map