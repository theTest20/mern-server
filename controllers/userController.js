const User = require('./../models/userModel');
const asyncHandler = require('express-async-handler');
const CustomizeError = require('../utils/customizeError');
const multer = require('multer');
const sharp = require('sharp');

 const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new CustomizeError('Not an image! Please upload only images.', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

 exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);
  res.status(200).json({
    status: 'success',
    data: newUser,
  });
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  // Get all users from MongoDB
  const users = await User.find().select('-password');
  // If no users
  if (!users?.length) {
    return next(new CustomizeError('No user found', 404));
  }
  //else, print users
  res.status(200).json({
    status: 'success',
    data: users,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  //const user = await User.findById(req.params.id).populate('posts');

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomizeError('User does not exist', 404));
  }
  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new CustomizeError('User does not exist', 404));
  }
  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new CustomizeError('User does not exist', 404));
  }
  res.status(200).json({
    status: 'User deleted!',
  });
});

////ordinary user 
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getMe = async (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = asyncHandler(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use Update My Password option.',
        400
      )
    );
  }
  const filterBody = filterObj(req.body, 'firstName', 'lastName', 'email');
  if (req.file) filterBody.photo = req.file.filename;
  //console.log(filterBody)
  const updatedInfo = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: updatedInfo,
  });
});

exports.deleteMe = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);
  res.status(204).json({
    status: 'success',
  });
});
