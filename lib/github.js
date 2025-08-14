// lib/github.js
const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BOT_TOKEN = process.env.PSSST_BOT_TOKEN;
const BOT_USERNAME = 'pssst-bot';
const TARGET_REPO = 'yybmion/pssst';

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

function getLocalISOString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
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

function detectLanguage(text) {
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  const detectedLanguages = [];
  if (hasKorean) detectedLanguages.push('ko');
  if (hasChinese) detectedLanguages.push('ch');
  if (hasJapanese) detectedLanguages.push('jp');
  if (hasEnglish && !hasKorean && !hasChinese && !hasJapanese) {
    detectedLanguages.push('en');
  }

  if (detectedLanguages.length === 1) {
    return {
      lang: detectedLanguages[0],
      mixedLanguage: false
    };
  }

  return {
    lang: 'all',
    mixedLanguage: true
  };
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

    if (!BOT_TOKEN) {
      return {
        success: false,
        error: 'Bot token not configured. Please contact the maintainer.'
      };
    }

    try {
      execSync('gh auth status', { stdio: 'pipe' });
    } catch (error) {
      return {
        success: false,
        error: 'GitHub CLI not authenticated. Please run "gh auth login" first.'
      };
    }

    let displayAuthor = 'anonymous';
    if (!isAnonymous) {
      displayAuthor = await getUserInfo();
    }

    const { lang, mixedLanguage } = detectLanguage(messageText);

    const newMessage = {
      text: messageText,
      author: displayAuthor,
      timestamp: getLocalISOString(),
      lang: lang
    };

    const result = await createPRWithBot(newMessage, isAnonymous, displayAuthor);

    return {
      success: result.success,
      prUrl: result.prUrl,
      message: newMessage,
      language: lang,
      author: displayAuthor,
      error: result.error
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to create PR: ${error.message}`
    };
  }
}

async function createPRWithBot(newMessage, isAnonymous, displayAuthor) {
  try {
    const github = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${BOT_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'pssst-bot'
      }
    });

    const mainBranchResponse = await github.get(`/repos/${TARGET_REPO}/git/refs/heads/main`);
    const mainSha = mainBranchResponse.data.object.sha;

    const branchName = `add-message-${Date.now()}`;
    await github.post(`/repos/${TARGET_REPO}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha: mainSha
    });

    const { lang, mixedLanguage } = detectLanguage(newMessage.text);

    if (mixedLanguage) {
      await updateFileWithBot(github, 'messages/all.json', newMessage, branchName);
    } else {
      await updateFileWithBot(github, `messages/${lang}.json`, newMessage, branchName);
      await updateFileWithBot(github, 'messages/all.json', newMessage, branchName);
    }

    const prTitle = isAnonymous
        ? `Add new ${lang} anonymous message`
        : `Add new ${lang} message by @${displayAuthor}`;

    const prBody = `## 🌍 New Developer Message

**Message:** "${newMessage.text}"
**Author:** ${displayAuthor}
**Language:** ${lang}
**Mode:** ${isAnonymous ? 'Anonymous' : 'Public'}

*This PR was created automatically by PSSST Bot*`;

    const prResponse = await github.post(`/repos/${TARGET_REPO}/pulls`, {
      title: prTitle,
      body: prBody,
      head: branchName,
      base: 'main'
    });

    return {
      success: true,
      prUrl: prResponse.data.html_url
    };

  } catch (error) {
    console.error('Bot API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: `Bot failed to create PR: ${error.message}`
    };
  }
}

async function updateFileWithBot(github, filePath, newMessage, branchName) {
  try {
    let fileData = { messages: [] };
    let fileSha = null;

    try {
      const fileResponse = await github.get(`/repos/${TARGET_REPO}/contents/${filePath}`, {
        params: { ref: branchName }
      });

      const content = Buffer.from(fileResponse.data.content, 'base64').toString();
      fileData = JSON.parse(content);
      fileSha = fileResponse.data.sha;
    } catch (error) {
      console.log(`File ${filePath} not found, creating new file`);
    }

    fileData.messages.push(newMessage);

    const updatedContent = Buffer.from(JSON.stringify(fileData, null, 2)).toString('base64');

    const updateData = {
      message: `Add message to ${filePath}`,
      content: updatedContent,
      branch: branchName
    };

    if (fileSha) {
      updateData.sha = fileSha;
    }

    await github.put(`/repos/${TARGET_REPO}/contents/${filePath}`, updateData);

  } catch (error) {
    throw new Error(`Failed to update ${filePath}: ${error.message}`);
  }
}

module.exports = { getRandomMessage, getRecentMessages, contributeMessage };
