'use strict';

// Require modules
const path = require('path');
const moduleAlias = require('module-alias');
const debug = require('debug')('wog:main');

// Register any modules/services
const paths = require('../jsconfig.json').compilerOptions.paths;
const aliases = {};
Object.keys(paths).forEach(el => {
  aliases[el] = path.resolve(path.dirname(__dirname), paths[el][0]);
});
moduleAlias.addAliases(aliases);

// Define global variables
global.DEBUG = process.env.DEBUG || false;
global.ROOT_DIRECTORY = path.resolve(__dirname, '..');

// Create global instances
global.storage = require('./init/storage');
global.config = require('./init/config');
global.logger = require('./init/logger');
global.database = require('./init/database');
global.adapters = require('./init/adapter-manager');
global.accounts = require('./init/accounts');
global.mailer = require('./init/mailer');
global.redis = require('./init/redis');

debug('DEBUG MODE ENABLED! REMEMBER TO TURN OFF!');

const isElevated = require('is-elevated');
const chalk = require('chalk');
const { fail } = require('./util');
const checkForUpdates = require('./updater');

// Fail on uncaught exceptions or rejections
process.on('uncaughtExceptionMonitor', (err, origin) => {
  logger.error('Uncaught exception detected!', { stack: err.stack, origin });
});
process.on('unhandledRejection', err => {
  logger.error('Unhandled promise rejection detected!', { stack: err.stack });
  process.exit(1);
});

// call init functions in an async scope
(async () => {
  try {
    // Check for elevation and print a warning when
    // running with administrative privileges
    if (await isElevated()) {
      logger.warn(chalk.bold('You\'re running with elevated permissions! ' +
        'You should avoid running as root or Administrator and tweak file permissions accordingly.'));
    }

    await checkForUpdates();
    await storage.init();
    await database.init();
    await adapters.init();
    await accounts.init();
    await mailer.init();
    await redis.init();

    require('./init/server');
  } catch (error) {
    fail(error);
  }
})();
