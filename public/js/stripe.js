/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe( 'pk_test_51H1jdnGVKpd6RqE4s8rsdsMzVNEdjUd7wNuHR6wSRlJziQFVtWmuGVRMHHeOExSYnYaaR5hdRMIW5wMHR84IVRHs00sI03qr5Y' );

export const bookTour = async tourId =>
{
	try
	{
		// 1) get checkout session from the server
		const session = await axios( `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}` );
		console.log( session );

		// 2) create checkout form + process payment
		await stripe.redirectToCheckout( { sessionId: session.data.session.id } );
	}
	catch ( err )
	{
		console.log( err );
		showAlert( 'error', err );
	}
};