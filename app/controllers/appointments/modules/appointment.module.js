import { result } from 'lodash';
import Sequelize from 'sequelize';
import moment from 'moment';
import {
  addAppTempFormat, updateAppTempFormat, addAppFormat, updateAppFormat, hopeAddFormat,
} from '../../../utils/payload.util';
import { generateCreatedAttribute, generateModifiedAttribute } from '../../../utils/helpers.util';
import {
  find as findApp, save as saveApp, verificationAppTemp,
  update as updateApp, findAppPatient,
} from '../../../queries/appointments/txAppointment.query';
import { generateAppointmentNo } from '../../../utils/transformer.util';
import { find as findAppTemp, save as saveAppTemp, update as updateAppTemp } from '../../../queries/appointments/txAppointmentTemporary.query';
import { addScheduleHope } from '../../../services/HIS/schedules.his';
import {
  appStatus, appTempStatus, APPOINTMENT__CREATE, APPOINTMENT_TEMPORARY__COUNT, appTempKey,
} from '../../../variables/appointment.variable';
import { appointmentChannel } from '../../../sockets/index';

const { Op } = Sequelize;

export async function generateAppNo(params = {}) {
  const {
    appointmentNumbers = [], scheduleId, appointmentDate, appointmentTemporaryId,
  } = params;
  let { appointmentNo } = params;
  const condition = [
    { schedule_id: scheduleId },
    { appointment_date: appointmentDate },
    { is_waiting_list: false },
  ];
  const order = [
    ['appointment_no', 'DESC'],
  ];
  const getAppointments = await findApp({
    where: { [Op.and]: condition.concat([{ appointment_status_id: appStatus.ACTIVE }]) },
    order,
  });
  await getAppointments.map(x => appointmentNumbers.push(x.appointment_no));
  const getAppointmentTemporaries = await findAppTemp({
    where: { [Op.and]: condition.concat([{ appointment_temporary_status: appTempStatus.ACTIVE }]) },
    order,
  });
  getAppointmentTemporaries.map(x => appointmentNumbers.push(x.appointment_no));
  appointmentNo = typeof appointmentTemporaryId !== 'number'
    ? generateAppointmentNo({ ...params, appointmentNumbers })
    : appointmentNo;
  return appointmentNo;
}

/* ********************************************************************************************** */

export async function addAppointmentLogic(params = {}, req) {
  const {
    appointmentTemporaryId, appointmentId, reschedule = false, hospitalId,
  } = params;
  let postParams = params; let appointment;
  const createdDate = moment().toISOString();
  const addSchedule = await addScheduleHope(hopeAddFormat(postParams));
  postParams = {
    ...postParams,
    appointmentHopeId: addSchedule.data.ResultEntityId,
    appointmentStatusId: appStatus.ACTIVE,
    appointmentTemporaryStatus: appTempStatus.ACTIVE,
    createdDate,
  };
  if (reschedule) {
    if (typeof appointmentTemporaryId === 'number') {
      const response = await updateAppTemp({
        ...updateAppTempFormat(postParams),
        ...generateModifiedAttribute(postParams, req),
      }, { where: { appointment_temporary_id: appointmentTemporaryId } });
      const [app] = response[1];
      appointment = app;
    } else {
      const response = await updateApp({
        ...updateAppFormat(postParams),
        ...generateModifiedAttribute(postParams, req),
      }, { where: { appointment_id: appointmentId } });
      const [app] = response[1];
      appointment = app;
    }
  } else if (typeof appointmentTemporaryId === 'number') appointment = await verificationAppTemp(postParams, req);
  else {
    appointment = await saveApp({
      ...addAppFormat(postParams),
      ...generateCreatedAttribute(postParams, req),
      ...generateModifiedAttribute(postParams, req),
    });
    const appForSocket = await findAppPatient({
      appointmentId: appointment.appointment_id,
      limit: 1,
    });
    await appointmentChannel.emit(APPOINTMENT__CREATE, { ...appForSocket[0], hospitalId });
  }
  return appointment;
}

export async function addAppointmentTemporaryLogic(params = {}, req) {
  let postParams = params;
  const { reschedule = false, appointmentTemporaryId } = params;
  const createdDate = moment().toISOString();
  postParams = {
    ...postParams,
    createdDate,
    appointmentStatusId: appStatus.ACTIVE,
    appointmentTemporaryStatus: appTempStatus.ACTIVE,
  };
  let response = null;
  if (reschedule) {
    response = await updateAppTemp({
      ...updateAppTempFormat(postParams),
      ...generateModifiedAttribute(postParams, req),
    }, { where: { appointment_temporary_id: appointmentTemporaryId } });
    response = result(response, '[1][0]', {});
  } else {
    response = await saveAppTemp({
      ...addAppTempFormat(postParams),
      ...generateCreatedAttribute(postParams, req),
      ...generateModifiedAttribute(postParams, req),
    });
    // await appointmentChannel.emit(APPOINTMENT__CREATE, { ...response, hospitalId });
    await appointmentChannel.emit(APPOINTMENT_TEMPORARY__COUNT, { key: appTempKey.ADD });
  }
  return response;
}
