'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');

const versionRequire = require('../');

module.exports = {
  setUp(cb) {
    const basePath = path.join(__dirname, 'versions');
    mkdirp(path.join(basePath, 'v1'), () => {
      fs.writeFile(path.join(basePath, 'test.js'), '', () => {
        fs.writeFile(path.join(basePath, 'v1', 'test.js'), '', () => {
          mkdirp(path.join(basePath, 'v1.1'), () => {
            mkdirp(path.join(basePath, 'v2'), () => {
              mkdirp(path.join(__dirname, 'empty'), cb);
            });
          });
        });
      });
    });
  },
  tearDown(cb) {
    rimraf(path.join(__dirname, 'versions'), () => {
      rimraf(path.join(__dirname, 'empty'), cb);
    });
  },

  invalidPaths(test) {
    test.expect(2);

    test.throws(() => {
      versionRequire('./foo');
    }, 'Invalid path did not raise exception.');

    test.throws(() => {
      versionRequire('./empty');
    }, 'Empty directory did not raise exception.');

    test.done();
  },
  validPaths(test) {
    test.expect(3);

    const reqV = versionRequire('./versions');

    test.equal(typeof reqV, 'function', 'Require function expected.');
    test.equal(typeof reqV.resolve, 'function', 'Resolve function expected.');
    test.equal(typeof reqV.cache, 'object', 'Cache object expected.');

    test.done();
  },
  fallback(test) {
    test.expect(3);

    const reqV = versionRequire('./versions');

    reqV('v3', 'test');
    reqV('v2', 'test');
    reqV('v1.1', 'test');
    reqV('v1', 'test');

    test.equal(
      reqV.cache['v3::test'],
      reqV.cache['v1::test'],
      'Version 3 did not use version 1.');
    test.equal(
      reqV.cache['v2::test'],
      reqV.cache['v1::test'],
      'Version 2 did not use version 1.');
    test.equal(
      reqV.cache['v1.1::test'],
      reqV.cache['v1::test'],
      'Version 1.1 did not use version 1.');

    test.done();
  },
  cache(test) {
    test.expect(1);

    const reqV = versionRequire('./versions');

    const first = reqV.resolve('v1', 'test');
    const second = reqV.resolve('v1', 'test');

    test.equal(first, second, 'Cached value not equivalent.');
    test.done();
  },
  unsupportedVersion(test) {
    test.expect(1);

    const reqV = versionRequire('./versions');

    test.throws(() => {
      reqV('v0.1', 'test');
    }, 'Unsupported version did not raise exception.');

    test.done();
  },
  missingModule(test) {
    test.expect(1);

    const reqV = versionRequire('./versions');

    test.throws(() => {
      reqV('v1', 'foo');
    }, 'Missing module did not raise exception.');

    test.done();
  },
};

