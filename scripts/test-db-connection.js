/**
 * Quick test: can we reach the PostgreSQL host?
 * Run: node scripts/test-db-connection.js
 * Requires: .env with DATABASE_URL
 */
require('dotenv').config();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('No DATABASE_URL in .env');
  process.exit(1);
}

const { hostname, port } = new URL(url.replace('postgresql://', 'http://'));
console.log('Testing reachability:', hostname, 'port', port || 5432);

const net = require('net');
const socket = new net.Socket();
const portNum = parseInt(port || '5432', 10);

socket.setTimeout(10000);
socket.on('connect', () => {
  console.log('TCP connection to', hostname + ':' + portNum, 'succeeded.');
  socket.destroy();
  process.exit(0);
});
socket.on('timeout', () => {
  console.error('Timeout: host', hostname, 'did not respond on port', portNum);
  socket.destroy();
  process.exit(1);
});
socket.on('error', (err) => {
  console.error('Connection error:', err.message);
  if (err.code) console.error('Code:', err.code);
  socket.destroy();
  process.exit(1);
});

socket.connect(portNum, hostname);
