const Post = require('../models/postModel');
const asyncHandler = require('express-async-handler');
const CustomizeError = require('../utils/customizeError');


const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadPostImages = upload.single( 'imageCover');

exports.resizePostImages = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  // Process Cover Image
 if(req.params.id){
  req.file.filename = `post-${req.params.id}-${Date.now()}-cover.jpeg`;
 }else{
  req.file.filename = `post-${Date.now()}-cover.jpeg`;
 }
  await sharp(req.file.buffer)
    .resize(2000, 1333,{ fit: 'fill'})
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/post/${req.file.filename}`);
  next();
});

exports.createPost = asyncHandler(async (req, res) => {
  if (!req.body.user) req.body.publisher = req.user.id;
  if (!req.body.firstName) req.body.firstName = req.user.firstName;
  if (req.file) {
    req.body.imageCover = req.file.filename;
  };
  
  const post = await Post.create(req.body);
  res.status(200).json({
    status: 'success',
    post,
  });
});

exports.getAllPosts = asyncHandler(async (req, res, next) => {
  const keyword=req.query['search'];
  const  page  = req.query.page;
  const limit = 3;
  const startIndex = (Number(page) - 1) * limit;  
  const total = await Post.countDocuments({});

 let posts='';
 if(keyword){
    posts = await Post.find({ title: { $regex: keyword, $options: "i" } }).limit(limit).skip(startIndex).sort({ createdAt: 'desc' });
 }else{
   posts = await Post.find().limit(limit).skip(startIndex).sort({ createdAt: 'desc' });
 }
 

  if (!posts) {
    return next(new CustomizeError('There are no posts', 404));
  }

  res.status(200).json({
    data: posts,
    currentPage: Number(page),
    totalPosts:total,
    numberOfPages: Math.ceil(total / limit),
  });
});

exports.getPost = asyncHandler(async (req, res, next) => {
 
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new CustomizeError('No such post exist!', 404));
  }
 
  res.status(200).json({
    data: post,
  });
});

exports.getPostsByUser = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ message: "User doesn't exist" });
  }
  const userPosts = await Post.find({ publisher: id });
  res.status(200).json(userPosts);
};

exports.updatePost = asyncHandler(async (req, res, next) => {
  console.log(req.file)
  if (req.file){ req.body.imageCover = req.file.filename;}
  //console.log(req.params.id)
  const postToUpdate = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!postToUpdate) {
    return next(new CustomizeError('Post not found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: postToUpdate,
  });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  _id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: `No post exist with id: ${_id}` });
  }
  const postToDelete = await Post.findByIdAndDelete(_id);
  if (!postToDelete) {
    return next(new CustomizeError('No post found with that ID!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: 'Post deleted successfully',
  });
});
