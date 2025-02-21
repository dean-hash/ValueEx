import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GODADDY_API_KEY;
const API_SECRET = process.env.GODADDY_API_SECRET;

if (!API_KEY || !API_SECRET) {
  console.error('Missing GoDaddy API credentials');
  process.exit(1);
}

const headers = {
  Authorization: `sso-key ${API_KEY}:${API_SECRET}`,
  Accept: 'application/json',
};

/**
 * List all domains in the GoDaddy account
 */
async function listDomains() {
  try {
    const response = await fetch('https://api.godaddy.com/v1/domains', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const domains = await response.json();
    console.log('Your domains:');
    domains.forEach((domain) => {
      console.log(`- ${domain.domain} (Expires: ${domain.expires})`);
    });
  } catch (error) {
    console.error('Failed to list domains:', error);
    process.exit(1);
  }
}

listDomains();
