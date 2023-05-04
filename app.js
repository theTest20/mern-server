const path = require('path');
const express = require('express');
const morgan = require('morgan');
//const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
//const mongoSanitize = require('express-mongo-sanitize');

const cors = require('cors');
//const compression = require('compression');
const CustomizeError = require('./utils/customizeError');
const globalErrorHandler = require('./controllers/errorController');
const postRouter = require('./routes/postRoutes');
const userRouter = require('./routes/userRoutes');
//const commentRouter = require('./routes/commentRoutes');

const app = express();

//Static file
app.use(express.static(path.join(__dirname, 'public')));

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again after an hour!',
});
app.use('/api', limiter);

//Body-parser, reading data from body into req.body
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));



//Data Sanitization against NoSQL query Injection
//app.use(mongoSanitize());

//Data Sanitization against XSS
////app.use(xss());

app.use(cors());
app.use('/api/posts', postRouter);
app.use('/api/users', userRouter);
//app.use('/api/v1/comments', commentRouter);

app.all('*', (req, res, next) => {
  next(
    new CustomizeError(`Can't find ${req.originalUrl} on this server!`, 404)
  );
});

app.use(globalErrorHandler);

//4. Start Server
module.exports = app;
