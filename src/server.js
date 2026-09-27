require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const { getConfig } = require('./config');

const { port, mongoUri } = getConfig();

async function start() {
  await mongoose.connect(mongoUri);
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Product API listening on port ${port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Failed to start Product API:', error);
  process.exit(1);
});
