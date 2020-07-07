const nodemailer = require( 'nodemailer' );
const pug = require( 'pug' );
const htmlToText = require( 'html-to-text' );

module.exports = class email
{
	constructor( user, url )
	{
		this.to = user.email;
		this.firstName = user.name.split( ' ' )[ 0 ];
		this.url = url;
		this.from = `Popoy Vargas <${process.env.EMAIL_FROM}>`;
		console.log( this.from );
	}

	newTransport()
	{
		if ( process.env.NODE_ENV === 'production' )
		{
			return nodemailer.createTransport(
			{
				service: 'SendGrid',
				auth:
				{
					user: process.env.SENDGRID_USERNAME,
					pass: process.env.SENDGRID_PASSWORD
				}
			});
		}

		return nodemailer.createTransport(
		{
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			auth:
			{
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		});
	}

	// send the actual email
	async send( template, subject )
	{
		// 1) render HTML based on a pug template
		const html = pug.renderFile( `${__dirname}/../views/emails/${template}.pug`,
		{
			firstName: this.firstName,
			url: this.url,
			subject
		});

		// 2) define email options
		const mailOptions =
		{
			from: this.from,
			to: this.to,
			subject,
			html,
			text: htmlToText.fromString( html )
		};
		console.log( this.from, this.to );
		// 3. create a transport and send email
		await this.newTransport().sendMail( mailOptions );
	}

	async sendWelcome()
	{
		await this.send( 'welcome', 'Welcome to Natours!' );
	}

	async sendPasswordReset()
	{
		await this.send( 'passwordReset', 'Your password reset token (valid for only 10 minutes' );
	}
};
/* 
const sendEmail = async options =>
{
	const transporter = nodemailer.createTransport(
	{
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		auth:
		{
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD
		}
	});
	
	const mailOptions =
	{
		from: 'Admin <admin@example.com',
		to: options.email,
		subject: options.subject,
		text: options.message,
		// html: 
	};
	
	await transporter.sendMail( mailOptions );
};

module.exports = sendEmail;
 */