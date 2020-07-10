/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateAccount } from './updateAccount';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

// DOM ELEMENTS
const mapBox = document.getElementById( 'map' );
const loginForm = document.getElementById( 'loginForm' );
const logoutBtn = document.querySelector( 'a.nav__el--logout' );
const updateAccountForm = document.getElementById( 'updateAccountForm' );
const updatePasswordForm = document.getElementById( 'updatePassword' );
const bookTourBtn = document.getElementById( 'bookTour' );
const alertMessage = document.querySelector( 'body' ).dataset.alert;

// VALUES

// DELEGATION
if ( mapBox )
{
	const locations = JSON.parse( mapBox.dataset.locations );
	displayMap( locations );
}

if ( loginForm )
{
	loginForm.addEventListener( 'submit', e =>
	{
		e.preventDefault();
		const email = document.getElementById( 'email' ).value;
		const password = document.getElementById( 'password' ).value;
		login( email, password );
	});
}

if ( logoutBtn )
{
	logoutBtn.addEventListener( 'click', logout );
}

if ( updateAccountForm )
{
	updateAccountForm.addEventListener( 'submit', e =>
	{
		e.preventDefault();
		const files = document.getElementById( 'photo' ).files;
		const formData = new FormData();
		formData.append( 'name', document.getElementById( 'name' ).value );
		formData.append( 'email', document.getElementById( 'email' ).value );
		formData.append( 'photo', files[ 0 ] );
		
		updateAccount( formData, 'profile', files );
	})
}

if ( updatePasswordForm )
{
	updatePasswordForm.addEventListener( 'submit', async e =>
	{
		const updatePasswordBtn = document.getElementById( 'updatePasswordBtn' );
		updatePasswordBtn.textContent = 'Updating...';
		updatePasswordBtn.disabled = true;
		e.preventDefault();
		// input elements
		const currentPasswordInput = document.getElementById( 'password-current' );
		const newPasswordInput = document.getElementById( 'password' );
		const newPasswordConfirmInput = document.getElementById( 'password-confirm' );

		// get values for updating
		const currentPassword = currentPasswordInput.value;
		const newPassword = newPasswordInput.value;
		const newPasswordConfirm = newPasswordConfirmInput.value;
		
		await updateAccount( { currentPassword, newPasswordConfirm, newPassword }, 'password' );

		// clear password fields
		currentPasswordInput.value = newPasswordInput.value = newPasswordConfirmInput.value = null;
		updatePasswordBtn.disabled = false;
		updatePasswordBtn.textContent = 'Save password';
	})
}

if ( bookTourBtn )
{
	bookTourBtn.addEventListener( 'click', e =>
	{
		e.target.textContent = 'Processing...';
		const { tourId } = e.target.dataset;
		bookTour( tourId );
	});
}

if ( alertMessage ) { showAlert( 'success', alertMessage, 20 ); }