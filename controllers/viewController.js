const Booking = require( '../models/bookingModel' );
const Tour = require( '../models/tourModel' );
const User = require( '../models/userModel' );
const catchAsync = require( '../utils/catchAsync' );
const AppError = require( '../utils/appError' );

exports.alerts = ( req, res, next ) =>
{
	const { alert } = req.query;

	if ( alert === 'booking' )
	{
		res.locals.alert = 'Your booking was successful! Please check your email for a confirmation. If your booking doesn\'t show up here immediately, please check back again later.';
	}

	next();
};

exports.getOverview = catchAsync( async ( req, res, next ) =>
{
	const tours = await Tour.find();

	res.status( 200 ).render( 'overview',
	{
		title: 'All Tours',
		tours
	});
});

exports.getTour = catchAsync( async ( req, res, next ) =>
{
	const tour = await Tour.findOne( { slug: req.params.slug } );

	if ( ! tour ) { return next( new AppError( 'There is no tour with that name!', 404 ) ); }
	
	res.status( 200 ).render( 'tour',
	{
		title: tour.name,
		tour
	});
});

exports.getLoginForm = ( req, res ) =>
{
	res.status( 200 ).render( 'login',
	{
		title: 'Login'
	});
};

exports.getAccount = ( req, res ) =>
{
	res.status( 200 ).render( 'account', { title: 'Your account' } );
};

exports.getMyTours = catchAsync( async ( req, res, next ) =>
{
	const bookings = await Booking.find( { user: req.currentUser.id } );
	const tourIDs = bookings.map( el => el.tour );
	const tours = await Tour.find( { _id: { $in: tourIDs } } );

	res.status( 200 ).render( 'overview',
	{
		title: 'My Tours',
		tours
	});
});

exports.updateUserData = catchAsync( async ( req, res, next ) =>
{
	const updatedUser = await User.findByIdAndUpdate( req.currentUser.id,
	{
		name: req.body.name,
		email: req.body.email
	},
	{
		new: true,
		runValidators: true
	});

	res.status( 200 ).render( 'account', { title: 'Your account', user: updatedUser } );
});