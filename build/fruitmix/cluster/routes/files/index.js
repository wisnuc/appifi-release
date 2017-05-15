'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Created by jianjin.wu on 2017/3/28.
 * the entrance of file routes
 */
var router = require('express').Router();

// import { Router } from 'express'
// import fruitmix from './fruitmix'

var fruitmix = require('./fruitmix');
var external = require('./external');
var transfer = require('./transfer');
var test = require('./test');

router.use('/fruitmix', fruitmix);
router.use('/external', external);
router.use('/transfer', transfer);
router.use('/test', test);

exports.default = router;