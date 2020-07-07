const express = require( 'express' );

const controller = require( '../controllers/reviewController' );
const authController = require( '../controllers/authController' );

const router = express.Router( { mergeParams: true } );

// user must be logged in to access routes after this middleware
router.use( authController.protect );

router.route( '/' )
	.get( controller.getAllReviews )
	.post( authController.restrictTo( 'user' ), controller.setTourUserIds, controller.createReview );
router.route( '/:id' )
	.get( controller.getReview )
	.patch( authController.restrictTo( 'user', 'admin' ), controller.updateReview )
	.delete( authController.restrictTo( 'user', 'admin' ), controller.deleteReview );

module.exports = router;
