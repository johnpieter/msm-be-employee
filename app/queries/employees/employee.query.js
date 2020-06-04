import Sequelize from 'sequelize';
import { isEmpty } from 'lodash';
import moment from 'moment';
import tmEmployee from '../../models/employees/tmEmployee.model';
const { Op } = Sequelize;

export function save(data) {
  return tmEmployee.create(data);
}
