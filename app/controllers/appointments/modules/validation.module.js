import Sequelize from 'sequelize';
import { result, isEmpty, omit } from 'lodash';
import moment from 'moment';
import { channel, DAY_LEAVE } from '../../../variables/common.variable';
import { getDoctorInHospital } from '../../../queries/doctors/tmDoctorHospital.query';
import { mySiloamSchedules, mySiloamAppointments } from '../../../variables/tableName.variable';
import { doctorStatus, doctorType } from '../../../variables/doctor.variable';
import { findOne as findOneSchedule, findByPk as findByPkSchedule } from '../../../queries/schedules/tmSchedule.query';
import { findOne as findOneScheduleBlock, find as findBlock } from '../../../queries/schedules/txScheduleBlock.query';
import { appStatus, appTempStatus } from '../../../variables/appointment.variable';
import { checkDoubleAppointment, findOne as findOneApp, find as findApp } from '../../../queries/appointments/txAppointment.query';
import {
  checkIfContactExist, save as saveContact, findByPk as findByPkContact, update as updateContact,
  getContactPatient,
} from '../../../queries/contacts/tmContact.query';
import { getPatientOrgHopeOne, getPatientOrgHopeTwo, getPatientHope } from '../../../services/HIS/patients.his';
import { findOne as findOnePatientHospital, getPatientHospital } from '../../../queries/patients/txPatientHospital.query';
import {
  addContactFormat, updateContactFormat, mapPatientHopeFormat, mapContactPatientFormat,
} from '../../../utils/payload.util';
import { generateCreatedAttribute, generateModifiedAttribute, getChannelCategory } from '../../../utils/helpers.util';
import { findOne as findOneAppTemp, find as findAppTemp } from '../../../queries/appointments/txAppointmentTemporary.query';
import { scheduleStatus, scheduleType } from '../../../variables/schedule.variable';
import { generateAppTime, generateTimeSlot } from '../../../utils/transformer.util';
import { mapPatientHope, mapContactPatientHope } from '../../../services/mysiloam/patient.mysiloam';
import { find as findDoctorNote } from '../../../queries/doctors/txDoctorNote.query';
import { findOne as findOneAppAido } from '../../../queries/appointments/txAppointmentAido.query';
import { findOne as findOneCity } from '../../../queries/generals/trCities.query';
import { findOne as findOneDistrict } from '../../../queries/generals/trDistricts.query';
import { findOne as findOneSubDistrict } from '../../../queries/generals/trSubdistricts.query';

const { Op } = Sequelize;

let globalParam = {};

export async function validateContact(params = {}, req) {
  let contact;
  const {
    channelId, name, birthDate, phoneNumber1, patientHopeId, updatePatientHopeOnly = false,
    contactId,
  } = params;
  let { patientHope, setToAppTemp } = params;

  if (updatePatientHopeOnly && !isEmpty(patientHope)) {
    await updateContact({
      ...updateContactFormat({ ...result(patientHope, 'data', {}), phoneNumber1: params.phoneNumber1 }),
      ...generateModifiedAttribute(params, req),
    }, { where: { contact_id: contactId } });
    return omit(params, ['updatePatientHopeOnly', 'patientHope']);
  }

  // 'Contact ID is required'
  if (channelId === channel.MOBILE && isEmpty(contactId)) throw new Error(484);
  else if (!isEmpty(contactId)) contact = await findByPkContact(contactId);
  else if (typeof patientHopeId === 'number') {
    patientHope = await getPatientHope(patientHopeId);
    contact = await getContactPatient({
      attributes: [`${mySiloamAppointments.TM_CONTACT}.*`],
      where: { [`$${mySiloamAppointments.TM_PATIENT}.patient_hope_id$`]: patientHopeId },
    });
  }

  if (isEmpty(contact) && channelId === channel.MOBILE) throw new Error(488);
  else if (isEmpty(contact)
    && !isEmpty(name)
    && !isEmpty(birthDate)) contact = await checkIfContactExist(name, birthDate);

  if (isEmpty(contact)) {
    contact = await saveContact({
      ...addContactFormat({ ...params, ...result(patientHope, 'data', {}) }),
      ...generateCreatedAttribute(params, req),
      ...generateModifiedAttribute(params, req),
    });
  }

  if (!isEmpty(patientHope)) {
    await updateContact({
      ...updateContactFormat({ ...result(patientHope, 'data', {}), phoneNumber1: params.phoneNumber1 }),
      ...generateModifiedAttribute(params, req),
    }, { where: { contact_id: contact.contact_id } });
  }

  let additionalPayload = {};

  if (channelId !== channel.AIDO) {
    const patient = await getPatientHospital({ where: { [`$${mySiloamAppointments.TM_PATIENT}.contact_id$`]: contact.contact_id } });
    if (!isEmpty(patient)) setToAppTemp = false;
    additionalPayload = {
      name: contact.name,
      birthDate: contact.birth_date,
      phoneNumber1: !isEmpty(phoneNumber1) ? phoneNumber1 : contact.phone_number_1,
      contactStatusId: contact.contact_status_id,
      setToAppTemp,
    };
  } else {
    additionalPayload = {
      name: !isEmpty(name) ? name : contact.name,
      birthDate: !isEmpty(birthDate) ? birthDate : contact.birth_date,
    };
    await updateContact({
      ...updateContactFormat(params),
      ...generateModifiedAttribute(params),
    }, { where: { contact_id: contact.contact_id } });
  }

  return {
    ...omit(params, ['patientHope']),
    ...additionalPayload,
    contactId: contact.contact_id,
  };
}

