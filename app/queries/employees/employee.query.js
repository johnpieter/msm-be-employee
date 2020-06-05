import Sequelize from 'sequelize';
import { isEmpty } from 'lodash';
import moment from 'moment';
import tmEmployee from '../../models/employees/tmEmployee.model';
const { Op } = Sequelize;

export function save(data) {
  return tmEmployee.create(data);
}

export function find(params) {
  return tmEmployee.findAll({...params, raw: true });
}

export function update(data, condition) {
  return tmEmployee.update(data, { ...condition, raw: true, returning: true });
}

export function remove(params) {
  return tmEmployee.destroy({ ...params, raw: true, returning: true });
}