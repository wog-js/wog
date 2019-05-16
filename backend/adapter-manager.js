// Require modules
const fs = require('fs');
const path = require('path');
const { objectKeyLoop } = require('./util');
const asyncForEach = require('@axelrindle/async-for-each');

/**
 * The AdapterManager holds all configured adapters and is used
 * to retrieve information from the active (selected) adapter.
 */
class AdapterManager {
  constructor() {
    this.logger = logger.scope('adapter-manager');
    this.adapters = this.available();
    this.instances = {};
  }

  /**
   * Loads available adapters (built-in and custom).
   */
  available() {
    const builtInDir = path.resolve(__dirname, 'adapter');
    const builtIn = fs.readdirSync(builtInDir);

    const extra = config.adapters.available;

    const result = {};
    builtIn.forEach(el => {
      const name = path.basename(el, '.js').toLowerCase().replace('adapter', '');
      if (name === 'base') return; // skip BaseAdapter
      result[name] = path.resolve(builtInDir, el);
    });
    if (DEBUG) {
      this.logger.debug(`Loaded ${Object.keys(result).length} adapters: `);
      this.logger.debug(result);
    }

    return Object.assign(result, extra);
  }

  async init() {
    // Load configured adapters
    const options = config.adapters.options;
    const enabled = config.adapters.enabled.split(',');

    // Create class instances for every enabled adapter
    await asyncForEach(enabled, async (el) => {
      // the path to the file is configured (alias/module/etc.)
      // we can just require it
      // and create a class instance with the given options
      const toLoad = this.adapters[el];
      if (!toLoad) {
        this.logger.error(`No adapter found with name ${el}!`);
        return;
      }

      const clazz = require(toLoad);
      const instance = new clazz(options[el]);
      try {
        await instance.init();
        this.instances[el] = instance;
      } catch (e) {
        instance.logger.error(e);
      }
    });
  }

  dispose() {
    objectKeyLoop(this.instances, el => {
      this.instances[el].dispose();
    });
    this.instances = null;
  }

  list() {
    return Object.keys(this.instances);
  }

  /**
   * Returns the currently selected adapter instance.
   *
   * @param string key The adapter to select.
   * @return {BaseAdapter|null} The selected adapter.
   */
  getAdapter(key) {
    return this.instances[key];
  }
}

global.adapters = new AdapterManager();
