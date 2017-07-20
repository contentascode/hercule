'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = SourceMapStream;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _sourceMap = require('source-map');

var _sourceMap2 = _interopRequireDefault(_sourceMap);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function updateCursor(cursor, content) {
  var currentLine = cursor.line;
  var currentColumn = cursor.column;

  var newLines = (content.match(/\n/g) || []).length;
  var newColumns = (content.match(/.*$/g) || [''])[0].length;

  var line = currentLine + newLines;
  var column = newLines > 0 ? newColumns : currentColumn + newColumns;

  return { line: line, column: column };
}

function SourceMapStream() {
  var generatedFile = arguments.length > 0 && arguments[0] !== undefined
    ? arguments[0]
    : 'string';

  var mappings = [];
  var cursor = {
    line: 1,
    column: 0,
  };

  function transform(chunk, encoding, cb) {
    var content = chunk.content;
    var originalLocation = { line: chunk.line, column: chunk.column };

    if (content === '') return cb();
    if (!generatedFile) return cb();

    mappings.push({
      source: _path2.default.relative(
        _path2.default.dirname(generatedFile),
        chunk.source
      ),
      original: originalLocation,
      generated: cursor,
    });
    cursor = updateCursor(cursor, content);

    this.push(chunk);
    return cb();
  }

  function flush(cb) {
    if (!generatedFile) return cb();

    var generator = new _sourceMap2.default.SourceMapGenerator({
      file: _path2.default.relative(__dirname, generatedFile),
    });
    _lodash2.default.forEach(mappings, function(map) {
      return generator.addMapping(map);
    });
    this.emit('sourcemap', JSON.parse(generator.toString()));
    return cb();
  }

  return _through2.default.obj(transform, flush);
}
//# sourceMappingURL=sourcemap.js.map