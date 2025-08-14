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

Review criteria - ONLY REJECT if the message contains:
1. Hate speech, discrimination, or harassment based on race, gender, religion, nationality, etc.
2. Terrorist content, violence, or threats against individuals or groups
3. Spam, advertisements, or promotional content
4. Sexual content or explicit material
5. Illegal activities or dangerous instructions

IMPORTANT: 
- Casual profanity and swear words are ALLOWED as they are common in developer communication
- Technical complaints, frustrations, or criticism are ALLOWED
- Everyday developer emotions and expressions are ALLOWED
- Only reject content that is genuinely harmful or inappropriate for a professional developer community

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
      reason: 'Service Error about AI review',
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
  const seenMessages = new Set();

  for (const file of changedFiles) {
    if (file.filename.startsWith('messages/') && file.filename.endsWith('.json')) {
      console.log(`Checking file: ${file.filename}`);

      const fileResponse = await github.get(`/repos/${process.env.GITHUB_REPOSITORY}/contents/${file.filename}?ref=${process.env.GITHUB_HEAD_REF}`);
      const content = JSON.parse(Buffer.from(fileResponse.data.content, 'base64').toString());

      if (content.messages && content.messages.length > 0) {
        const latestMessage = content.messages[content.messages.length - 1];

        const messageKey = `${latestMessage.text}-${latestMessage.author}`;
        if (!seenMessages.has(messageKey)) {
          seenMessages.add(messageKey);
          newMessages.push({
            text: latestMessage.text,
            author: latestMessage.author,
            lang: latestMessage.lang,
            file: file.filename
          });
        }
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
    console.log('Checking PR status before merge...');
    const prResponse = await github.get(`/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}`);
    const pr = prResponse.data;

    console.log(`PR State: ${pr.state}`);
    console.log(`PR Mergeable: ${pr.mergeable}`);
    console.log(`PR Mergeable State: ${pr.mergeable_state}`);

    if (pr.state !== 'open') {
      throw new Error(`PR is not open (state: ${pr.state})`);
    }

    if (pr.mergeable === false) {
      throw new Error(`PR is not mergeable (mergeable_state: ${pr.mergeable_state})`);
    }

    console.log('Attempting to merge PR...');
    const mergeResponse = await github.put(`/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}/merge`, {
      commit_title: 'Auto-merge approved message',
      commit_message: 'This message was automatically reviewed and approved by AI.',
      merge_method: 'squash'
    });

    console.log('PR merged successfully:', mergeResponse.data);

  } catch (error) {
    console.error('Failed to merge PR:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }

    await addComment(prNumber,
        `## ⚠️ Auto-merge Failed\n\n` +
        `The message was approved but automatic merge failed.\n` +
        `**Error:** ${error.message}\n\n` +
        `Please merge manually or check the branch protection settings.`
    );
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
