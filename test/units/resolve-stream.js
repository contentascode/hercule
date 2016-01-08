import test from 'ava';
import ResolveStream from '../../lib/resolve-stream';


test.cb('should handle no input', (t) => {
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      if (this.read() !== null) t.fail();
    })
    .on('error', () => t.fail())
    .on('end', () => {
      t.pass();
      t.end();
    });

  testStream.end();
});


test.cb('should skip input without link', (t) => {
  const input = { content: 'The quick brown fox jumps over the lazy dog./n' };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.notOk(chunk.link);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input simple link', (t) => {
  const input = {
    content: ':[](animal.md)',
    link: {
      href: 'animal.md',
    },
  };
  const expected = {
    href: 'animal.md',
    hrefType: 'local',
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.link, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with overrides', (t) => {
  const input = {
    content: ':[](animal animal:wolf.md food:"cheese" remote:http://github.com/example.md null:)',
    link: {
      href: 'animal animal:wolf.md food:"cheese" remote:http://github.com/example.md null:',
    },
    line: 1,
    column: 0,
  };
  const expectedReferences = [
    {
      placeholder: 'animal',
      href: 'wolf.md',
      hrefType: 'local',
      source: 'test.md',
      line: 1,
      column: 11,
    },
    {
      placeholder: 'food',
      href: 'cheese',
      hrefType: 'string',
      source: 'test.md',
      line: 1,
      column: 31,
    },
    {
      placeholder: 'remote',
      href: 'http://github.com/example.md',
      hrefType: 'http',
      source: 'test.md',
      line: 1,
      column: 47,
    },
    {
      placeholder: 'null',
      href: '',
      hrefType: 'string',
      source: 'test.md',
      line: 1,
      column: 81,
    },
  ];
  const testStream = new ResolveStream('test.md');

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.references, expectedReferences);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with overriding link', (t) => {
  const input = {
    content: ':[](animal animal:wolf.md)',
    link: {
      href: 'animal animal:wolf.md',
    },
    references: [
      {
        placeholder: 'animal',
        href: 'fox.md',
        hrefType: 'local',
      },
      {
        placeholder: 'food',
        href: 'cheese.md',
        hrefType: 'local',
      },
    ],
  };
  const expected = {
    href: 'fox.md',
    hrefType: 'local',
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.link, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with fallback link', (t) => {
  const input = {
    content: ':[](animal || "fox" feline:cat.md food:cheese.md)',
    link: {
      href: 'animal || "fox" feline:cat.md food:cheese.md',
    },
    line: 1,
    column: 0,
  };
  const expected = {
    content: ':[](animal || "fox" feline:cat.md food:cheese.md)',
    references: [
      {
        placeholder: 'feline',
        href: 'cat.md',
        hrefType: 'local',
        source: 'test.md',
        line: 1,
        column: 27,
      },
      {
        placeholder: 'food',
        href: 'cheese.md',
        hrefType: 'local',
        source: 'test.md',
        line: 1,
        column: 39,
      },
    ],
    link: {
      href: 'fox',
      hrefType: 'string',
    },
    line: 1,
    column: 0,
  };
  const testStream = new ResolveStream('test.md');

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error on invalid transclusion link', (t) => {
  const input = {
    content: ':[](animal.md foo:bar:"exception!")',
    link: {
      href: 'animal.md foo:bar:"exception!"',
    },
  };
  const testStream = new ResolveStream();

  t.plan(2);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk, input);
      }
    })
    .on('error', () => t.pass())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should resolve link relative to file', (t) => {
  const input = {
    content: ':[](animal.md)',
    link: {
      href: 'animal.md',
    },
  };
  const expected = {
    content: ':[](animal.md)',
    references: [],
    link: {
      href: 'foo/animal.md',
      hrefType: 'local',
    },
  };
  const testStream = new ResolveStream('foo/test.md');

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});
