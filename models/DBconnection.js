const mongoose = require( 'mongoose' );

module.exports = () =>
{
	const DB = process.env.DATABASE.replace( '<PASSWORD>', process.env.DB_PASSWORD );
	mongoose.connect( DB,
	{
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	})
	.then( () => console.log( 'DB connection successful!' ) );
	// .catch( err => console.log( 'ERROR 💥' ));
};