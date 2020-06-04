import { isEmpty, result, omit } from 'lodash';
import moment from 'moment';
import Sequelize from 'sequelize';
import { save as addNewEmployee } from '../../queries/employees/employee.query';
const { Op } = Sequelize;
import uuidv4 from 'uuid/v4';

export async function addEmployee(req, res) {
  try {
    const {
      username, firstName, lastName, email, birthDate, 
      basicSalary, status, groupName, description
    } = req.body;

    let postParams = {
      employee_id: uuidv4(),
      username: username,
      first_name: firstName,
      last_name: lastName,
      email: email,
      birth_date: birthDate,
      basic_salary: basicSalary,
      status: status,
      group_name: groupName,
      description: description
    };

    let result = await addNewEmployee(postParams);
    
    res.status(200).json({
      data: result,
      status: 'OK',
      message: 'Add employee successfully',
    });
    req.message = 'Add employee successfully';
  } catch (error) {
    const errorMessage = !Number.isNaN(Number(error.message))
      ? appErrorCode[error.message]
      : error.message;
    const errorCode = !Number.isNaN(Number(error.message))
      ? Number(error.message)
      : 500;
    res.status(errorCode).json({
      data: null,
      status: 'ERROR',
      message: errorMessage,
    });
  }
}

