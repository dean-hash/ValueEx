const https = require('https');

const options = {
  hostname: 'api.godaddy.com',
  path: '/v1/domains',
  headers: {
    'Authorization': 'sso-key YvFt7v3Y1X_YHYvN-jTbpcrGYN-dwyR:QwzQzWrRZzwKmLGvqwbP'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (e) => console.error(e));
