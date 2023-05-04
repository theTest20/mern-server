const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
//const postRouter = require('../routes/postRoutes');

const router = express.Router();
// router.use('/:userId/posts', postRouter); //mounting a router

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
///router.get('/logout', authController.logout);

router.use(authController.protect);

router.patch('/updateMyPassword/', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

router.delete('/deleteMe', userController.deleteMe);

// router.use(authController.restrictTo('admin'));
// router.route('/').get(userController.getAllUsers);
// router.post(userController.createUser); //
// router
//   .route('/:id')
//   .get(userController.getUser)
//   .patch(userController.updateUser)
//   .delete(userController.deleteUser);
module.exports = router;
