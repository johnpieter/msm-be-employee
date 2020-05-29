import Joi from 'joi';
import { isEmpty } from 'lodash';
import { postError } from '../../services/common/slack.common';
import { bugsLevel, protocol, API_PATH } from '../../variables/common.variable';
import config from '../../configs/env.config';
import endpoints from '../../configs/api.config';

export async function getTimeSlotMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      hospitalId: Joi.string().guid().required(),
      doctorId: Joi.string().guid().required(),
      appointmentDate: Joi.date().required(),
      availableOnly: Joi.boolean(),
      scheduleId: Joi.string().guid(),
      isActive: Joi.boolean(),
    });
    const result = Joi.validate({ ...req.params, ...req.query }, schema);
    if (isEmpty(result.error)) next();
    else {
      const error = result.error.message;
      res.status(400).json({
        data: null,
        status: 'ERROR',
        message: result.error.message,
      });
      await postError({
        error: {
          name: 'Get Time Slot',
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
        name: 'Get Time Slot',
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

export async function getScheduleBlock(req, res, next) {
  try {
    const schema = Joi.object().keys({
      scheduleId: Joi.string().guid().required(),
      date: Joi.date().required(),
      limit: Joi.number().min(0),
      offset: Joi.number().min(0),
    });
    const result = Joi.validate({ ...req.params, ...req.query }, schema);
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
          name: 'Get Schedule Block',
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
      await postError({
        error: {
          name: 'Get Schedule Block',
          priority: bugsLevel.MINOR,
          message: result.error.message,
        },
        data: { params: req.params, query: req.query, body: req.body },
        url: `${protocol.HTTP
        }${config.app.host
        }:${config.app.port
        }${API_PATH
        }${endpoints.SCHEDULE_BLOCK
        }/${req.params.scheduleId}`,
        method: 'GET',
      }).catch(() => {

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
        name: 'Get Schedule Block',
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

export async function addScheduleBlock(req, res, next) {
  try {
    const schemaBody = Joi.object().keys({
      fromDate: Joi.date().required(),
      toDate: Joi.date().min(Joi.ref('fromDate')).required(),
      fromTime: Joi.string().required(),
      toTime: Joi.string().required(),
      isIncludeWaitingList: Joi.boolean(),
      isTeleconsultation: Joi.boolean().strict().optional(),
      reason: Joi.string().required(),
      scheduleId: Joi.string().guid().required(),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.body, ...req.params }, schemaBody);
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
          name: 'Add Schedule Block',
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
        name: 'Add Schedule Block',
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

export async function updateScheduleBlock(req, res, next) {
  try {
    const schema = Joi.object().keys({
      scheduleId: Joi.string().guid().required(),
      fromDate: Joi.date().allow(['', null]),
      toDate: Joi.date().min(Joi.ref('fromDate')).allow(['', null]),
      fromTime: Joi.string().allow(['', null]),
      toTime: Joi.string().allow(['', null]),
      isIncludeWaitingList: Joi.boolean().optional(),
      isTeleconsultation: Joi.boolean().strict().optional(),
      reason: Joi.string().allow(['', null]),
      scheduleBlockId: Joi.string().guid().required(),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.body, ...req.params }, schema);
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
          name: 'Update Schedule Block',
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
        name: 'Update Schedule Block',
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

export async function deleteScheduleBlock(req, res, next) {
  try {
    const schema = Joi.object().keys({
      scheduleBlockId: Joi.string().guid().required(),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.body, ...req.params }, schema);
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
          name: 'Delete Schedule Block',
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
        name: 'Delete Schedule Block',
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
