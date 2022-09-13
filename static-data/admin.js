const User = require('../models/userModel');

const admin = {
  name: 'Admin',
  email: 'admin@mail.com',
  role: 'admin',
};

User.create(admin, (err) => {
  if (err) {
    console.log(err);
  }
});
