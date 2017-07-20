'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = Transclude;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _cloneRegexp = require('clone-regexp');

var _cloneRegexp2 = _interopRequireDefault(_cloneRegexp);

var _leftSplit = require('left-split');

var _leftSplit2 = _interopRequireDefault(_leftSplit);

var _resolver = require('./resolver');

var _parse = require('./parse');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
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

var SYNTAX = {
  hercule: {
    REGEXP: /(^[\t ]*)?:\[.*?]\((.*?)\)/gm,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 2,
  },
  aglio: {
    REGEXP: /( *)?(<!-- include\((.*?)\) -->)/gim,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 3,
  },
  marked: {
    REGEXP: /( *)?<<\[(.*)]/gm,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 2,
  },
  multimarkdown: {
    REGEXP: /( *)?{{(.*)}}/gm,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 2,
  },
};

function shiftCursor(content, _ref) {
  var line = _ref.line,
    column = _ref.column;

  var newLines = (content.match(/\n/g) || []).length;
  var newColumns = content.match(/.*$/g)[0].length;

  var newLine = line + newLines;
  var newColumn = newLines > 0 ? newColumns : column + newColumns;

  return { line: newLine, column: newColumn };
}

function applyReferences(chunk) {
  var source = chunk.source,
    line = chunk.line,
    column = chunk.column;

  var transclusionLink = chunk.link;
  var inheritedReferences = chunk.references;

  var _parseContent = (0, _parse.parseContent)(transclusionLink, {
    source: source,
    line: line,
    column: column,
  }),
    contentLink = _parseContent.contentLink,
    scopeReferences = _parseContent.scopeReferences,
    descendantReferences = _parseContent.descendantReferences;

  // Inherited reference take precendence over fallback reference

  var contextReferences = [].concat(
    _toConsumableArray(inheritedReferences),
    _toConsumableArray(scopeReferences)
  );
  var link =
    _lodash2.default.find(contextReferences, {
      placeholder: contentLink.url,
    }) || contentLink;

  // Prefer nearest inherited reference
  var nextReferences = _lodash2.default.uniqBy(
    [].concat(
      _toConsumableArray(descendantReferences),
      _toConsumableArray(inheritedReferences)
    ),
    'placeholder'
  );

  return { link: link, nextReferences: nextReferences };
}

