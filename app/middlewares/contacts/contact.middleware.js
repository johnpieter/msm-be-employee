import Joi from 'joi';
import { isEmpty } from 'lodash';
import { postError } from '../../services/common/slack.common';
import { bugsLevel, protocol } from '../../variables/common.variable';
import config from '../../configs/env.config';

export async function getContactById(req, res, next) {
  try {
    const schema = Joi.object().keys({
      contactId: Joi.string().guid().required(),
    });
    const result = Joi.validate({ ...req.body, ...req.params, ...req.query }, schema);
    if (isEmpty(result.error)) next();
    else {
      const error = result.error.message;
      res.status(400).json({
        data: null,
        status: 'ERROR',
        message: error,
      });
      await postError({
        error: {
          name: 'Get Contact By ID',
          priority: bugsLevel.MINOR,
          message: error,
        },
        data: { params: req.params, query: req.query, body: req.body },
        url: `${protocol.HTTP
        }${config.app.host
        }:${config.app.port
        }${req.originalUrl}`,
        method: req.method,
      });
    }
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    await postError({
      error: {
        name: 'Get Contact By ID',
        priority: bugsLevel.MAJOR,
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

export async function addContactMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      genderId: Joi.string().allow(['', null]),
      birthDate: Joi.date().iso().required(),
      religionId: Joi.string().allow(['', null]),
      phoneNumber1: Joi.string().required(),
      phoneNumber2: Joi.string().allow(['', null]),
      emailAddress: Joi.string().allow(['', null]),
      addressLine1: Joi.string().allow(['', null]),
      addressLine2: Joi.string().allow(['', null]),
      subDistrictId: Joi.number().integer().allow([null]),
      districtId: Joi.number().integer().allow([null]),
      cityId: Joi.number().integer().allow([null]),
      stateId: Joi.number().integer().allow([null]),
      countryId: Joi.string().allow(['', null]),
      identityTypeId: Joi.string().allow(['', null]),
      identityNumber: Joi.string().allow(['', null]),
      channelId: Joi.string().required(),
      pin: Joi.string().allow(['', null]),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.body, ...req.params, ...req.query }, schema);
    if (isEmpty(result.error)) next();
    else {
      const error = result.error.message;
      res.status(400).json({
        data: null,
        status: 'ERROR',
        message: error,
      });
      await postError({
        error: {
          name: 'Create Contact Only',
          priority: bugsLevel.MINOR,
          message: error,
        },
        data: { params: req.params, query: req.query, body: req.body },
        url: `${protocol.HTTP
        }${config.app.host
        }:${config.app.port
        }${req.originalUrl}`,
        method: req.method,
      });
    }
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    await postError({
      error: {
        name: 'Create Contact Only',
        priority: bugsLevel.MAJOR,
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

export async function updateContact(req, res, next) {
  try {
    const schema = Joi.object().keys({
      contactId: Joi.string().guid().required(),
      data: {
        phoneNumber1: Joi.string().required(),
        genderId: Joi.string().allow(['', null]),
      },
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.body, ...req.params, ...req.query }, schema);
    if (isEmpty(result.error)) next();
    else {
      const error = result.error.message;
      res.status(400).json({
        data: null,
        status: 'ERROR',
        message: error,
      });
      await postError({
        error: {
          name: 'Update Contact Only',
          priority: bugsLevel.MINOR,
          message: error,
        },
        data: { params: req.params, query: req.query, body: req.body },
        url: `${protocol.HTTP
        }${config.app.host
        }:${config.app.port
        }${req.originalUrl}`,
        method: req.method,
      });
    }
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    await postError({
      error: {
        name: 'Update Contact Only',
        priority: bugsLevel.MAJOR,
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
