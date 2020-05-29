import Sequelize from 'sequelize';
import config from '../configs/env.config';

require('pg').defaults.parseInt8 = true;

export const db1 = new Sequelize(config.db1.name, config.db1.user, config.db1.password, config.db1);

export const db2 = new Sequelize(config.db2.name, config.db2.user, config.db2.password, config.db2);

export const db3 = new Sequelize(config.db3.name, config.db3.user, config.db3.password, config.db3);
