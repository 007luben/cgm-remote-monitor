
var express = require('express');
function create (env) {
  var store = env.store;
  var pushover = require('./lib/pushover')(env);
  ///////////////////////////////////////////////////
  // api and json object variables
  ///////////////////////////////////////////////////
  var entries = require('./lib/entries')(env.mongo_collection, store);
  var settings = require('./lib/settings')(env.settings_collection, store);
  var treatments = require('./lib/treatments')(env.treatments_collection, store, pushover);
  var profile = require('./lib/profile')(env.profile_collection, store);

  var devicestatus = require('./lib/devicestatus')(env.devicestatus_collection, store);
  var api = require('./lib/api/')(env, entries, settings, treatments, profile, devicestatus);
  var pebble = require('./lib/pebble');
  var compression = require('compression');

  var app = express();
  app.entries = entries;
  app.treatments = treatments;
  app.profiles = profile;
  app.devicestatus = devicestatus;
  var appInfo = env.name + ' ' + env.version;
  app.set('title', appInfo);
  app.enable('trust proxy'); // Allows req.secure test on heroku https connections.

  app.use(compression({filter: shouldCompress}));

  function shouldCompress(req, res) {
      //TODO: return false here if we find a condition where we don't want to compress
      // fallback to standard filter function
      return compression.filter(req, res);
  }

  //if (env.api_secret) {
  //    console.log("API_SECRET", env.api_secret);
  //}
  app.use('/api/v1', api);


  // pebble data
  app.get('/pebble', pebble(entries, treatments, profile, devicestatus));

  //app.get('/package.json', software);

  // define static server
  //TODO: JC - changed cache to 1 hour from 30d ays to bypass cache hell until we have a real solution
  var staticFiles = express.static(env.static_files, {maxAge: 60 * 60 * 1000});

  // serve the static content
  app.use(staticFiles);

  var bundle = require('./bundle')();
  app.use(bundle);

// Handle errors with express's errorhandler, to display more readable error messages.

  // Handle errors with express's errorhandler, to display more readable error messages.
  var errorhandler = require('errorhandler');
  //if (process.env.NODE_ENV === 'development') {
    app.use(errorhandler());
  //}
  return app;
}
module.exports = create;

