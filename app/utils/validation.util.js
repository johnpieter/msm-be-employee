import moment from 'moment';

export function validateRangeTime(from, to, date) {
  const range = moment().range(from, to);
  const validate = range.within(date);
  return validate;
}

export function noop() {}
