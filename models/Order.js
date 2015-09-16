var keystone = require('keystone'),
	async = require('async'),
	Types = keystone.Field.Types;

/**
 * Orders Model
 * ===========
 */

var Order = new keystone.List('Order');

Order.add({
	state: { type: Types.Select, options: 'ordered, processed, onroute, delivered', default: 'ordered', index: true },
	who:  { type: Types.Relationship, ref: 'User', index: true },
	restaurants : { type: Types.Relationship, ref: 'Restaurant', many: true },
	deliveryLocation : { type: Types.Location, index: true },
	itemsOrdered: { type: Types.Relationship, ref: 'Item', many:true},
	total: { type: Types.Money, index: true },
	createdAt: { type: Date, noedit: true, collapse: true, default: Date.now },

});

/**
 * Virtuals
 * ========
 */

Order.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});


/**
 * Relationships
 * =============
 */

//Order.relationship({ ref: 'OrderComment', refPath: 'Order', path: 'comments' });


/**
 * Notifications
 * =============
 */

Order.schema.methods.notifyAdmins = function(callback) {
	
	var order = this;
	
	// Method to send the notification email after data has been loaded
	var sendEmail = function(err, results) {
		
		if (err) return callback(err);
		
		async.each(results.admins, function(admin, done) {
			
			new keystone.Email('admin-notification-new-order').send({
				admin: admin.name.first || admin.name.full,
				author: results.author ? results.author.name.full : 'Somebody',
				title: order.title,
				keystoneURL: 'http://www.sydjs.com/keystone/order/' + order.id,
				subject: 'New Order to SydJS'
			}, {
				to: admin,
				from: {
					name: 'SydJS',
					email: 'contact@sydjs.com'
				}
			}, done);
			
		}, callback);
		
	}
	
	// Query data in parallel
	async.parallel({
		author: function(next) {
			if (!order.author) return next();
			keystone.list('User').model.findById(order.author).exec(next);
		},
		admins: function(next) {
			keystone.list('User').model.find().where('isAdmin', true).exec(next)
		}
	}, sendEmail);
	
}


/**
 * Registration
 * ============
 */

/*Order.addPattern('standard meta');*/
Order.defaultSort = '-publishedDate';
Order.defaultColumns = 'createdAt|20% state|20%, who|20%, amount|20%';
Order.register();
