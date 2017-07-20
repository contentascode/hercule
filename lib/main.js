'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _meow = require('meow');

var _meow2 = _interopRequireDefault(_meow);

var _hercule = require('./hercule');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
* Hercule
* A simple markdown transclusion tool
* Author: James Ramsay
*/

var cli = (0, _meow2.default)(
  [
    'Usage:',
    '  $ hercule [<input> ...]',
    '',
    'Options:',
    '  --stdin, -                 Specifies input to be read from stdin.',
    '  --output, -o path          Specifies the name and location of the output file.  If not specified, stdout is used.',
    '  --syntax, -s syntax_name   Specifies which transclusion link syntax (e.g. hercule, aglio, marked, multimarkdown).',
    '                             If not specifed, hercule is used.',
    '  --relative, -r path        Specifies the path to which links in input are relative',
    '  --sourcemap, -m            Specifies a sourcemap should be gnerated. Only used if output is specified.',
    '',
    'Examples:',
    '  $ hercule foo.md',
    '    Processes the file foo.md and prints to stdout',
    '  $ cat foo.md | hercule - --output bar.md',
    '    Processes the input from stdin and writes output to bar.md',
  ],
  {
    string: ['_', 'output', 'syntax', 'relative'],
    boolean: ['sourcemap', 'stdin'],
    default: {
      syntax: 'hercule',
      relative: '',
    },
    alias: {
      o: 'output',
      s: 'syntax',
      r: 'relative',
      m: 'sourcemap',
      h: 'help',
    },
  }
);

if (cli.input.length === 0 && !cli.flags.stdin) {
  process.stderr.write('\nNo input specified.\n');
  cli.showHelp();
}

var inputStream = void 0;
var source = void 0;
var options = { transclusionSyntax: cli.flags.syntax };
var input = cli.input[0];

if (input) {
  // Reading input from file
  source = _path2.default.normalize(input);
  inputStream = _fs2.default.createReadStream(source, { encoding: 'utf8' });
} else {
  // Reading from stdin
  source = _path2.default.join(cli.flags.relative, 'stdin');
  inputStream = process.stdin;
}

var outputStream = cli.flags.output
  ? _fs2.default.createWriteStream(cli.flags.output, { encoding: 'utf8' })
  : process.stdout;
options.outputFile = cli.flags.output || 'stdout';

var transclude = new _hercule.TranscludeStream(source, options);

inputStream.on('error', function(err) {
  process.stderr.write('\n\n' + err.message + ' (' + err.path + ')\n');
  process.exit(1);
});

transclude.on('error', function(err) {
  process.stderr.write('\n\nERROR: ' + err.message + ' (' + err.path + ')\n');
  process.exit(1);
});

transclude.on('sourcemap', function(sourcemap) {
  var sourcemapFilepath = cli.flags.output + '.map';
  if (cli.flags.sourcemap && cli.flags.output)
    _fs2.default.writeFileSync(
      sourcemapFilepath,
      JSON.stringify(sourcemap) + '\n'
    );
});

inputStream.pipe(transclude).pipe(outputStream);
//# sourceMappingURL=main.js.map