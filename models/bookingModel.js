const mongoose = require( 'mongoose' );

const schema = new mongoose.Schema(
{
	tour: { type: mongoose.Schema.ObjectId, ref: 'Tour', requied: [ true, 'Booking must belong to a Tour!' ] },
	user: { type: mongoose.Schema.ObjectId, ref: 'User', requied: [ true, 'Booking must belong to a User!' ] },
	price: { type: Number, required: [ true, 'Booking must have a price!' ] },
	createdAt: { type: Date, default: Date.now() },
	paid: { type: Boolean, default: true }
});

schema.pre( /^find/, function ( next )
{
	this.populate( { path: 'tour', select: 'name' } )
		.populate( 'user' );

	next();
});

const Booking = mongoose.model( 'Booking', schema );

module.exports = Booking;