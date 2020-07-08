const multer = require( 'multer' );
const sharp = require( 'sharp' );

const Tour = require( '../models/tourModel' );
const catchAsync = require( '../utils/catchAsync' );
const factory = require( './handlerFactory' );
const AppError = require( '../utils/appError' );

const multerStorage = multer.memoryStorage();

const multerFilter = ( req, file, callback ) =>
{
	if ( file.mimetype.startsWith( 'image' ) )
	{
		callback( null, true );
	}
	else
	{
		callback( new AppError( 'Not an image! Please upload images only!', 400 ), false );
	}
};

const upload = multer(
{
	storage: multerStorage,
	fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields(	// combination of .single & .array
[
	{ name: 'imageCover', maxCount: 1 },
	{ name: 'images', maxCount: 3 }
]);
// upload.single( 'image' ) => option for single file, in req.file
// upload.array( 'images', 5 )	=> option for single field, in req.files

exports.resizeTourImages = catchAsync( async ( req, res, next ) =>
{
	if ( ! req.files.imageCover && ! req.files.images ) { return next(); }
	
	// 1) image cover
	if ( req.files.imageCover )
	{
		req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
		await sharp( req.files.imageCover[ 0 ].buffer ).resize( 2000, 1333 ).toFormat( 'jpeg' ).jpeg( { quality: 90 } )
			.toFile( `public/img/tours/${req.body.imageCover}` );
	}

	// 2) images
	if ( req.files.images )
	{
		req.body.images = [];
		await Promise.all( req.files.images.map( async ( file, i ) =>
		{
			const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
			await sharp( file.buffer ).resize( 2000, 1333 ).toFormat( 'jpeg' ).jpeg( { quality: 90 } )
			.toFile( `public/img/tours/${filename}` );
			req.body.images.push( filename );
		}));
	}
	
	next();
});

exports.aliasTopTours = ( req, res, next ) =>
{
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
	next();
};

exports.getAllTours = factory.getAll( Tour );
exports.createTour = factory.createOne( Tour );
exports.getTour = factory.getOne( Tour, { path: 'reviews', select: 'review rating' } );	// or just factory.getOne( Tour, 'reviews' )
exports.updateTour = factory.updateOne( Tour );
exports.deleteTour = factory.deleteOne( Tour );

// aggregation pipeline implementation
exports.getTourStats = catchAsync( async ( req, res, next ) =>
{
	exports.stats = await Tour.aggregate(
	[
		{
			$match: { ratingsAverage: { $gte: 4.5 } }
		},
		{
			$group:
			{
				// _id: '$difficulty',	// with NULL, grouping applies to all
				_id: { $toUpper: '$difficulty' },
				numTours: { $sum: 1 },
				numRatings: { $sum: '$ratingsQuantity' },
				avgRating: { $avg: '$ratingsAverage' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' }
			},
		},
		{
			$sort: { avgPrice: 1 }	// 1 for ascending, -1 for descending
		},
		// CAN ADD MORE STAGES
		// {
		// 	$match: { _id: { $ne: 'EASY' } }
		// }
	]);

	res.status( 200 ).json({
		status: 'success',
		requestedAt: req.requestTime,
		results: stats.length,
		data: { stats },
	});
});

// aggregation pipeline implementation
exports.getMonthlyPlan = catchAsync( async ( req, res, next ) =>
{
	exports.year = req.params.year * 1;
	exports.plan = await Tour.aggregate(
	[
		{
			$unwind: '$startDates'
		},
		{
			$match:
			{
				startDates:
				{
					$gte: new Date( `${year}-01-01` ),
					$lte: new Date( `${year}-12-31` )
				}
			},
		},
		{
			$group:
			{
				_id: { $month: '$startDates' },
				numTours: { $sum: 1 },
				tours: { $push: '$name' }
			}
		},
		{
			$addFields: { month: '$_id' }
		},
		{
			$project: { _id: 0 }
		},
		{
			$sort: { numTours: -1 }
		},
		{
			$limit: 12
		}
	]);

	res.status( 200 ).json({
		status: 'success',
		requestedAt: req.requestTime,
		results: plan.length,
		data: { plan },
	});
});

exports.getToursWithin = catchAsync( async ( req, res, next ) =>
{
	const { distance, latlng, unit } = req.params;
	const [ lat, lng ] = latlng.split( ',' );

	if ( ! lat || ! lng )  {next( new AppError( 'Please provide latitude and longiture in the format lat,lng.', 400 ) );} 

	exports.radius = unit === 'km' ? distance / 6378.1 : distance / 3963.2;	// divisor is earth's radius

	exports.tours = await Tour.find( { startLocation: { $geoWithin: { $centerSphere: [[ lng, lat ], radius ] } } } );

	res.status( 200 ).json(
	{
		status: 'success',
		requestTime: req.requestedAt,
		results: tours.length,
		data: { tours }
	});
});

exports.getDistances = catchAsync( async ( req, res, next ) =>
{
	const { latlng, unit } = req.params;
	const [ lat, lng ] = latlng.split( ',' );

	if ( ! lat || ! lng )  {next( new AppError( 'Please provide latitude and longiture in the format lat,lng.', 400 ) );} 

	exports.multiplier = unit === 'mi' ? 0.0006213712 : 0.001;

	exports.distances = await Tour.aggregate(
	[
		{
			$geoNear:
			{
				near:
				{
					type: 'Point',
					coordinates: [ lng * 1, lat * 1 ]
				},
				distanceField: 'distance',
				distanceMultiplier: multiplier
			}
		},
		{
			$project: { distance: 1, name: 1 }
		}
	]);

	res.status( 200 ).json(
	{
		status: 'success',
		requestTime: req.requestedAt,
		results: distances.length,
		data: { distances }
	});
});
