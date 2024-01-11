Simple lib for generating a dynamic package.json based on recursively stepping through source files and finding imports.

Currently setup to work for nx projects and calling generateNx somewhere in the build process.

```
const { generateNx } = require('generate-package-json');

// if you omit the last param it will not save anywhere
const packageJsonObject = generateNx('./path/to/nx/app', './path/to/nx/root', './optional/save/to/build/folder/path');
```
