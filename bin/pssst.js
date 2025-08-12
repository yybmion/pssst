#!/usr/bin/env node
// bin/pssst.js

const { program } = require('commander');
const { getRandomMessage } = require('../lib/github');
const chalk = require('chalk');

function getTimeAgo(timestamp) {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now - messageTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}days before`;
  } else if (diffHours > 0) {
    return `${diffHours}hours before`;
  } else {
    return 'now';
  }
}

program
.action(async () => {
  const message = await getRandomMessage();

  if (typeof message === 'string') {
    console.log(chalk.red(message));
  } else {
    console.log(chalk.cyan(`"${message.text}"`));
    console.log(chalk.gray(`- ${getTimeAgo(message.timestamp)}, author @${message.author} `));
  }
});

program.parse();