function Transclude() {
  var source = arguments.length > 0 && arguments[0] !== undefined
    ? arguments[0]
    : 'string';
  var options = arguments.length > 1 && arguments[1] !== undefined
    ? arguments[1]
    : {};
  var _options$transclusion = options.transclusionSyntax,
    transclusionSyntax = _options$transclusion === undefined
      ? 'hercule'
      : _options$transclusion,
    _options$inheritedPar = options.inheritedParents,
    inheritedParents = _options$inheritedPar === undefined
      ? []
      : _options$inheritedPar,
    _options$inheritedRef = options.inheritedReferences,
    inheritedReferences = _options$inheritedRef === undefined
      ? []
      : _options$inheritedRef,
    _options$inheritedInd = options.inheritedIndent,
    inheritedIndent = _options$inheritedInd === undefined
      ? ''
      : _options$inheritedInd,
    resolvers = options.resolvers;
  var _SYNTAX$transclusionS = SYNTAX[transclusionSyntax],
    REGEXP = _SYNTAX$transclusionS.REGEXP,
    MATCH_GROUP = _SYNTAX$transclusionS.MATCH_GROUP,
    INDENT_GROUP = _SYNTAX$transclusionS.INDENT_GROUP,
    LINK_GROUP = _SYNTAX$transclusionS.LINK_GROUP;

  var pattern = (0, _cloneRegexp2.default)(REGEXP);
  var inputBuffer = '';
  var line = 1;
  var column = 0;

  function transclude(chunk, cb) {
    var self = this;

    // eslint-disable-next-line consistent-return
    process.nextTick(function() {
      if (!chunk.link) {
        self.push(chunk);
        return cb();
      }

      var parents = chunk.parents,
        indent = chunk.indent;

      var sourceLine = chunk.line;
      var sourceColumn = chunk.column;
      var content = chunk.content;

      var out = void 0;
      try {
        out = applyReferences(chunk);
      } catch (error) {
        self.push(chunk.link);
        return cb({
          message: 'Link could not be parsed',
          path: source,
          error: error,
          line: sourceLine,
          column: sourceColumn,
        });
      }

      var _out = out,
        link = _out.link,
        nextReferences = _out.nextReferences;

      link.content = content;

      var _resolveToReadableStr = (0, _resolver.resolveToReadableStream)(
        link,
        resolvers,
        content
      ),
        contentStream = _resolveToReadableStr.contentStream,
        resolvedUrl = _resolveToReadableStr.resolvedUrl;

      if (_lodash2.default.includes(parents, resolvedUrl)) {
        self.push(link);
        return cb({
          message: 'Circular dependency detected',
          path: resolvedUrl,
          line: link.line,
          column: link.column,
        });
      }

      // Resolved URL will be undefined for quoted strings: :[exmple](link || "fallback" reference:"string")
      var resolvedSource = resolvedUrl || link.source;
      var resolvedParents = resolvedSource ? parents : undefined;

      var nestedTransclude = new Transclude(resolvedSource, {
        transclusionSyntax: transclusionSyntax,
        inheritedParents: resolvedParents,
        inheritedReferences: nextReferences,
        inheritedIndent: indent,
        resolvers: resolvers,
      });

      nestedTransclude
        .on('readable', function inputReadable() {
          var streamContent = void 0;
          while ((streamContent = this.read()) !== null) {
            self.push(streamContent);
          }
        })
        .on('error', function(err) {
          return cb(err);
        })
        .on('end', function() {
          return cb(null, true);
        });
      contentStream.on('error', function(err) {
        return cb(err);
      });
      contentStream.pipe(nestedTransclude);
    });
  }

  function toToken(chunk) {
    var content = chunk[MATCH_GROUP];
    var link = chunk[LINK_GROUP];
    var indent = chunk[INDENT_GROUP] || '';

    var output = { content: content, line: line, column: column };
    output.link = link;
    output.source = source;
    output.parents = [].concat(_toConsumableArray(inheritedParents), [source]);
    output.references = [].concat(_toConsumableArray(inheritedReferences));
    output.indent = inheritedIndent + indent;
    output.column += content.lastIndexOf(link);

    var _shiftCursor = shiftCursor(content, { line: line, column: column });

    line = _shiftCursor.line;
    column = _shiftCursor.column;

    return output;
  }

  function toSeparators(separator) {
    // Each line must be processed individually for correct sourcemap output
    var separators = (0, _leftSplit2.default)(separator, /(\r?\n)/);

    separators = _lodash2.default.map(separators, function(content) {
      if (!content) return null;

      var output = { content: content, line: line, column: column };
      output.source = source;
      output.indent = inheritedIndent;
      output.parents = [].concat(_toConsumableArray(inheritedParents));

      var _shiftCursor2 = shiftCursor(content, { line: line, column: column });

      line = _shiftCursor2.line;
      column = _shiftCursor2.column;

      return output;
    });

    return _lodash2.default.without(separators, null);
  }

  function tokenize(chunk) {
    var lastChunk = !chunk;
    var nextOffset = 0;
    var match = null;
    var tokens = [];

    if (chunk) inputBuffer += chunk;

    while ((match = pattern.exec(inputBuffer)) !== null) {
      // Content prior to match can be returned without transform
      if (match.index > nextOffset) {
        var separator = inputBuffer.slice(nextOffset, match.index);
        tokens = tokens.concat(toSeparators(separator));
      }

      // Match within bounds: [  xxxx  ]
      if (pattern.lastIndex < inputBuffer.length || lastChunk) {
        tokens.push(toToken(match));

        // Next match must be after this match
        nextOffset = pattern.lastIndex;
        // Match against bounds: [     xxx]
      } else {
        // Next match will be the start of this match
        nextOffset = match.index;
      }
    }

    inputBuffer = inputBuffer.slice(nextOffset);
    pattern.lastIndex = 0;

    // End of input, flush the input buffer
    if (lastChunk) tokens = tokens.concat(toSeparators(inputBuffer));

    return tokens;
  }

  // eslint-disable-next-line consistent-return
  function transform(chunk, encoding, cb) {
    var _this = this;

    // Allow objects straight through
    if (_lodash2.default.isPlainObject(chunk)) return cb(null, chunk);

    _async2.default.eachSeries(
      tokenize(chunk.toString('utf8')),
      function(output, next) {
        return transclude.call(_this, output, next);
      },
      function(err) {
        if (err) inputBuffer = '';
        cb(err);
      }
    );
  }

  function flush(cb) {
    var _this2 = this;

    _async2.default.eachSeries(
      tokenize(),
      function(output, next) {
        return transclude.call(_this2, output, next);
      },
      function(err) {
        _this2.push(null);
        cb(err);
      }
    );
  }

  return _through2.default.obj(transform, flush);
}
//# sourceMappingURL=transclude.js.map