const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const CustomizeError = require('./../utils/customizeError');
const Email = require('../utils/email');
const asyncHandler = require('express-async-handler');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  //Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const createVerifyToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_VERIFY_SECRET, {
    expiresIn: process.env.JWT_VERIFY_EXPIRES_IN,
  });
};

exports.signup = asyncHandler(async (req, res, next) => {
  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = createVerifyToken(user._id);
  const url = `${req.protocol}://${req.get('host')}/verify/${token}`;
  new Email(user, url).sendWelcomeVerify();
  createSendToken(user, 200, res);
});

exports.activateAccount = asyncHandler(async (req, res, next) => {
  const { activateToken } = req.body;
  const decoded_JWT = await promisify(jwt.verify)(
    activateToken,
    process.env.JWT_VERIFY_SECRET
  );
  const user = await User.findById(decoded_JWT.id);
  if (user) user.verified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    data: decoded_JWT,
    msg: 'Account has been verified, please go at login page!',
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  //Check if email & password Exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //Check if the user Exist & if password is Correct
  const user = await User.findOne({ email }).select('+password'); //now we need explicty to select password

  if (!user) {
    return next(new CustomizeError('Incorrect email or password', 404));
  }
  if (!(await user.correctPassword(password, user.password))) {
    return next(new CustomizeError('Incorrect email or password', 404));
  }

  const token = signToken(user._id);
  //--> verification on Front side not yet available
  // if (!user.verified) {
  //   return next(
  //     new CustomizeError(
  //       'Your account is not verified, please check your email for verification link!',
  //       401
  //     )
  //   );
  // }

  //If everyting OK, send Token
  //Remove password from output
  user.password = undefined;
  res.status(200).json({
    token,
    data: {
      user,
    },
  });
});

exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new CustomizeError(
        'You are not logged in! Please log in to get access.',
        401
      )
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new CustomizeError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new CustomizeError(
        'User recently changed password! Please log in again.',
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomizeError(
          'You do not have permission to perform this action',
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  //1. Get User based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new CustomizeError('There is no user with that email address.', 404)
    );
  }
  //2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3.Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: `Token sent to email!`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new CustomizeError(
        `There was an error sending the email. Please, try again later!`,
        500
      )
    );
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  //1. Get user based on Token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new CustomizeError('Token has expired!', 400));
  }
  //2. If token has not expired/there is user, Set New Password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3. Update the passwordChangedAt property for the user
  // updated on userModel line 66/pre save middleware
  //4. Log the user in, send JTW
  createSendToken(user, 200, res);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  //1. Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  //2. Check if POSTED password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new CustomizeError('Your current password is wrong!', 401));
  }
  //3. Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User.findByIdandUpdate() won't work as intended.

  //4.Log in user, send TOKEN
  createSendToken(user, 200, res);
});
