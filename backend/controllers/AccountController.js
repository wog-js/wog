// Require modules
const Controller = require('./Controller');

/**
 * The FrontendController is responsible for rendering the HTML pages.
 */
module.exports = class AccountController extends Controller {

  init() {
    this.logger = logger.scope('ProfileController');
    this.title = this.app.get('title') + ' | account';
  }

  /**
   * Example route handler.
   *
   * @param {Express.Request} req
   * @param {Express.Response} res
   */
  showAccount(req, res) {
    this.render(res, 'account/show.html', {
      title: `${this.title} overview`,
      user: req.user
    });
  }

};