const mongoose = require( 'mongoose' );
const slugify = require( 'slugify' );
const validator = require( 'validator' );

const schema = new mongoose.Schema(
{
	name: {
		type: String,
		trim: true,
		unique: true,
		// validators
		required: [ true, 'A tour must have a name.' ],
		maxlength: [ 40, 'A tour name must be no longer than 40 characters!' ],
		minlength: [ 10, 'A tour name must have at least 10 characters!' ],
		// validate: [ validator.isAlpha, 'Tour name should only contain alpha characters!' ]
	},
	slug: String,
	duration: {
		type: Number,
		required: [ true, 'A tour must have a duration!' ]
	},
	maxGroupSize: {
		type: Number,
		required: [ true, 'Tour must have a group size!' ]
	},
	difficulty: {
		type: String,
		trim: true,
		required: [ true, 'A tour must have difficulty!' ],
		enum:
		{
			values: [ 'easy', 'medium', 'difficult' ],
			message: 'Valid difficulty values: easy, medium, or difficult!'
		}
	},
	ratingsAverage:
	{
		type: Number,
		default: 4.5,
		min: [ 1, 'Rating must be at least 1.0!' ],
		max: [ 5, 'Rating must not be higher than 5.0!' ],
		set: val => Math.round( val * 10 ) / 10
	},
	ratingsQuantity:
	{
		type: Number,
		default: 0
	},
	price: {
		type: Number,
		required: [ true, 'A tour must have a price.' ]
	},
	priceDiscount:
	{
		type: Number,
		validate:
		{
			validator: function( val )
			{
				// <this> only points to current doc on NEW document creation
				return val < this.price;
			},
			message: 'Discount ({VALUE}) cannot be higher than the price!'
		}
	},
	summary: {
		type: String,
		trim: true,
		required: [ true, 'A tour must have a description!' ]
	},
	description: {
		type: String,
		trim: true
	},
	imageCover: {
		type: String,
		required: [ true, 'A tour must have a cover image!' ]
	},
	images: [ String ],
	createdAt: {
		type: Date,
		default: Date.now(),
		select: false	// excludes from fetching
	},
	startDates: [ Date ],
	secretTour: { type: Boolean, default: false },
	// GeoJSON
	startLocation:
	{
		type:
		{
			type: String,
			default: 'Point',
			enum: [ 'Point' ]
		},
		coordinates: [ Number ],	// longitude [(vertical) point from meridian], latitude [(horizontal) point from equator]
		address: String,
		description: String
	},
	locations:
	[	// by specifying an array, this creates an embedded (sub-)documents
		{
			type:
			{
				type: String,
				default: 'Point',
				enum: [ 'Point' ]
			},
			coordinates: [ Number ],
			address: String,
			description: String,
			day: Number
		}
	],
	// guides: Array	// provided for embedding user documents
	guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
},
{
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

// indexing for better READ performance
// schema.index( { price: 1 } );	// sorting: 1 for ASC & -1 for DESC
schema.index( { price: 1, ratingsAverage: -1 } );	// compound-index
schema.index( { slug: 1 } );
schema.index( { startLocation: '2dsphere' } );

schema.virtual( 'durationWeeks' ).get( function()
{
	return this.duration / 7;
});

// virtual populate
schema.virtual( 'reviews',
{
	ref: 'Review',
	foreignField: 'tour',
	localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs for .save() & .create() but not .insertMany() and others
// pre-sve hook
schema.pre( 'save', function( next )
{
	this.slug = slugify( this.name, { lower: true } );
	next();
});

// embeds user documents
// schema.pre( 'save', async function( next )
// {
// 	const guidesPromises = this.guides.map( async id => await User.findById( id ) );
// 	this.guides = await Promise.all( guidesPromises );
// 	next();
// });

/*
schema.pre( 'save', function( next )
{
	console.log( 'Will save document...' );
	next();
});

// runs after | post-sve hook
schema.post( 'save', function( doc, next )
{
	console.log( doc );
	next();
});
*/

// QUERY MIDDLEWARE
schema.pre( /^find/, function( next )
{
	this.start = Date.now();
	this.find( { secretTour: { $ne: true } } );	// hides "secret tours"

	this.populate( { path: 'guides', select: '-__v -passwordChangedAt' } );	// populates guides with corresponding user documents

	this.populate( { path: 'reviews', fields: 'review rating user' } );	// populates reviews

	next();
});

schema.post( /^find/, function( docs, next )
{
	console.log( `Query took ${Date.now() - this.start} ms` );
	next();
});

// AGGREGATION MIDDLEWARE
// schema.pre( 'aggregate', function( next )
// {
// 	this.pipeline().unshift( { $match: { secretTour: { $ne: true } } } );	// add new stage at the beginning
	// this.pipeline()[ 0 ][ '$match' ] = Object.assign( { secretTour: { $ne: true } }, this.pipeline()[ 0 ][ '$match' ] );	// modify $match stage
	// console.log( this.pipeline() );
// 	next();
// });

const Tour = mongoose.model( 'Tour', schema );

module.exports = Tour;