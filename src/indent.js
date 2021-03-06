import through2 from 'through2';
import _ from 'lodash';

export default function Indent() {
  const NEWLINE = '\n';
  const inputBuffer = [];

  function transform(chunk, encoding, cb) {
    if (chunk.content) inputBuffer.push(chunk);

    // The input buffer shouldn't have more than two items in it at a time
    while (inputBuffer.length > 1) {
      const indent = inputBuffer[1].indent;
      let content = inputBuffer[1].content;
      const preceededNewLine = inputBuffer[0].content.slice(-1) === NEWLINE;
      const beginsNewLine = inputBuffer[1].content.slice(0, 1) === NEWLINE;

      if (indent) {
        if (preceededNewLine && !beginsNewLine) content = indent + content;

        content = _.replace(content, /\n(?!\s|$)/g, `\n${indent}`);
        inputBuffer[1].content = content;
      }

      this.push(inputBuffer.shift());
    }

    return cb();
  }

  function flush(cb) {
    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer.length > 0) this.push(inputBuffer.shift());
    this.push(null);
    return cb();
  }

  return through2.obj(transform, flush);
}
