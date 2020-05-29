import { result, isEmpty } from 'lodash';
import Sequelize from 'sequelize';
import { generateCreatedAttribute, generateModifiedAttribute } from '../../utils/helpers.util';
import { findOne as findOnePatient } from '../../queries/patients/tmPatient.query';
import { save as saveContactQuery, update as updateContact, findOne as findOneContact } from '../../queries/contacts/tmContact.query';
import { findOne as findOneHospital, findByPk as findByPkHospital } from '../../queries/hospitals/tmHospital.query';
import {
  getPatientOrgHopeOne, getPatientOrgHopeTwo, getPatientHope, searchPatientToHope,
} from '../../services/HIS/patients.his';
import {
  addContactFormat, mapContactPatientFormat, mapPatientHopeFormat, checkCurrentAidoAppFormat,
} from '../../utils/payload.util';
import { mapContactPatientHope, mapPatientHope } from '../../services/mysiloam/patient.mysiloam';
import {
  channel, bugsLevel, protocol, slackCode,
} from '../../variables/common.variable';
import { patientStatus } from '../../variables/patient.variable';
import { postError } from '../../services/common/slack.common';
import config from '../../configs/env.config';
import { contactStatus } from '../../variables/contact.variable';
import { checkCurrentAidoApp as checkCurrentAidoAppService } from '../../services/mysiloam/appointment.mysiloam';

const { Op } = Sequelize;

async function mappingContactPatientHope(params = {}, req) {
  let { contactId = '' } = params;
  const { patientOrgId, patientHopeId } = params;
  const patient = await findOnePatient({
    attributes: ['patient_id', 'contact_id'],
    where: { patient_hope_id: patientHopeId },
  });
  if (!isEmpty(patient)) {
    contactId = patient.contact_id;

    // Then access Front Office service to create patient and patient hospital
    if (patientOrgId) {
      await mapContactPatientHope(mapContactPatientFormat({ ...params, contactId }));
    } else await mapPatientHope(mapPatientHopeFormat({ ...params, contactId }));
  } else if (!isEmpty(contactId)) { // If contactId found, use it
    // Check if contact is mapped or not
    const contact = await findOnePatient({
      attributes: ['patient_hope_id', 'contact_id'],
      where: { contact_id: contactId },
    });
    if (isEmpty(contact)) {
      // Then access Front Office service to create patient and patient hospital
      if (patientOrgId) {
        await mapContactPatientHope(mapContactPatientFormat({ ...params, contactId }));
      } else await mapPatientHope(mapPatientHopeFormat({ ...params, contactId }));
    }
  } else {
    // If contactId empty, create new contactId
    const contact = await saveContactQuery({
      ...addContactFormat({
        ...params,
        channelId: channel.CALL_CENTER,
      }),
      ...generateCreatedAttribute(params, req),
      ...generateModifiedAttribute(params, req),
    });
    contactId = contact.contact_id;

    // Then access Front Office service to create patient and patient hospital
    if (patientOrgId) {
      await mapContactPatientHope(mapContactPatientFormat({ ...params, contactId }));
    } else await mapPatientHope(mapPatientHopeFormat({ ...params, contactId }));
  }
  return contactId;
}

export async function verifyPatient(req, res) {
  try {
    const { hospitalId, channelId } = req.body;
    let {
      patientHopeId, contactId: newContactId, name, birthDate, phoneNumber1,
      patientOrgId,
    } = req.body;
    const contact = await findOneContact({
      where: {
        [Op.and]: [
          { contact_id: newContactId },
          { contact_status_id: { [Op.not]: contactStatus.INACTIVE } },
        ],
      },
    });
    if (isEmpty(contact)) throw new Error('Contact not found');
    const hospital = await findOneHospital({
      attributes: ['hospital_hope_id'],
      where: { hospital_id: hospitalId },
    });
    const hospitalHopeId = hospital.hospital_hope_id;
    if (patientHopeId) {
      const patientOrg = await getPatientOrgHopeOne(patientHopeId, hospitalHopeId);
      patientOrgId = result(patientOrg, 'data[0].patientOrganizationId', null);
      if (!isEmpty(newContactId)) {
        // 1. Mapping patientHopeId to MySiloam with contactId
        newContactId = await mappingContactPatientHope({ ...req.body, patientOrgId }, req);
      } else {
        // 2. Mapping patientHopeId to MySiloam without contactId
        const patientHope = await getPatientHope(patientHopeId);
        name = result(patientHope, 'data.name', '');
        birthDate = result(patientHope, 'data.birthDate', '');
        phoneNumber1 = result(patientHope, 'data.homePhoneNo', null)
          || result(patientHope, 'data.officePhoneNo', null)
          || result(patientHope, 'data.mobileNo1', null)
          || result(patientHope, 'data.mobileNo2', null);
        newContactId = await mappingContactPatientHope({
          ...req.body, patientOrgId, name, birthDate, phoneNumber1,
        }, req);
      }
    } else if (!isEmpty(name) && !isEmpty(birthDate) && !isEmpty(phoneNumber1)) {
      // 3. Mapping patientHopeId to MySiloam with name, birthDate, phoneNumber1
      const patientHope = await getPatientOrgHopeTwo(hospitalHopeId, name, birthDate, phoneNumber1);
      if (!isEmpty(patientHope) && Number(patientHope.code) === 200 && result(patientHope, 'data.length', 0) === 1) {
        patientHopeId = result(patientHope, 'data[0].patientId', null);
        const { patientOrganizationId, patientOrganizationMrNo } = result(patientHope, 'data[0]', {});
        if (patientHopeId) {
          newContactId = await mappingContactPatientHope({
            ...req.body,
            patientHopeId,
            patientOrgId: patientOrganizationId,
            patientOrganizationMrNo,
          }, req);
        }
      } else if (result(patientHope, 'data.length', 0) > 1) throw new Error('Cannot mapping patient data because multiple data found');
      else throw new Error('Patient not found');
    } else throw new Error('Invalid input');
    const updatedPatient = await updateContact({
      contact_status_id: contactStatus.PATIENT_VERIFICATION,
    }, { where: { contact_id: newContactId } });
    if (isEmpty(updatedPatient[1][0])) throw new Error('Update patient failed');
    if (channelId === channel.AIDO) {
      await checkCurrentAidoAppService(checkCurrentAidoAppFormat({
        ...req.body, newContactId, patientOrgId,
      }));
    }
    res.status(200).json({
      status: 'OK',
      data: { contact_id: newContactId },
      message: 'Verify Patient Successfully',
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
        name: 'Verify Patient',
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

export async function searchPatientHope(req, res) {
  try {
    const {
      patientName, birthDate, mrLocalNo, hospitalId, exactMatch = false,
    } = req.query;
    const orgId = await findByPkHospital(hospitalId, { attributes: ['hospital_hope_id'] });
    let patients = await searchPatientToHope(patientName,
      birthDate, mrLocalNo, orgId.hospital_hope_id, { exactMatch });
    patients = await patients.map(async patient => (
      String(patient.patientStatusId) === patientStatus.ACTIVE
      && String(patient.medicalRecordStatusId) === patientStatus.ACTIVE
        ? {
          ...patient,
          mrNo: patient.mrNo,
          mrNoUnit: orgId.hospital_hope_id === patient.organizationId
            ? patient.mrNoUnit : undefined,
        } : undefined));

    Promise.all(patients)
      .then(async (patient) => {
        const response = await patient.filter(pat => !isEmpty(pat));
        res.status(200).json({
          status: 'OK',
          data: response,
          message: 'Search Patient Hope Successfully',
        });
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
        name: 'Search Patient Hope',
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
