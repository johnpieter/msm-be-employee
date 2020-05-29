import chai from 'chai';
import chaiHttp from 'chai-http';
import server from './server.util.test';
import ENDPOINTS from '../../configs/api.config';
import { API_PATH } from '../../variables/common.variable';

chai.should();
chai.use(chaiHttp);

export function GET(endpoint, token = '', params = '', query = '') {
  return chai
    .request(server)
    .get(API_PATH + ENDPOINTS[endpoint] + params + query)
    .set('Authorization', `Bearer ${token}`);
}

export function POST(endpoint, token = '', payload, params = '', query = '') {
  return chai
    .request(server)
    .post(API_PATH + ENDPOINTS[endpoint] + params + query)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

export function PUT(endpoint, token = '', payload, params = '', query = '') {
  return chai
    .request(server)
    .put(API_PATH + ENDPOINTS[endpoint] + params + query)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

export function DELETE(endpoint, token = '', payload, params = '', query = '') {
  return chai
    .request(server)
    .delete(API_PATH + ENDPOINTS[endpoint] + params + query)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}
