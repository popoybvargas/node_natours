/* eslint-disable */
export const hideAlert = () =>
{
	const el = document.querySelector( '.alert' );

	if ( el )
	{
		el.parentElement.removeChild( el );
	}
};

/**
 * 
 * @param {string} type either 'success' or 'error'
 * @param {string} message to be displayed as an alert
 */
export const showAlert = ( type, message, time = 7 ) =>
{
	hideAlert();
	const markup = `<div class="alert alert--${type}">${message}</div>`;
	document.querySelector( 'body' ).insertAdjacentHTML( 'afterbegin', markup );
	window.setTimeout( hideAlert, time * 1000 );
};