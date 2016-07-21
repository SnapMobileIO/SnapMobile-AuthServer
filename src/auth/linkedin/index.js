'use strict';

import { Router } from 'express';
import passport from 'passport';
import * as linkedinPassport from './passport';
import crypto from 'crypto';
import request from 'request';

const auth = require('../auth.service');
const Linkedin = require('node-linkedin')(process.env.LINKEDIN_API_KEY,
  process.env.LINKEDIN_SECRET_KEY, 'http://localhost/callback');

const router = new Router();

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function setUser(_user, _tag) {
  auth.setUser(_user);

  linkedinPassport.setup(_user, auth, _tag);
  router.get('/', passport.authenticate('linkedin', { scope: 'r_emailaddress' }));

  router.get('/callback', (req, res, next) => {
    passport.authenticate('linkedin', { failureRedirect: '/login' },
    (err, user) => {
      if (!user) {
        console.error(err);
        return res.status(404).json({ message: 'Something went wrong, please try again.' });
      }

      let token = auth.signToken(user._id);
      res.cookie('token', token);
      res.json({ token });
    })(req, res, next);
  });

  router.post('/', (req, res, next) => {
    let options = {
      url: 'https://www.linkedin.com/oauth/v2/accessToken',
      method: 'POST',
      headers: {},
      form: {
        grant_type: 'authorization_code',
        code: req.body.code,
        redirect_uri: 'http://' + req.headers.host + '/linkedin-callback',
        client_id: process.env.LINKEDIN_API_KEY,
        client_secret: process.env.LINKEDIN_SECRET_KEY
      }
    };
    request.post(options, (error, response, body) => {
      let bodyJSON = JSON.parse(body);
      if (!bodyJSON.access_token) { return; }

      let linkedin = Linkedin.init(bodyJSON.access_token);
      linkedin.people.me((err, linkedInUser) => {
        _user.findOne({ email: linkedInUser.emailAddress.toLowerCase() })
        .then(user => {
          if (!user) { // not registered

            //generate a random password for using Facebook login

            let randomPassword = crypto.randomBytes(16).toString('base64');

            let userObject = {
              firstName: linkedInUser.firstName,
              lastName: linkedInUser.lastName,
              email: linkedInUser.emailAddress.toLowerCase(),
              password: randomPassword,
              provider: 'linkedin',
              socialProfiles: {
                linkedin: {
                  id: linkedInUser.id,
                  info: linkedInUser.headline
                }
              }
            };
            if (linkedInUser.pictureUrl) {
              userObject.socialProfiles.linkedin.avatar = linkedInUser.pictureUrl;
            }

            if (_tag && linkedInUser.industry) {
              _tag.findOrCreate(linkedInUser.industry)
              .then(tag => {
                userObject._tags = [tag._id];
                _user.create(userObject).then(result => {
                  let token = Auth.signToken(result._id);
                  res.json({ token: token });
                })
                .catch(err => res.status(400).json({ message:
                  'Could not create user, please try again.' }));
              });
            } else {
              _user.create(userObject).then(result => {
                let token = auth.signToken(result._id);
                res.json({ token: token });
              })
              .catch(err => res.status(400).json({ message:
                'Could not create user, please try again.' }));
            }
          } else { // is registered
            if (!user.socialProfiles) {
              user.socialProfiles = { linkedin: {} };
            }

            user.socialProfiles.linkedin.id = linkedInUser.id;
            if (!user.socialProfiles.linkedin.info || user.socialProfiles.linkedin.info == '') {
              user.socialProfiles.linkedin.info = linkedInUser.headline;
            }

            if (!user.firstName || user.firstName == '') {
              user.firstName = linkedInUser.firstName;
            }

            if (!user.lastName || user.lastName == '') {
              user.lastName = linkedInUser.lastName;
            }

            if (linkedInUser.pictureUrl) {
              user.socialProfiles.linkedin.avatar = linkedInUser.pictureUrl;
            }

            user.markModified('socialProfiles');

            if (_tag && linkedInUser.industry) {
              _tag.findOrCreate(linkedInUser.industry)
              .then(tag => {
                if (user._tags.indexOf(tag._id) === -1) {
                  user._tags.push([tag._id]);
                  user.save();
                }
              });
            }

            user.save();
            let token = auth.signToken(user._id);
            res.json({ token: token });
          }
        })
      .catch(err => res.status(400).json({ message: 'Could not create user, please try again.' }));
      });
    });
  });
}

module.exports.authService = auth;
module.exports.router = router;
module.exports.setUser = setUser;
