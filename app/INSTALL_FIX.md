# Installation

Use Node.js 20:

```bash
nvm use 20.19.5
rm -rf node_modules
npm cache verify
npm ci --no-audit --no-fund --progress=false
```

The package lock is pinned to the public npm registry. Do not interrupt `npm ci` while it is extracting packages.

Then run Metro and Android in separate terminals:

```bash
npm start -- --reset-cache
```

```bash
npm run android
```
