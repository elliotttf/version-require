/* eslint-disable import/no-dynamic-require,global-require */

'use strict';

const compare = require('version-comparison');
const fs = require('fs');
const path = require('path');
const stack = require('callsite');

const requireCache = {};

/**
 * Exports a versioned require object.
 *
 * @param {string} basePath
 *   The base path to look for versioned modules in.
 *
 * @return {function}
 *   Can be used to require a versioned module, to resolve the path to a
 *   versioned module, or to view/alter the cache for versioned routes.
 */
module.exports = (basePath) => {
  let versions = [];

  // Set the base path relative to where the module was called.
  const rBasePath = path.resolve(path.dirname(stack()[1].getFileName()), basePath);

  // The first time the module is called for a given base path a synchronous
  // lookup is performed for versions in the directory. This value is cached
  // so it is only performed once per route.
  if (!requireCache[rBasePath]) {
    requireCache[rBasePath] = { paths: {} };
    const paths = fs.readdirSync(rBasePath);
    if (!paths.length) {
      throw new Error(`Unable to find version directorys within '${rBasePath}'`);
    }
    requireCache[rBasePath].versions = paths
      .filter(target => fs.statSync(path.join(rBasePath, target)).isDirectory())
      .sort(compare);
  }
  versions = requireCache[rBasePath].versions;

  /**
   * Resolve method that accepts a version and relative path and returns
   * the path to the highest supported version of relPath.
   *
   * @param {string} version
   *   The target version to resolve.
   * @param {string} relPath
   *   The relative path from within version to load.
   *
   * @return {string}
   *   The highest supported version of relPath.
   *
   * @throws {Error}
   *   Thrown if version is not supported or if no versions support relPath.
   */
  const resolve = (version, relPath) => {
    if (requireCache[rBasePath].paths[`${version}::${relPath}`]) {
      return requireCache[rBasePath].paths[`${version}::${relPath}`];
    }

    let i = versions.length - 1;

    for (i; i >= 0; i -= 1) {
      if (compare(version, versions[i]) === -1) {
        continue; // eslint-disable-line no-continue
      }

      try {
        const reqPath = path.join(rBasePath, versions[i], relPath);
        require.resolve(reqPath);
        requireCache[rBasePath].paths[`${version}::${relPath}`] = reqPath;
        return reqPath;
      }
      catch (e) {} // eslint-disable-line no-empty
    }

    throw new Error(`Cannot find module '${relPath}'`);
  };

  /**
   * Requires a versioned module.
   *
   * @param {string} version
   *   The target version to require.
   * @param {string} relPath
   *   The relative path to the module that should be included.
   *
   * @return {*}
   *   The result of the versioned require.
   */
  const versionRequire = (version, relPath) => {
    const reqPath = resolve(version, relPath);
    return require(reqPath);
  };

  /**
   * @see resolve
   */
  versionRequire.resolve = resolve;

  /**
   * Exposes the cache object for this path.
   */
  versionRequire.cache = requireCache[rBasePath];

  return versionRequire;
};
