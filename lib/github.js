// lib/github.js
const axios = require('axios');

async function getRandomMessage() {
  try {
    const response = await axios.get('https://api.github.com/zen');
    return response.data;
  } catch (error) {
    return "GitHub API connect fail😢";
  }
}

module.exports = { getRandomMessage };
