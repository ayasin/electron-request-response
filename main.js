'use strict';

var ipcMain = require('electron').ipcMain;
var UUID = require('uuid');
var _ = require('lodash');
var CONSTANTS = require('./lib/constants');

var hosts = {};

function makeAddressable (name, browserWindow) {
  if (hosts[name]) {
    throw String('A host is already registered at this name');
  }
  hosts[name] = browserWindow;
  browserWindow.on('closed', function (e) {
    hosts[name] = null;
  });
}

function registerRoute (route, callback) {
  hosts[CONSTANTS.MAIN_PROCESS_HOST][route] = callback;
}

function routeRequest (request, done) {
  if (request.host === CONSTANTS.MAIN_PROCESS_HOST) {
    var routes = hosts[CONSTANTS.MAIN_PROCESS_HOST];
    if (typeof routes[request.route] === 'function') {
      routes[request.route](request.data, function (err, response) {
        done({
          status: err ? CONSTANTS.STATUS_ERROR : CONSTANTS.STATUS_OK,
          errorMessage: err,
          response: response
        });
      });
    }
    else {
      done({
        status: CONSTANTS.STATUS_INVALID_ROUTE,
        errorMessage: 'No such route exists',
        response: ''
      });
    }
  }
  else {
    if (hosts[request.host]) {
      var generated = UUID.v4();
      ipcMain.once(generated, function (event, message) {
        done(message);
      });
      hosts[request.host].webContents.send(CONSTANTS.ROUTER_ROUTE_REQUEST, _.defaults({}, {responseChannel: generated}, request));
    }
    else {
      done({
        status: CONSTANTS.STATUS_INVALID_HOST,
        errorMessage: 'No such host exists',
        response: ''
      });
    }
  }
}

ipcMain.on(CONSTANTS.ROUTER_ROUTE_REQUEST, function (event, message) {
  routeRequest(message, function (result) {
    event.sender.send(message.responseChannel, result);
  });
});

hosts[CONSTANTS.MAIN_PROCESS_HOST] = {};

module.exports = {
  makeAddressable: makeAddressable,
  registerRoute: registerRoute,
  CONSTANTS: CONSTANTS
};
