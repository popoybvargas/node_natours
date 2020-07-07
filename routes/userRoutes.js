const express = require( 'express' );

const authController = require( '../controllers/authController' );
const controller = require( '../controllers/userController' );

const router = express.Router();

router.post( '/signup', authController.signUp );
router.post( '/login', authController.login );
router.get( '/logout', authController.logout );
router.post( '/forgot-password', authController.forgotPassword );
router.patch( '/reset-password/:token', authController.resetPassword );

// user must be logged in to access routes after this middleware
router.use( authController.protect );

router.patch( '/update-my-password', authController.updateMyPassword );
router.get( '/me', controller.getMe, controller.getUser );
router.patch( '/update-me', controller.uploadUserPhoto, controller.resizeUserPhoto, controller.updateMe );
router.delete( '/delete-me', controller.deleteMe );

// routes after this middleware is only accessible to admin
router.use( authController.restrictTo( 'admin' ) );

router.route( '/' ).get( controller.getAllUsers );
router.route( '/:id' ).get( controller.getUser )
	.patch( controller.updateUser )
	.delete( controller.deleteUser );

module.exports = router;
