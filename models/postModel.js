const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please give a title for your post'],
      default: 'post title',
    },
    content: {
      type: String,
      required: [true, 'Please fill the content of your post!'],
      trim: true,
    },
    imageCover: {
      type: String,
    },
    slug: String,
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      //required: [true, 'Story must belong to a user'],
    },
   
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


postSchema.virtual('userImage', {
  ref: 'User',
  localField: 'publisher',
  foreignField: '_id',
});

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'publisher',
    select: 'firstName',
  });
  next();
});


const Post = mongoose.model('Post', postSchema);
module.exports = Post;
