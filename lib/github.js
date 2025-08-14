// lib/github.js
const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function getGitHubUser() {
  try {
    const userInfo = execSync('gh api user', { encoding: 'utf8' });
    const user = JSON.parse(userInfo);
    return user.login; // GitHub username
  } catch (error) {
    console.warn('Failed to get GitHub user, using anonymous');
    return 'anonymous';
  }
}

async function contributeMessage(messageText, isAnonymous = false) {
  try {
    try {
      execSync('gh auth status', { stdio: 'pipe' });
    } catch (error) {
      return {
        success: false,
        error: 'GitHub CLI not authenticated. Please run "gh auth login" first.'
      };
    }

    let githubUsername = 'anonymous';
    let displayAuthor = 'anonymous';

    if (!isAnonymous) {
      githubUsername = await getGitHubUser();
      displayAuthor = githubUsername;
    } else {
      githubUsername = await getGitHubUser();
    }

    const { lang, mixedLanguage } = detectLanguage(messageText);

    const newMessage = {
      text: messageText,
      author: displayAuthor,
      timestamp: getLocalISOString(),
      lang: lang
    };

    const tempDir = path.join(os.tmpdir(), `pssst-contribute-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const originalDir = process.cwd();

    try {
      process.chdir(tempDir);
      execSync('gh repo clone yybmion/pssst', { stdio: 'pipe' });
      process.chdir(path.join(tempDir, 'pssst'));

      const branchName = `add-message-${Date.now()}`;
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });

      if (mixedLanguage) {
        await addMessageToFile('messages/all.json', newMessage);
      } else {
        await addMessageToFile(`messages/${lang}.json`, newMessage);
        await addMessageToFile('messages/all.json', newMessage);
      }

      execSync('git add .', { stdio: 'pipe' });

      const commitMessage = isAnonymous
          ? `Add ${lang} anonymous message`
          : `Add ${lang} message by @${githubUsername}`;

      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      execSync(`git push origin ${branchName}`, { stdio: 'pipe' });

      const prTitle = isAnonymous
          ? `Add new ${lang} anonymous message`
          : `Add new ${lang} message by @${githubUsername}`;

      const prBodyPath = path.join(tempDir, 'pr-body.txt');
      const prBody = `## 🌍 New Developer Message

**Message:** "${messageText}"
**Author:** ${displayAuthor}
**Language:** ${lang}
**Mode:** ${isAnonymous ? 'Anonymous' : 'Public'}

*This PR was created automatically by pssst CLI*`;

      fs.writeFileSync(prBodyPath, prBody);

      const prResult = execSync(`gh pr create --title "${prTitle}" --body-file "${prBodyPath}"`, { encoding: 'utf8' });
      const prUrl = prResult.trim();

      return {
        success: true,
        prUrl: prUrl,
        message: newMessage,
        language: lang,
        author: displayAuthor
      };

    } finally {
      process.chdir(originalDir);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

  } catch (error) {
    return {
      success: false,
      error: `Failed to create PR: ${error.message}`
    };
  }
}

async function addMessageToFile(filePath, newMessage) {
  try {
    let data = { messages: [] };

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileContent);
    } else {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
    }

    data.messages.push(newMessage);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  } catch (error) {
    throw new Error(`Failed to update ${filePath}: ${error.message}`);
  }
}

module.exports = { getRandomMessage, getRecentMessages, contributeMessage };
