'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = inflate;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function inflate(link, chunk, cb, get) {
  var _this = this;

  return get(link).on('response', function(res) {
    if (res.statusCode !== 200) {
      _this.emit('error', { msg: res.statusMessage, path: link });
      cb();
    }
  });
} // import { Readable } from 'stream';

// export default function inflate() {
//   const rs = new Readable({ objectMode: true });

//   rs._read = function read() {
//     this.push('Not implemented');
//     this.push(null);
//   };

//   return rs;
// }

// import request from 'request';

// export default function inflate(link, chunk, cb) {
//   return request.get(link)
//     .on('response', (res) => {
//       if (res.statusCode !== 200) {
//         this.emit('error', { msg: res.statusMessage, path: link });
//         cb();
//       }
//     });
// }

// Starting from the http inflater as it might be closer to the
// backbone app (specifically prose) needs.

// Seems like a possible first step would be to pass a function that would
// know about the model and how to find a transcluded target.
// This function's would need to be a Readable stream and take the callback as argument
// It would be provided when starting TranscludeString:
//   get(link, cb)
//# sourceMappingURL=local-browser.js.map
