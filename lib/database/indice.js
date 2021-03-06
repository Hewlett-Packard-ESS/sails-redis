/**
 * Module Dependencies
 */

var Errors = require('waterline-errors'),
    Utils = require('../utils');

/**
 * Indice.js
 *
 * Handles creating an "index" in Redis. This is really just a set made up of unique
 * values that can be checked against to determine if a value is unique or not.
 */

var Indice = module.exports = function(collectionName, name, client, unique) {

  // Escape the collection name
  var collection = collectionName.toLowerCase();

  // Cache the client connection
  this.client = client.connection;

  // Set the name of the sequence
  this.name = Utils.sanitize(name);

  // Set if it is a unique index
  this.unique = unique;

  // Build a NoSQL Key name for this sequence
  this.keyName = 'waterline:' + collectionName.toLowerCase() + ':_indicies:' + this.name;

  return this;
};


///////////////////////////////////////////////////////////////////////////////////////////
/// PUBLIC METHODS
///////////////////////////////////////////////////////////////////////////////////////////


/**
 * Create an index without doing a check first 
 *
 * @param {String} value
 * @param {Function} callback
 * @api public
 */

Indice.prototype.add = function index(value, cb) {
  var self = this;

  self.client.sadd(self.keyName, value, function(err) {
    if(err) return cb(err);
    cb();
  });
};

/**
 * Create an index if one doesn't exist or return an error if the
 * value is already indexed.
 *
 * @param {String} value
 * @param {Function} callback
 * @api public
 */

Indice.prototype.index = function index(value, cb) {
  var self = this;

  this._indexed(value, function(err, indexed) {
    if(err) return cb(err);
    if(indexed > 0 && self.unique) return cb(new Error(Errors.adapter.NotUnique));

    // Create the index
    if(!indexed) {
      self.add(value, cb);
    } else {
      cb();
    }
  });

};

///////////////////////////////////////////////////////////////////////////////////////////
/// PRIVATE METHODS
///////////////////////////////////////////////////////////////////////////////////////////


/**
 * Check if a value is indexed.
 *
 * @param {String} value
 * @param {Function} callback
 * @api private
 */

Indice.prototype._indexed = function _indexed(value, cb) {
  this.client.sismember(this.keyName, value, function(err, indexed) {
    if(err) return cb(err);
    cb(null, indexed);
  });
};
