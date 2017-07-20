'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
// Link detection (including leading whitespace)
var defaultTokenRegExp = (exports.defaultTokenRegExp = new RegExp(
  /((^[\t ]*)?:\[.*?]\((.*?)\))/gm
));
var MATCH_GROUP = (exports.MATCH_GROUP = 0);
var WHITESPACE_GROUP = (exports.WHITESPACE_GROUP = 2);
var PLACEHOLDER_GROUP = (exports.PLACEHOLDER_GROUP = 1);
var LINK_GROUP = (exports.LINK_GROUP = 3);
//# sourceMappingURL=config.js.map