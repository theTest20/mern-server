const mongoose = require('mongoose');
const Post = require('./postModel');

const commentsSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, 'Comment can not be empty!'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'Post',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentsSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Comments = mongoose.model('Comments', commentsSchema);
module.exports = Comments;
