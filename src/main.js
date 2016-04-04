/**
* Hercule
* A simple markdown transclusion tool
* Author: James Ramsay
*/

import fs from 'fs';
import path from 'path';
import dashdash from 'dashdash';
import Transcluder from './transclude-stream';

let opts;

const parser = dashdash.createParser({
  options: [
    {
      names: ['help', 'h'],
      type: 'bool',
      help: 'Print this help and exit.',
    },
    {
      names: ['output', 'o'],
      type: 'string',
      help: 'File to output.',
      helpArg: 'FILE',
    },
    // TODO: unit test transcludeStringSync with relativePath
    {
      names: ['relativePath', 'r'],
      type: 'string',
      help: 'Relative path. stdin will be parsed relative to this path.',
    },
    {
      name: 'reporter',
      type: 'string',
      help: 'Supported reporters include json, json-stderr, tree',
    },
    {
      name: 'sourcemap',
      type: 'bool',
      help: 'Generate sourcemap for output file.',
    },
  ],
});


try {
  opts = parser.parse(process.argv);
} catch (err) {
  console.log(`hercule: error: ${err.message}`); // eslint-disable-line
  process.exit(1);
}


if (opts.help) {
  console.log(`usage: hercule [OPTIONS]\noptions:\n${parser.help({includeEnv: true}).trimRight()}`); // eslint-disable-line
  process.exit();
}


function main() {
  let inputStream;
  let outputStream;
  let sourceFile;
  const options = {
    relativePath: '',
    parents: [],
    parentRefs: [],
  };

  if (opts._args.length === 0) {
    // Reading input from stdin
    inputStream = process.stdin;
    sourceFile = `${opts.relativePath}/stdin.md`;
    options.relativePath = opts.relativePath;
  } else {
    // Reading input from file
    // TODO: handle file error!
    inputStream = fs.createReadStream(opts._args[0], { encoding: 'utf8' });

    inputStream.on('error', (err) => {
      process.stdout.write(err);
      process.exit(1);
    });

    sourceFile = path.normalize(opts._args[0]);

    // TODO: remove these two lines
    options.relativePath = path.dirname(opts._args[0]);
  }

  if (opts.output) {
    // Writing output to file
    outputStream = fs.createWriteStream(opts.output, { encoding: 'utf8' });
    options.generatedFile = opts.output;
    // options.sourcemapFile = `${opts.output}.map`;
  } else {
    // Writing output to stdout
    outputStream = process.stdout;
    options.generatedFile = 'stdout';
  }

  const transclude = new Transcluder(sourceFile, options);

  transclude.on('error', (err) => {
    if (opts.reporter === 'json-err') {
      process.stderr.write(JSON.stringify(err));
    } else {
      process.stdout.write(`\n\nERROR: ${err.msg} (${err.path})\n`);
    }
    process.exit(1);
  });

  transclude.on('sourcemap', (srcMap) => {
    if (opts.output) fs.writeFileSync(`${opts.output}.map`, JSON.stringify(srcMap));
  });

  inputStream.pipe(transclude).pipe(outputStream);
}

main();
