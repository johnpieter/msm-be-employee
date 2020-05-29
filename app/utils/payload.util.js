import moment from 'moment';
import { snakeCase, isEmpty } from 'lodash';
import { images, colors } from '../variables/common.variable';

export function slackFormat(payload = {}) {
  const { req } = payload;
  let headers = {};
  if (!isEmpty(req)) {
    let ipAddr = req.headers['x-forwarded-for'];
    if (ipAddr) {
      const list = ipAddr.split(',');
      ipAddr = list[list.length - 1];
    } else ipAddr = req.connection.remoteAddress;
    headers = { ...headers, ...req.headers, ipAddr };
  }
  return {
    icon_url: images[payload.error.priority],
    username: 'Slack Bugs Notification',
    attachments: [{
      color: colors[payload.error.priority],
      pretext: `Mysiloam 2.0 Template:\n${payload.method} <${payload.url}>`,
      fields: [{
        title: 'Priority',
        value: `\`\`\`${payload.error.priority.toUpperCase()}\`\`\``,
        short: false,
      }, {
        title: 'API Name',
        value: `\`\`\`${payload.error.name}\`\`\``,
        short: false,
      }, {
        title: 'Error Message',
        value: `\`\`\`${JSON.stringify(payload.error.message)}\`\`\``,
        short: false,
      }, {
        title: 'Request Body',
        value: `\`\`\`${JSON.stringify(payload.data)}\`\`\``,
        short: false,
      }, {
        title: 'Request Headers',
        value: `\`\`\`${JSON.stringify(headers)}\`\`\``,
        short: false,
      }],
      thumb_url: 'https://platform.slack-edge.com/img/default_application_icon.png',
      footer: 'Atria Dika Puspita',
      footer_icon: 'https://avatars3.githubusercontent.com/u/20973157?s=400&u=532e9e0335d920cfc0c1d823f3c771a87744873d&v=4',
      ts: moment().unix(),
    }],
  };
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
