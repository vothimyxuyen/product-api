const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/product');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  const healthy = mongoose.connection.readyState === 1;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'unavailable',
    database: healthy ? 'connected' : 'disconnected'
  });
});

app.post('/api/products', async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'pid already exists' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    res.json(await Product.find().sort({ pid: 1 }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/products/:pid', async (req, res, next) => {
  try {
    const product = await Product.findOne({ pid: req.params.pid });
    if (!product) {
      return res.status(404).json({ error: 'product not found' });
    }
    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

app.put('/api/products/:pid', async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { pid: req.params.pid },
      req.body,
      { new: true, runValidators: true, overwrite: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'product not found' });
    }
    return res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'pid already exists' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

app.delete('/api/products/:pid', async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ pid: req.params.pid });
    if (!product) {
      return res.status(404).json({ error: 'product not found' });
    }
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'internal server error' });
});

module.exports = app;
