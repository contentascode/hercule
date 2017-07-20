'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.parseContent = parseContent;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _grammar = require('./grammar');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function extendWithSource(link, source, line, column) {
  var url = link.url;
  var placeholder = link.placeholder;
  return {
    url: url,
    placeholder: placeholder,
    source: source,
    line: line,
    column: column + link.index,
  };
}

// eslint-disable-next-line import/prefer-default-export
function parseContent(content, _ref) {
  var source = _ref.source,
    line = _ref.line,
    column = _ref.column;

  var args = _grammar.grammar.parse(content);

  // Attach source information to all the url to be resolved
  var contentLink = extendWithSource(args.link, source, line, column);
  var scopeReferences = _lodash2.default.map(args.scopeReferences, function(
    ref
  ) {
    return extendWithSource(ref, source, line, column);
  });
  var descendantReferences = _lodash2.default.map(
    args.descendantReferences,
    function(ref) {
      return extendWithSource(ref, source, line, column);
    }
  );

  return {
    contentLink: contentLink,
    scopeReferences: scopeReferences,
    descendantReferences: descendantReferences,
  };
}
//# sourceMappingURL=parse.js.map