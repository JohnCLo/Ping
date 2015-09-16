var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Restaurants Model
 * =============
 */

var Restaurant = new keystone.List('Restaurant');

Restaurant.add({
	name: { type: String, required: true, initial: true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	date: { type: Types.Date, required: true, initial: true, index: true },
	photo: { type: Types.CloudinaryImage },
	location: {type: Types.Location},
	description: { type: Types.Html, wysiwyg: true },

	// Opening Closing Hours
	Monday: { type: String, required: true, initial: true, width: 'short', default: '6:00pm - 9:00pm', note: 'e.g. 6:00pm - 9:00pm' },
	Tuesday: { type: String, required: true, initial: true, width: 'short', default: '6:00pm - 9:00pm'},
	Wednesday: { type: String, required: true, initial: true, width: 'short', default: '6:00pm - 9:00pm'},
	Thursday: { type: String, required: true, initial: true, width: 'short', default: '6:00pm - 9:00pm'},
	Friday: { type: String, required: true, initial: true, width: 'short', default: '6:00pm - 9:00pm'},
	Saturday: { type: String, required: true, initial: true, width: 'short', default: '6:00pm - 9:00pm'},
	Sunday: { type: String, required: true, initial: true, width: 'short', default: '6:00pm - 9:00pm'},

	holidays: { type: Types.Date, default: Date.now },
	maxRSVPs: { type: Number, default: 100 },
	totalRSVPs: { type: Number, noedit: true }
});


/**
 * Relationships
 * =============
 */

Restaurant.relationship({ ref: 'Item', refPath: 'restaurant', path: 'item' });
Restaurant.relationship({ ref: 'RSVP', refPath: 'restaurant', path: 'rsvps' });


/**
 * Virtuals
 * ========
 */

Restaurant.schema.virtual('remainingRSVPs').get(function() {
	if (!this.maxRSVPs) return -1;
	return Math.max(this.maxRSVPs - (this.totalRSVPs || 0), 0);
});

Restaurant.schema.virtual('rsvpsAvailable').get(function() {
	return (this.remainingRSVPs != 0);
});


/**
 * Methods
 * =======
 */

Restaurant.schema.methods.refreshRSVPs = function(callback) {
	
	var restaurant = this;
	
	keystone.list('RSVP').model.count()
		.where('restaurant').in([restaurant.id])
		.where('attending', true)
		.exec(function(err, count) {
			
			if (err) return callback(err);
			
			restaurant.totalRSVPs = count;
			restaurant.save(callback);
			
		});
	
}


/**
 * Registration
 * ============
 */

Restaurant.addPattern('standard meta');
Restaurant.defaultColumns = 'name, state|20%, date|20%';
Restaurant.register();
