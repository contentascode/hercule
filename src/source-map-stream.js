import path from 'path';

import _ from 'lodash';
import through2 from 'through2';
import sourceMap from 'source-map';

function updateCursor(cursor, content) {
  const currentLine = cursor.line;
  const currentColumn = cursor.column;

  const newLines = (content.match(/\n/g) || []).length;
  const newColumns = (content.match(/.*$/g) || [''])[0].length;

  const line = currentLine + newLines;
  const column = newLines > 0 ? newColumns : currentColumn + newColumns;

  return { line, column };
}

export default function SourceMapStream(generatedFile) {
  const mappings = [];
  let cursor = {
    line: 1,
    column: 0,
  };

  function transform(chunk, encoding, callback) {
    const content = chunk.content;
    const originalLocation = {
      line: chunk.line,
      column: chunk.column,
    };

    if (!generatedFile) return callback(null, chunk);

    mappings.push({
      source: path.relative(path.dirname(generatedFile), chunk.source),
      original: originalLocation,
      generated: cursor,
    });

    cursor = updateCursor(cursor, content);

    this.push(chunk);
    return callback();
  }

  function flush(callback) {
    if (!generatedFile) return callback();

    // http://sokra.github.io/source-map-visualization/#custom
    const generator = new sourceMap.SourceMapGenerator({ file: path.relative(__dirname, generatedFile) });

    try {
      _.forEach(mappings, (map) => {
        generator.addMapping(map);
        // TODO: Inline source?
        // generator.setSourceContent(map.source, fs.readFileSync(map.source));
      });
    } catch (ex) {
      // console.log('Error adding mapping...');
    }

    this.emit('sourcemap', JSON.parse(generator.toString()));
    return callback();
  }

  return through2.obj(transform, flush);
}
