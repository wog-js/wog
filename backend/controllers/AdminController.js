// Require modules
const Controller = require('./Controller');
const { url } = require('@wogjs/utils');

module.exports = class AdminController extends Controller {

  init() {
    this.config = this.container.resolve('config');

    /** @type {import('@wogjs/types').Accounts} */
    this.accounts = this.container.resolve('accounts');

    /** @type {import('@wogjs/types').PackageRegistry} */
    this.packages = this.container.resolve('packages');

    /** @type {string} */
    this.title = this.app.get('title');
  }

  /**
   * Shows the administration page for admin users.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  index(req, res) {
    if (req.user.role === 'admin') {
      this.render(res, 'administration.html', {
        title: `${this.title} | administration`,
        user: req.user
      });
    } else {
      res.redirect( url() );
    }
  }

  //#region Users

  /**
   * Sends a list of all users.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  listUsers(req, res) {
    this.accounts.all()
      .then(result => res.json(result))
      .catch(err => {
        this.logger.error(err);
        res.status(500).json({ type: 'error', data: err.toString() });
      })
  }

  /**
   * Creates a new user.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createUser(req, res) {
    this.accounts.create(req.body)
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => {
        res.status(500).json({ message: err.message, ...err });
      });
  }

  /**
   * Updates an existing user.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  editUser(req, res) {
    this.accounts.update(req.body)
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => {
        this.logger.error(err);
        res.status(500).json(err);
      });
  }

  /**
   * Delete a user. Fails if the user to be deleted is the logged in user.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  deleteUser(req, res) {
    if (req.user.id === req.body.id) {
      return res.status(403).send('You\'re not allowed to delete your own account!');
    }

    this.accounts.deleteUser(req.body.id)
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => {
        this.logger.error(err);
        res.status(500).json(err);
      });
  }

  //#endregion


  //#region Config

  /**
   * Sends a list of non-critical config entries.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  listConfig(req, res) { // TODO: Pretty empty now, but reserved for future use
    const allowedTypes = ['undefined', 'boolean', 'number', 'string'];
    const data = {};
    for (const key in this.config) {
      if (key === 'secure') continue;
      data[key] = {};
      for (const entry in this.config[key]) {
        if (allowedTypes.indexOf(typeof this.config[key][entry]) !== -1) {
          data[key][entry] = {
            key: entry,
            value: this.config[key][entry]
          };
        }
      }
    }
    res.json(data);
  }

  //#endregion

  //#region Statistics

  /**
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   */
  listStatistics(_req, res) {
    const data = {};

    this.accounts.count()
      .then(userAmount => {
        data.users = userAmount;
        return Promise.resolve(this.packages.count());
      })
      .then(packageAmount => {
        data.packages = packageAmount;
        return Promise.resolve();
      })
      .catch(err => {
        this.logger.error(err.stack);
      })
      .then(() => res.json(data));
  }

  //#endregion

};
