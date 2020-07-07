const APIFeatures = require( '../utils/apiFeatures' );
const AppError = require( '../utils/appError' );
const catchAsync = require( '../utils/catchAsync' );

exports.createOne = Model => catchAsync( async ( req, res, next ) =>
{
	const newDocument = await Model.create( req.body );
	
	res.status( 201 ).json( {
		status: 'success',
		requestedAt: req.requestTime,
		data: { document: newDocument },
	});
});

exports.getAll = Model => catchAsync( async ( req, res, next ) =>
{
	// hack to provide for nested GET reviews on tour
	let filter = {};
	if ( req.params.tourId ) { filter = { tour: req.params.tourId }; }

	// BUILD & EXECUTE QUERY
	const features = new APIFeatures( Model.find( filter ), req.query ).filter().sort().limitFields().paginate();
	const documents = await features.query;	// chain the explain() method to include statistics about the query

	// SEND RESPONSE
	res.status( 200 ).json({
		status: 'success',
		requestedAt: req.requestTime,
		results: documents.length,
		data: { documents },
	});
});

exports.getOne = ( Model, populateOptions ) => catchAsync( async ( req, res, next ) =>
{
	const query = populateOptions ? Model.findById( req.params.id ).populate( populateOptions ) : Model.findById( req.params.id );
	const document = await query;

	if ( ! document )
	{
		return next( new AppError( 'No document found with that ID!', 404 ) );
	}
	res.status( 200 ).json({
		status: 'success',
		requestedAt: req.requestTime,
		data: { document },
	});
});

exports.updateOne = Model => catchAsync( async ( req, res, next ) =>
{
	const document = await Model.findByIdAndUpdate( req.params.id, req.body,
	{
		new: true,
		runValidators: true
	});

	if ( ! document )
	{
		return next( new AppError( 'No document found with that ID!', 404 ) );
	}
	res.status( 200 ).json({
		status: 'success',
		requestedAt: req.requestTime,
		data: { document },
	});
});

exports.deleteOne = Model => catchAsync( async ( req, res, next ) =>
{
	const document = await Model.findByIdAndDelete( req.params.id );

	if ( ! document )
	{
		return next( new AppError( 'No document found with that ID!', 404 ) );
	}
	res.status( 204 ).json({
		status: 'success',
		requestedAt: req.requestTime,
		data: null,
	});
});