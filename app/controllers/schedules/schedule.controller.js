import moment from 'moment';
import Sequelize from 'sequelize';
import { isEmpty, result } from 'lodash';
import { find as findSchedule, findByPk as findByPkSchedule } from '../../queries/schedules/tmSchedule.query';
import { findOne as findOneDoctorHospital } from '../../queries/doctors/tmDoctorHospital.query';
import { find as findApp } from '../../queries/appointments/txAppointment.query';
import { find as findAppTemp } from '../../queries/appointments/txAppointmentTemporary.query';
import { generateTimeSlot } from '../../utils/transformer.util';
import { appStatus, appTempStatus } from '../../variables/appointment.variable';
import {
  GET_LIMIT, bugsLevel, protocol, slackCode,
} from '../../variables/common.variable';
import {
  getSBList, save as addSBQuery, update as updateSBQuery,
  remove as removeSBQuery, findByPk as findByPkSB,
  findOne as findOneScheduleBlock, find as findBlock,
  attributes as attributesSB,
} from '../../queries/schedules/txScheduleBlock.query';
import {
  updateFormat, addSBFormat, rescheduleAppFormat, scheduleBlockCondition,
} from '../../utils/payload.util';
import { generateModifiedAttribute, generateCreatedAttribute } from '../../utils/helpers.util';
import { moveToWorklist } from '../../services/mysiloam/schedule.mysiloam';
import { postError } from '../../services/common/slack.common';
import config from '../../configs/env.config';
import { scheduleType, scheduleStatus } from '../../variables/schedule.variable';
import { findByPk as findByPkHospital } from '../../queries/hospitals/tmHospital.query';

const { Op } = Sequelize;

