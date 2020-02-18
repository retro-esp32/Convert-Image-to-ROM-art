'use strict';

/*
 * npm packages
 */
const express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
const port = process.env.PORT || 8081;
const moment = require('moment');

/*
 * router
 */
global.router = express.Router();

/*
 * socket
 */
global.io = require('socket.io')(http);

/*
 * global
 */
global.path = require('path');
global.dir = __dirname;
/*
 * helpers
 */
global.echo = require('./helpers/echo');

/*
 * routes
 */
const index = require('./routes/index');

/*
 * app
 */
 app.use(express.static('public'));

/*
 * map
 */
app.use('/', index);

/*
 * redirect
 */
app.all('*', function(req, res) {
  //res.redirect('/404');
});


/*
 *
 */
module.exports = http.listen(port, () => {
  console.log(`Express running on port: ${port}`);
});
