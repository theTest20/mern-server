const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
//const Post = require('./../../models/postModel');
const User = require('./../../models/userModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB was successfully connected!'));

//READING JSON FILE
//const posts = JSON.parse(fs.readFileSync(`${__dirname}/posts.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    // await Post.create(posts);
    await User.create(users, { validateBeforeSave: false });

    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//DELETE  ALL DATAs FROM COLLECTION
const deleteData = async () => {
  try {
    // await Post.deleteMany();
    await User.deleteMany();

    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