export async function validatePatient(params = {}, req) {
  let patientHope;
  let postParams = await validateContact(params, req);
  const {
    hospitalId, hospitalHopeId, name, birthDate, phoneNumber1,
  } = postParams;
  let { patientHopeId } = postParams;
  const conditions = typeof patientHopeId === 'number'
    ? { [`$${mySiloamAppointments.TM_PATIENT}.patient_hope_id$`]: patientHopeId }
    : { contact_id: postParams.contactId };
  const order = [
    ['created_date', 'DESC'],
  ];
  const attributes = [
    'contact_id',
    `${mySiloamAppointments.TM_PATIENT}.patient_id`,
    `${mySiloamAppointments.TM_PATIENT}.patient_hope_id`,
    'contact_status_id',
  ];
  let patientOrg = null;
  const patient = await getContactPatient({ attributes, where: conditions, order });

  if (typeof patientHopeId === 'number') patientOrg = await getPatientOrgHopeOne(patientHopeId, hospitalHopeId);
  else if (!isEmpty(patient)) {
    patientOrg = await getPatientOrgHopeTwo(patient.patient_hope_id, name, birthDate, phoneNumber1);
    patientHopeId = patient.patient_hope_id;
    postParams = { ...postParams, patientHopeId };
  }

  const { patientOrganizationId, mrNo } = result(patientOrg, 'data[0]', {});

  if (isEmpty(patient) && (typeof patientOrganizationId === 'number' || typeof mrNo === 'number')) {
    postParams = { ...postParams, patientOrgId: patientOrganizationId, mrNo };
    await mapContactPatientHope(mapContactPatientFormat(postParams));
    patientHope = await getPatientHope(patientHopeId);
    postParams = { ...postParams, updatePatientHopeOnly: true, patientHope };
    postParams = await validateContact(postParams, req);
  } else if (isEmpty(patient) && typeof patientHopeId === 'number') {
    await mapPatientHope(mapPatientHopeFormat(postParams));
    patientHope = await getPatientHope(patientHopeId);
    postParams = { ...postParams, updatePatientHopeOnly: true, patientHope };
    postParams = await validateContact(postParams, req);
  } else if (!isEmpty(patient)) {
    patientHope = await getPatientHope(patient.patient_hope_id);
    postParams = {
      ...postParams,
      contactId: patient.contact_id,
      patientId: patient.patient_id,
      contactStatusId: patient.contact_status_id,
      patientHopeId: patient.patient_hope_id,
      updatePatientHopeOnly: true,
      patientHope,
    };
    postParams = await validateContact(postParams, req);
    const patientHospital = await findOnePatientHospital({
      attributes: ['patient_id', 'patient_organization_id', 'medical_record_number'],
      where: {
        [Op.and]: [
          { patient_id: patient.patient_id },
          { hospital_id: hospitalId },
        ],
      },
    });
    if (!isEmpty(patientHospital)) {
      if (!isEmpty(result(patientOrg, 'data', null))) {
        postParams = { ...postParams, patientOrgId: patientOrganizationId, mrNo };
        await mapContactPatientHope(mapContactPatientFormat(postParams));
        return postParams;
      }
      return {
        ...postParams,
        patientOrgId: result(patientHospital, 'patient_organization_id', undefined),
        mrNo: result(patientHospital, 'medical_record_number', undefined),
      };
    }
    delete postParams.patientOrgId;
    delete postParams.mrNo;
    await mapPatientHope(mapPatientHopeFormat(postParams));
  }
  return postParams;
}

