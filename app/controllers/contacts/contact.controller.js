import { isEmpty } from 'lodash';
import { generateCreatedAttribute, generateModifiedAttribute } from '../../utils/helpers.util';
import {
  checkIfContactExist, save as addContactQuery, update as updateContactQuery,
  findByPk as findByPkContact,
} from '../../queries/contacts/tmContact.query';
import { addContactFormat, contactFormat } from '../../utils/payload.util';
import { postError } from '../../services/common/slack.common';
import { bugsLevel, protocol, slackCode } from '../../variables/common.variable';
import config from '../../configs/env.config';

export async function getContactById(req, res) {
  try {
    const { contactId } = req.params;
    const response = await findByPkContact(contactId);
    res.status(200).json({
      data: response,
      status: 'OK',
      message: 'Get Contact By ID Successfully',
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
        name: 'Get Contact By ID',
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

export async function addContact(req, res) {
  try {
    const { name, birthDate, phoneNumber1 } = req.body;
    const checkContact = await checkIfContactExist(name,
      birthDate, phoneNumber1);
    if (isEmpty(checkContact)) {
      const response = await addContactQuery({
        ...addContactFormat(req.body),
        ...generateCreatedAttribute(req.body, req),
        ...generateModifiedAttribute(req.body, req),
      });
      res.status(200).json({
        data: response,
        status: 'OK',
        message: 'Add contact successfully',
      });
    } else throw new Error('Contact already exist');
  } catch (error) {
    res.status(500).json({
      data: null,
      status: 'ERROR',
      message: error.message,
    });
    const code = error.message.substring(0, 6);
    await postError({
      error: {
        name: 'Create Contact Only',
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

export async function updateContact(req, res) {
  try {
    const { data } = req.body;
    const { contactId } = req.params;
    const updatedRes = await updateContactQuery({
      ...contactFormat(data),
      ...generateModifiedAttribute(req.body, req),
    }, { where: { contact_id: contactId } });
    if (Number(updatedRes[0]) < 1) throw new Error('Update Contact Failed');
    res.status(200).json({
      data: updatedRes[1][0],
      status: 'OK',
      message: 'Update contact successfully',
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
        name: 'Update Contact Only',
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
