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
auth.setUser(User);
app.use('/auth', auth.router);
```

To use `auth.service`, call the following:

```
import authServer from 'snapmobile-authserver';
import User from './user.model';
authServer.setUser(User);
var auth = authServer.authService; // auth.service.js
```

# Facebook

Add the following to .env:

    # Facebook API keys
    FACEBOOK_APP_ID=[YOUR_ID]
    FACEBOOK_APP_SECRET=[YOUR_SECRET]
    FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

Then, update your call of `setUser` to:

    authServer.setUser(User, ['linkedin']);

# Linkedin

Add the following to .env:

```
# Linkedin API keys
LINKEDIN_API_KEY=
LINKEDIN_SECRET_KEY=
LINKEDIN_CALLBACK_URL=http://localhost:3000/auth/linkedin/callback
```

Then, update your call of `setUser` to:

    authServer.setUser(User, ['linkedin']);

Add the following to .env:

# Updating

Make any changes in `/src`.

Once changes are completed, run `gulp dist` to process JavaScript files and add to `/dist`.
