'use strict';

import passport from 'passport';
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';

// TODO: Move these to config
const validateJwt = expressJwt({ secret: process.env.SESSION_SECRET });

var User;

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
export function setUser(_user) {
  User = _user;
}

/**
 * Middleware attaches the user object to the request if authenticated
 * If shouldError is false, a 401 will not be returned, but req.user will be undefined
 */
export function isAuthenticated(shouldError = true) {
  return compose()
    .use(function(req, res, next) {
      // Validate jwt
      // allow access_token to be passed through query parameter as well
      if (req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }

      validateJwt(req, res, next);
    })
    .use(function(err, req, res, next) {
      if (!shouldError) { return next(); }

      // Catch UnauthorizedError for better response
      if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: err.message });
      }
    })
    .use(function(req, res, next) {
      if (!shouldError && !req.user) { return next(); }

      // Attach user to request
      User.findById(req.user._id)
        .then(user => {
          if (!user) {
            return res.status(401).end();
          }

          req.user = user;
          next();
        })
        .catch(err => next(err));
    });
}

/**
 * Alias for isAuthenticated(false);
 */
export function canAuthenticate() {
  return isAuthenticated(false);
}

/**
 * Middleware checks if the user's roles meets the minimum requirements of the route
 */
export function hasRole(roleRequired) {
  if (!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
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
export function signToken(id) {
  return jwt.sign({ _id: id }, process.env.SESSION_SECRET, {
    expiresIn: '100 days',
  });
}

/**
 * Set token cookie directly for oAuth strategies
 */
export function setTokenCookie(req, res) {
  if (!req.user) {
    return res.status(404).send('It looks like you aren\'t logged in, please try again.');
  }

  var token = signToken(req.user._id);
  res.cookie('token', token);
  res.redirect('/');
}
