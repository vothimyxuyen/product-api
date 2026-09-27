const test = require('node:test');
const assert = require('node:assert/strict');
const { getConfig } = require('../../src/config');

const validEnv = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/store',
  JWT_SECRET: 'a-secret-with-at-least-32-characters-long'
};

test('uses the configured server defaults', () => {
  assert.deepEqual(getConfig(validEnv), {
    port: 3000,
    databaseUrl: validEnv.DATABASE_URL,
    jwtSecret: validEnv.JWT_SECRET,
    jwtExpiresIn: '1h'
  });
});

test('reads server settings from the environment', () => {
  assert.deepEqual(
    getConfig({ ...validEnv, PORT: '4000', JWT_EXPIRES_IN: '2h' }),
    {
      port: 4000,
      databaseUrl: validEnv.DATABASE_URL,
      jwtSecret: validEnv.JWT_SECRET,
      jwtExpiresIn: '2h'
    }
  );
});

test('rejects an invalid port or missing secrets', () => {
  assert.throws(() => getConfig({ ...validEnv, PORT: '70000' }), /PORT/);
  assert.throws(() => getConfig({ ...validEnv, JWT_SECRET: 'short' }), /JWT_SECRET/);
  assert.throws(() => getConfig({ ...validEnv, JWT_EXPIRES_IN: 'soon' }), /JWT_EXPIRES_IN/);
  assert.throws(() => getConfig({ JWT_SECRET: validEnv.JWT_SECRET }), /DATABASE_URL/);
});
