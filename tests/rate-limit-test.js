const axios = require('axios');

const API_URL = 'http://localhost:3000/api/send';

const payload = {
  name: "rate-limit-test.js",
  email: "test@ratelimit.lol",
  subject: "Rate Limit Test",
  message: "Bleh bleh bleh"
};

const NUM_REQUESTS = 15;

async function sendRequest(i) {
  try {
    const response = await axios.post(API_URL, payload);
    console.log(`Request #${i}:`, response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log(`Request #${i}:`, error.response.status, error.response.data);
    } else {
      console.log(`Rest #${i}: Error`, error.message);
    }
  }
}

async function main() {
  const promises = [];
  for (let i = 1; i <= NUM_REQUESTS; i++) {
    promises.push(sendRequest(i));
  }
  await Promise.all(promises);
}

main();
