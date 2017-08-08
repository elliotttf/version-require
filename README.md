# Version Require

[![Greenkeeper badge](https://badges.greenkeeper.io/elliotttf/version-require.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/elliotttf/version-require.svg?branch=master)](https://travis-ci.org/elliotttf/version-require)
[![Coverage Status](https://coveralls.io/repos/elliotttf/version-require/badge.svg?branch=master&service=github)](https://coveralls.io/github/elliotttf/version-require?branch=master)

This module allows you to require a given version of a file, and to fall back
to a previous version if the targeted version does not exist.

## Usage

```javascript
/**
 * Given directory structure:
 *
 * - models
 *   - v3
 *     - video.js
 *   - v3.1
 *     - show.js
 */
var requireModels = require('version-require')('./models');

// Load v3 of video.
var video3 = requireModels('v3', 'video');

// Load v3 of video, since 3.1 does not exist
var video3_1 = requireModels('v3.1', 'video');

// Throws an exception since show does not exist at the targeted version
// or a previous version.
var show3_1_err = requireModels('v3', 'show');

// Resolves a path to the actual loaded module.
var videoPath = requireModels.resolve('v3.1', 'video');
// __dirname + '/models/v3/video.js'

// Exposes cached information from the module
var cache = requireModels.cache;
// {
//   versions: ['v3', 'v3.1'],
//   paths: {
//     'v3::video': './models/v3/video',
//     'v3.1::video': './models/v3/video',
//   }
// }
```