/* ******************************************************************************************** */

export async function validateAppNo(params = {}) {
  const {
    channelId, appointmentNo, appointmentTemporaryId, reschedule = false,
  } = params;
  const isInternal = getChannelCategory(channelId);
  if (!reschedule) {
    if (isInternal && typeof appointmentNo !== 'number') throw new Error('Appointment no cannot be empty!');
    // 'Appointment no not allowed!'
    else if (!isInternal && typeof appointmentNo === 'number' && typeof appointmentTemporaryId !== 'number') {
      throw new Error(480);
    }
  }
}

export async function validateDoctorHospital(params = {}) {
  const { doctorId, appointmentDate, hospitalId } = params;
  const doctor = await getDoctorInHospital({
    attributes: [
      `${mySiloamSchedules.TM_DOCTOR}.doctor_id`, `${mySiloamSchedules.TM_DOCTOR}.doctor_hope_id`,
      `${mySiloamSchedules.TM_DOCTOR}.name`, 'status_id', 'doctor_type_id', 'quota', 'reservation',
      'walkin', 'effective_date',
    ],
    where: {
      [Op.and]: [
        { doctor_id: doctorId },
        { hospital_id: hospitalId },
        {
          [Op.or]: [
            { status_id: doctorStatus.ACTIVE },
            { status_id: doctorStatus.NOT_SHOW },
          ],
        },
        { effective_date: { [Op.lte]: appointmentDate } },
      ],
    },
    order: [
      ['effective_date', 'DESC'],
    ],
  });
  if (doctor) {
    globalParam = {
      ...globalParam,
      doctorId: doctor.doctor_id,
      doctorHopeId: doctor.doctor_hope_id,
      doctorName: doctor.name,
      doctorTypeId: doctor.doctor_type_id,
      quota: doctor.quota,
      reservation: doctor.reservation,
      walkin: doctor.walkin,
    };
    return globalParam;
  }
  // 'Doctor quota not set yet'
  throw new Error(481);
}

export async function validateDoctorLeave(params = {}) {
  const { doctorId, appointmentDate, hospitalId } = params;
  const leave = await findOneSchedule({
    where: {
      [Op.and]: [
        { doctor_id: doctorId },
        { hospital_id: hospitalId },
        { from_date: { [Op.lte]: appointmentDate } },
        { to_date: { [Op.gte]: appointmentDate } },
        { schedule_status_id: scheduleStatus.LEAVE_ACTIVE },
        { day: DAY_LEAVE },
        { schedule_type_id: { [Op.notIn]: [scheduleType.PRACTICE] } },
      ],
    },
  });
  // 'Cannot create appointment because doctor not available on the date you choosed'
  if (leave) throw new Error(481);
}

export async function validateDoctorNote(params = {}) {
  const {
    doctorId, hospitalId, appointmentDate, channelId,
  } = params;
  const isInternal = getChannelCategory(channelId);

  if (!isInternal) {
    const doctorNotes = await findDoctorNote({
      where: {
        [Op.and]: [
          { doctor_id: doctorId },
          { hospital_id: hospitalId },
          { from_date: { [Op.lte]: appointmentDate } },
          { to_date: { [Op.gte]: appointmentDate } },
          { is_active: true },
        ],
      },
    });
    if (!isEmpty(doctorNotes)) {
      for (let i = 0, { length } = doctorNotes; i < length; i += 1) {
        if (doctorNotes[i].is_impact_schedule) throw new Error(490);
      }
      globalParam = {
        ...globalParam,
        setToAppTemp: true,
      };
      return globalParam;
    }
  } return {};
}