export async function getScheduleBlock(req, res) {
  try {
    const {
      sortBy = 'created_date', orderBy = 'DESC', limit = GET_LIMIT, offset = 0,
      date = moment().format('YYYY-MM-DD'),
    } = req.query;
    const order = [
      [sortBy, orderBy], ['created_date', 'DESC'],
    ];
    const conditions = {
      [Op.and]: [
        { from_date: date },
        { is_active: true },
        { schedule_id: req.params.scheduleId },
      ],
    };
    const request = {
      attributes: attributesSB, limit, offset, order, where: conditions,
    };
    if (Number(limit) === 0 && Number(offset) === 0) {
      delete request.limit;
      delete request.offset;
    }
    const sbList = await getSBList(request);
    res.status(200).json({
      data: sbList,
      status: 'OK',
      message: 'Get Schedule Block Successfully',
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
        name: 'Get Schedule Block',
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

export async function addScheduleBlock(req, res) {
  try {
    const { scheduleId } = req.params;
    const createdDate = moment().toISOString();
    const { conditions = [] } = scheduleBlockCondition({ ...req.params, ...req.body }, true);
    const dupScheduleBlock = await findOneScheduleBlock({ where: { [Op.and]: conditions } });
    if (!isEmpty(dupScheduleBlock)) throw new Error('Schedule Already Exist');
    const schedule = await findByPkSchedule(scheduleId);
    const responses = await addSBQuery({
      ...addSBFormat({ ...req.body, ...req.params }),
      ...generateCreatedAttribute({ ...req.body, createdDate }, req),
      ...generateModifiedAttribute({ ...req.body, createdDate }, req),
    });
    await moveToWorklist(rescheduleAppFormat({
      ...req.body, ...req.params, scheduleId: [scheduleId], hospitalId: schedule.hospital_id,
    })).then(async () => {
      res.status(200).json({
        data: responses,
        status: 'OK',
        message: 'Add Schedule Block Successfully',
      });
      req.message = 'Add Schedule Block Successfully';
    }).catch(async (error) => {
      await removeSBQuery({ where: { schedule_block_id: responses.schedule_block_id } });
      throw new Error(error.message);
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
        name: 'Add Schedule Block',
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

export async function updateScheduleBlock(req, res) {
  try {
    const sbBefore = await findByPkSB(req.params.scheduleBlockId);
    const { conditions = [] } = scheduleBlockCondition({ ...req.params, ...req.body }, true);
    const dupScheduleBlock = await findOneScheduleBlock({ where: { [Op.and]: conditions } });
    if (!isEmpty(dupScheduleBlock)) throw new Error('Schedule Already Exist');
    const schedule = await findByPkSchedule(req.body.scheduleId);
    delete req.body.scheduleId;
    const responses = await updateSBQuery({
      ...updateFormat(req.body),
      ...generateModifiedAttribute(req.body, req),
    }, { where: { schedule_block_id: req.params.scheduleBlockId } });
    if (responses[0] <= 0) throw new Error('No Schedule Block Updated');
    await moveToWorklist(rescheduleAppFormat({
      scheduleId: [result(responses, '[1][0].schedule_id', '')],
      fromDate: result(responses, '[1][0].from_date', ''),
      ...req.body,
      ...req.params,
      hospitalId: schedule.hospitalId,
    })).then(async () => {
      res.status(200).json({
        data: responses[1][0] || null,
        status: 'OK',
        message: 'Update Schedule Block Successfully',
      });
    }).catch(async (error) => {
      await updateSBQuery(sbBefore,
        { where: { schedule_block_id: sbBefore.schedule_block_id } });
      throw new Error(error.message);
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
        name: 'Update Schedule Block',
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

export async function deleteScheduleBlock(req, res) {
  try {
    const responses = await updateSBQuery({
      is_active: false,
      ...generateModifiedAttribute(req.body, req),
    }, { where: { schedule_block_id: req.params.scheduleBlockId } });
    res.status(200).json({
      data: result(responses, '[1][0]', {}),
      status: 'OK',
      message: 'Delete Schedule Block Successfully',
    });
    req.message = 'Delete Schedule Block Successfully';
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Delete Schedule Block',
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

export async function getTimeSlot(req, res) {
  try {
    const { doctorId, hospitalId, appointmentDate } = req.params;
    const { availableOnly = false, scheduleId } = req.query;
    const sDay = moment(appointmentDate).format('E');
    const hospital = await findByPkHospital(hospitalId);
    const conditions = [
      { doctor_id: doctorId },
      { hospital_id: hospitalId },
      { day: sDay },
      { schedule_type_id: scheduleType.PRACTICE },
      { schedule_status_id: scheduleStatus.SCHEDULE_ACTIVE },
    ];
    if (scheduleId) conditions.push({ schedule_id: scheduleId });
    const schedules = await findSchedule({
      attributes: ['schedule_id', 'from_time', 'to_time'],
      where: { [Op.and]: conditions },
      order: [
        ['from_time', 'ASC'],
      ],
    });
    const scheduleIdQuery = [];
    schedules.map(x => scheduleIdQuery.push(x.schedule_id));
    const doctor = await findOneDoctorHospital({
      attributes: ['doctor_type_id', 'quota', 'reservation', 'walkin'],
      where: {
        [Op.and]: [
          { doctor_id: doctorId },
          { hospital_id: hospitalId },
          { effective_date: { [Op.lte]: appointmentDate } },
        ],
      },
      order: [
        ['created_date', 'DESC'],
      ],
    });
    let apps = await findApp({
      attributes: ['appointment_id', 'appointment_from_time', 'appointment_to_time', 'appointment_no', 'schedule_id'],
      where: {
        [Op.and]: [
          { schedule_id: { [Op.in]: scheduleIdQuery } },
          { appointment_date: appointmentDate },
          { appointment_status_id: appStatus.ACTIVE },
        ],
      },
    });
    const appTemp = await findAppTemp({
      attributes: ['appointment_id', 'appointment_from_time', 'appointment_to_time', 'appointment_no',
        'schedule_id'],
      where: {
        [Op.and]: [
          { schedule_id: { [Op.in]: scheduleIdQuery } },
          { appointment_date: appointmentDate },
          { appointment_temporary_status: appTempStatus.ACTIVE },
        ],
      },
    });
    const checkBlock = await findBlock({
      attributes: ['from_date', 'to_date', 'from_time', 'to_time', 'schedule_id', 'is_active'],
      where: {
        [Op.and]: [
          { schedule_id: { [Op.in]: scheduleIdQuery } },
          { is_active: true },
          { from_date: { [Op.lte]: appointmentDate } },
          { to_date: { [Op.gte]: appointmentDate } },
        ],
      },
    });
    // Join appointments with appointment temporaries
    apps = apps.concat(appTemp);
    let timeSlot = generateTimeSlot(schedules, doctor, apps, checkBlock, {
      ...req.params, ...hospital,
    });
    if (String(availableOnly) === 'true' && doctor.doctor_type_id !== '1') {
      timeSlot = timeSlot.filter(slot => slot.is_walkin === false
        && slot.is_available === true && slot.is_blocked === false
        && slot.is_full === false);
    }
    res.status(200).json({
      status: 'OK',
      data: timeSlot,
      message: 'Get time slot successfully',
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
        name: 'Get Time Slot',
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
