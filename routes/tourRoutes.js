const express = require( 'express' );

const controller = require( '../controllers/tourController' );
const authController = require( '../controllers/authController' );
const reviewRouter = require( './reviewRoutes' );

const router = express.Router();

// router.param( 'id', controller.checkId );
router.route( '/top-5-cheap' ).get( controller.aliasTopTours, controller.getAllTours );
router.route( '/stats' ).get( controller.getTourStats );

router.route( '/' ).get( controller.getAllTours );
router.route( '/:id' ).get( controller.getTour );

router.route( '/within/:distance/center/:latlng/unit/:unit' ).get( controller.getToursWithin );
// /tours-within?distance=250&center=-40,45&unit=mi
// /tours-within/250/center/-40,45/unit/mi

router.route( '/distances/:latlng/unit/:unit' ).get( controller.getDistances );

// user must be logged in to access routes after this middleware
router.use( authController.protect );

router.use( '/:tourId/reviews', reviewRouter );

// routes after this middleware are only accessible to admin and lead-guide
router.use( authController.restrictTo( 'admin', 'lead-guide' ) );

router.route( '/monthly-plan/:year' ).get( controller.getMonthlyPlan );
router.route( '/' ).post( controller.createTour );
router.route( '/:id' )
	.patch( controller.uploadTourImages, controller.resizeTourImages, controller.updateTour )
	.delete( controller.deleteTour );

// create a review
// router.route( '/:tourId/reviews' ).post( authController.restrictTo( 'user' ), reviewController.createReview );

module.exports = router;