export async function validateSchedule(params = {}) {
  const { appointmentDate, scheduleId, appointmentFromTime } = params;
  const appFromTime = moment(`${appointmentDate} ${appointmentFromTime}`, 'YYYY-MM-DD HH:mm');

  const schedule = await findByPkSchedule(scheduleId);
  if (schedule) {
    const scheduleFromTime = moment(`${appointmentDate} ${schedule.from_time}`);
    const scheduleToTime = moment(`${appointmentDate} ${schedule.to_time}`);

    if (appFromTime >= scheduleFromTime && appFromTime <= scheduleToTime) {
      globalParam = {
        ...globalParam,
        scheduleFromTime: schedule.from_time,
        scheduleToTime: schedule.to_time,
      };
      return globalParam;
    }
    // 'Appointment from time not valid'
    throw new Error(486);
  }
  // 'Schedule not found'
  throw new Error(482);
}

export async function validateScheduleBlock(params = {}) {
  const {
    appointmentDate, scheduleId, appointmentFromTime, isVerify = false,
    reschedule = false, appointmentTemporaryId, channelId,
  } = params;
  let { appointmentNo, appointmentToTime } = params;
  let postParams = { ...params, ...globalParam };

  if (typeof appointmentNo !== 'number' && String(isVerify) === 'false') {
    let apps = await findApp({
      attributes: ['appointment_id', 'appointment_from_time', 'appointment_to_time',
        'appointment_no', 'schedule_id'],
      where: {
        [Op.and]: [
          { schedule_id: scheduleId },
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
          { schedule_id: scheduleId },
          { appointment_date: appointmentDate },
          { appointment_temporary_status: appTempStatus.ACTIVE },
        ],
      },
    });
    apps = apps.concat(appTemp);
    if (globalParam.doctorTypeId === '2' || globalParam.doctorTypeId === '3') {
      const schedules = await findByPkSchedule(scheduleId);
      const doctor = {
        doctor_id: globalParam.doctorId,
        doctor_hope_id: globalParam.doctorHopeId,
        name: globalParam.doctorName,
        doctor_type_id: globalParam.doctorTypeId,
        quota: globalParam.quota,
        reservation: globalParam.reservation,
        walkin: globalParam.walkin,
      };
      const checkBlock = await findBlock({
        attributes: ['from_date', 'to_date', 'from_time', 'to_time',
          'schedule_id', 'is_active'],
        where: {
          [Op.and]: [
            { schedule_id: scheduleId },
            { is_active: true },
            { from_date: { [Op.lte]: appointmentDate } },
            { to_date: { [Op.gte]: appointmentDate } },
          ],
        },
      });
      let timeSlot = generateTimeSlot([schedules], doctor, apps, checkBlock, params);
      timeSlot = timeSlot.filter(slot => String(slot.schedule_from_time) === moment(appointmentFromTime, 'HH:mm').format('HH:mm')
        && slot.is_available === true
        && slot.is_walkin === false
        && slot.is_blocked === false
        && slot.is_full === false);
      const appNo = result(timeSlot, '[0].appointment_no', null);
      if (typeof appNo !== 'number') throw new Error(487);
      appointmentNo = timeSlot[0].appointment_no;
      appointmentToTime = timeSlot[0].schedule_to_time;
    } else {
      apps = apps.sort((a, b) => b.appointment_no - a.appointment_no);
      // assign appointmentNo default to 0 when there is no appointment yet for FCFS
      if (apps.length === 0) appointmentNo = 0;
      else appointmentNo = apps[0].appointment_no + 1;
    }
    globalParam = { ...globalParam, appointmentNo };
    postParams = { ...postParams, appointmentNo };
  } else postParams = { ...postParams, appointmentNo };

  if (!appointmentToTime) {
    const { appFromTime, appToTime } = generateAppTime(postParams);
    globalParam = {
      ...globalParam,
      appointmentFromTime: appFromTime,
      appointmentToTime: appToTime,
    };
    postParams = {
      ...postParams,
      appointmentFromTime: appFromTime,
      appointmentToTime: appToTime,
    };
  } else postParams = { ...postParams, appointmentToTime, appointmentFromTime };

  const appFromTime = moment(`${appointmentDate} ${appointmentFromTime}`, 'YYYY-MM-DD HH:mm').utc();
  const appToTime = moment(`${appointmentDate} ${postParams.appointmentToTime}`, 'YYYY-MM-DD HH:mm').utc();
  const isInternal = getChannelCategory(channelId);
  const validateAppJ4 = moment().utc().add(4, 'hours');

  if ((
    (appFromTime <= validateAppJ4
      && (
        globalParam.doctorTypeId === doctorType.FIX_APPOINTMENT
        || globalParam.doctorTypeId === doctorType.HOURLY_APPOINTMENT
      )
    ) || (appToTime <= validateAppJ4 && globalParam.doctorTypeId === doctorType.FCFS))
    && moment(appointmentDate).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
    && !isInternal
    && !reschedule
    && typeof appointmentTemporaryId !== 'number'
  ) throw new Error(485); // 'Appointment time should at least 4 hours from now'

  const scheduleBlock = await findOneScheduleBlock({
    where: {
      [Op.and]: [
        { schedule_id: scheduleId },
        { from_date: { [Op.lte]: appointmentDate } },
        { to_date: { [Op.gte]: appointmentDate } },
        Sequelize.literal(`(date '${postParams.appointmentDate}' + from_time) <= (date '${postParams.appointmentDate}' + time '${postParams.appointmentFromTime}') `),
        Sequelize.literal(`(date '${postParams.appointmentDate}' + to_time) >= (date '${postParams.appointmentDate}' + time '${postParams.appointmentToTime}') `),
        { is_active: true },
      ],
    },
  });
  // 'Cannot create appointment because the doctor is unavailable at that time'
  if (!isEmpty(scheduleBlock) && channelId !== channel.AIDO) throw new Error(481);

  return postParams;
}

