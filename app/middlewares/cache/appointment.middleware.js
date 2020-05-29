import { isEmpty } from 'lodash';
import client from '../../configs/redish/index';
import { mySiloamTemporaries } from '../../variables/tableName.variable';
import { postError } from '../../services/common/slack.common';
import { bugsLevel, protocol } from '../../variables/common.variable';
import config from '../../configs/env.config';

export async function getReservedSlot(req, res) {
  try {
    const {
      userId, scheduleId, appointmentDate, appointmentNo,
    } = req.query;
    const key = isEmpty(userId)
      ? `${mySiloamTemporaries.TX_APPOINTMENT_RESERVED}/${scheduleId}/${appointmentDate}/${appointmentNo}*`
      : `${mySiloamTemporaries.TX_APPOINTMENT_RESERVED}/${scheduleId}/${appointmentDate}/${appointmentNo}/${userId}`;
    client.keys(key, (err, result) => {
      if (err) throw err;
      else {
        const resultData = isEmpty(result) ? { key: null } : { key: result[0] };
        if (result != null) {
          res.status(200).json({
            status: 'OK',
            data: resultData,
            message: 'Get reserved slot successfully',
          });
        } else throw new Error('Failed to get reserved slot');
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      data: null,
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

export async function setReservedSlot(req, res) {
  try {
    client.setex(`${mySiloamTemporaries.TX_APPOINTMENT_RESERVED}/${req.body.scheduleId}/${req.body.appointmentDate}/${req.body.appointmentNo}/${req.body.userId}`, config.redis.reservedSlotDuration, '1');
    res.status(200).json({
      status: 'OK',
      data: req.body,
      message: 'Slot reserved',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      data: null,
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
