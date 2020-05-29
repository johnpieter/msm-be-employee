import 'babel-polyfill';
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import compression from 'compression';
import cors from 'cors';
import indexRouter from './routes';
import config from './configs/env.config';
import { accessLogStream } from './utils/devices.util';

const app = express();
const env = process.env.NODE_ENV;

app.use(cors());

if (env === 'prodExt') app.use(jwt({ secret: config.app.jwtSecret }).unless({ path: config.app.publicUrl }));

function shouldCompress(req, res) {
  return compression.filter(req, res);
}

app.use(compression({ filter: shouldCompress }));

app.use(logger('dev'));
app.use(logger('combined', { stream: accessLogStream() })); // creating access to file
app.use(bodyParser.json({ limit: '50mb', extended: false }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'assets')));

app.use('/api/v2', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)));

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use((req, res) => {
  res.header('Access-Control-Allow-Origin', `${config.nginx.host}:${config.nginx.port}`);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Secret, token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Content-Type', 'application/json');
});

module.exports = app;
