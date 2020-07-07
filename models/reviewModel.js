const mongoose = require( 'mongoose' );

const Tour = require( './tourModel' );

const schema = new mongoose.Schema(
{
	review:
	{
		type: String,
		trim: true,
		required: [ true, 'You have to say something about your review.' ]
	},
	rating:
	{
		type: Number,
		min: [ 1, 'Rating must be at least 1.0!' ],
		max: [ 5, 'Rating must not be higher than 5.0!' ]
	},
	createdAt:
	{
		type: Date,
		default: Date.now()
	},
	tour:
	{
		type: mongoose.Schema.ObjectId,
		ref: 'Tour',
		required: [ true, 'A review must belong to a tour!' ]
		},
	user:
	{
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: [ true, 'A review must belong to a user!' ]
	}
},
{
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

schema.index( { tour: 1, user: 1 }, { unique: true } );

// QUERY MIDDLEWARE for GET method: populate tour and user
schema.pre( /^find/, function( next )
{
	// this.populate( { path: 'tour', select: 'name' } )
	// 	.populate( { path: 'user', select: 'name photo' } );
	this.populate( { path: 'user', select: 'name photo' } );
	next();
});

schema.statics.calcAverageRatings = async function( tourId )
{
	const stats = await this.aggregate(
	[
		{
			$match: { tour: tourId }
		},
		{
			$group:
			{
				_id: '$tour',
				nRating: { $sum: 1 },
				avgRating: { $avg: '$rating' }
			}
		}
	]);
	console.log( stats );
	if ( stats.length > 0 )
	{
		await Tour.findByIdAndUpdate( tourId,
		{
			ratingsQuantity: stats[ 0 ].nRating,
			ratingsAverage: stats[ 0 ].avgRating
		});
	}
	else
	{
		await Tour.findByIdAndUpdate( tourId,
		{
			ratingsQuantity: 0,
			ratingsAverage: 4.5
		});
	}
};

schema.post( 'save', function()
{
	this.constructor.calcAverageRatings( this.tour );
});

// findByIdAndUpdate
// findByIdAndDelete
schema.pre( /^findOneAnd/, async function( next )	// query middleware; this keyword is the current query
{
	this.r = await this.findOne();
	next();
});

schema.post( /^findOneAnd/, async function()
{
	// await this.findOne();	// does NOT work here since query has already executed
	await this.r.constructor.calcAverageRatings( this.r.tour );
});

const Review = mongoose.model( 'Review', schema );

module.exports = Review;