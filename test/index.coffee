require 'coffee-script/register'
assert = require 'assert-diff'
hercule = require '../lib/transclude'
fs = require 'fs'
path = require 'path'

describe 'hercule', ->
  describe 'scan', ->
    it 'should not detect non-existant placeholders', (done) ->
      document = "Test document\nwith no placeholders."

      references = hercule.scan document
      assert.deepEqual references, []

      done()

    it 'should detect placeholders', (done) ->
      document = "Test document\nwith :[number](one.md) placeholder."

      references = hercule.scan document
      assert.equal references.length, 1

      done()

    it 'should detect multiple placeholders', (done) ->
      document = "Test :[document](test/doc.md) with :[number](three.md footer:common/footer.md) :[placeholders]()."

      references = hercule.scan document
      assert.equal references.length, 3

      done()

    it 'should not detect non-existant leading whitespace', (done) ->
      document = "word :[word](test.md) word"

      references = hercule.scan document
      assert.equal references[0].whitespace, ""

      done()

    it 'should detect whitespace on the first line of a file', (done) ->
      document = "\t:[](test)"

      references = hercule.scan document
      assert.equal references[0].whitespace, "\t"

      done()

    it 'should detect whitespace on following lines of a file', (done) ->
      document = "\n :[](test)"

      references = hercule.scan document
      assert.equal references[0].whitespace, " "

      done()

    it 'should detect different types of leading whitespace', (done) ->
      document = """# Heading 1
      \t:[](tab)
        :[](space)
        \t :[](mixed)
      """

      references = hercule.scan document
      assert.equal references[0].whitespace, "\t"
      assert.equal references[1].whitespace, "  "
      assert.equal references[2].whitespace, "  \t "

      done()


  describe 'parse', ->
    it 'should parse a single file reference', (done) ->
      reference =
        placeholder: ":[name](file)"
        relativePath: ""

      parsed = hercule.parse reference
      assert.deepEqual parsed, {
        file: "file"
        name: "name"
        placeholder: reference.placeholder
        references: []
        relativePath: ""
      }

      done()

    it 'should parse a single file reference with reference', (done) ->
      reference =
        placeholder: ":[name](file placeholder:filename.md)"
        relativePath: ""

      parsed = hercule.parse reference
      assert.deepEqual parsed, {
        file: "file"
        name: "name"
        placeholder: reference.placeholder
        references: [
          placeholder: "placeholder"
          type: "file"
          value: "filename.md"
        ]
        relativePath: ""
      }

      done()

    it 'should parse a special reference', (done) ->
      reference =
        placeholder: ":[](file extend:)"
        relativePath: ""

      parsed = hercule.parse reference
      assert.deepEqual parsed, {
        file: "file"
        name: null
        placeholder: reference.placeholder
        references: [
          placeholder: "extend"
          type: "string"
          value: ""
        ]
        relativePath: ""
      }

      done()

    it 'should parse multiples references', (done) ->
      reference =
        placeholder: ":[](file fruit:apple.md footer:../common/footer.md copyright:\"Copyright 2014 (c)\")"
        relativePath: "customer/farmers-market"

      parsed = hercule.parse reference
      assert.deepEqual parsed, {
        file: "file"
        name: null
        placeholder: reference.placeholder
        references: [
          placeholder: "fruit"
          type: "file"
          value: "customer/farmers-market/apple.md"
        ,
          placeholder: "footer"
          type: "file"
          value: "customer/common/footer.md"
        ,
          placeholder:"copyright"
          type:"string"
          value:"Copyright 2014 (c)"
        ]
        relativePath: "customer/farmers-market"
      }

      done()

  describe 'linksFromInput', ->
    it 'should return a parsed set of links for input', (done) ->
      placeholder = ":[test](speed.md)"
      input = "The #{placeholder} brown fox..."

      links = hercule.linksFromInput input, [], ""
      assert.deepEqual links, [
        {
          placeholder: placeholder
          file: "speed.md"
          name: "test"
          whitespace: ""
          references: []
          relativePath: ""
          parents: []
        }
      ]

      done()

  describe 'substitute', ->
    it 'should not change the link when there are no references', (done) ->
      file = "file.md"

      expanded = hercule.substitute file, []
      assert.deepEqual expanded, {file: file, type: "file"}

      done()

    it 'should not change the link when there are no matching references', (done) ->
      file = "file.md"
      references = [
        placeholder: "footer"
        type: "file"
        value: "footer.md"
      ]

      expanded = hercule.substitute file, references
      assert.deepEqual expanded, {file: file, type: "file"}

      done()

    it 'should change the link when there is a matching references', (done) ->
      file = "footer"
      references = [
        placeholder: "footer"
        type: "file"
        value: "common/footer.md"
      ]

      expanded = hercule.substitute file, references
      assert.deepEqual expanded, {file: "common/footer.md", type: "file"}

      done()

    it 'should change the link when there is a matching references', (done) ->
      file = "canine"
      references = [
        placeholder: "canine"
        type: "string"
        value: "dog"
      ]

      expanded = hercule.substitute file, references
      assert.deepEqual expanded, {file: "dog", type: "string"}

      done()

  describe 'readFile', ->
    it 'should not throw an error for missing files', (done) ->
      inputFile = __dirname + "/fixtures/missing.md"

      content = hercule.readFile 'missing.md'
      assert.equal content, null

      done()

    it 'should read files which exist', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      content = hercule.readFile inputFile
      assert.equal content, 'The quick brown fox jumps over the lazy dog.\n'

      done()


  describe 'transcludeString', ->
    it 'should transclude files with valid links', (done) ->
      input = "Jackdaws love my big sphinx of quartz."

      hercule.transcludeString input, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'Jackdaws love my big sphinx of quartz.'

        done()

    it 'should transclude files with valid links', (done) ->
      file = __dirname + "/fixtures/test-basic/jackdaw.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      hercule.transcludeString input, dir, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'Jackdaws love my big sphinx of quartz.\n'

        done()

  describe 'transclude', ->
    it 'should exit if a circular link exists', (done) ->
      inputFile = __dirname + "/fixtures/test-circular/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        assert.notEqual err, null

        done()

    it 'should not change a file without links', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'The quick brown fox jumps over the lazy dog.\n'

        done()

    it 'should not change a file without valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-invalid/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'The quick brown fox {{jumps}} over the lazy dog.\n'

        done()

    it 'should transclude files with valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-basic/jackdaw.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'Jackdaws love my big sphinx of quartz.\n'

        done()

    it 'should transclude files with valid links and respect leading whitespace', (done) ->
      inputFile = __dirname + "/fixtures/test-whitespace/jackdaw.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        # TODO: Should there be the extra `\n `?
        assert.equal document, 'Jackdaws love my\n  big\n  \n    sphinx of quartz.\n'

        done()

    it 'should transclude files with valid links and references', (done) ->
      inputFile = __dirname + "/fixtures/test-extend/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, "The quick brown fox jumps over the lazy dog.\n"

        done()

    it 'should transclude files with valid links, references and string substitutions', (done) ->
      inputFile = __dirname + "/fixtures/test-string-extend/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, "The quick brown fox jumps over the lazy dog.\n"

        done()
