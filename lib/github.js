const axios = require('axios');

async function getRandomMessage() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/yybmion/pssst/main/messages/all.json');
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

    return "No messages available 😢";
  } catch (error) {
    return "Failed to fetch messages 😢";
  }
}

module.exports = { getRandomMessage };
