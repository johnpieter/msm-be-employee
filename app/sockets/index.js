import socket from 'socket.io-client';
import Security from 'msm-kadapat';
import config from '../configs/env.config';
import { protocol, API_PATH } from '../variables/common.variable';

export const globalChannel = socket(`http://${config.socket.host}:${config.socket.port}`, {
  query: `data=${
    Security.encrypt({ secretKey: config.socket.secretKey }, config.socket.jwtKey)
  }&url=${protocol.HTTP}${config.app.host}:${config.app.port}${API_PATH}`,
});

export const doctorChannel = socket(`http://${config.socket.host}:${config.socket.port}/doctors`, {
  query: `data=${
    Security.encrypt({ secretKey: config.socket.secretKey }, config.socket.jwtKey)
  }&url=${protocol.HTTP}${config.app.host}:${config.app.port}${API_PATH}`,
});

export const appointmentChannel = socket(`http://${config.socket.host}:${config.socket.port}/appointments`, {
  query: `data=${
    Security.encrypt({ secretKey: config.socket.secretKey }, config.socket.jwtKey)
  }&url=${protocol.HTTP}${config.app.host}:${config.app.port}${API_PATH}`,
});

export const queueChannel = socket(`http://${config.socket.host}:${config.socket.port}/queues`, {
  query: `data=${
    Security.encrypt({ secretKey: config.socket.secretKey }, config.socket.jwtKey)
  }&url=${protocol.HTTP}${config.app.host}:${config.app.port}${API_PATH}`,
});
