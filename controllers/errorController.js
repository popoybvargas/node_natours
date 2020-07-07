const AppError = require( '../utils/appError' );
// const process.env = require( 'zv-getprocess.env' )();

const handleCastErrorDB = err =>
{
	const message = `Invalid ${err.path}: ${err.value}!`;
	
	return new AppError( message, 400 );
};

const handleDuplicateFieldDB = err =>
{
	const value = err.message.match( /(["'])(\\?.)*?\1/ )[ 0 ];
	const message = `Duplicate field value: ${value}!`;

	return new AppError( message, 400 );
};

const handleValidationErrorDB = err =>
{
	const errors = Object.values( err.errors ).map( el => el.message );
	const message = `Invalid input data! ${errors.join( ' | ' )}`;

	return new AppError( message, 400 );
};

const handleJWTError = () => new AppError( 'Invalid token. Please log in again!', 401 );

const handleJWTExpiredError = () => new AppError( 'Expired token. Please log in again!', 401 );

const sendErrorDev = ( err, req, res ) =>
{
	console.error( 'ERROR 💥', err );
	// A) API
	if ( req.originalUrl.startsWith( '/api' ) )
	{
		return res.status( err.statusCode ).json(
		{
			status: err.status,
			message: err.message,
			error: err,
			stack: err.stack
		});
	}
	// B) rendered pages
	res.status( err.statusCode ).render( 'error',
	{
		title: 'ERROR 💥 Something went wrong!',
		message: err.message
	});
};

const sendErrorProd = ( err, req, res ) =>
{
	// A) API
	if ( req.originalUrl.startsWith( '/api' ) )
	{
		console.log( '>>> ERROR FOR API' );
		// Operational, trusted error: send message to client
		if ( err.isOperational )
		{
			return res.status( err.statusCode ).json(
			{
				status: err.status,
				message: err.message
			});
		}
		// Programming or other unknown error: don't leak error details
		// 1) Log error
		console.error( 'ERROR 💥', err );

		// 2) Send generic message
		return res.status( 500 ).json(
		{
			status: 'error',
			message: 'Something went wrong!',
		});
	}

	// B) rendered pages
	// Operational, trusted error: send message to client
	if ( err.isOperational )
	{
		return res.status( err.statusCode ).render( 'error',
		{
			title: 'ERROR 💥 Something went wrong!',
			message: err.message
		});
	}
	// Programming or other unknown error: don't leak error details
	// 1) Log error
	console.error( 'ERROR 💥', err );

	// 2) Send generic message
	res.status( err.statusCode ).render( 'error',
	{
		title: 'ERROR 💥 Something went wrong!',
		message: 'Please try again later.'
	});
};

module.exports = ( err, req, res, next ) =>
{
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if ( process.env.NODE_ENV === 'development' )
	{
		sendErrorDev( err, req, res );
	}
	else if ( process.env.NODE_ENV === 'production' )
	{
		let error = { name: err.name, message: err.message };
		error = Object.assign( error, err );
		// error = { ...err };
		
		if ( error.name === 'CastError' ) { error = handleCastErrorDB( error ); }

		if ( error.code === 11000 ) { error = handleDuplicateFieldDB( error ); }

		if ( error.name === 'ValidationError' ) { error = handleValidationErrorDB( error ); }

		if ( error.name === 'JsonWebTokenError' ) { error = handleJWTError(); }

		if ( error.name === 'TokenExpiredError' ) { error = handleJWTExpiredError(); }
		
		sendErrorProd( error, req, res );
	}
};