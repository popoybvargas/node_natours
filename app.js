const path = require( 'path' );

const express = require( 'express' );
const helmet = require( 'helmet' );
const hpp = require( 'hpp' );
const mongoSanitize = require( 'express-mongo-sanitize' );
const morgan = require( 'morgan' );
const rateLimit = require( 'express-rate-limit' );
const xss = require( 'xss-clean' );
const cookieParser = require( 'cookie-parser' );
const compression = require( 'compression' );
const cors = require( 'cors' );

const AppError = require( './utils/appError' );
// const process.env = require( 'zv-getprocess.env' )();
const globalErrorHandler = require( './controllers/errorController' );
const tourRouter = require( './routes/tourRoutes' );
const userRouter = require( './routes/userRoutes' );
const reviewRouter = require( './routes/reviewRoutes' );
const bookingRouter = require( './routes/bookingRoutes' );
const viewRouter = require( './routes/viewRoutes' );

const app = express();

app.set( 'view engine', 'pug' );
app.set( 'views', path.join( __dirname, 'views' ) );

// GLOBAL MIDDLEWARES
app.use( cors() );	// implement CORS
// Access-Control-Allow_Origin *
// access api.natours.com from front-end: natours.com
// app.use( cors(
// {
// 	origin: 'https://www.natours.com'
// }));
app.options( '*', cors() );	// allow CORS for complex requests, e.g. PUT, PATCH, DELETE, or set non-standard headers
// app.options( '/api/v1/tours/:id', cors() );	// allow complex requests to specific endpoint
app.use( express.static( path.join( __dirname, 'public' ) ) );	// serving static files
app.use( helmet() );	// set security HTTP headers
if ( process.env.NODE_ENV === 'development' ) { app.use( morgan( 'dev' ) ); }	// development logging
const limiter = rateLimit(
{
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP. Please try again in an hour.'
});
app.use( '/api', limiter );	// limit requests from sme IP
app.use( express.json( { limit: '10kb' }) ); // parser - reading data from body into req.body
app.use( express.urlencoded( { extended: true, limit: '10kb' } ) );	// parse form data into req.body
app.use( cookieParser() );	// parses cookies
app.use( mongoSanitize() );	// data sanitization against nosql query injection
app.use( xss() );	// data sanitization against nosql cross-site scripting (XSS)
app.use( hpp(
{
	whitelist: [ 'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price' ]
}));	// prevent (HTTP) parameter pollution
app.use( compression() );	// compresses text responses before they're sent to the client
app.use( ( req, res, next ) =>	// test/custom middleware
{
	req.requestTime = new Date().toISOString();
	// console.log( req.cookies );
	next();
} );
// ROUTES - VIEWS
app.use( '/', viewRouter );
// ROUTES - API
app.use( '/api/v1/tours', tourRouter ); // mounting the router
app.use( '/api/v1/users', userRouter );
app.use( '/api/v1/reviews', reviewRouter );
app.use( '/api/v1/bookings', bookingRouter );

// catches endpoints that are not valid (not handled by above route handlers)
app.all( '*', ( req, res, next ) =>
{
	next( new AppError( `Can't find ${req.originalUrl} on this server!`, 404 ) );	// when an arguament is passwed with the next() function, it would mean there was an error
});

app.use( globalErrorHandler );

module.exports = app;
