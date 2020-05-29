require('dotenv').config();

const env = process.env.NODE_ENV || 'dev'; // 'dev', 'test', 'prodInt, prodExt

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
  },
  db2: {
    host: process.env.DEV_DB_HOST,
    port: Number(process.env.DEV_DB_PORT),
    name: process.env.DEV_DB_2_NAME,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    dialect: process.env.DEV_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  db3: {
    host: process.env.DEV_DB_HOST,
    port: Number(process.env.DEV_DB_PORT),
    name: process.env.DEV_DB_3_NAME,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    dialect: process.env.DEV_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  nginx: {
    host: process.env.DEV_NGINX_HOST,
    port: process.env.DEV_NGINX_PORT,
  },
  socket: {
    host: process.env.DEV_SOCKET_HOST,
    port: process.env.DEV_SOCKET_PORT,
    secretKey: process.env.DEV_SOCKET_SECRET_KEY || 'default',
    jwtKey: process.env.DEV_SOCKET_JWT_KEY || 'default',
  },
  slack: {
    url: process.env.DEV_SLACK_URL,
    idOne: process.env.DEV_SLACK_ID_ONE,
    idTwo: process.env.DEV_SLACK_ID_TWO,
    accessToken: process.env.DEV_SLACK_ACCESS_TOKEN,
  },
  redis: {
    host: process.env.DEV_REDIS_HOST,
    port: process.env.DEV_REDIS_PORT,
  },
};

const test = {
  app: {
    host: process.env.TEST_APP_HOST,
    port: Number(process.env.TEST_APP_PORT),
    jwtSecret: process.env.TEST_JWT_SECRET,
    publicUrl: ['/api/v2/login'],
  },
  db1: {
    host: process.env.TEST_DB_HOST,
    port: Number(process.env.TEST_DB_PORT),
    name: process.env.TEST_DB_1_NAME,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    dialect: process.env.TEST_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  db2: {
    host: process.env.TEST_DB_HOST,
    port: Number(process.env.TEST_DB_PORT),
    name: process.env.TEST_DB_2_NAME,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    dialect: process.env.TEST_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  db3: {
    host: process.env.TEST_DB_HOST,
    port: Number(process.env.TEST_DB_PORT),
    name: process.env.TEST_DB_3_NAME,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    dialect: process.env.TEST_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  nginx: {
    host: process.env.TEST_NGINX_HOST,
    port: process.env.TEST_NGINX_PORT,
  },
  socket: {
    host: process.env.TEST_SOCKET_HOST,
    port: process.env.TEST_SOCKET_PORT,
    secretKey: process.env.TEST_SOCKET_SECRET_KEY || 'default',
    jwtKey: process.env.TEST_SOCKET_JWT_KEY || 'default',
  },
  slack: {
    url: process.env.TEST_SLACK_URL,
    idOne: process.env.TEST_SLACK_ID_ONE,
    idTwo: process.env.TEST_SLACK_ID_TWO,
    accessToken: process.env.TEST_SLACK_ACCESS_TOKEN,
  },
  redis: {
    host: process.env.TEST_REDIS_HOST,
    port: process.env.TEST_REDIS_PORT,
  },
};

const prodInt = {
  app: {
    host: process.env.PROD_INT_APP_HOST,
    port: Number(process.env.PROD_INT_APP_PORT),
    jwtSecret: process.env.PROD_INT_JWT_SECRET,
    publicUrl: ['/api/v2/appointment'],
  },
  db1: {
    host: process.env.PROD_INT_DB_HOST,
    port: Number(process.env.PROD_INT_DB_PORT),
    name: process.env.PROD_INT_DB_1_NAME,
    user: process.env.PROD_INT_DB_USER,
    password: process.env.PROD_INT_DB_PASSWORD,
    dialect: process.env.PROD_INT_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  db2: {
    host: process.env.PROD_INT_DB_HOST,
    port: Number(process.env.PROD_INT_DB_PORT),
    name: process.env.PROD_INT_DB_2_NAME,
    user: process.env.PROD_INT_DB_USER,
    password: process.env.PROD_INT_DB_PASSWORD,
    dialect: process.env.PROD_INT_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  db3: {
    host: process.env.PROD_INT_DB_HOST,
    port: Number(process.env.PROD_INT_DB_PORT),
    name: process.env.PROD_INT_DB_3_NAME,
    user: process.env.PROD_INT_DB_USER,
    password: process.env.PROD_INT_DB_PASSWORD,
    dialect: process.env.PROD_INT_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  nginx: {
    host: process.env.PROD_INT_NGINX_HOST,
    port: process.env.PROD_INT_NGINX_PORT,
  },
  socket: {
    host: process.env.PROD_INT_SOCKET_HOST,
    port: process.env.PROD_INT_SOCKET_PORT,
    secretKey: process.env.PROD_INT_SOCKET_SECRET_KEY || 'default',
    jwtKey: process.env.PROD_INT_SOCKET_JWT_KEY || 'default',
  },
  slack: {
    url: process.env.PROD_INT_SLACK_URL,
    idOne: process.env.PROD_INT_SLACK_ID_ONE,
    idTwo: process.env.PROD_INT_SLACK_ID_TWO,
    accessToken: process.env.PROD_INT_SLACK_ACCESS_TOKEN,
  },
  redis: {
    host: process.env.PROD_INT_REDIS_HOST,
    port: process.env.PROD_INT_REDIS_PORT,
  },
};

const prodExt = {
  app: {
    host: process.env.PROD_EXT_APP_HOST,
    port: Number(process.env.PROD_EXT_APP_PORT),
    jwtSecret: process.env.PROD_EXT_JWT_SECRET,
    publicUrl: ['/api/v1/appointment'],
  },
  db1: {
    host: process.env.PROD_EXT_DB_HOST,
    port: Number(process.env.PROD_EXT_DB_PORT),
    name: process.env.PROD_EXT_DB_1_NAME,
    user: process.env.PROD_EXT_DB_USER,
    password: process.env.PROD_EXT_DB_PASSWORD,
    dialect: process.env.PROD_EXT_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  db2: {
    host: process.env.PROD_EXT_DB_HOST,
    port: Number(process.env.PROD_EXT_DB_PORT),
    name: process.env.PROD_EXT_DB_2_NAME,
    user: process.env.PROD_EXT_DB_USER,
    password: process.env.PROD_EXT_DB_PASSWORD,
    dialect: process.env.PROD_EXT_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  db3: {
    host: process.env.PROD_EXT_DB_HOST,
    port: Number(process.env.PROD_EXT_DB_PORT),
    name: process.env.PROD_EXT_DB_3_NAME,
    user: process.env.PROD_EXT_DB_USER,
    password: process.env.PROD_EXT_DB_PASSWORD,
    dialect: process.env.PROD_EXT_DB_DIALECT,
    operatorsAliases: false,
    logging: false,
  },
  nginx: {
    host: process.env.PROD_EXT_NGINX_HOST,
    port: process.env.PROD_EXT_NGINX_PORT,
  },
  socket: {
    host: process.env.PROD_EXT_SOCKET_HOST,
    port: process.env.PROD_EXT_SOCKET_PORT,
    secretKey: process.env.PROD_EXT_SOCKET_SECRET_KEY || 'default',
    jwtKey: process.env.PROD_EXT_SOCKET_JWT_KEY || 'default',
  },
  slack: {
    url: process.env.PROD_EXT_SLACK_URL,
    idOne: process.env.PROD_EXT_SLACK_ID_ONE,
    idTwo: process.env.PROD_EXT_SLACK_ID_TWO,
    accessToken: process.env.PROD_EXT_SLACK_ACCESS_TOKEN,
  },
  redis: {
    host: process.env.PROD_EXT_REDIS_HOST,
    port: process.env.PROD_EXT_REDIS_PORT,
  },
};

const config = {
  dev,
  test,
  prodInt,
  prodExt,
};

module.exports = config[env];
