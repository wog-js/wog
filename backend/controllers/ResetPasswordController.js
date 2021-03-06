// Require modules
const Controller = require('./Controller');
const debug = require('debug')('wog:ResetPasswordController');

const { idGen, url } = require('@wogjs/utils');

const TOKEN_PREFIX = 'password_reset:';
const TOKEN_LENGTH = 32;

/**
 * The ResetPasswordController is responsible for handling password reset requests and sending
 * the corresponding emails.
 */
module.exports = class ResetPasswordController extends Controller {

  init() {
    this.config = this.container.resolve('config');

    /** @type {import('@wogjs/types').RedisManager} */
    this.redis = this.container.resolve('redis');

    /** @type {import('@wogjs/types').Accounts} */
    this.accounts = this.container.resolve('accounts');

    /** @type {import('@wogjs/types').Mailer} */
    this.mailer = this.container.resolve('mailer');

    /** @type {string} */
    this.title = this.app.get('title');
  }

  _flashError(req, msg) {
    req.flash('status', msg);
    req.flash('status-class', 'is-danger');
  }

  async _generateToken(userId) {
    const token = await idGen(TOKEN_LENGTH);
    const lifetime = this.config.secure.resetTokenLifetime;
    return new Promise((resolve, reject) => {
      this.redis.client.setex(TOKEN_PREFIX + token, lifetime, userId, (err, reply) => {
        if (err) reject(err);
        else {
          debug(`Redis replied: ${reply}`);
          resolve(token);
        }
      });
    });
  }

  _checkToken(token) {
    return new Promise((resolve, reject) => {
      this.redis.client.get(TOKEN_PREFIX + token, (err, reply) => {
        if (err) reject(err);
        else if (reply === null) resolve();
        else {
          debug(`Redis replied: ${reply}`);
          resolve(reply);
        }
      });
    });
  }

  async _deleteToken(token) {
    return new Promise((resolve, reject) => {
      this.redis.client.del(token, (err, reply) => {
        if (err) reject(err);
        else {
          debug(`Redis replied: ${reply}`);
          resolve();
        }
      });
    });
  }

  /**
   * Show the form for requesting a password reset.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  showRequestForm(req, res) {
    this.render(res, 'password-reset/request-form.html', {
      title: `${this.title} | reset password`
    });
  }

  /**
   * Handles an incoming password reset request.
   * The only required POST parameter is the user's email or username.
   * If a matching entry is found in the database, an email is sent to the found user.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async handleRequest(req, res) {
    const redirectPath = url('reset/password');
    const commonErrorHandler = err => {
      if (typeof err === 'object') this.logger.error(err); // only log thrown errors
      this._flashError(req, err.message || err);
      res.redirect(redirectPath);
    };

    req.flash('username', req.body.username);

    // do nothing when not connected to SMTP server
    if (!this.mailer.isConnected) {
      commonErrorHandler('Application is not configured to send mails! Please contact your administrator.');
      return;
    }

    try {
      const user = await this.accounts.findByUsername(req.body.username);
      if (!user) {
        commonErrorHandler('No matching user found!');
        return;
      }
      if (!user.email) {
        commonErrorHandler('The user has no email configured! Please contact your administrator.');
        return;
      }

      const token = await this._generateToken(user.id);
      const url = redirectPath + '/' + token;
      const sentMailInfo = await this.mailer.sendMail(
        user.email, 'Password Reset Request',
        `
        <p>Password Reset Request</p>
        <a href="${url}">${url}</a>
        `
      );

      this.logger.info('Sent an email message to ' + user.email + '. (' + sentMailInfo.messageId + ')');
      req.flash('status', 'An email has been sent. Check your inbox.');
      req.flash('status-class', 'is-success');
      res.redirect(redirectPath);
    } catch (err) {
      commonErrorHandler(err);
    }
  }

  /**
   * Show the form for actually resetting the password.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async showResetForm(req, res) {
    const token = req.params.token;

    if (!token || !await this._checkToken(token)) {
      this._flashError(req, 'Invalid token!');
      res.redirect( url('reset/password') );
      return;
    }

    this.render(res, 'password-reset/reset-form.html', {
      title: `${this.title} | reset password`,
      token
    });
  }

  /**
   * Handles a password reset.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async handleReset(req, res) {
    const tokenFromRequest = req.params.token;
    const redirectPath = url('reset/password/' + tokenFromRequest);

    try {
      const userId = await this._checkToken(tokenFromRequest);
      if (!tokenFromRequest || !userId) {
        this._flashError(req, 'Invalid token!');
        res.redirect(redirectPath);
        return;
      }

      const password = req.body.password;
      const password_confirmed = req.body.password_confirm;

      if (!password || !password_confirmed) {
        this._flashError(req, 'Both fields must be filled!');
        res.redirect(redirectPath);
        return;
      }
      if (password !== password_confirmed) {
        this._flashError(req, 'The passwords do no match!');
        res.redirect(redirectPath);
        return;
      }

      await this._deleteToken(tokenFromRequest);
      await this.accounts.update({ id: userId, password });

      req.flash('status', 'The password has been changed.');
      res.redirect( url() );
    } catch (err) {
      this.logger.error('Failed to reset a password! ' + err.message);
      debug(err);
      this._flashError(req, err.message);
      res.redirect(redirectPath);
    }
  }
}
