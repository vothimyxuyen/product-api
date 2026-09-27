const test = require('node:test');
const assert = require('node:assert/strict');
const { getConfig } = require('../../src/config');

test('uses local MongoDB defaults', () => {
  assert.deepEqual(getConfig({}), {
    port: 3000,
    mongoUri: 'mongodb://localhost:27017/productdb'
  });
});

test('reads port and MongoDB URI from the environment', () => {
  assert.deepEqual(
    getConfig({ PORT: '4000', MONGODB_URI: 'mongodb://db:27017/testdb' }),
    { port: 4000, mongoUri: 'mongodb://db:27017/testdb' }
  );
});
