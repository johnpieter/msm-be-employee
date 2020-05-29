import { isArray } from 'lodash';
import jwt from 'express-jwt';
import config from '../../../configs/env.config';

export function checkCommonResponse(res) {
  res.should.have.status(200);
  res.body.should.be.a('object');
  res.body.should.have.property('data');
  res.body.should.have.property('status').eql('OK');
  res.body.should.have.property('message');
  res.body.status.should.be.a('string');
  res.body.message.should.be.a('string');
  if (isArray(res.body.data)) res.body.data.should.be.a('array');
  else if (typeof res.body.data === 'object') res.body.data.should.be.a('object');
}

export function badRequestResponse(res) {
  res.should.have.status(400);
  res.body.should.have.property('data').eql(null);
  res.body.should.have.property('status').eql('ERROR');
  res.body.should.have.property('message');
  res.body.status.should.be.a('string');
  res.body.message.should.be.a('string');
}

export function internalServerErrorResponse(res) {
  res.should.have.status(500);
  res.body.should.have.property('data').eql(null);
  res.body.should.have.property('status').eql('ERROR');
  res.body.should.have.property('message');
  res.body.status.should.be.a('string');
  res.body.message.should.be.a('string');
}

export async function initialTestSetup() {
  try {
    const token = jwt.sign({}, config.app.jwtSecret, { expiresIn: '24h' });
    return token;
  } catch (err) {
    throw err;
  }
}
