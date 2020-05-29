import moment from 'moment';

export function generateCreatedAttribute(payload = {}, req) {
  let ipAddr = req.headers['x-forwarded-for'];
  if (ipAddr) {
    const list = ipAddr.split(',');
    ipAddr = list[list.length - 1];
  } else ipAddr = req.connection.remoteAddress;
  const time = moment().toISOString();
  return {
    created_date: payload.createdDate || time,
    created_by: payload.userId || '',
    created_name: payload.userName || '',
    created_from: payload.source || ipAddr,
  };
}

export function generateModifiedAttribute(payload = {}, req) {
  let ipAddr = req.headers['x-forwarded-for'];
  if (ipAddr) {
    const list = ipAddr.split(',');
    ipAddr = list[list.length - 1];
  } else ipAddr = req.connection.remoteAddress;
  const time = moment().toISOString();
  return {
    modified_date: payload.modifiedDate || time,
    modified_by: payload.userId || '',
    modified_name: payload.userName || '',
    modified_from: payload.source || ipAddr,
  };
}
