const Comment = require('../models/commentModel');
const asyncHandler = require('express-async-handler');
const CustomizeError = require('../utils/customizeError');

exports.setStoryUserId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.postComment = asyncHandler(async (req, res, next) => {
  // if (!req.body.post) req.body.post = req.params.postId;
  // if (!req.body.user) req.body.user = req.user.userId;
  const comment = await Comment.create(req.body);
  res.status(200).json({
    status: 'success',
    data: comment,
  });
});

exports.getAllComments = asyncHandler(async (req, res, next) => {
  let filter = {};
  if (req.params.postId) filter = { post: req.params.postId };
  const comments = await Comment.find(filter);
  if (!comments) {
    return next(new CustomizeError('There are no comments', 404));
  }
  res.status(200).json({
    status: 'success',
    data: comments,
  });
});

exports.getComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new CustomizeError('No such comment exist!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: comment,
  });
});

exports.updateComment = asyncHandler(async (req, res, next) => {
  const updateComment = await Comment.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  ).clone();
  if (!updateComment) {
    return next(new CustomizeError('Post not found!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: updateComment,
  });
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  await Comment.findByIdAndDelete(req.params.id).clone();
  res.status(200).json({
    status: 'success',
    data: null,
  });
});
