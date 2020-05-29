import http from '../../utils/http.util';
import { slackFormat } from '../../utils/payload.util';
import config from '../../configs/env.config';

export async function postError(payload) {
  return http.POST(config.slack.url,
    'SLACK_INTEGRATION',
    slackFormat(payload),
    `/${config.slack.idOne}/${config.slack.idTwo}/${config.slack.accessToken}`)
    .catch(() => {});
}

export function noop() {}
