# electron-request-response
This package allows you to communicate with the main process or render processes via a rest like interface.

### Why not IPC?
The IPC mechanism in Electron is quite powerful, but also quite cumbersome.  A rest like interface is much more friendly
and also more familiar to most JavaScript developers.

### Concepts

* **Host** - either the main process (`CONSTANTS.MAIN_PROCESS.HOST`) or the name of any BrowserWindow which you have made addressable via the `makeAddressable(name, browserWindow)` method
* **Route** - an addressable endpoint.  You register these in either the main process for use with the main process host, or in BrowserWindow processes when calling methods in those BrowserWindow processes.

### API docs

You can find the API documentation [in the Wiki for this repo](https://github.com/ayasin/electron-request-response/wiki)

### Quick start

In the main process:
```js
var router = require('electron-request-response/main');

// electron startup stuff omitted

app.on('ready', () => {
  firstWindow = new BrowserWindow({height: 700, width: 800, frame: true, resizeable: true});
  secondWindow = new BrowserWindow({height: 700, width: 800, frame: true, resizeable: true});

  router.makeAddressable('first-window', firstWindow);
  router.makeAddressable('second-window', secondWindow);

  // there's no need to make a host unaddressable, this will happen automatically when the window is closed.

  // do some other stuff
}

```

Somewhere in the first window JS files
```js
var router = require('electron-request-response/render');

// do some stuff that makes us want to communiate with second-window

var msgObj = {
  any_fields_you_want: 'Hey did you get this?'
};

router.request('second-window', '/some/path', msgObj)
    .then((response) => {
      console.log(resoinse); // on any day but Wednesday will print "I got it!"
      console.log('Yay! My message was received!');
    })
    .catch(function (err) {
      console.log('Oh no! Something went wrong!');
      console.log(err); // on Wednesday will print "Go away, it's hump day"
    });

```

Somewhere in the second window JS files
```js
var router = require('electron-request-response/render');

// register a route

router.registerRoute('/some/path', function (data, callback) {
  console.log(data.any_fields_you_want); // will log "Hey did you get this?
  var shouldError = (new Date()).getDay() === 3; // we don't work on hump day
  if (shouldError) {
    return callback('Go away, it\'s hump day', null); // we could also use an object as the error here...
  }
  return callback(null, 'I got it!');
});
```
