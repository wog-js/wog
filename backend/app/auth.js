// Require modules
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const accounts = require('./accounts');

// Configure strategy
passport.use(new LocalStrategy(
  (username, password, done) => {
    if (!accounts.has(username)) {
      return done(null, false, { message: 'Unknown username!' });
    }
    if (!accounts.checkAuth(username, password)) {
      return done(null, false, { message: 'Incorrect password!' });
    }

    return done(null, username);
  }
));

// Serialization
passport.serializeUser((username, done) => {
  done(null, username);
});
passport.deserializeUser((username, done) => {
  const user = accounts.find(username);
  if (!user) done('Unknown user!', null);
  else done(null, user);
});

// export configured passport instance
module.exports = app => {

  // setup session store
  app.use(session({
    secret: config.secure.secret,
    saveUninitialized: true,
    resave: false,
    store: new RedisStore(config.secure.redis)
  }));

  // Init passport authentication
  app.use(passport.initialize());

  // persistent login sessions
  app.use(passport.session());

  // persist passport instance
  app.set('passport', passport);
};
