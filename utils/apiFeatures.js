module.exports = class
{
	constructor( query, requestQuery )
	{
		this.query = query;
		this.requestQuery = requestQuery;
	}

	filter()
	{
		const queryObj = { ...this.requestQuery };	// creates a (separate) "hard" copy
		const excludedParams = [ 'page', 'sort', 'limit', 'fields' ];
		excludedParams.forEach( el => delete queryObj[ el ] );
		let queryStr = JSON.stringify( queryObj );
		queryStr = queryStr.replace( /\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

		this.query = this.query.find( JSON.parse( queryStr ) );

		return this;
	}

	sort()
	{
		if ( this.requestQuery.sort )
		{
			/**
			 * ascending by default, for descending, prepend with a "-"
			 * multiple sorting parameter, space-separated
			 */
			const sortBy = this.requestQuery.sort.split( ',' ).join( ' ' );
			this.query = this.query.sort( sortBy );
		}
		else
		{
			this.query = this.query.sort( '-createdAt' );	// default sorting
		}

		return this;
	}

	limitFields()
	{
		if ( this.requestQuery.fields )
		{
			const fields = this.requestQuery.fields.split( ',' ).join( ' ' );
			this.query = this.query.select( fields );
		}
		else
		{
			this.query = this.query.select( '-__v' );	// exludes with "-" prefix
		}

		return this;
	}

	paginate()
	{
		const page = this.requestQuery.page * 1 || 1;
		const limit = this.requestQuery.limit * 1 || 100;
		const skip = ( page -1 ) * limit;

		this.query = this.query.skip( skip ).limit( limit );

		return this;
	}
};