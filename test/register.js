'use strict';
const browserEnv = require('browser-env');
browserEnv();

const streams = require('web-streams-ponyfill')
Object.assign(global, streams.default)
