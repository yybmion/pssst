// .github/scripts/ai-review.js
const axios = require('axios');
const fs = require('fs');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const github = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'pssst-ai-review'
  }
});

async function callGeminiAPI(message) {
  const prompt = `
Please review the following developer message:

Message: "${message}"

Review criteria:
1. Does it contain spam, advertisements, or inappropriate content?
2. Does it contain discriminatory expressions?

Response format:
{
  "approved": true/false,
  "reason": "approval/rejection reason",
  "language": "detected language (ko/en/ch/jp)",
  "category": "review result"
}

Please respond only in JSON format.`;

  try {
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    console.log('AI Response:', aiResponse);

    try {
      return JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, ''));
    } catch (parseError) {
      console.log('JSON parsing failed, using fallback');
      return {
        approved: false,
        reason: 'Fail parsing from AI response',
        language: 'unknown',
        category: 'parsing_error'
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    return {
      approved: false,
      reason: 'Error occur from AI review',
      language: 'unknown',
      category: 'api_error'
    };
  }
}

async function extractNewMessages() {
  const prNumber = process.env.GITHUB_EVENT_PATH
      ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')).pull_request.number
      : null;

  if (!prNumber) {
    throw new Error('PR number not found');
  }

  console.log(`Analyzing PR #${prNumber}`);

  const filesResponse = await github.get(`/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}/files`);
  const changedFiles = filesResponse.data;

  const newMessages = [];

  for (const file of changedFiles) {
    if (file.filename.startsWith('messages/') && file.filename.endsWith('.json')) {
      console.log(`Checking file: ${file.filename}`);

      const fileResponse = await github.get(`/repos/${process.env.GITHUB_REPOSITORY}/contents/${file.filename}?ref=${process.env.GITHUB_HEAD_REF}`);
      const content = JSON.parse(Buffer.from(fileResponse.data.content, 'base64').toString());

      if (content.messages && content.messages.length > 0) {
        const latestMessage = content.messages[content.messages.length - 1];
        newMessages.push({
          text: latestMessage.text,
          author: latestMessage.author,
          lang: latestMessage.lang,
          file: file.filename
        });
      }
    }
  }

  return { prNumber, messages: newMessages };
}

async function addComment(prNumber, message) {
  try {
    await github.post(`/repos/${process.env.GITHUB_REPOSITORY}/issues/${prNumber}/comments`, {
      body: message
    });
    console.log('Comment added successfully');
  } catch (error) {
    console.error('Failed to add comment:', error.message);
  }
}

async function mergePR(prNumber) {
  try {
    await github.put(`/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}/merge`, {
      commit_title: 'AI Review: Auto-merge approved message',
      commit_message: 'This message was automatically reviewed and approved by AI.',
      merge_method: 'squash'
    });
    console.log('PR merged successfully');
  } catch (error) {
    console.error('Failed to merge PR:', error.message);
  }
}

async function closePR(prNumber) {
  try {
    await github.patch(`/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}`, {
      state: 'closed'
    });
    console.log('PR closed successfully');
  } catch (error) {
    console.error('Failed to close PR:', error.message);
  }
}

async function main() {
  try {
    console.log('🤖 Starting AI message review...');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found');
    }
    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN not found');
    }

    const { prNumber, messages } = await extractNewMessages();

    if (messages.length === 0) {
      console.log('No new messages found');
      return;
    }

    console.log(`Found ${messages.length} new message(s)`);

    for (const message of messages) {
      console.log(`\n🔍 Reviewing message: "${message.text}"`);

      const review = await callGeminiAPI(message.text);
      console.log('Review result:', review);

      if (review.approved) {
        console.log('✅ Message approved');

        await addComment(prNumber,
            `## ✅ AI Review: Approved\n\n` +
            `**Message:** "${message.text}"\n` +
            `**Author:** @${message.author}\n` +
            `**Detected Language:** ${review.language}\n` +
            `**Category:** ${review.category}\n` +
            `**Reason:** ${review.reason}\n\n` +
            `🤖 This message has been automatically approved and will be merged.`
        );

        await mergePR(prNumber);

      } else {
        console.log('❌ Message rejected');

        await addComment(prNumber,
            `## ❌ AI Review: Rejected\n\n` +
            `**Message:** "${message.text}"\n` +
            `**Author:** @${message.author}\n` +
            `**Reason:** ${review.reason}\n\n` +
            `🚫 This message does not meet our community guidelines. Please review and submit a different message.`
        );

        await closePR(prNumber);
      }
    }

    console.log('🎉 AI review completed');

  } catch (error) {
    console.error('❌ AI review failed:', error.message);
    process.exit(1);
  }
}

main();
