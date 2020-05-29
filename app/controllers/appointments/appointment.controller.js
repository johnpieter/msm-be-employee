import { isEmpty, result, omit } from 'lodash';
import moment from 'moment';
import Sequelize from 'sequelize';
import {
  GET_LIMIT, bugsLevel, protocol, slackCode, channel,
} from '../../variables/common.variable';
import { findByPk as findByPkHospital } from '../../queries/hospitals/tmHospital.query';
import { addAppointmentLogic, addAppointmentTemporaryLogic } from './modules/appointment.module';
import {
  findByPk as findByPkApp, update as updateApp, getTotalReschedule,
  getReschedule as getRescheduleApp, moveToWorklist as moveToWorklistApp,
  collectAppToWorklist, findAppPatient, getAppById, count as countApp,
  checkInApp as checkInAppQuery,
} from '../../queries/appointments/txAppointment.query';
import { findOne as findOneContact } from '../../queries/contacts/tmContact.query';
import { getPatientHospital } from '../../queries/patients/txPatientHospital.query';
import {
  find as findAppTemp, count as countAppTemp, update as updateTempAppointment,
  findByPk as findByPkAppTemp, update as updateAppTemp, findOne as findOneAppTemp,
} from '../../queries/appointments/txAppointmentTemporary.query';
import { cancelScheduleHope } from '../../services/HIS/schedules.his';
import {
  appStatus, appTempStatus, APPOINTMENT_TEMPORARY__COUNT, APPOINTMENT__CANCEL,
  APPOINTMENT__RESCHEDULE, appTempKey, appErrorCode, appRescheduleKey,
  APPOINTMENT_RESCHEDULE__COUNT,
} from '../../variables/appointment.variable';
import {
  validatePatient, validateContact, validateAppointment, validateDuplicateApp,
  validatePatientData,
} from './modules/validation.module';
import {
  hopeCancelFormat, cancelAppFormat, moveToWorkListFormat, getAppCondition, appTempCondFormat,
  rescheduleAppTempFormat, collectAppToRescheduleFormat, updateFormat, appAidoFormat,
  updateAppAidoFormat, createAdmAidoFormat,
} from '../../utils/payload.util';
import { generateCreatedAttribute, generateModifiedAttribute, getChannelCategory } from '../../utils/helpers.util';
import { mySiloamAppointments, mySiloamTemporaries } from '../../variables/tableName.variable';
import { postError } from '../../services/common/slack.common';
import config from '../../configs/env.config';
import { appointmentChannel } from '../../sockets/index';
import { findAppHistory } from '../../queries/appointments/thAppointmentHistory.query';
import { contactStatus } from '../../variables/contact.variable';
import { findOne as findOneSchedule } from '../../queries/schedules/tmSchedule.query';
import { findOne as findOneScheduleBlock } from '../../queries/schedules/txScheduleBlock.query';
import { doctorLabel } from '../../variables/doctor.variable';
import { scheduleStatus, scheduleType } from '../../variables/schedule.variable';
import {
  save as saveAppointmentAido, findAppAidoDetail, update as updateAppAido,
  findByPk as findByPkAppAido, findOne as findOneAppAido, find as findAppAido,
} from '../../queries/appointments/txAppointmentAido.query';
import { admStatus } from '../../variables/admission.variable';
import { createAdmission as createAdmissionService } from '../../services/mysiloam/admission.mysiloam';
import { checkPatientMappingHope } from '../../functions/patient.function';
import { findByPk as findByPkDoctor } from '../../queries/doctors/tmDoctor.query';

const { Op } = Sequelize;

async function cancelApp(params = {}, req) {
  try {
    const { appointmentId, reschedule = false, appointmentTemporaryId } = params;
    let response = [];
    if (!reschedule && !isEmpty(appointmentId)) {
      response = await updateApp({
        ...cancelAppFormat(params),
        ...generateModifiedAttribute(params, req),
      }, { where: { appointment_id: params.appointmentId } });
      const hopeResponse = await cancelScheduleHope(hopeCancelFormat(result(response, '[1][0]', {})));
      if (((!reschedule && !isEmpty(response[1][0]) && Number(hopeResponse.code) === 200)
        || (reschedule && Number(hopeResponse.code) === 200))) response = result(response, '[1][0]', {});
      else throw new Error('Cancel appointment failed');
    } else if (typeof appointmentTemporaryId === 'number') {
      response = await updateAppTemp({
        appointment_temporary_status: appTempStatus.CANCELLED,
        ...generateModifiedAttribute(params, req),
      }, { where: { appointment_temporary_id: appointmentTemporaryId } });
      if (!isEmpty(response[1][0])) {
        response = result(response, '[1][0]', {});
        await appointmentChannel.emit(APPOINTMENT_TEMPORARY__COUNT,
          { key: appTempKey.REMOVE });
      } else throw new Error('Cancel appointment failed');
    }
    return {
      success: true,
      data: response,
      message: null,
    };
  } catch (err) {
    throw err;
  }
}

