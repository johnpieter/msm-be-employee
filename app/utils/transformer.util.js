import { ceil, snakeCase, camelCase } from 'lodash';

export function pagingFormat(total, limit, offset) {
  const totalPage = ceil(total / limit);
  const currentPage = Math.round((offset / limit) + 1);
  return { totalPage, currentPage, total };
}

export function updateFormat(payload = {}) {
  let data = {};
  Object.keys(payload)
    .forEach((key) => {
      data = { ...data, [snakeCase(key)]: payload[key] };
      return data;
    });
  return data;
}

export function setCamelCase(payload = {}) {
  let data = {};
  Object.keys(payload)
    .forEach((key) => {
      data = { ...data, [camelCase(key)]: payload[key] };
      return data;
    });
  return data;
}
