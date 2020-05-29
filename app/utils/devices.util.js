import rfs from 'rotating-file-stream';
import path from 'path';

export function accessLogStream() {
  return rfs('access.log', {
    size: '10M', // rotate every 10 MegaBytes written
    interval: '1d', // rotate daily
    compress: 'gzip',
    path: path.join(__dirname, 'loggerHandler'),
  });
}

export function noop() {}
