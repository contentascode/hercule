import through2 from 'through2';
import path from 'path';
import _ from 'lodash';

import grammar from './transclude-parser';
import { LINK_TYPES } from './config';

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

function resolve(primary, fallback, references, relativePath) {
  // console.log(`Resolve:`);
  // console.log(primary);
  // console.log(fallback);
  // console.log(references);
  // const primary = unresolvedLink.primary;
  // const fallback = unresolvedLink.fallback;
  const override = _.find(references, { placeholder: primary.href });
  const link = _.pick(override || fallback || primary, ['href', 'hrefType']);

  if (!override && link.hrefType === LINK_TYPES.LOCAL) {
    link.href = path.join(relativePath, link.href);
  }

  return link;
}

function parse(rawLink, rawLinkPath, sourcePath, sourceFile, cursor) {
  // Parse link body using peg.js grammar
  // Returns object: { primary, fallback, references }
  const parsedLink = grammar.parse(rawLinkPath);

  // Make local references relative to the source file
  parsedLink.references = _.map(parsedLink.references, ({ placeholder, href, hrefType }) => {
    const relativeHref = (hrefType === LINK_TYPES.LOCAL) ? path.join(sourcePath, href) : href;
    const ref = {
      placeholder,
      href: relativeHref,
      hrefType,
      source: sourceFile,
      line: cursor.line,
      column: cursor.column + rawLink.indexOf(`${placeholder}`) + placeholder.length + 1,
    };

    return ref;
  });

  return parsedLink;
}

export default function ResolveStream(sourceFile) {
  function transform(chunk, encoding, cb) {
    const rawLink = _.get(chunk, 'content');
    const rawLinkPath = _.get(chunk, ['link', 'href']);
    const parentRefs = _.get(chunk, 'references') || [];
    const sourcePath = path.dirname(sourceFile);
    const cursor = {
      line: _.get(chunk, 'line'),
      column: _.get(chunk, 'column'),
    };

    // Example: :[link](pimrary || fallback placeholder:link/path.md)
    // The 'primary', 'fallback', and 'references' from parent files are required to resolve the link
    let primary;
    let fallback;
    let references;

    // No link to parse, move along
    if (!rawLinkPath) {
      this.push(chunk);
      return cb();
    }

    // Parse link body using peg.js grammar
    // This allows complex links with placeholders, fallbacks, and overrides
    try {
      ({ primary, fallback, references } = parse(rawLink, rawLinkPath, sourcePath, sourceFile, cursor));
    } catch (err) {
      this.push(chunk);
      this.emit('error', { msg: 'Link could not be parsed', path: rawLinkPath, error: err });
      return cb();
    }

    const link = resolve(primary, fallback, parentRefs, sourcePath);

    this.emit('source', link.href);
    this.push(_.assign(chunk, { link, references: _.uniq([...references, ...parentRefs]) }));
    return cb();
  }

  return through2.obj(transform);
}
