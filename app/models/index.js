import Sequelize from 'sequelize';
import config from '../configs/env.config';

require('pg').defaults.parseInt8 = true;

export const db1 = new Sequelize(config.db1.name, config.db1.user, config.db1.password, config.db1);
