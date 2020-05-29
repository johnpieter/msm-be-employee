import Joi from 'joi';
import { isEmpty } from 'lodash';
import { postError } from '../../services/common/slack.common';
import { bugsLevel, protocol } from '../../variables/common.variable';
import config from '../../configs/env.config';

export async function verifyPatientMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      contactId: Joi.string().guid().allow(['', null]),
      patientHopeId: Joi.number().integer().allow([null]),
      name: Joi.string().allow(['', null]),
      birthDate: Joi.string().allow(['', null]),
      phoneNumber1: Joi.string().allow(['', null]),
      hospitalId: Joi.string().guid().required(),
      channelId: Joi.string().optional(),
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
          name: 'Verify Patient',
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
        name: 'Verify Patient',
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

export async function searchPatientHopeMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      patientName: Joi.string(),
      birthDate: Joi.date(),
      mrLocalNo: Joi.number(),
      hospitalId: Joi.string().guid().required(),
      exactMatch: Joi.boolean(),
    }).with('patientName', ['birthDate'])
      .with('birthDate', ['patientName'])
      .without('mrLocalNo', ['patientName', 'birthDate']);
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
          name: 'Search Patient Hope',
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
        name: 'Search Patient Hope',
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