/* ******************************************************************************************** */

export async function addAppointment(req, res) {
  try {
    const {
      hospitalId, channelId, patientHopeId, contactId, name, birthDate, phoneNumber1,
      appointmentTemporaryId, isVerify = false,
    } = req.body;

    if (typeof appointmentTemporaryId === 'number') {
      const appTemp = await findOneAppTemp({
        where: {
          [Op.and]: [
            { appointment_temporary_id: appointmentTemporaryId },
            {
              appointment_temporary_status: {
                [Op.in]: [appTempStatus.ACTIVE, appTempStatus.RESCHEDULED],
              },
            },
          ],
        },
      });
      if (isEmpty(appTemp)) throw new Error(491);
    }

    const isInternal = getChannelCategory(channelId);

    let postParams = { ...req.body, setToAppTemp: !isInternal };
    const hospital = await findByPkHospital(hospitalId);
    postParams = {
      ...postParams,
      hospitalHopeId: hospital.hospital_hope_id,
      hospitalName: hospital.name,
      hospitalAlias: hospital.alias,
      hospitalTimeZone: hospital.time_zone,
    };

    if (isVerify) postParams = await validatePatient(postParams, req);
    else if (isInternal) {
      if (typeof patientHopeId === 'number') postParams = await validatePatient(postParams, req);
      else if (name && birthDate && phoneNumber1) {
        postParams = await validatePatient(postParams, req);
      } else throw new Error('name, DOB, phoneNumber / patientHopeId required');
    } else if (!isInternal) {
      if (contactId) postParams = await validateContact(postParams, req);
      else if (name && birthDate && phoneNumber1) {
        postParams = await validateContact(postParams, req);
      } else throw new Error(484);
    }

    let appointment;
    const validateApp = await validateAppointment(postParams);
    postParams = { ...postParams, ...validateApp };

    if (isInternal) appointment = await addAppointmentLogic(postParams, req);
    else if (!isInternal) {
      appointment = typeof appointmentTemporaryId === 'number'
        || String(postParams.contactStatusId) === contactStatus.PATIENT_VERIFICATION
        || !postParams.setToAppTemp
        ? await addAppointmentLogic(postParams, req)
        : await addAppointmentTemporaryLogic(postParams, req);
    }
    res.status(200).json({
      data: appointment,
      status: 'OK',
      message: 'Create appointment successfully',
    });
    req.message = 'Create appointment successfully';
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
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Create Appointment',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: errorMessage,
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

export async function addAppointmentAido(req, res) {
  try {
    let postParams = req.body;
    const {
      hospitalId, nationalityId, nationalIdNo, currentAddress, phoneNumber,
      identityAddress, nationalIdTypeId, doctorId,
    } = postParams;
    const hospital = await findByPkHospital(hospitalId);
    postParams = {
      ...postParams,
      channelId: channel.AIDO,
      hospitalHopeId: hospital.hospital_hope_id,
      hospitalTimeZone: hospital.time_zone,
    };
    const doctor = await findByPkDoctor(doctorId);
    postParams = {
      ...postParams,
      doctorHopeId: doctor.doctor_hope_id,
    };
    postParams = await validatePatientData(postParams);
    postParams = await validateContact({
      ...postParams,
      phoneNumber1: phoneNumber,
      addressLine1: currentAddress,
      addressLine2: identityAddress,
      identityTypeId: nationalIdTypeId,
      identityNumber: nationalIdNo,
      countryId: nationalityId,
    });
    postParams = await checkPatientMappingHope(postParams);
    postParams = await Promise.all([
      await validateDuplicateApp(postParams),
    ]).then((response) => {
      response.forEach((respon) => { postParams = { ...postParams, ...respon }; });
      return postParams;
    });
    const appointment = await saveAppointmentAido({
      ...appAidoFormat(postParams),
      ...generateCreatedAttribute(postParams, req),
      ...generateModifiedAttribute(postParams, req),
    });
    res.status(200).json({
      data: appointment,
      status: 'OK',
      message: 'Create appointment AIDO successfully',
    });
    req.message = 'Create appointment AIDO successfully';
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
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Create Appointment AIDO',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: errorMessage,
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

export async function checkCurrentAidoApp(req, res) {
  try {
    const {
      contactId, newContactId, patientHopeId, patientOrgId,
    } = req.body;
    const contact = await findOneContact({
      where: {
        [Op.and]: [
          { contact_id: contactId },
          { contact_status_id: { [Op.not]: contactStatus.INACTIVE } },
        ],
      },
    });
    if (isEmpty(contact)) throw new Error('Contact not found');
    const aidoPayload = typeof patientOrgId === 'number' ? { patient_organization_id: patientOrgId } : {};
    const updtAppAido = await updateAppAido({
      ...aidoPayload,
      contact_id: !isEmpty(newContactId) ? newContactId : contactId,
      patient_hope_id: patientHopeId,
      is_double_mr: false,
      ...generateModifiedAttribute(req.body, req),
    }, { where: { contact_id: contactId } });
    if (isEmpty(updtAppAido[1])) throw new Error('Update appointment AIDO failed');
    const appAido = await findAppAido({
      attributes: ['appointment_id'],
      where: {
        [Op.and]: [
          { contact_id: contactId },
          { is_double_mr: false },
          { patient_hope_id: { [Op.not]: 0 } },
          { patient_organization_id: { [Op.not]: 0 } },
          { appointment_status_id: appStatus.ACTIVE },
          { admission_status_id: { [Op.in]: [admStatus.ACTIVE, admStatus.FAILED] } },
          { appointment_date: moment.tz('Asia/Jakarta').format('YYYY-MM-DD') },
        ],
      },
    });
    const createAdm = [];
    for (let i = 0, { length } = appAido; i < length; i += 1) {
      createAdm.push(createAdmissionService(createAdmAidoFormat({
        ...req.body, appointmentId: appAido[i].appointment_id,
      })).catch(() => null));
    }
    Promise.all(createAdm)
      .then((response) => {
        res.status(200).json({
          data: response,
          status: 'OK',
          message: 'Check current appointment AIDO successfully',
        });
      }).catch((error) => {
        throw new Error(error.message);
      });
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
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Check Current Appointment AIDO',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: errorMessage,
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

export async function getAppointment(req, res) {
  try {
    const {
      sortBy = 'appointment_no', orderBy = 'ASC', limit = GET_LIMIT, offset = 0,
    } = req.query;
    let paging; let pagingAttribute;
    const conditions = getAppCondition(req.query);
    const order = [
      [sortBy, orderBy],
    ];
    const attributesAppTemp = [
      [Sequelize.fn('DISTINCT', Sequelize.col(`${mySiloamTemporaries.TX_APPOINTMENT_TEMPORARY}.appointment_temporary_id`)), 'appointment_temporary_id'],
      'appointment_id', 'appointment_no', 'created_by', 'created_date', 'created_from', 'modified_by',
      'modified_date', 'modified_from', 'contact_name', 'doctor_id', 'doctor_name', 'created_name',
      [Sequelize.col('date_of_birth'), 'birth_date'], 'hospital_name', 'hospital_alias',
      [Sequelize.col('note'), 'appointment_note'],
      [Sequelize.col('appointment_from_time'), 'from_time'],
      [Sequelize.col('appointment_to_time'), 'to_time'],
      'phone_number', 'hospital_id', 'current_address', 'identity_address',
      'schedule_id', 'appointment_date', 'is_waiting_list',
      'modified_name', 'contact_id', 'gender_id', 'appointment_temporary_status',
    ];

    if (Number(limit) !== 0 || Number(offset) !== 0) {
      paging = { limit, offset };
      pagingAttribute = Number(limit) !== 0 || Number(offset) !== 0
        ? {}
        : undefined;
    }
    const appointment = await findAppPatient({
      ...paging,
      ...req.query,
      sortBy,
      orderBy,
    });
    const appointmentTemp = await findAppTemp({
      ...paging,
      attributes: attributesAppTemp,
      where: {
        [Op.and]: conditions.concat([{ appointment_temporary_status: appTempStatus.ACTIVE }]),
      },
      order,
    });
    let response = appointment.concat(appointmentTemp);
    response = response.sort((a, b) => a.appointment_no - b.appointment_no);
    res.status(200).json({
      data: response,
      ...pagingAttribute,
      status: 'OK',
      message: 'Get Appointment Successfully',
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

export async function getAppointmentAido(req, res) {
  try {
    const appointment = await findAppAidoDetail({ ...req.query, ...req.params });
    res.status(200).json({
      data: appointment,
      status: 'OK',
      message: 'Get appointment list AIDO successfully',
    });
    req.message = 'Get appointment list AIDO successfully';
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
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Get Appointment List AIDO',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: errorMessage,
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

export async function getAppointmentById(req, res) {
  try {
    const { appointmentId } = req.params;
    const appointment = await getAppById(appointmentId);
    res.status(200).json({
      data: appointment,
      status: 'OK',
      message: 'Get Appointment Successfully',
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
        name: 'Get Appointment by ID',
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

export async function cancelAppointment(req, res) {
  try {
    const { appointmentId } = req.params;
    const checkInApp = await checkInAppQuery({ where: { appointment_id: appointmentId } });
    if (checkInApp) throw new Error(489);
    const cancel = await cancelApp({ ...req.params, ...req.body }, req);
    await appointmentChannel.emit(APPOINTMENT__CANCEL, {
      ...cancel.data, hospitalId: cancel.data.hospital_id,
    });
    res.status(200).json({
      data: cancel.data,
      status: 'OK',
      message: 'Cancel appointment successfully',
    });
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
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Cancel Appointment',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: errorMessage,
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

export async function getRescheduleWorklist(req, res) {
  try {
    const {
      sortBy = 'created_date', orderBy = 'DESC', limit = GET_LIMIT, offset = 0,
      patientName, from = moment().format('YYYY-MM-DD'), to = moment().format('YYYY-MM-DD'),
      doctorId, hospitalId,
    } = req.query;
    const order = [
      [sortBy, orderBy], ['created_date', 'DESC'],
    ];
    const conditions = {
      hospitalId, from, to, doctorId, patientName, limit, offset,
    };
    const tempCond = rescheduleAppTempFormat(conditions);
    const tempAttributes = [
      'appointment_temporary_id', 'appointment_id', ['contact_name', 'patient_name'],
      ['date_of_birth', 'birth_date'], 'appointment_date', 'appointment_from_time',
      'appointment_to_time', 'doctor_id', 'doctor_name', 'hospital_alias', 'hospital_name',
      ['phone_number', 'phone_number_1'], 'note', 'hospital_id', 'created_by', 'created_date',
      'created_from',
    ];
    const request = {
      limit, offset, order, ...conditions,
    };
    if (Number(limit) === 0 && Number(offset) === 0) {
      delete request.limit;
      delete request.offset;
    }
    const rescheduleApp = await getRescheduleApp(request);
    const rescheduleAppTemp = await findAppTemp({
      ...request, attributes: tempAttributes, where: { [Op.and]: tempCond },
    });
    res.status(200).json({
      data: rescheduleApp.concat(rescheduleAppTemp),
      status: 'OK',
      message: 'Get Reschedule Worklist Successfully',
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
        name: 'Get Reschedule Worklist',
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

export async function getCountRescheduleUndone(req, res) {
  try {
    const [{ total }] = await getTotalReschedule({
      where: { appointment_status_id: appStatus.RESCHEDULED },
    });
    res.status(200).json({
      data: Number(total),
      status: 'OK',
      message: 'Get Count Reschedule Undone Successfully',
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
        name: 'Get Count Reschedule Undone',
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

export async function getTempAppointment(req, res) {
  try {
    const {
      sortBy = 'created_date', orderBy = 'DESC', limit = 10, offset = 0,
    } = req.query;
    const order = [
      [sortBy, orderBy],
      ['created_date', 'DESC'],
    ];
    const conditions = appTempCondFormat(req.query);
    const appointment = await findAppTemp({
      where: { [Op.and]: conditions }, order, limit, offset,
    });
    res.status(200).json({
      status: 'OK',
      data: appointment,
      message: 'Get Temporary Appointment Successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      data: null,
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Get Appointment Temporary',
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

export async function getTotalTempAppointment(req, res) {
  try {
    const total = await countAppTemp({
      where: {
        appointment_temporary_status: {
          [Op.in]: [appTempStatus.ACTIVE, appTempStatus.RESCHEDULED],
        },
      },
    });
    await appointmentChannel.emit(APPOINTMENT_TEMPORARY__COUNT, {
      key: appTempKey.RESET,
      total,
    });
    res.status(200).json({
      data: Number(total),
      status: 'OK',
      message: 'Get Total Temporary Appointment Successfully',
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
        name: 'Get Total Appointment Temporary',
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

export async function cancelTempAppointment(req, res) {
  try {
    const { appointmentTemporaryId } = req.params;
    const updateParams = {
      appointment_temporary_status: appTempStatus.CANCELLED,
      ...generateModifiedAttribute(req.body, req),
    };
    const conditions = { where: { appointment_temporary_id: appointmentTemporaryId } };
    const validate = await findByPkAppTemp(appointmentTemporaryId);
    const cancel = await updateTempAppointment(updateParams, conditions);
    if (!isEmpty(validate) && result(validate, 'appointment_temporary_status', '') === 'active'
      && !isEmpty(cancel[1][0])) {
      await appointmentChannel.emit(APPOINTMENT__CANCEL, {
        ...cancel[1][0], hospitalId: validate.hospital_id,
      });
      await appointmentChannel.emit(APPOINTMENT_TEMPORARY__COUNT, { key: appTempKey.REMOVE });
    }
    res.status(200).json({
      status: 'OK',
      data: cancel[1][0] || null,
      message: 'Cancel temporary appointment successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'OK',
      data: null,
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Cancel Appointment Temporary',
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

export async function cancelAppointmentAido(req, res) {
  try {
    const { appointmentId } = req.params;
    const appointment = await findOneAppAido({
      where: {
        [Op.and]: [
          { appointment_id: appointmentId },
          { admission_status_id: { [Op.not]: admStatus.SUCCESS } },
        ],
      },
    });
    if (isEmpty(appointment)) throw new Error('Appointment not found');
    if (!(moment(appointment.appointment_date, 'YYYY-MM-DD').isAfter(moment.tz('Asia/Jakarta')))) throw new Error('Cannot cancel today appointment');
    const cancel = await updateAppAido({
      appointment_status_id: appStatus.CANCELED,
      ...generateModifiedAttribute(req.body, req),
    }, { where: { appointment_id: appointmentId } });
    res.status(200).json({
      status: 'OK',
      data: cancel[1][0] || null,
      message: 'Cancel appointment AIDO successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'OK',
      data: null,
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Cancel Appointment AIDO',
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

export async function moveAppointmentToWorklist(req, res) {
  try {
    const {
      scheduleId, appTempId = [], hospitalId, includeIntApp = true,
    } = req.body;
    let { appointmentId = [] } = req.body;
    if (!isEmpty(scheduleId)) {
      const condition = collectAppToRescheduleFormat(req.body);
      const { app = [], appTemp = [] } = await collectAppToWorklist(condition);
      app.map(x => appointmentId.push(x.appointment_id));
      appTemp.map(x => appTempId.push(x.appointment_temporary_id));
    } else if (isEmpty(appointmentId)) throw new Error('scheduleId or appointmentId required');
    if (!includeIntApp) appointmentId = [];
    const response = await moveToWorklistApp(moveToWorkListFormat({
      ...req.body, appointmentId, appTempId,
    }), req);
    const affectedRows = Number(response[0]);
    const responseData = response[1];
    const hopeFormData = [];
    for (let i = 0, { length } = responseData; i < length; i += 1) {
      if (typeof responseData[i].appointment_temporary_id !== 'number') hopeFormData.push(hopeCancelFormat(responseData[i]));
    }
    await cancelScheduleHope(hopeFormData);
    const countAppReschedule = await countApp({
      where: {
        [Op.and]: [
          {
            appointment_date: {
              [Op.between]: [moment().format('YYYY-MM-DD'), moment().add(7, 'days').format('YYYY-MM-DD')],
            },
          }, { appointment_status_id: appStatus.RESCHEDULED },
        ],
      },
    });
    const countAppTempReschedule = await countAppTemp({
      where: {
        [Op.and]: [
          {
            appointment_date: {
              [Op.between]: [moment().format('YYYY-MM-DD'), moment().add(7, 'days').format('YYYY-MM-DD')],
            },
          },
          { appointment_temporary_status: appTempStatus.RESCHEDULED },
        ],
      },
    });
    appointmentChannel.emit(APPOINTMENT_RESCHEDULE__COUNT, {
      key: appRescheduleKey.RESET,
      value: Number(countAppReschedule + countAppTempReschedule),
      hospitalId,
    });
    res.status(200).json({
      data: { affectedRows },
      status: 'OK',
      message: 'Move to Worklist Successfully',
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
        name: 'Move To Worklist',
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

export async function rescheduleAppointment(req, res) {
  try {
    const {
      appointmentId, appointmentTemporaryId, hospitalId, channelId,
    } = req.body;

    const isInternal = getChannelCategory(channelId);

    const hospital = await findByPkHospital(hospitalId, { attributes: ['hospital_hope_id'] });

    let appointment;

    if (typeof appointmentTemporaryId === 'number') {
      appointment = await findByPkAppTemp(appointmentTemporaryId);
      if (
        !(result(appointment, 'appointment_temporary_status', null) === appTempStatus.ACTIVE
        || result(appointment, 'appointment_temporary_status', null) === appTempStatus.RESCHEDULED)
      ) throw new Error(491);
    } else {
      appointment = await findByPkApp(appointmentId);
      if (
        !(result(appointment, 'appointment_status_id', null) === appStatus.ACTIVE
        || result(appointment, 'appointment_status_id', null) === appStatus.RESCHEDULED)
      ) throw new Error(491);
    }

    const patient = await getPatientHospital({
      attributes: ['patient_organization_id'],
      where: { [`$${mySiloamAppointments.TM_PATIENT}.contact_id$`]: appointment.contact_id },
    });

    const contact = await findOneContact({
      attributes: ['name', 'birth_date', 'phone_number_1'],
      where: { contact_id: appointment.contact_id },
    });

    // Cancel Appointment
    if (!isEmpty(appointmentId)) {
      const hopeResponse = await cancelScheduleHope(hopeCancelFormat(appointment));
      if (Number(hopeResponse.code) !== 200) throw new Error('Reschedule Appointment Was Failed');
    }

    // Create Appointment
    let requestBody = { ...req.body };
    if (!isInternal) requestBody = omit(requestBody, ['appointmentNo']);

    const validateApp = await validateAppointment({
      ...requestBody,
      contactId: appointment.contact_id,
      patientOrganizationId: result(patient, 'patient_organization_id', null),
      name: contact.name,
      birthDate: contact.birth_date,
      phoneNumber1: contact.phone_number_1,
      doctorId: appointment.doctor_id,
      hospitalId,
      channelId,
      reschedule: true,
      appointmentDateBefore: appointment.appointment_date,
    });

    let createApp = null;

    if (isInternal) {
      createApp = await addAppointmentLogic({
        ...req.body,
        appointmentId,
        contactId: appointment.contact_id,
        doctorId: appointment.doctor_id,
        hospitalId,
        hospitalHopeId: hospital.hospital_hope_id,
        channelId,
        ...validateApp,
        reschedule: true,
      }, req);
    } else {
      createApp = !isEmpty(appointmentId)
        ? await addAppointmentLogic({
          ...req.body,
          appointmentId,
          contactId: appointment.contact_id,
          doctorId: appointment.doctor_id,
          hospitalId,
          hospitalHopeId: hospital.hospital_hope_id,
          channelId,
          ...validateApp,
          reschedule: true,
        }, req)
        : await addAppointmentTemporaryLogic({
          ...req.body,
          appointmentId,
          contactId: appointment.contact_id,
          doctorId: appointment.doctor_id,
          hospitalId,
          hospitalHopeId: hospital.hospital_hope_id,
          ...validateApp,
          reschedule: true,
        }, req);
    }

    if (!isEmpty(createApp)) {
      if (!isEmpty(appointmentId)) {
        const appForSocket = await findAppPatient({ appointmentId: createApp.appointment_id });
        createApp = result(appForSocket, '[0]', {});
        if (appointment.appointment_status_id === appStatus.RESCHEDULED) {
          await appointmentChannel.emit(APPOINTMENT_RESCHEDULE__COUNT, {
            key: appRescheduleKey.REMOVE,
            hospitalId,
          });
        }
      }
      await appointmentChannel.emit(APPOINTMENT__RESCHEDULE, {
        before: appointment,
        after: createApp,
        hospitalId,
      });
      res.status(200).json({
        data: createApp,
        status: 'OK',
        message: 'Reschedule Appointment Successfully',
      });
    } else throw new Error('Reschedule Appointment Was Failed');
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
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Reschedule Appointment',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: errorMessage,
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

export async function rescheduleAppointmentAido(req, res) {
  try {
    const { appointmentId } = req.body;
    let {
      chiefComplaint, zoomUrl, aidoTrxId, deliveryAddress,
    } = req.body;
    let postParams = req.body;
    const appointment = !isEmpty(appointmentId)
      ? await findByPkAppAido(appointmentId)
      : await findOneAppAido({
        where: { aido_transaction_id: aidoTrxId },
        order: [['created_by', 'DESC']],
      });
    if (isEmpty(appointment)) throw new Error('Appointment not found');

    if (!(moment(appointment.appointment_date, 'YYYY-MM-DD').isAfter(moment.tz('Asia/Jakarta')))) throw new Error('Cannot reschedule today appointment');
    chiefComplaint = !isEmpty(chiefComplaint) ? chiefComplaint : appointment.chief_complaint;
    zoomUrl = !isEmpty(zoomUrl) ? zoomUrl : appointment.zoom_url;
    aidoTrxId = !isEmpty(aidoTrxId) ? aidoTrxId : appointment.aido_transaction_id;
    deliveryAddress = !isEmpty(deliveryAddress) ? deliveryAddress : appointment.delivery_address;
    postParams = {
      ...postParams,
      appointmentId: appointment.appointment_id,
      doctorId: appointment.doctor_id,
      hospitalId: appointment.hospital_id,
      channelId: channel.AIDO,
      chiefComplaint,
      zoomUrl,
      aidoTrxId,
      deliveryAddress,
    };
    postParams = await Promise.all([
      await validateDuplicateApp(postParams),
    ]).then((response) => {
      response.forEach((respon) => { postParams = { ...postParams, ...respon }; });
      return postParams;
    });
    const newApp = await updateAppAido({
      ...updateAppAidoFormat(postParams),
      ...generateModifiedAttribute(postParams, req),
    }, { where: { appointment_id: postParams.appointmentId } });
    res.status(200).json({
      data: newApp[1][0],
      status: 'OK',
      message: 'Reschedule Appointment AIDO Successfully',
    });
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
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Reschedule Appointment AIDO',
        priority: code === slackCode.HOPE
        || code === slackCode.MY_SILOAM
          ? bugsLevel.CRITICAL
          : bugsLevel.MAJOR,
        message: errorMessage,
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

export async function getAppTempById(req, res) {
  try {
    const { appTempId } = req.params;
    const appointment = await findByPkAppTemp(appTempId);
    res.status(200).json({
      data: appointment,
      status: 'OK',
      message: 'Get Appointment Successfully',
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
        name: 'Get Appointment by ID',
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

export async function getAppHistoryById(req, res) {
  try {
    const {
      sortBy = 'app_his.created_date', orderBy = 'DESC', limit = GET_LIMIT, offset = 0,
    } = req.query;
    let paging = {};
    if (Number(limit) !== 0 || Number(offset) !== 0) paging = { limit, offset };
    const appointment = await findAppHistory({
      ...req.params, ...req.query, ...paging, sortBy, orderBy,
    });
    res.status(200).json({
      data: appointment,
      status: 'OK',
      message: 'Get Appointment Successfully',
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
        name: 'Get Appointment History by ID',
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

export async function confirmRescheduleApp(req, res) {
  try {
    const { appointmentTemporaryId } = req.query;
    const appTemp = await findByPkAppTemp(appointmentTemporaryId);

    let message = 'Get Reschedule Confirm Successfully';
    let data = false;

    // doctor have a leave on appointment_date
    // schedule was blocked
    // schedule still exist

    const schedule = await findOneSchedule({
      attributes: ['schedule_id'],
      where: {
        [Op.and]: [
          { day: Number(moment(appTemp.appointment_date).format('E')) },
          { schedule_status_id: scheduleStatus.SCHEDULE_ACTIVE },
          { schedule_type_id: scheduleType.PRACTICE },
          { doctor_id: appTemp.doctor_id },
          { hospital_id: appTemp.hospital_id },
          Sequelize.literal(`(date '${appTemp.appointment_date}' + from_time) <= (date '${appTemp.appointment_date}' + time '${appTemp.appointment_from_time}') `),
          Sequelize.literal(`(date '${appTemp.appointment_date}' + to_time) >= (date '${appTemp.appointment_date}' + time '${appTemp.appointment_to_time}') `),
        ],
      },
    });

    if (isEmpty(schedule)) {
      data = true;
      message = 'Schedule not longer available';
    }

    const leave = await findOneSchedule({
      attributes: ['schedule_id'],
      where: {
        [Op.and]: [
          { day: doctorLabel.LEAVE },
          { schedule_status_id: scheduleStatus.LEAVE_ACTIVE },
          { schedule_type_id: { [Op.not]: scheduleType.PRACTICE } },
          { doctor_id: appTemp.doctor_id },
          { hospital_id: appTemp.hospital_id },
          {
            [Op.and]: [
              { from_date: { [Op.lte]: appTemp.appointment_date } },
              { to_date: { [Op.gte]: appTemp.appointment_date } },
            ],
          },
        ],
      },
    });

    if (!isEmpty(leave)) {
      data = true;
      message = 'Doctor has leave on the appointment date';
    }

    const scheduleBlock = await findOneScheduleBlock({
      attributes: ['schedule_block_id'],
      where: {
        [Op.and]: [
          { schedule_id: appTemp.schedule_id },
          { is_active: true },
          Sequelize.literal(`(from_date + from_time) <= (date '${appTemp.appointment_date}' + time '${appTemp.appointment_from_time}') `),
          Sequelize.literal(`(to_date + to_time) >= (date '${appTemp.appointment_date}' + time '${appTemp.appointment_to_time}') `),
        ],
      },
    });

    if (!isEmpty(scheduleBlock)) {
      data = true;
      message = 'Schedule has been blocked';
    }

    res.status(200).json({ data, status: 'OK', message });
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Get Confirm Reschedule Appointment',
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

export async function getTotalRescheduleApp(req, res) {
  try {
    const {
      fromDate = moment().format('YYYY-MM-DD'), toDate = moment().add(7, 'days').format('YYYY-MM-DD'),
      hospitalId,
    } = req.query;
    const appQuery = [
      { appointment_date: { [Op.between]: [fromDate, toDate] } },
      { appointment_status_id: appStatus.RESCHEDULED },
    ];
    const appTempQuery = [
      { appointment_date: { [Op.between]: [fromDate, toDate] } },
      { appointment_temporary_status: appTempStatus.RESCHEDULED },
    ];
    const countAppReschedule = await countApp({
      where: {
        [Op.and]: hospitalId ? appQuery.concat([{ hospital_id: hospitalId }]) : appQuery,
      },
    });
    const countAppTempReschedule = await countAppTemp({
      where: {
        [Op.and]: hospitalId ? appTempQuery.concat([{ hospital_id: hospitalId }]) : appTempQuery,
      },
    });
    const total = Number(countAppReschedule + countAppTempReschedule);
    appointmentChannel.emit(APPOINTMENT_RESCHEDULE__COUNT, {
      key: appRescheduleKey.RESET,
      value: total,
      hospitalId,
    });
    res.status(200).json({
      data: total,
      status: 'OK',
      message: 'Get Count Reschedule Undone Successfully',
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
        name: 'Get Count Reschedule Undone',
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

export async function updateAppTemporary(req, res) {
  try {
    const { appTempId } = req.params;
    const response = await updateAppTemp({
      ...updateFormat(omit(req.body, ['userId', 'userName', 'source'])),
      ...generateModifiedAttribute(req.body),
    }, { where: { appointment_temporary_id: appTempId } });
    res.status(200).json({
      data: response[1][0],
      status: 'OK',
      message: 'Update Appointment Temporary Successfully',
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
        name: 'Update Appointment Temporary Successfully',
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