export async function validateDuplicateApp(params = {}) {
  const {
    appointmentDate, contactId, doctorId, appointmentDateBefore, hospitalId,
    channelId, appointmentFromTime,
  } = params;
  if (channelId === channel.AIDO) {
    const isDoubleApp = await findOneAppAido({
      where: {
        [Op.and]: [
          { appointment_date: appointmentDate },
          { appointment_from_time: appointmentFromTime },
          { doctor_id: doctorId },
          { hospital_id: hospitalId },
          { appointment_status_id: appStatus.ACTIVE },
        ],
      },
    });
    if (!isEmpty(isDoubleApp)) throw new Error(483);
    return params;
  }
  if (appointmentDate !== appointmentDateBefore) {
    const conditions = [
      { contact_id: contactId },
      { appointment_date: appointmentDate },
      { appointment_status_id: appStatus.ACTIVE },
      { [`$${mySiloamAppointments.TX_ADMISSION}.admission_id$`]: null },
      { doctor_id: doctorId },
      { hospital_id: hospitalId },
    ];
    const isDoubleApp = await checkDoubleAppointment({
      attributes: ['appointment_id',
        [Sequelize.col(`${mySiloamAppointments.TX_ADMISSION}.admission_id`), 'admission_id'],
      ],
      where: { [Op.and]: conditions },
    });
    // 'This patient has an active appointment at this time.
    // Cannot create more than 1 appointment at the same time or on the same doctor in one day.'
    if (!isEmpty(isDoubleApp)) throw new Error(483);
  }
  return params;
}

export async function validateDuplicateAppTemp(params = {}) {
  const {
    doctorId, appointmentDate, contactId, name, birthDate, phoneNumber1, isVerify = false,
    appointmentDateBefore = String(isVerify) === 'true' ? appointmentDate : null, hospitalId,
  } = params;
  if (appointmentDate !== appointmentDateBefore) {
    const conditions = [{
      [Op.and]: [
        { channel_id: { [Op.in]: [channel.WEBSITE, channel.CHATBOT] } },
        Sequelize.where(Sequelize.fn('upper', Sequelize.col('contact_name')), String(name).toUpperCase()),
        { date_of_birth: birthDate },
        { phone_number: phoneNumber1 },
        { doctor_id: doctorId },
        { appointment_date: appointmentDate },
        { appointment_temporary_status: appTempStatus.ACTIVE },
        { hospital_id: hospitalId },
      ],
    }, {
      [Op.and]: [
        { channel_id: channel.MOBILE },
        { contact_id: contactId },
        { doctor_id: doctorId },
        { appointment_date: appointmentDate },
        { appointment_temporary_status: appTempStatus.ACTIVE },
        { hospital_id: hospitalId },
      ],
    }];
    const checkDoubleAppTemp = await findOneAppTemp({
      attributes: ['appointment_temporary_id'],
      where: { [Op.or]: conditions },
    });
    // 'This patient has an active appointment at this time. '
    // 'Cannot create more than 1 appointment at the same time or on the same doctor in one day.'
    if (checkDoubleAppTemp) throw new Error(483);
  }
}

