require('dotenv').config();

const env = process.env.NODE_ENV || 'dev';

const dev = {
  app: {
    host: process.env.DEV_APP_HOST,
    port: Number(process.env.DEV_APP_PORT),
    jwtSecret: process.env.DEV_JWT_SECRET,
    publicUrl: ['/api/v2/login'],
  },
  db1: {
    host: process.env.DEV_DB_HOST,
    port: Number(process.env.DEV_DB_PORT),
    name: process.env.DEV_DB_1_NAME,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    dialect: process.env.DEV_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  }
};

const config = {
  dev
};

module.exports = config[env];
