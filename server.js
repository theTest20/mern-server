const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' }); //reading of variables to the node process

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  .then(() => console.log('DB was successfully connected!'));

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`App running at port ${process.env.PORT || 8000}...`);
});

//global handling of rejected promises/unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection! 🧨 Shutting down...');
  console.log(err.name, err.message);
  //give server times to finish all request and then kill it with process.exit()
  server.close(() => {
    process.exit(1); //crashing app is optional for unhandledRejection
  });
});
