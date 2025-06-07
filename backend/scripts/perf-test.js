const autocannon = require('autocannon');

const JWT = process.env.JWT || '';

const instance = autocannon({
  url: 'http://localhost:4000/api/projects?page=1&limit=10',
  method: 'GET',
  headers: JWT ? { Authorization: `Bearer ${JWT}` } : {},
  connections: 20, // concurrent connections
  duration: 10,    // test duration in seconds
}, console.log);

autocannon.track(instance, { renderProgressBar: true }); 