import Joi from 'joi';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { postError } from '../../services/common/slack.common';
import {
  bugsLevel, protocol, API_PATH, channel,
} from '../../variables/common.variable';
import config from '../../configs/env.config';
import endpoints from '../../configs/api.config';

export async function addAppointmentMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appointmentNo: Joi.number().integer().min(0).allow([null])
        .when('isVerify', { is: true, then: Joi.number().integer().min(0).required() })
        .when('channelId', { is: channel.CALL_CENTER, then: Joi.number().integer().min(0).required() })
        .when('channelId', { is: channel.DOCTOR, then: Joi.number().integer().min(0).required() })
        .when('channelId', { is: channel.NURSE, then: Joi.number().integer().min(0).required() })
        .when('channelId', { is: channel.FRONT_OFFICE, then: Joi.number().integer().min(0).required() }),
      appointmentTemporaryId: Joi.number().integer().allow([null]),
      appointmentDate: Joi.date().min(moment.tz('Asia/Jakarta').format('YYYY-MM-DD')).required(),
      appointmentFromTime: Joi.string().required(),
      appointmentToTime: Joi.string().allow([null, '']),
      isWaitingList: Joi.boolean().required(),
      channelId: Joi.string().required(),
      scheduleId: Joi.string().guid().required(),
      contactId: Joi.string().allow([null, '']),
      patientHopeId: Joi.number().integer().allow([null]),
      name: Joi.string().trim().min(3).max(100)
        .allow([null, '']),
      birthDate: Joi.date().allow([null, '']),
      phoneNumber1: Joi.string().allow(['', null]),
      placeOfBirth: Joi.string().allow(['', null]),
      addressLine1: Joi.string().allow(['', null]),
      addressLine2: Joi.string().allow(['', null]),
      emailAddress: Joi.string().trim().email().allow(['', null]),
      sexId: Joi.number().integer().min(1).max(2)
        .allow([null]),
      cityId: Joi.number().integer().allow([null]),
      districtId: Joi.number().integer().allow([null]),
      subDistrictId: Joi.number().integer().allow([null]),
      nationalityId: Joi.number().integer().allow([null]),
      emergencyContactName: Joi.string().allow(['', null]),
      emergencyContactPhone: Joi.string().allow(['', null]),
      doctorId: Joi.string().guid().required(),
      hospitalId: Joi.string().guid().required(),
      note: Joi.string().allow(['', null]),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
      isWalkin: Joi.boolean(),
      appointmentDateBefore: Joi.date().min(moment().format('YYYY-MM-DD')),
      isVerify: Joi.boolean().default(false).strict(),
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
      await postError({
        error: {
          name: 'Create Appointment',
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
        name: 'Create Appointment',
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

export async function addAppointmentAidoMid(req, res, next) {
  try {
    const { minAppDay = config.others.minDayAppAido } = req.body;
    const schema = Joi.object().keys({
      contactId: Joi.string().guid().optional(),
      appointmentDate: Joi.date().min(moment.tz('Asia/Jakarta').add(minAppDay, 'days').format('YYYY-MM-DD')).required(),
      appointmentFromTime: Joi.string().required(),
      appointmentToTime: Joi.string().required(),
      doctorId: Joi.string().guid().required(),
      hospitalId: Joi.string().guid().required(),
      chiefComplaint: Joi.string().optional().allow(['', null]),
      zoomUrl: Joi.string().optional().allow(['', null]),
      aidoTrxId: Joi.string().optional().allow(['', null]),
      name: Joi.string().trim().optional().min(3)
        .max(100)
        .allow(['', null]),
      sexId: Joi.number().integer().strict().min(1)
        .max(2)
        .optional()
        .allow([null]),
      cityId: Joi.number().integer().strict().optional()
        .allow([null]),
      districtId: Joi.number().integer().strict().optional()
        .allow([null]),
      subDistrictId: Joi.number().integer().strict().optional()
        .allow([null]),
      nationalityId: Joi.number().integer().strict().optional()
        .allow([null]),
      birthDate: Joi.date().optional().allow(['', null]),
      phoneNumber: Joi.string().required(),
      currentAddress: Joi.string().optional().allow(['', null]),
      currentCityId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      currentPostCode: Joi.string().trim().regex(/^\d+$/).min(5)
        .max(5)
        .optional()
        .allow(['', null]),
      identityAddress: Joi.string().optional().allow(['', null]),
      identityCityId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      identityPostCode: Joi.string().trim().regex(/^\d+$/).min(5)
        .max(5)
        .optional()
        .allow(['', null]),
      nationalIdTypeId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      nationalIdNo: Joi.string().trim().optional().allow(['', null]),
      emergencyContactName: Joi.string().optional().allow(['', null]),
      emergencyContactAddress: Joi.string().trim().min(3).max(200)
        .optional()
        .allow(['', null]),
      emergencyContactCityId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      emergencyContactPhone: Joi.string().optional().allow(['', null]),
      emergencyContactMobileNo: Joi.string().trim().regex(/^\d+$/).optional()
        .allow(['', null]),
      emergencyContactEmailAddress: Joi.string().trim().email().optional()
        .allow(['', null]),
      postCode: Joi.string().trim().regex(/^\d+$/).min(5)
        .max(5)
        .optional()
        .allow(['', null]),
      birthPlaceId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      titleId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      maritalStatusId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      religionId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      bloodTypeId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      fatherName: Joi.string().trim().min(3).max(100)
        .optional()
        .allow(['', null]),
      motherName: Joi.string().trim().min(3).max(100)
        .optional()
        .allow(['', null]),
      spouseName: Joi.string().trim().min(3).max(100)
        .optional()
        .allow(['', null]),
      allergy: Joi.string().trim().optional()
        .allow(['', null]),
      contactNotes: Joi.string().trim().min(3).max(200)
        .optional()
        .allow(['', null]),
      homePhoneNo: Joi.string().trim().regex(/^\d+$/)
        .optional()
        .allow(['', null]),
      officePhoneNo: Joi.string().trim().regex(/^\d+$/).optional()
        .allow(['', null]),
      mobileNo2: Joi.string().trim().regex(/^\d+$/).optional()
        .allow(['', null]),
      emailAddress: Joi.string().trim().email().required(),
      deliveryAddress: Joi.string().optional().allow(['', null]),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
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
      await postError({
        error: {
          name: 'Create Appointment AIDO',
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
        name: 'Create Appointment AIDO',
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

export async function checkCurrentAidoAppMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      contactId: Joi.string().guid().required(),
      newContactId: Joi.string().guid().optional().allow(['', null]),
      patientHopeId: Joi.number().integer().strict().required(),
      patientOrgId: Joi.number().integer().strict().optional()
        .allow(['', null]),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
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
      await postError({
        error: {
          name: 'Check Current Appointment AIDO',
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
        name: 'Check Current Appointment AIDO',
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

export async function getRescheduleWorklist(req, res, next) {
  try {
    const schema = Joi.object().keys({
      patientName: Joi.string().min(3).max(30),
      from: Joi.date(),
      to: Joi.date(),
      doctorId: Joi.string().guid(),
      hospitalId: Joi.string().guid(),
      limit: Joi.number().min(0),
      offset: Joi.number().min(0),
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
      await postError({
        error: {
          name: 'Get Reschedule Worklist',
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
        name: 'Get Reschedule Worklist',
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

export async function cancelAppointmentMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appointmentId: Joi.string().guid().required(),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.body, ...req.query, ...req.params }, schema);
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
          name: 'Cancel Appointment',
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
          name: 'Cancel Appointment',
          priority: bugsLevel.MINOR,
          message: result.error.message,
        },
        data: { params: req.params, query: req.query, body: req.body },
        url: `${protocol.HTTP
        }${config.app.host
        }:${config.app.port
        }${API_PATH
        }${endpoints.APPOINTMENT
        }/${req.params.appointmentId}`,
        method: 'DELETE',
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
        name: 'Cancel Appointment',
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

export async function getTotalTempAppointment(req, res, next) {
  try {
    const schema = Joi.object().keys({
      hospitalId: Joi.string().guid(),
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
      await postError({
        error: {
          name: 'Get Total Appointment Temporary',
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
        name: 'Get Total Appointment Temporary',
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

export async function getCountRescheduleUndone(req, res, next) {
  try {
    const schema = Joi.object().keys({
      hospitalId: Joi.string().guid().required(),
    });
    Joi.validate({ ...req.body, ...req.query, ...req.params }, schema, async (error) => {
      if (isEmpty(error)) next();
      else {
        res.status(400).json({
          data: null,
          status: 'ERROR',
          message: error.message,
        });
        await postError({
          error: {
            name: 'Get Count Reschedule Undone',
            priority: bugsLevel.MINOR,
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
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    await postError({
      error: {
        name: 'Get Count Reschedule Undone',
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

export async function getTempAppointmentMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      hospitalId: Joi.string().guid(),
      doctorId: Joi.string().guid(),
      patientName: Joi.string(),
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
      sortBy: Joi.string(),
      orderBy: Joi.string(),
      from: Joi.date(),
      to: Joi.date().min(Joi.ref('from')),
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
      await postError({
        error: {
          name: 'Get Appointment Temporary',
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
        name: 'Get Appointment Temporary',
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

export async function setReservedSlotMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      scheduleId: Joi.string().guid().required(),
      appointmentDate: Joi.date().required(),
      appointmentNo: Joi.number().integer().required(),
      userId: Joi.string().required(),
      userName: Joi.string(),
      source: Joi.string(),
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
      await postError({
        error: {
          name: 'Set Reserved Slot',
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
        name: 'Set Reserved Slot',
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

export async function getReservedSlotMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      scheduleId: Joi.string().guid().required(),
      appointmentDate: Joi.date().required(),
      appointmentNo: Joi.number().integer().required(),
      userId: Joi.string().required(),
      userName: Joi.string(),
      source: Joi.string(),
    });
    const result = Joi.validate({ ...req.body, ...req.query }, schema);
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
          name: 'Get Reserved Slot',
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
        name: 'Get Reserved Slot',
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

export async function moveToWorklistMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      scheduleId: Joi.array().items(Joi.string()).required(),
      appFromDate: Joi.date().allow(['', null]),
      appToDate: Joi.date().allow(['', null]),
      afterAppDate: Joi.date(),
      appointmentId: Joi.array().items(Joi.string()),
      appTempId: Joi.array().items(Joi.string()),
      fromTime: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
      toTime: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/),
      isInclude: Joi.boolean(),
      excludeTime: Joi.boolean(),
      includeIntApp: Joi.boolean().strict(),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
      hospitalId: Joi.string().guid(),
    }).with('fromTime', ['toTime'])
      .with('toTime', ['fromTime']);
    const result = Joi.validate(req.body, schema);
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
          name: 'Move To Worklist',
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
        name: 'Move To Worklist',
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

export async function cancelTempAppointmentMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appointmentTemporaryId: Joi.number().integer().required(),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.params, ...req.body }, schema);
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
          name: 'Cancel Appointment Temporary',
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
        name: 'Cancel Appointment Temporary',
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

export async function cancelAppointmentAidoMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appointmentId: Joi.string().guid().required(),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    });
    const result = Joi.validate({ ...req.params, ...req.body }, schema);
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
          name: 'Cancel Appointment AIDO',
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
        name: 'Cancel Appointment AIDO',
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

export async function rescheduleAppointmentMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appointmentId: Joi.string().guid(),
      appointmentTemporaryId: Joi.number().integer(),
      channelId: Joi.string().required(),
      appointmentNo: Joi.number().integer()
        .when('channelId', { is: channel.CALL_CENTER, then: Joi.number().integer().min(0).required() })
        .when('channelId', { is: channel.DOCTOR, then: Joi.number().integer().min(0).required() })
        .when('channelId', { is: channel.NURSE, then: Joi.number().integer().min(0).required() })
        .when('channelId', { is: channel.FRONT_OFFICE, then: Joi.number().integer().min(0).required() }),
      appointmentDate: Joi.date().required(),
      appointmentFromTime: Joi.string().required(),
      appointmentToTime: Joi.string(),
      scheduleId: Joi.string().guid().required(),
      isWaitingList: Joi.boolean().required(),
      hospitalId: Joi.string().guid().required(),
      note: Joi.string().allow(['', null]),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
    }).or('appointmentId', 'appointmentTemporaryId');
    const result = Joi.validate(req.body, schema);
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
          name: 'Reschedule Appointment',
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
        name: 'Reschedule Appointment',
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

export async function rescheduleAppointmentAidoMid(req, res, next) {
  try {
    const { minAppDay = config.others.minDayAppAido } = req.body;
    const schema = Joi.object().keys({
      appointmentId: Joi.string().guid().optional().allow(['', null]),
      appointmentDate: Joi.date().min(moment.tz('Asia/Jakarta').add(minAppDay, 'days').format('YYYY-MM-DD')).required(),
      appointmentFromTime: Joi.string().required(),
      appointmentToTime: Joi.string().required(),
      chiefComplaint: Joi.string().optional().allow(['', null]),
      zoomUrl: Joi.string().optional().allow(['', null]),
      aidoTrxId: Joi.string().required(),
      deliveryAddress: Joi.string().optional().allow(['', null]),
      userId: Joi.string().required(),
      userName: Joi.string().allow(['', null]),
      source: Joi.string().allow(['', null]),
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
      await postError({
        error: {
          name: 'Reschedule Appointment AIDO',
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
        name: 'Reschedule Appointment AIDO',
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

export async function getAppointmentMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      scheduleId: Joi.string().guid().required(),
      date: Joi.date().required(),
      limit: Joi.number().min(0),
      offset: Joi.number().min(0),
      sortBy: Joi.string().allow(['', null]),
      orderBy: Joi.string().allow(['', null]),
    }).with('scheduleId', ['date'])
      .with('date', ['scheduleId']);
    const result = Joi.validate(req.query, schema);
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
          name: 'Get Appointment',
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
        name: 'Get Appointment',
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

export async function getAppointmentAidoMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      hospitalId: Joi.string().guid().required(),
      doctorId: Joi.string().guid().optional(),
      patientName: Joi.string().optional(),
      isDoubleMr: Joi.boolean().optional(),
      admStatus: Joi.string().optional(),
      fromDate: Joi.date().optional(),
      toDate: Joi.date().min(Joi.ref('fromDate')),
      limit: Joi.number().min(0).required(),
      offset: Joi.number().min(0).required(),
    }).with('fromDate', ['toDate'])
      .with('toDate', ['fromDate']);
    const result = Joi.validate({ ...req.query, ...req.params }, schema);
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
          name: 'Get Appointment',
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
        name: 'Get Appointment',
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

export async function getAppointmentByIdMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appointmentId: Joi.string().guid().required(),
    });
    const result = Joi.validate({ ...req.params, ...req.body }, schema);
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
          name: 'Get Appointment by ID',
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
        name: 'Get Appointment by ID',
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

export async function getAppTempByIdMid(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appTempId: Joi.number().required(),
    });
    const result = Joi.validate({ ...req.params, ...req.body }, schema);
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
          name: 'Get Appointment Temporary by ID',
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
        name: 'Get Appointment Temporary by ID',
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

export async function getAppHistoryById(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appointmentId: Joi.string().guid().required(),
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
          name: 'Get Appointment History by ID',
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
        name: 'Get Appointment History by ID',
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

export async function confirmRescheduleApp(req, res, next) {
  try {
    const schema = Joi.object().keys({ appointmentTemporaryId: Joi.number().required() });
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
          name: 'Get Confirm Reschedule Appointment',
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
        name: 'Get Confirm Reschedule Appointment',
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

export async function getTotalRescheduleApp(req, res, next) {
  try {
    const schema = Joi.object().keys({
      fromDate: Joi.date(),
      toDate: Joi.date(),
      hospitalId: Joi.string().guid(),
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
          name: 'Get Confirm Reschedule Appointment',
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
        name: 'Get Confirm Reschedule Appointment',
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

export async function updateAppTemp(req, res, next) {
  try {
    const schema = Joi.object().keys({
      appTempId: Joi.number().integer().min(0).required(),
      phoneNumber: Joi.string().allow(['', null]),
      note: Joi.string().allow(['', null]),
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
          name: 'Update Appointment Temporary',
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
        name: 'Create Appointment',
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
