const crypto = require( 'crypto' );

const bcrypt = require( 'bcryptjs' );
// const process.env = require( 'zv-getprocess.env' )();
const jwt = require( 'jsonwebtoken' );
const mongoose = require( 'mongoose' );
const validator = require( 'validator' );

const userSchema = new mongoose.Schema(
{
	name:
	{
		type: String,
		trim: true,
		required: [ true, 'A user must have a name!' ]
	},
	email:
	{
		type: String,
		required: [ true, 'A user must have an email' ],
		unique: true,
		lowercase: true,
		validate: [ validator.isEmail, 'Please provide a valid email address!' ]
	},
	photo: { type: String, default: 'default.jpg' },
	role:
	{
		type: String,
		enum: [ 'user', 'guide', 'lead-guide', 'admin' ],
		default: 'user'
	},
	password:
	{
		type: String,
		trim: true,
		required: [ true, 'Pasword is required!' ],
		minlength: [ 8, 'Password must be at least 8-character long!' ],
		select: false
	},
	passwordConfirm:
	{
		type: String,
		trim: true,
		required: [ true, 'Pasword must be confirmed!' ],
		validate:
		{
			validator: function( el ) { return el === this.password; },	// only works for NEW DOCUMENTS (SAVE or CREATE)
			message: 'Passwords do not match!'
		}
	},
	passwordChangedAt:
	{
		type: Date,
		// default: Date.now()
	},
	passwordResetToken: String,
	passwordResetExpires: Date,
	active:
	{
		type: Boolean,
		default: true,
		select: false
	}
});

userSchema.pre( 'save', async function( next )
{
	if ( this.isModified( 'password' ) )
	{
		this.password = await bcrypt.hash( this.password, 12 );	// encryption cost set to 12
		this.passwordConfirm = undefined;

		if ( ! this.isNew )
		{
			this.passwordChangedAt = Date.now() - 1000;	// subtracting 1s to provide for possible time needed by the signing of new token
		}
	}
	next();
});

// userSchema.pre( 'save', async function( next )
// {

// 	next();
// });

// query middleware
userSchema.pre(  /^find/, function( next )
{
	this.find( { active: { $ne: false } } );
	next();
});

// instance method - available on all documents
userSchema.methods.correctPassword = async function( candidatePassword, userPassword )
{
	return await bcrypt.compare( candidatePassword, userPassword );
};

userSchema.methods.changedPasswordAfter = function( JWTTimestamp )
{
	if ( this.passwordChangedAt )
	{
		const changedTimestamp = parseInt( this.passwordChangedAt.getTime() / 1000, 10 );

		return changedTimestamp > JWTTimestamp;
	}
	return false;
};

userSchema.methods.signToken = function( id )
{
	// 1st param = payload, 2nd is a secret string, and 3rd param is for token header
	return jwt.sign( { id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION } );
};

userSchema.methods.createPasswordResetToken = function()
{
	const resetToken = crypto.randomBytes( 32 ).toString( 'hex' );
	this.passwordResetToken = crypto.createHash( 'sha256' ).update( resetToken ).digest( 'hex' );
	this.passwordResetExpires = Date.now() + ( 10 * 60 * 1000 );

	return resetToken;
};

const User = mongoose.model( 'User', userSchema );

module.exports = User;