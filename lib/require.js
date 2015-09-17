'use strict';

var compare = require('version-comparison');
var fs = require('fs');
var path = require('path');
var stack = require('callsite');

var requireCache = {};

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
module.exports = function (basePath) {
  var versions = [];

  // Set the base path relative to where the module was called.
  basePath = path.resolve(path.dirname(stack()[1].getFileName()), basePath);

  // The first time the module is called for a given base path a synchronous
  // lookup is performed for versions in the directory. This value is cached
  // so it is only performed once per route.
  if (!requireCache[basePath]) {
    requireCache[basePath] = {paths: {}};
    var paths = fs.readdirSync(basePath);
    if (!paths.length) {
      throw new Error('Unable to find version directorys within \'' + basePath + '\'');
    }
    requireCache[basePath].versions = paths.sort(compare);
  }
  versions = requireCache[basePath].versions;

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
  var resolve = function (version, relPath) {
    if (requireCache[basePath].paths[version + '::' + relPath]) {
      return requireCache[basePath].paths[version + '::' + relPath];
    }

    var i = versions.indexOf(version);
    if (i === -1) {
      throw new Error('Unsupported version');
    }

    for (i; i >= 0; i--) {
      try {
        var reqPath = path.join(basePath, versions[i], relPath);
        require.resolve(reqPath);
        requireCache[basePath].paths[version + '::' + relPath] = reqPath;
        return reqPath;
      } catch (e) {} // eslint-disable-line no-empty
    }

    throw new Error('Cannot find module \'' + relPath + '\'');
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
  var versionRequire = function (version, relPath) {
    var reqPath = resolve(version, relPath);
    return require(reqPath);
  };

  /**
   * @see resolve
   */
  versionRequire.resolve = resolve;

  /**
   * Exposes the cache object for this path.
   */
  versionRequire.cache = requireCache[basePath];

  return versionRequire;
};