export async function validateAvailabilityAppNo(params = {}) {
  const {
    appointmentNo, appointmentDate, scheduleId, doctorTypeId, appointmentTemporaryId,
  } = params;
  const checkAppNo = await findOneApp({
    attributes: ['appointment_id'],
    where: {
      [Op.and]: [
        { schedule_id: scheduleId },
        { appointment_date: appointmentDate },
        { appointment_no: appointmentNo || globalParam.appointmentNo },
        { appointment_status_id: appStatus.ACTIVE },
      ],
    },
  });
  const checkAppTempNo = await findOneAppTemp({
    attributes: ['appointment_temporary_id'],
    where: {
      [Op.and]: [
        { schedule_id: scheduleId },
        { appointment_date: appointmentDate },
        { appointment_no: appointmentNo || globalParam.appointmentNo },
        { appointment_temporary_status: appTempStatus.ACTIVE },
      ],
    },
  });
  // 'Appointment Number not available'
  if (typeof appointmentTemporaryId !== 'number' && ((checkAppNo
  || checkAppTempNo) && doctorTypeId !== doctorType.FCFS)) throw new Error(487);
}

export async function validateCheckInApp(params = {}) {
  const { reschedule = false, appointmentId } = params;
  if (reschedule) {
    const checkCheckInApp = await checkDoubleAppointment({
      attributes: ['appointment_id'],
      where: {
        [Op.and]: [
          { appointment_id: appointmentId },
          { [`$${mySiloamAppointments.TX_ADMISSION}.admission_id$`]: { [Op.not]: null } },
        ],
      },
    });
    // 'Cannot reschedule check-in app'
    if (checkCheckInApp) throw new Error(489);
  }
}

export async function validatePatientData(params = {}) {
  const {
    name, birthDate, sexId, nationalityId, nationalIdNo, currentAddress, phoneNumber,
    emergencyContactName, emergencyContactMobileNo, cityId, districtId, subDistrictId,
    hospitalHopeId, nationalIdTypeId,
  } = params;
  const newPatientPayload = typeof hospitalHopeId === 'number'
    && !isEmpty(name)
    && typeof sexId === 'number'
    && !isEmpty(birthDate)
    && !isEmpty(phoneNumber)
    && !isEmpty(currentAddress)
    && typeof cityId === 'number'
    && typeof districtId === 'number'
    && typeof subDistrictId === 'number'
    && typeof nationalityId === 'number'
    && typeof nationalIdTypeId === 'number'
    && !isEmpty(nationalIdNo)
    && !isEmpty(emergencyContactName)
    && !isEmpty(emergencyContactMobileNo);
  if (!newPatientPayload) throw new Error(492);
  const city = await findOneCity(cityId);
  if (isEmpty(city)) throw new Error(492);
  const district = await findOneDistrict({
    where: {
      [Op.and]: [
        { district_id: districtId },
        { city_id: cityId },
        { is_active: true },
      ],
    },
  });
  if (isEmpty(district)) throw new Error(492);
  const subDistrict = await findOneSubDistrict({
    where: {
      [Op.and]: [
        { sub_district_id: subDistrictId },
        { district_id: districtId },
        { is_active: true },
      ],
    },
  });
  if (isEmpty(subDistrict)) throw new Error(492);
  return params;
}

export async function validateAppointment(params = {}) {
  let postParams = params;
  return Promise.all([
    await validateAppNo(params),
    await validateDoctorHospital(params),
    await validateDoctorLeave(params),
    await validateDoctorNote(params),
    await validateSchedule(params),
    await validateScheduleBlock(params),
    await validateDuplicateApp(params),
    await validateDuplicateAppTemp(params),
    await validateAvailabilityAppNo(params),
    await validateCheckInApp(params),
  ]).then((res) => {
    res.forEach((respon) => { postParams = { ...postParams, ...respon }; });
    return postParams;
  }).catch((err) => {
    throw err;
  });
}
