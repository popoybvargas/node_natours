const crypto = require( 'crypto' );
const { promisify } = require( 'util' );

// const process.env = require( 'zv-getprocess.env' )();
const jwt = require( 'jsonwebtoken' );

const AppError = require( '../utils/appError' );
const catchAsync = require( '../utils/catchAsync' );
// const sendEmail = require( '../utils/email' );
const Email = require( '../utils/email' );
const User = require( '../models/userModel' );

const createSendToken = ( user, statusCode, req, res ) =>
{
	const token = user.signToken( user._id );

	// if ( process.env.NODE_ENV === 'production' ) { cookieOptions.secure = true; }	// via https only

	res.cookie( 'jwt', token,
	{
		expires: new Date( Date.now() + ( process.env.JWT_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000 ) ),	// converted to milliseconds
		httpOnly: true,	// prevents access/modified by the browser - prevents cross-site scripting attacks
		secure: req.secure || req.headers[ 'x-forwarded-prop' ] === 'https'	// via https only
	});

	// remove password from the output
	user.password = undefined;

	res.status( statusCode ).json(
	{
		status: 'success',
		data: { token, user }
	});
};

exports.signUp = catchAsync( async ( req, res, next ) =>
{
	// const newUser = await User.create( req.body );	// vulnerable to injections
	const { name, email, role, password, passwordConfirm } = req.body;
	const newUser = await User.create( { name, email, role, password, passwordConfirm } );

	const url = `${req.protocol}://${req.get( 'host' )}/me`;
	await new Email( newUser, url ).sendWelcome();

	createSendToken( newUser, 201, req, res );
});
// password for all test data is: test1234
exports.login = catchAsync( async ( req, res, next ) =>
{
	const { email, password } = req.body;

	if ( ! email || ! password )
	{
		return next( new AppError( 'Please provide email and password!', 400 ) );
	}
	const user = await User.findOne( { email } ).select( '+password' );

	if ( ! user || ! ( await user.correctPassword( password, user.password ) ) )
	{
		return next( new AppError( 'Incorrect email or password!', 401 ) );
	}
	createSendToken( user, 200, req, res );
});

exports.logout = ( req, res ) =>
{
	res.cookie( 'jwt', 'logged-out',
	{
		expires: new Date( Date.now() + ( 10 * 1000 ) ),
		httpOnly: true
	});

	res.status( 200 ).json( { status: 'success' });
};

exports.protect = catchAsync( async ( req, res, next ) =>
{
	let token;

	if ( req.headers.authorization && req.headers.authorization.startsWith( 'Bearer' ) )
	{
		token = req.headers.authorization.split( ' ' )[ 1 ];
	}
	else if ( req.cookies.jwt )
	{
		token = req.cookies.jwt;
	}
	
	if ( ! token )
	{
		return next( new AppError( 'You are not logged in!', 401 ) );
	}

	const decoded = await promisify( jwt.verify)( token, process.env.JWT_SECRET );
	const currentUser = await User.findById( decoded.id );
	
	if ( ! currentUser )
	{
		return next( new AppError( 'The user owner of this token does not exist!', 401 ) );
	}
	
	if ( currentUser.changedPasswordAfter( decoded.iat ) )
	{
		return next( new AppError( 'Token is no longer valid. Please log in again!', 401 ) );
	}
	req.currentUser = currentUser;
	res.locals.user = currentUser;
	
	next();
});

// only for rendered pages, no error reporting
exports.isLoggedIn = async ( req, res, next ) =>
{
	if ( req.cookies.jwt )
	{
		try
		{
			const decoded = await promisify( jwt.verify)( req.cookies.jwt, process.env.JWT_SECRET );
			const currentUser = await User.findById( decoded.id );
			
			if ( ! currentUser )
			{
				return next();
			}
			
			if ( currentUser.changedPasswordAfter( decoded.iat ) )
			{
				return next();
			}
			res.locals.user = currentUser;
			
			return next();
		} catch ( err ) { return next(); }
	}
	next();
};

exports.restrictTo = ( ...roles ) =>
{
	return ( req, res, next ) =>
	{
		if ( ! roles.includes( req.currentUser.role ) )
		{
			return next( new AppError( 'You are not allowed to perform this action!', 403 ) );
		}
		next();
	};
};

exports.forgotPassword = catchAsync( async ( req, res, next ) =>
{
	const user = await User.findOne( { email: req.body.email } );

	if ( ! user )
	{
		return next( new AppError( 'User does not exist!', 404 ) );
	}
	const resetToken = user.createPasswordResetToken();
	await user.save( { validateBeforeSave: false } );

	try
	{
		const resetURL = `${req.protocol}://${req.get( 'host' )}/api/v1/users/reset-password/${resetToken}`;
		await new Email( user, resetURL ).sendPasswordReset();

		res.status( 200 ).json(
		{
			status: 'success',
			message: 'Token sent via email.'
		});;
	}
	catch ( err )
	{
		console.log( err );
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save( { validateBeforeSave: false } );

		return next( new AppError( 'There was an error sending the email. Please try again later!', 500 ) );
	}
});

exports.resetPassword = catchAsync( async ( req, res, next ) =>
{
	const hashedToken = crypto.createHash( 'sha256' ).update( req.params.token ).digest( 'hex' );
	const user = await User.findOne( { passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } } );

	if ( ! user )
	{
		return next( new AppError( 'Token is invalid or has expired!', 400 ) );
	}
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();
	createSendToken( user, 200, req, res );
});

exports.updateMyPassword = catchAsync( async ( req, res, next ) =>
{
	// fetch current user with his/her password
	const user = await User.findById( req.currentUser.id ).select( '+password' );
	const { currentPassword, newPassword, newPasswordConfirm } = req.body;
	// check if POSTed current password is correct
	if ( ! ( await user.correctPassword( currentPassword, user.password ) ) )
	{
		return next( new AppError( 'Current password is incorrect!', 401 ) );
	}
	// update password
	user.password = newPassword;
	user.passwordConfirm = newPasswordConfirm;
	await user.save();
	// log in user, send JWT
	createSendToken( user, 200, req, res );
});