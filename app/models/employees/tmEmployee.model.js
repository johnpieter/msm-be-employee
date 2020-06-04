import Sequelize from 'sequelize';
import uuidv4 from 'uuid/v4';
import { db1 } from '../index';
import { johnpietCompany } from '../../variables/tableName.variable';

module.exports = db1.define(johnpietCompany.EMPLOYEE, {
  employee_id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: uuidv4(),
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  first_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  last_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  birth_date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  basic_salary: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  group_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  }
}, {
  classMethods: {}, // for custom query
  freezeTableName: true,
  tableName: johnpietCompany.EMPLOYEE,
  timestamps: false,
});
