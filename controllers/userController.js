const multer = require( 'multer' );
const sharp = require( 'sharp' );

const User = require( '../models/userModel' );
const catchAsync = require( '../utils/catchAsync' );
const AppError = require( '../utils/appError' );
const factory = require( './handlerFactory' );

// const multerStorage = multer.diskStorage(
// {
// 	destination: ( req, file, callback ) =>
// 	{
// 		callback( null, 'public/img/users' );	// first param is for error
// 	},
// 	filename: ( req, file, callback ) =>
// 	{
// 		const ext = file.mimetype.split( '/' )[ 1 ];
// 		// callback( null, `user-${req.currentUser.id}-${Date.now()}.${ext}}` );
// 		callback( null, `${req.currentUser.name.split( ' ' )[ 0 ].toLowerCase()}-${Date.now()}.${ext}` );
// 	}
// });
const multerStorage = multer.memoryStorage();

const multerFilter = ( req, file, callback ) =>
{
	if ( file.mimetype.startsWith( 'image' ) )
	{
		{callback( null, true );}
	}
	else
	{
		{callback( new AppError( 'Not an image! Please upload an image only!', 400 ), false );}
	}
};

const upload = multer(
{
	storage: multerStorage,
	fileFilter: multerFilter
});

const uploadUserPhoto = upload.single( 'photo' );

const resizeUserPhoto = catchAsync( async ( req, res, next ) =>
{
	if ( ! req.file ) {return next();}

	req.file.filename = `${req.currentUser.name.split( ' ' )[ 0 ].toLowerCase()}-${Date.now()}.jpeg`;

	await sharp( req.file.buffer ).resize( 500, 500 ).toFormat( 'jpeg' ).jpeg( { quality: 90 } )
		.toFile( `public/img/users/${req.file.filename}` );

	next();
});

const filterObj = ( requestBodyObject, ...allowedFields ) =>
{
	const newObj = {};
	Object.keys( requestBodyObject ).forEach( el =>
	{
		if ( allowedFields.includes( el ) )
		
			{newObj[ el ] = requestBodyObject[ el ];}
		
	});

	return newObj;
};

const getMe = ( req, res, next ) =>
{
	req.params.id = req.currentUser.id;
	next();
};

const updateMe = catchAsync( async ( req, res, next ) =>
{
	// create error if user POSTs password data
	if ( req.body.password || req.body.passwordConfirm )
	
		{return next( new AppError( 'To update your passsword, please use the /update-my-password route!', 400 ) );}
	
	// rest parameters for fiels that are allowed to be updated
	const filteredRequestBody = filterObj( req.body, 'name', 'email' );

	if ( req.file )  {filteredRequestBody.photo = req.file.filename;} 

	const updatedUser = await User.findByIdAndUpdate( req.currentUser.id, filteredRequestBody, { new: true, runValidators: true } );

	res.status( 200 ).json(
	{
		status: 'success',
		requestedAt: req.requestTime,
		data: { user: updatedUser }
	});
});

const deleteMe = catchAsync( async ( req, res, next ) =>
{
	const user = await User.findByIdAndUpdate( req.currentUser.id, { active: false } );
	res.status( 204 ).json(
	{
		status: 'success',
		requestedAt: req.requestTime,
		data: null
	});
});

const getAllUsers = factory.getAll( User );
const getUser = factory.getOne( User );
// const getMe = factory
// Do NOT update passwords with this!
const updateUser = factory.updateOne( User );
const deleteUser = factory.deleteOne( User );

module.exports = {
	getMe,
	uploadUserPhoto,
	resizeUserPhoto,
	updateMe,
	deleteMe,
	getAllUsers,
	getUser,
	updateUser,
	deleteUser,
};
