// lib/github.js
const axios = require('axios');
const { execSync } = require('child_process');

function getMessageUrl(lang) {
  const baseUrl = 'https://raw.githubusercontent.com/yybmion/pssst/main/messages';

  switch(lang) {
    case 'ko':
      return `${baseUrl}/ko.json`;
    case 'en':
      return `${baseUrl}/en.json`;
    case 'ch':
      return `${baseUrl}/ch.json`;
    case 'jp':
      return `${baseUrl}/jp.json`;
    case 'all':
    default:
      return `${baseUrl}/all.json`;
  }
}

async function getRandomMessage(lang = 'all') {
  try {
    const url = getMessageUrl(lang);
    const response = await axios.get(url);
    const data = response.data;

    if (data.messages && data.messages.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.messages.length);
      const message = data.messages[randomIndex];

      return {
        text: message.text,
        author: message.author,
        timestamp: message.timestamp,
        lang: message.lang
      };
    }

    return `No ${lang} messages available 😢`;
  } catch (error) {
    console.error('Error details:', error.message);
    return `Failed to fetch ${lang} messages 😢`;
  }
}

async function getRecentMessages(lang = 'all', count = 10) {
  try {
    const url = getMessageUrl(lang);
    const response = await axios.get(url);
    const data = response.data;

    if (data.messages && data.messages.length > 0) {
      const sortedMessages = data.messages
      .map(message => ({
        text: message.text,
        author: message.author,
        timestamp: message.timestamp,
        lang: message.lang
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return sortedMessages.slice(0, count);
    }

    return `No ${lang} messages available 😢`;
  } catch (error) {
    console.error('Error details:', error.message);
    return `Failed to fetch ${lang} messages 😢`;
  }
}

async function getUserInfo() {
  try {
    const userInfo = execSync('gh api user', { encoding: 'utf8' });
    const user = JSON.parse(userInfo);
    return user.login;
  } catch (error) {
    console.warn('Failed to get user info, using anonymous');
    return 'anonymous';
  }
}

async function contributeMessage(messageText, isAnonymous = false) {
  try {
    if (messageText.length > 200) {
      return {
        success: false,
        error: `Message too long (${messageText.length}/200 characters). Please keep it under 200 characters.`
      };
    }

    let displayAuthor = 'anonymous';
    if (!isAnonymous) {
      displayAuthor = await getUserInfo();
    }

    const apiUrl = 'https://pssst-3yvyhdmbq-yybmions-projects.vercel.app/api/contribute';

    console.log('Calling API:', apiUrl);

    const response = await axios.post(apiUrl, {
      message: messageText,
      isAnonymous: isAnonymous,
      author: displayAuthor
    });

    return {
      success: true,
      prUrl: response.data.prUrl,
      message: response.data.message,
      language: response.data.language,
      author: displayAuthor
    };

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || `API Error: ${error.message}`
    };
  }
}

module.exports = {
  getRandomMessage,
  getRecentMessages,
  contributeMessage
};
