#!/usr/bin/env node
// bin/pssst.js

const { program } = require('commander');
const { getRandomMessage, contributeMessage } = require('../lib/github');
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

function getFlag(country) {
  const flags = {
    'KR': '🇰🇷',
    'US': '🇺🇸',
    'JP': '🇯🇵',
    'CN': '🇨🇳',
    'GLOBAL': '🌍'
  };
  return flags[country] || '🌍';
}

program
.option('-l, --lang <language>', 'filter by language (ko, en, ch, jp, all)', 'all')
.option('-d, --detailed', 'show detailed author information')
.action(async (options) => {
  const message = await getRandomMessage(options.lang);

  if (typeof message === 'string') {
    console.log(chalk.red(message));
  } else {
    console.log(chalk.cyan(`"${message.text}"`));

    console.log(chalk.gray(`- ${getTimeAgo(message.timestamp)}, @${message.author} ${getFlag(message.country)}`));

    if (options.detailed) {
      console.log(chalk.gray(`- Profile: https://github.com/${message.author}`));
    }
  }
});

program
.command('contribute <message>')
.description('contribute a new developer message')
.action(async (message) => {
  console.log(chalk.blue('🚀 Contributing your message...'));
  console.log(chalk.gray(`Message: "${message}"`));

  const result = await contributeMessage(message);

  if (result.success) {
    console.log(chalk.green('✅ Message contributed successfully!'));
    console.log(chalk.gray(`🔗 PR created: ${result.prUrl}`));
    console.log(chalk.gray(`👤 Author: @${result.author}`));
    console.log(chalk.gray(`📋 Language detected: ${result.language}`));
    console.log(chalk.gray('🤖 Your message will be reviewed and merged automatically'));
  } else {
    console.log(chalk.red('❌ Failed to contribute message:'));
    console.log(chalk.red(result.error));
  }
});

program.parse();
