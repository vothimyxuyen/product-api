const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const Product = require('../../src/models/product');

const mongoUri = process.env.MONGODB_URI;

test('Product CRUD API with MongoDB', async (t) => {
  assert.ok(mongoUri, 'MONGODB_URI must be set for integration tests');
  await mongoose.connect(mongoUri);
  await Product.deleteMany({});

  t.after(async () => {
    await Product.deleteMany({});
    await mongoose.disconnect();
  });

  const created = await request(app)
    .post('/api/products')
    .send({ pid: 'p-101', pname: 'Notebook', price: 4.5, quantity: 8 });
  assert.equal(created.status, 201);
  assert.equal(created.body.pid, 'p-101');

  const listed = await request(app).get('/api/products');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.length, 1);

  const fetched = await request(app).get('/api/products/p-101');
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.pname, 'Notebook');

  const updated = await request(app)
    .put('/api/products/p-101')
    .send({ pid: 'p-101', pname: 'Notebook XL', price: 6, quantity: 3 });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.pname, 'Notebook XL');

  const deleted = await request(app).delete('/api/products/p-101');
  assert.equal(deleted.status, 204);
  assert.equal((await request(app).get('/api/products/p-101')).status, 404);

  const health = await request(app).get('/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.database, 'connected');
});
