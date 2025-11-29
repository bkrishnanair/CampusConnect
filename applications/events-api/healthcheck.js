// Simple healthcheck for the events-api service
const http = require('http');

const options = {
  host: 'localhost',
  port: 8080,
  path: '/health',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => process.exit(1));
req.end();
