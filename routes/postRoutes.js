const express = require('express');
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');

const router = express.Router();

router
  .route('/')
  .get(postController.getAllPosts)
  .post(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    postController.uploadPostImages,
    postController.resizePostImages,
    postController.createPost
  );

router
  .route('/:id')
  .get(postController.getPost)
  .patch(
    authController.protect,
    authController.restrictTo('user'),
    postController.uploadPostImages,
    postController.resizePostImages,
    postController.updatePost
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    postController.deletePost
  );

router.get(
  '/userPosts/:id',
  authController.protect,
  postController.getPostsByUser
);

module.exports = router;
