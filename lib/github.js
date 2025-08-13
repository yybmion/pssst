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
        lang: message.lang,
        country: message.country
      };
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
    const lang = detectedLanguages[0];
    const countryMap = {
      'ko': 'KR',
      'ch': 'CN',
      'jp': 'JP',
      'en': 'US'
    };

    return {
      lang: lang,
      country: countryMap[lang],
      mixedLanguage: false
    };
  }

  return {
    lang: 'all',
    country: 'GLOBAL',
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

async function contributeMessage(messageText) {
  try {
    console.log('🔍 Checking GitHub CLI authentication...');
    try {
      execSync('gh auth status', { stdio: 'pipe' });
    } catch (error) {
      return {
        success: false,
        error: 'GitHub CLI not authenticated. Please run "gh auth login" first.'
      };
    }

    console.log('👤 Getting GitHub user info...');
    const githubUsername = await getGitHubUser();
    console.log(`   User: @${githubUsername}`);

    console.log('🔤 Detecting language...');
    const { lang, country, mixedLanguage } = detectLanguage(messageText);

    if (mixedLanguage) {
      console.log(`   Detected: Mixed languages → all.json`);
    } else {
      console.log(`   Detected: ${lang} (${country})`);
    }

    const newMessage = {
      text: messageText,
      author: githubUsername,
      timestamp: getLocalISOString(),
      lang: lang,
      country: country
    };

    console.log('📁 Setting up workspace...');
    const tempDir = path.join(os.tmpdir(), `pssst-contribute-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const originalDir = process.cwd();

    try {
      console.log('📥 Cloning repository...');
      process.chdir(tempDir);
      execSync('gh repo clone yybmion/pssst', { stdio: 'pipe' });
      process.chdir(path.join(tempDir, 'pssst'));

      const branchName = `add-message-${Date.now()}`;
      console.log(`🌿 Creating branch: ${branchName}`);
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });

      if (mixedLanguage) {
        console.log(`📝 Adding mixed language message to all.json only...`);
        await addMessageToFile('messages/all.json', newMessage);
      } else {
        console.log(`📝 Adding message to ${lang}.json and all.json...`);
        await addMessageToFile(`messages/${lang}.json`, newMessage);
        await addMessageToFile('messages/all.json', newMessage);
      }

      console.log('💾 Committing changes...');
      execSync('git add .', { stdio: 'pipe' });
      execSync(`git commit -m "Add ${lang} message by @${githubUsername}"`, { stdio: 'pipe' }); // 커밋 메시지도 단순화

      console.log('⬆️ Pushing to GitHub...');
      execSync(`git push origin ${branchName}`, { stdio: 'pipe' });

      console.log('🔄 Creating Pull Request...');

      const prTitle = `Add new ${lang} message by @${githubUsername}`;

      const prBodyPath = path.join(tempDir, 'pr-body.txt');
      const prBody = `## 🌍 New Developer Message

**Message:** "${messageText}"
**Author:** @${githubUsername}
**Language:** ${lang}
**Country:** ${country}

*This PR was created automatically by pssst CLI*`;

      fs.writeFileSync(prBodyPath, prBody);

      const prResult = execSync(`gh pr create --title "${prTitle}" --body-file "${prBodyPath}"`, { encoding: 'utf8' });
      const prUrl = prResult.trim();

      return {
        success: true,
        prUrl: prUrl,
        message: newMessage,
        language: lang,
        author: githubUsername
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

module.exports = { getRandomMessage, contributeMessage };
