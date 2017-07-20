'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = ResolveStream;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _transcludeParser = require('./transclude-parser');

var _transcludeParser2 = _interopRequireDefault(_transcludeParser);

var _config = require('./config');

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

/**
* Input stream: (object)
* - link (object, required)
*   - href (string, required)
* - relativePath (string)
* - references (array, required)
*   - (object)
*     - placeholder (string, required)
*     - href (string, required)
*     - hrefType (enum, required)
*     - source (string)
*     - original (object)
*       - line (integer, required)
*       - column (integer, required)
* - parents (array, required)
*
* Output stream: (object)
* - link (object, required)
*   - href (string)
*   - hrefType (enum)
* - relativePath (string, optional)
* - references (array, required) - References extended with any newly parsed references.
*   - (object) - as above
* - parents (array, required)
*
* Input and output properties can be altered by providing options
*/

function resolve(unresolvedLink, references, relativePath) {
  var primary = unresolvedLink.primary;
  var fallback = unresolvedLink.fallback;
  var override = _lodash2.default.find(references, {
    placeholder: primary.href,
  });
  var link = _lodash2.default.pick(override || fallback || primary, [
    'href',
    'hrefType',
  ]);

  if (!override && link.hrefType === _config.LINK_TYPES.LOCAL) {
    link.href = _path2.default.join(relativePath, link.href);
  }

  return link;
}

function parse(rawLink, relativePath) {
  // Parse link body using peg.js grammar
  // This allows complex links with placeholders, fallbacks, and overrides
  var parsedLink = _transcludeParser2.default.parse(rawLink);

  // Make references relative
  var parsedReferences = _lodash2.default.map(parsedLink.references, function(
    _ref
  ) {
    var placeholder = _ref.placeholder;
    var href = _ref.href;
    var hrefType = _ref.hrefType;

    var relativeHref = hrefType === _config.LINK_TYPES.LOCAL
      ? _path2.default.join(relativePath, href)
      : href;
    return { placeholder: placeholder, hrefType: hrefType, href: relativeHref };
  });

  return { parsedLink: parsedLink, parsedReferences: parsedReferences };
}

function ResolveStream(sourceFile) {
  var sourcePaths = arguments.length <= 1 || arguments[1] === undefined
    ? []
    : arguments[1];

  function transform(chunk, encoding, cb) {
    var rawLink = _lodash2.default.get(chunk, ['link', 'href']);
    var relativePath = _lodash2.default.get(chunk, 'relativePath') || '';
    var parentRefs = _lodash2.default.get(chunk, 'references') || [];
    var parsedLink = void 0;
    var parsedReferences = void 0;

    // No link to parse, move along
    if (!rawLink) {
      this.push(chunk);
      return cb();
    }

    try {
      var _parse = parse(rawLink, relativePath);

      parsedLink = _parse.parsedLink;
      parsedReferences = _parse.parsedReferences;
    } catch (err) {
      this.push(chunk);
      this.emit('error', {
        msg: 'Link could not be parsed',
        path: rawLink,
        error: err,
      });
      return cb();
    }

    var references = _lodash2.default.uniq(
      [].concat(
        _toConsumableArray(parsedReferences),
        _toConsumableArray(parentRefs)
      )
    );
    var link = resolve(parsedLink, parentRefs, relativePath);

    // Add the resolved link path to the array of all source paths
    sourcePaths.push(link.href);

    this.push(
      _lodash2.default.assign(chunk, { link: link, references: references })
    );
    return cb();
  }

  return _through2.default.obj(transform);
}
//# sourceMappingURL=resolve-stream.js.map
