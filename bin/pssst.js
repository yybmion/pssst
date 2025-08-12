#!/usr/bin/env node
// bin/pssst.js

const { program } = require('commander');
const { getRandomMessage } = require('../lib/github');
const chalk = require('chalk');

program
.action(async () => {
  console.log('Fetching message ...');
  const message = await getRandomMessage();
  console.log(chalk.cyan(`"${message}"`));
  console.log(chalk.gray('- Bring message from Github'));
});

program.parse();
