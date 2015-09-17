'use strict';
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var rimraf = require('rimraf');

var requireVersion = require('../');
module.exports = {
  setUp: function (cb) {
    var basePath = path.join(__dirname, 'versions');
    mkdirp(path.join(basePath, 'v1'), function () {
      fs.writeFile(path.join(basePath, 'v1', 'test.js'), '', function (err) {
        mkdirp(path.join(basePath, 'v1.1'), function () {
          mkdirp(path.join(basePath, 'v2'), function () {
            mkdirp(path.join(__dirname, 'empty'), cb);
          });
        });
      });
    });
  },
  tearDown: function (cb) {
    rimraf(path.join(__dirname, 'versions'), function () {
      rimraf(path.join(__dirname, 'empty'), cb);
    });
  },

  invalidPaths: function (test) {
    test.expect(2);

    test.throws(function () {
      requireVersion('./foo');
    }, 'Invalid path did not raise exception.');

    test.throws(function () {
      requireVersion('./empty');
    }, 'Empty directory did not raise exception.');

    test.done();
  },
  validPaths: function (test) {
    try {
    test.expect(3);

    var reqV = requireVersion('./versions');

    test.equal(typeof reqV, 'function', 'Require function expected.');
    test.equal(typeof reqV.resolve, 'function', 'Resolve function expected.');
    test.equal(typeof reqV.cache, 'object', 'Cache object expected.');

    test.done();
    } catch (e) { console.log(e); }
  },
  fallback: function (test) {
    test.expect(2);

    var reqV = requireVersion('./versions');

    reqV('v2', 'test');
    reqV('v1.1', 'test');
    reqV('v1', 'test');

    test.equal(
      reqV.cache['v2::test'],
      reqV.cache['v1::test'],
      'Version 2 did not use version 1.'
    );
    test.equal(
      reqV.cache['v1.1::test'],
      reqV.cache['v1::test'],
      'Version 1.1 did not use version 1.'
    );

    test.done();
  },
  cache: function (test) {
    test.expect(1);

    var reqV = requireVersion('./versions');

    var first = reqV.resolve('v1', 'test');
    var second = reqV.resolve('v1', 'test');

    test.equal(first, second, 'Cached value not equivalent.');
    test.done();
  },
  unsupportedVersion: function (test) {
    test.expect(1);

    var reqV = requireVersion('./versions');

    test.throws(function () {
      reqV('v4', 'test');
    }, 'Unsupported version did not raise exception.');

    test.done();
  },
  missingModule: function (test) {
    test.expect(1);

    var reqV = requireVersion('./versions');

    test.throws(function () {
      reqV('v1', 'foo');
    }, 'Missing module did not raise exception.');

    test.done();
  }
};

