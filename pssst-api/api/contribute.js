const axios = require('axios');

const BOT_TOKEN = process.env.PSSST_BOT_TOKEN;
const TARGET_REPO = 'yybmion/pssst';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: "PSSST API is working!",
      hasToken: !!BOT_TOKEN,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  }

  if (req.method === 'POST') {
    try {
      const { message, isAnonymous = false, author = 'anonymous' } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string'
        });
      }

      if (message.length > 200) {
        return res.status(400).json({
          success: false,
          error: `Message too long (${message.length}/200 characters)`
        });
      }

      if (!BOT_TOKEN) {
        return res.status(500).json({
          success: false,
          error: 'Bot token not configured'
        });
      }

      const github = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
          'Authorization': `token ${BOT_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'pssst-bot'
        }
      });

      const lang = detectLanguage(message);

      const newMessage = {
        text: message,
        author: isAnonymous ? 'anonymous' : author,
        timestamp: new Date().toISOString(),
        lang: lang
      };

      console.log('Creating PR for message:', newMessage);

      const result = await createPRWithBot(github, newMessage, isAnonymous);

      return res.status(200).json({
        success: true,
        prUrl: result.prUrl,
        message: newMessage,
        language: lang
      });

    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        success: false,
        error: `Failed to create PR: ${error.message}`
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function detectLanguage(text) {
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);

  if (hasKorean) return 'ko';
  if (hasChinese) return 'ch';
  if (hasJapanese) return 'jp';
  return 'en';
}

async function createPRWithBot(github, newMessage, isAnonymous) {
  try {
    console.log('Getting main branch info...');
    const mainBranchResponse = await github.get(`/repos/${TARGET_REPO}/git/refs/heads/main`);
    const mainSha = mainBranchResponse.data.object.sha;

    const branchName = `add-message-${Date.now()}`;
    console.log(`Creating branch: ${branchName}`);
    await github.post(`/repos/${TARGET_REPO}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha: mainSha
    });

    console.log('Updating files...');
    await updateFileWithBot(github, `messages/${newMessage.lang}.json`, newMessage, branchName);
    await updateFileWithBot(github, 'messages/all.json', newMessage, branchName);

    const prTitle = isAnonymous
        ? `Add new ${newMessage.lang} anonymous message`
        : `Add new ${newMessage.lang} message by @${newMessage.author}`;

    const prBody = `## 🌍 New Developer Message

**Message:** "${newMessage.text}"
**Author:** ${newMessage.author}
**Language:** ${newMessage.lang}
**Mode:** ${isAnonymous ? 'Anonymous' : 'Public'}

*This PR was created automatically by PSSST Bot*`;

    console.log('Creating PR...');
    const prResponse = await github.post(`/repos/${TARGET_REPO}/pulls`, {
      title: prTitle,
      body: prBody,
      head: branchName,
      base: 'main'
    });

    console.log('PR created successfully:', prResponse.data.html_url);
    return {
      prUrl: prResponse.data.html_url
    };

  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    throw error;
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
    console.log(`Updated ${filePath} successfully`);

  } catch (error) {
    console.error(`Failed to update ${filePath}:`, error.response?.data || error.message);
    throw new Error(`Failed to update ${filePath}: ${error.message}`);
  }
}
