# SnapMobile-AuthServer
A npm module for server side authentication

# Usage

Include this private module by adding the following under `dependencies` in `package.json`, and run `npm install`.

    "snapmobile-auth": "git+ssh://@github.com/SnapMobileIO/SnapMobile-AuthServer.git",

To configure, add the following to `routes.js`:

```
import User from '../app/user/user.model';
...
var auth = require('snapmobile-authserver');
auth.initialize(User);
app.use('/auth', auth.router);
```

To use `auth.service`, call the following:

```
import authServer from 'snapmobile-authserver';
import User from './user.model';
authServer.initialize(User);
var auth = authServer.authService; // auth.service.js
```

# Facebook

Add the following to .env:

    # Facebook API keys
    FACEBOOK_APP_ID=[YOUR_ID]
    FACEBOOK_APP_SECRET=[YOUR_SECRET]
    FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

Then, update your call of `initialize` to:

```
authServer.initialize(User, [{ name: 'facebook', callback: (user, facebookProfile) => {
    //configure any additional fields here. 
}]);
```

By default, the user's name, profile photo, facebook id, facebook access token and facebook refresh token are stored under `user.socialProfiles.facebook`.

# Linkedin

Add the following to .env:

```
# Linkedin API keys
LINKEDIN_API_KEY=
LINKEDIN_SECRET_KEY=
LINKEDIN_CALLBACK_URL=http://localhost:3000/auth/linkedin/callback
```

Then, update your call of `setUser` to:

```
authServer.initialize(User, [{ name: 'linkedin', callback: (user, linkedinProfile) => {
    //configure any additional fields here. 
}]);
```

By default, the user's name, photo, linkedin id, and headline are stored under `user.socialProfiles.linkedin`.

# Updating

Make any changes in `/src`.

Once changes are completed, run `gulp dist` to process JavaScript files and add to `/dist`.
