/* eslint-disable */

export const displayMap = locations =>
{
	mapboxgl.accessToken = 'pk.eyJ1IjoicG9wb3l2YXJnYXMiLCJhIjoiY2tjNXk3eWhhMG1nNzJxbnY3cGkwNHc4OCJ9.5m7Qo_brxQyP9tEFgnLhiA';

	const map = new mapboxgl.Map(
	{
		container: 'map',
		style: 'mapbox://styles/popoyvargas/ckc5yibxf0rmt1iplstcjkwxy',
		scrollZoom: false,
		// center: [ -118.113491, 34.111745 ],
		// zoom: 10,
		// interactive: false
	});

	const bounds = new mapboxgl.LngLatBounds();

	locations.forEach( loc =>
	{
		const el = document.createElement( 'div' );
		el.className = 'marker';

		new mapboxgl.Marker(
		{
			element: el,
			anchor: 'bottom'
		}).setLngLat( loc.coordinates ).addTo( map );

		new mapboxgl.Popup(
		{
			offset: 30
		}).setLngLat( loc.coordinates ).setHTML( `<p>Day ${loc.day}: ${loc.description}</p>` ).addTo( map );

		bounds.extend( loc.coordinates );
	});

	map.fitBounds( bounds,
	{
		padding:
		{
			top: 200,
			bottom: 150,
			left: 100,
			right: 100
		}
	});
}