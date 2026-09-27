function getConfig(env = process.env) {
  return {
    port: Number(env.PORT || 3000),
    mongoUri: env.MONGODB_URI || 'mongodb://localhost:27017/productdb'
  };
}

module.exports = { getConfig };
