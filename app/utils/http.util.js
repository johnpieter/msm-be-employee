import axios from 'axios';
import ENDPOINTS from '../configs/api.config';

const baseConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
  withCredentials: false,
};

async function GET(baseURL, endpoint, params = '', options = {}) {
  const config = {
    baseURL,
    ...baseConfig,
    ...options,
    method: 'get',
    url: ENDPOINTS[endpoint] + params,
  };
  return axios(config);
}

function POST(baseURL, endpoint, data = {}, params = '', options = {}) {
  const config = {
    baseURL,
    ...baseConfig,
    ...options,
    method: 'post',
    url: ENDPOINTS[endpoint] + params,
    data: JSON.stringify(data),
  };
  return axios(config);
}

function PUT(baseURL, endpoint, data = {}, params = '', options = {}) {
  const config = {
    baseURL,
    ...baseConfig,
    ...options,
    method: 'put',
    url: ENDPOINTS[endpoint] + params,
    data: JSON.stringify(data),
  };
  return axios(config);
}

function DELETE(baseURL, endpoint, data = {}, params = '', options = {}) {
  const config = {
    baseURL,
    ...baseConfig,
    ...options,
    method: 'delete',
    url: ENDPOINTS[endpoint] + params,
    data: JSON.stringify(data),
  };
  return axios(config);
}

export default {
  get GET() {
    return GET;
  },
  get POST() {
    return POST;
  },
  get PUT() {
    return PUT;
  },
  get DELETE() {
    return DELETE;
  },
};
