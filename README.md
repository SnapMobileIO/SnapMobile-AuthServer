# SnapMobile-AuthServer
A npm module for server side authentication

# Usage

Include this private module by adding the following under `dependencies` in `package.json`, and run `npm install`.

    "snapmobile-auth": "git+https://62c8578b25fe85a6cd679783c834bee2ece03e39:x-oauth-basic@github.com/SnapMobileIO/SnapMobile-AuthServer.git",

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

# Updating

Make any changes in `/src`.

Once changes are completed, run `gulp dist` to process JavaScript files and add to `/dist`.
