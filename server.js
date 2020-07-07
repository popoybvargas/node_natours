require( 'zv-load.env' )();

if ( process.argv[ 2 ] && process.argv[ 2 ] === '--production' )
{
	process.env.NODE_ENV = 'production';
	console.log( '>>> environment: PRODUCTION\n' );
}

const handleAUncaughtUnhandled = ( err, type = 'UNHANDLED REJECTION' ) =>
{
	console.log( type, '💥 Shutting down...' );
	// console.log( `${err.name} >>> ${err.message}` );
	console.log( err.stack );
	// server.close( () => process.exit( 1 ) );
	process.exit( 1 );
};

const app = require( './app' );

// CONNECT TO DB
require( './models/DBconnection' )();

// START SERVER
const port = process.env.PORT || 8000;
const server = app.listen( port, () => {
	console.log( `Listening at port ${port} ...` );
} );

process.on( 'unhandledRejection', err => handleAUncaughtUnhandled( err ) );
process.on( 'uncaughtException', err => handleAUncaughtUnhandled( err, 'UNCAUGHT EXCEPTION' ) );
process.on( 'SIGTERM', () =>
{
	console.log( '👋🏼 SIGTERM RECEIVED. Shutting down gracefully...' );
	server.close( () =>
	{
		console.log( '💥 Process terminated!' );
	});
});