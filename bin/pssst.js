#!/usr/bin/env node
// bin/pssst.js

const { program } = require('commander');

program
.action(() => {
  console.log('Hello DevMsg!');
});

program.parse();
