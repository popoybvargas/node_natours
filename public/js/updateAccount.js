import axios from 'axios';
import { showAlert } from './alerts';

/**
 * 
 * @param {object} data 
 * @param {string} type either 'password' or 'profile'
 * @param {boolean} hasPhoto 
 */
export const updateAccount = async ( data, type, hasPhoto = false ) =>
{
	try
	{
		let url = '/api/v1/users/';
		url += ( type === 'password' ) ? 'update-my-password' : 'update-me';

		const res = await axios( { method: 'PATCH', url, data });

		if ( res.data.status === 'success' )
		{
			showAlert( 'success', `${type.toUpperCase()} updated successfully!` );

			if ( hasPhoto ) window.setTimeout( () =>location.assign( '/me', true ), 1000 );
		}
	}
	catch ( err )
	{
		showAlert( 'error', err.response.data.message );
	}
};