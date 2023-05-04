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
    firstName: {
      type: String,
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

//Virtual Populate
// postSchema.virtual('comments', {
//   ref: 'Comments',
//   foreignField: 'post',
//   localField: '_id',
// });

// postSchema.pre('save', function (next) {
//   this.slug = slugify(this.name, { lower: true });
//   next();
// });

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'publisher',
    select: 'firstName',
  });
  next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
