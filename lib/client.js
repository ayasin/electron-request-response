var ipc = require('electron').ipcRenderer;
var UUID = require('uuid');
var CONSTANTS = require('./constants.js');

let routes = {};

function registerRoute (path, handler) {
  routes[path] = handler;
}

function request (target, path, data) {
  return new Promise(function (resolve, reject) {
    var responseChannel = UUID.v4();
    ipc.once(responseChannel, function (event, message) {
      if (message.status === CONSTANTS.STATUS_OK) {
        resolve(message.data);
      }
      else {
        reject({
          status: message.status,
          error: message.errorMessage
        });
      }
    });
    ipc.send(CONSTANTS.ROUTER_ROUTE_REQUEST, {
      host: target,
      route: path,
      responseChannel: responseChannel,
      data: data
    });
  });
}

function routeRequest (request, done) {
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

ipc.on(CONSTANTS.ROUTER_ROUTE_REQUEST, function (event, message) {
  routeRequest(message, function (result) {
    ipc.send(message.responseChannel, result);
  });
});

module.exports = {
  request: request,
  registerRoute: registerRoute
};
