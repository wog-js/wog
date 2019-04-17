// Require modules
const EventEmitter = require('events');
const nanoid = require('nanoid/generate');

/**
 * Throws an exception indicating that a function has to be implemented by a sub class.
 */
const unimplemented = () => {
  throw new Exception("Not implemented!");
};

/**
 * Describes an adapter for retrieving log entries.
 *
 * @extends EventEmitter
 */
class BaseAdapter extends EventEmitter {

  /**
   * Creates a new Adapter instance.
   * @param {object} options The options for the adapter.
   */
  constructor(options) {
    super();
    this.options = options;
    this.logger = logger.scope(this.name);

    try {
      this.init();
    } catch (e) {
      fail(e, this.logger);
    }
  }

  generateId() {
    return nanoid(NANOID_ALPHABET, 10);
  }

  get name() {
    return this.constructor.name;
  }

  /**
   * Indicates whether this adapter will emit events.
   * @return {boolean} Whether events are supported.
   */
  supportsEvents() {
    return true;
  }

  /**
   * Called when this adapter is no longer needed. Used to clean up
   * resources or to close any connections.
   */
  dispose() {
    /* Might be unused ;) */
  }

  // -------------------------------
  // INTERFACE

  init() {
    unimplemented();
  }

  /**
   * Returns an array containing all the files/objects which contain logs.
   * @return {array} An array with all log files/objects/etc.
   */
  get entries() {
    unimplemented();
  }

  /**
   * Finds a specific entry by it's id.
   * @param  {string} id The unique id identifying an entry.
   * @return {object|null|Promise} An object holding an entry's data (name, path, etc.).
   *                               Using Promises is also allowed.
   */
  getEntry(id) {
    unimplemented();
  }

  /**
   * Returns the contents for an entry.
   * @param  {string} id The unique id identifying an entry.
   * @return {array|object} An array containing the log entries, where each element represents one line/log.
   *                        Also supported is an object with additional information (size, dates, etc.).
   */
  getContents(id) {
    unimplemented();
  }
}

module.exports = BaseAdapter;