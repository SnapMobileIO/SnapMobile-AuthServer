'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setUser = setUser;
exports.isAuthenticated = isAuthenticated;
exports.canAuthenticate = canAuthenticate;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _expressJwt = require('express-jwt');

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _composableMiddleware = require('composable-middleware');

var _composableMiddleware2 = _interopRequireDefault(_composableMiddleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import User from '../user/user.model';

// TODO: Move these to config
var validateJwt = (0, _expressJwt2.default)({ secret: process.env.SESSION_SECRET });

var User;

function setUser(_user) {
  User = _user;
}

/**
 * Middleware attaches the user object to the request if authenticated
 * If shouldError is false, a 401 will not be returned, but req.user will be undefined
 */
function isAuthenticated() {
  var shouldError = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

  return (0, _composableMiddleware2.default)().use(function (req, res, next) {
    // Validate jwt
    // allow access_token to be passed through query parameter as well
    if (req.query && req.query.hasOwnProperty('access_token')) {
      req.headers.authorization = 'Bearer ' + req.query.access_token;
    }

    validateJwt(req, res, next);
  }).use(function (err, req, res, next) {
    if (!shouldError) {
      return next();
    }

    // Catch UnauthorizedError for better response
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({ error: err.message });
    }
  }).use(function (req, res, next) {
    if (!shouldError && !req.user) {
      return next();
    }

    // Attach user to request
    User.findById(req.user._id).then(function (user) {
      if (!user) {
        return res.status(401).end();
      }

      req.user = user;
      next();
    }).catch(function (err) {
      return next(err);
    });
  });
}

/**
 * Alias for isAuthenticated(false);
 */
function canAuthenticate() {
  return isAuthenticated(false);
}

/**
 * Middleware checks if the user's roles meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return (0, _composableMiddleware2.default)().use(isAuthenticated()).use(function meetsRequirements(req, res, next) {
    if (req.user.roles.indexOf(roleRequired) >= 0) {
      next();
    } else {
      res.status(403).send({ error: 'You do not have access to this' });
    }
  });
}

/**
 * Returns a jwt token signed by the app secret
 * ExpiresIn: seconds or string (https://github.com/rauchg/ms.js)
 * @param {String} id User id to be signed
 * @return {String} Signed token
 */
function signToken(id) {
  return _jsonwebtoken2.default.sign({ _id: id }, process.env.SESSION_SECRET, {
    expiresIn: '100 days'
  });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) {
    return res.status(404).send('It looks like you aren\'t logged in, please try again.');
  }

  var token = signToken(req.user._id);
  res.cookie('token', token);
  res.redirect('/');
}