import { isEmpty, result, omit } from 'lodash';
import moment from 'moment';
import Sequelize from 'sequelize';
import { save as addNewEmployee, 
          find as getAllEmployee,
          update as editEmployee,
          remove as delEmployee } from '../../queries/employees/employee.query';
const { Op } = Sequelize;
import uuidv4 from 'uuid/v4';

export async function addEmployee(req, res) {
  try {
    const {
      username, firstName, lastName, email, birthDate, 
      basicSalary, status, groupName, description = null
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
      description: description,
      created_date: moment().toISOString()
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

export async function getEmployeeList(req, res) {
  try {
    const {
      sortBy = "created_date", orderBy = 'DESC', limit = 10, offset = 0, name
    } = req.query;
    const order = [
      [sortBy, orderBy],
    ];

    const conditions = name ? {
      username: { [Op.like]: `%${name}%` } 
    } : null;

    const response = await getAllEmployee({
      order,
      where: conditions,
      limit: Number(limit),
      offset: Number(offset)
    });
    res.status(200).json({
      data: response,
      status: 'OK',
      message: 'Get Employee Successfully',
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Get Appointment',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: error.message,
      },
      data: { params: req.params, query: req.query, body: req.body },
      url: `${protocol.HTTP
      }${config.app.host
      }:${config.app.port
      }${req.originalUrl}`,
      method: req.method,
    });
  }
}


export async function updateEmployee(req, res) {
  try {
    const { 
      username, firstName, lastName, email, 
      birthDate, basicSalary, status, groupName, description
    } = req.body;
    const { employeeId } = req.params;
    
    let postParams = {
      username: username,
      first_name: firstName,
      last_name: lastName,
      email: email,
      birth_date: birthDate,
      basic_salary: basicSalary,
      status: status,
      group_name: groupName,
      description: description,
      created_date: moment().toISOString()
    };

    await editEmployee(postParams, { where: { employee_id: employeeId } });

    res.status(200).json({
      status: 'OK',
      message: 'Update employee successfully',
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    const code = error.message.substring(0, 6);
  }
}

export async function deleteEmployee(req, res) {
  try {
    const { employeeId } = req.body;

    await delEmployee({ where: { employee_id: employeeId } });

    res.status(200).json({
      status: 'OK',
      message: 'Delete employee successfully',
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Delete Doctor Note',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: error.message,
      },
      data: { params: req.params, query: req.query, body: req.body },
      url: `${protocol.HTTP
      }${config.app.host
      }:${config.app.port
      }${req.originalUrl}`,
      method: req.method,
      req,
    });
  }
}

