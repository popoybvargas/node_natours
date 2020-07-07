const express = require( 'express' );

const authController = require( '../controllers/authController' );
const controller = require( '../controllers/viewController' );
const bookingController = require( '../controllers/bookingController' );

const router = express.Router();

router.get( '/me', authController.protect, controller.getAccount );
router.get( '/my-tours', authController.protect, controller.getMyTours );
router.post( '/submit-user-data', authController.protect, controller.updateUserData );

router.use( authController.isLoggedIn );

router.get( '/', bookingController.createBookingCheckout, controller.getOverview );
router.get( '/tours/:slug', controller.getTour );
router.get( '/login', controller.getLoginForm );


module.exports = router;