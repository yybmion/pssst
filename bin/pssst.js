#!/usr/bin/env node
// bin/pssst.js

const { program } = require('commander');
const { getRandomMessage, getRecentMessages, contributeMessage } = require('../lib/github');
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
    return 'few minutes before';
  }
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
    console.log(chalk.gray(`- ${getTimeAgo(message.timestamp)}, @${message.author}`));

    if (options.detailed) {
      console.log(chalk.gray(`- Profile: https://github.com/${message.author}`));
    }
  }
});

program
.command('recent [count]')
.description('show recent messages (default: 10)')
.option('-l, --lang <language>', 'filter by language (ko, en, ch, jp, all)', 'all')
.option('-d, --detailed', 'show detailed author information')
.action(async (count, options) => {
  const messageCount = parseInt(count) || 10;

  if (messageCount < 1 || messageCount > 50) {
    console.log(chalk.red('Count must be between 1 and 50'));
    return;
  }

  console.log(chalk.blue(`📝 Recent ${messageCount} messages from ${options.lang === 'all' ? 'all languages' : options.lang}:\n`));

  const messages = await getRecentMessages(options.lang, messageCount);

  if (typeof messages === 'string') {
    console.log(chalk.red(messages));
  } else if (messages.length === 0) {
    console.log(chalk.yellow('No messages found 😢'));
  } else {
    messages.forEach((message, index) => {
      console.log(chalk.cyan(`${index + 1}. "${message.text}"`));
      console.log(chalk.gray(`   - ${getTimeAgo(message.timestamp)}, @${message.author}`));

      if (options.detailed) {
        console.log(chalk.gray(`   - Profile: https://github.com/${message.author}`));
      }

      if (index < messages.length - 1) console.log();
    });
  }
});

program
.command('send <message>')
.description('contribute a new developer message')
.option('-a, --anonymous', 'contribute message anonymously')
.action(async (message, options) => {
  console.log(chalk.blue('Contributing your message...'));

  if (options.anonymous) {
    console.log(chalk.gray('-Anonymous mode'));
  }

  const result = await contributeMessage(message, options.anonymous);

  if (result.success) {
    console.log(chalk.green('-Message contributed successfully!'));
    console.log(chalk.gray(`--${result.prUrl}`));
    console.log(chalk.gray(`---@${result.author} • ${result.language}`));
  } else {
    console.log(chalk.red('❌ Failed to contribute message:'));
    console.log(chalk.red(result.error));
  }
});

program.parse();
