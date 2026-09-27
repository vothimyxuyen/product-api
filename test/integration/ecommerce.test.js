const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/prisma');
const { signToken } = require('../../src/utils/auth');

test('e-commerce flow: auth, stock-safe order, shipment and health', async (t) => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL must be set for integration tests');
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminRole = await prisma.role.findUnique({ where: { rolename: 'ADMIN' } });
  const membership = await prisma.membership.findUnique({ where: { mname: 'Basic' } });
  assert.ok(adminRole && membership, 'run npm run db:seed before integration tests');

  const admin = await prisma.user.create({
    data: {
      username: `admin-${suffix}`,
      fullname: 'Test Admin',
      password: 'not-used-by-this-test',
      roleId: adminRole.roleId,
      membershipId: membership.membershipId
    }
  });
  const adminToken = signToken({ ...admin, role: adminRole });
  const username = `customer-${suffix}`;
  let product;
  t.after(async () => {
    const customer = await prisma.user.findUnique({ where: { username } });
    if (customer) {
      await prisma.order.deleteMany({ where: { uid: customer.uid } });
      await prisma.user.delete({ where: { uid: customer.uid } });
    }
    if (product) await prisma.product.delete({ where: { pid: product.pid } });
    await prisma.user.delete({ where: { uid: admin.uid } });
    await prisma.$disconnect();
  });

  const registration = await request(app)
    .post('/api/auth/register')
    .send({ username, fullname: 'Test Customer', password: 'correct-horse' });
  assert.equal(registration.status, 201);
  assert.equal('password' in registration.body.user, false);
  const customerToken = registration.body.token;
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'correct-horse' });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'CUSTOMER');

  const unauthorized = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ pname: 'Denied', price: 2, quantity: 1 });
  assert.equal(unauthorized.status, 403);

  const createdProduct = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ pname: 'Test Product', price: 12.5, quantity: 5 });
  assert.equal(createdProduct.status, 201);
  product = createdProduct.body;

  const order = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ items: [{ pid: product.pid, qty: 2 }] });
  assert.equal(order.status, 201);
  assert.equal(Number(order.body.details[0].unitPrice), 12.5);
  assert.equal((await prisma.product.findUnique({ where: { pid: product.pid } })).quantity, 3);
  const rejectedOrder = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ items: [{ pid: product.pid, qty: 99 }] });
  assert.equal(rejectedOrder.status, 409);
  assert.equal((await prisma.product.findUnique({ where: { pid: product.pid } })).quantity, 3);

  const customerOrders = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`);
  assert.equal(customerOrders.status, 200);
  assert.equal(customerOrders.body.length, 1);

  const shipment = await request(app)
    .post(`/api/orders/${order.body.oid}/shipments`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'packed' });
  assert.equal(shipment.status, 201);
  assert.equal(shipment.body.status, 'packed');

  const health = await request(app).get('/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.database, 'connected');
});
