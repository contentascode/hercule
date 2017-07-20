'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.resolveHttpUrl = resolveHttpUrl;
exports.resolveLocalUrl = resolveLocalUrl;
exports.resolveString = resolveString;
exports.resolveToReadableStream = resolveToReadableStream;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

var _isstream = require('isstream');

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function resolveHttpUrl(url) {
  // TODO: handle relative link in
  var isHttpUrl = /^https?:\/\//;
  if (!isHttpUrl.test(url)) return null;

  var content = _got2.default.stream(url);

  // Manually trigger error since 2XX respsonse doesn't trigger error despite not having expected content
  content.on('response', function error(res) {
    if (res.statusCode !== 200)
      this.emit('error', { message: 'Could not read file', path: url });
  });

  return { content: content, url: url };
}

function resolveLocalUrl(url, sourcePath) {
  var isLocalUrl = /^[^ ()"']+/;
  if (!isLocalUrl.test(url)) return null;

  var relativePath = _path2.default.dirname(sourcePath);
  var localUrl = _path2.default.join(relativePath, url);

  var content = _fs2.default.createReadStream(localUrl, { encoding: 'utf8' });

  return { content: content, url: localUrl };
}

function resolveString(input) {
  var isQuotedString = /^["'].*["']$/;
  if (!isQuotedString.test(input)) return null;

  return { content: input.slice(1, -1) };
}

var defaultResolvers = [resolveHttpUrl, resolveLocalUrl, resolveString];

// Resolves link to string or stream
//  - resolvers is an array of synchronus functions that return null, string or stream.
//  - stream requires processing
//  - string assumed fully processed
function resolveToReadableStream(link) {
  var resolvers = arguments.length > 1 && arguments[1] !== undefined
    ? arguments[1]
    : defaultResolvers;
  var placeholder = arguments[2];

  var _$reduce = _lodash2.default.reduce(
    resolvers,
    function(memo, resolver) {
      return memo || resolver(link.url, link.source, placeholder);
    },
    null
  ),
    content = _$reduce.content,
    url = _$reduce.url;

  var outputStream = void 0;

  if (_lodash2.default.isString(content)) {
    outputStream = (0, _through2.default)({ objectMode: true });

    outputStream.push({
      content: content,
      source: link.source,
      line: link.line,
      column: link.column,
    });
    outputStream.push(null);
  } else if ((0, _isstream.isReadable)(content)) {
    outputStream = content;
  } else {
    throw new Error("no readable stream or string, resolve '" + link.url + "'");
  }

  return { contentStream: outputStream, resolvedUrl: url };
}
//# sourceMappingURL=resolver.js.map