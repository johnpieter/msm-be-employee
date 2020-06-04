import Joi from 'joi';
import { isEmpty } from 'lodash';

export async function addEmployeeMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      username: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().required(),
      birthDate: Joi.date().required(),
      basicSalary: Joi.number().required(),
      status: Joi.string().required(),
      groupName: Joi.string().required(),
      description: Joi.string(),

    });
    const result = Joi.validate({ ...req.body, ...req.query, ...req.params }, schema);
    if (isEmpty(result.error)) next();
    else {
      const error = result.error.message;
      res.status(400).json({
        data: null,
        status: 'ERROR',
        message: error,
      });
    }
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
  }
}
