//const req = require('express/lib/request');
const CustomizeError = require('../utils/customizeError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new CustomizeError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate field '${value}'. Please use another value!`;
  return new CustomizeError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')} `;
  return new CustomizeError(message, 400);
};

const handleJWTError = () =>
  new CustomizeError('Invalid token, please log in again!', 401);

const handleJWTExpiredError = () =>
  new CustomizeError('Your token has expired! Please login again!', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // A) APIs
  if (req.originalUrl.startsWith('/api')) {
    //Operatinal, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        //status: err.status,
        message: err.message,
      });
      //Programming or other unknown error: no details for client
    } else {
      //1-log error
      console.error('ERRROR 🎆', err);
      //2-Send generic message
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = Object.assign(err);
  //console.log(error.name);
  if (error.name === 'CastError') {
    error = handleCastErrorDB(error);
  }
  if (error.code === 11000) {
    error = handleDuplicateFieldsDB(error);
  }
  if (error.name === 'ValidationError') {
    error = handleValidationErrorDB(error);
  }
  if (error.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  if (error.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  sendErrorProd(error, req, res);
};
