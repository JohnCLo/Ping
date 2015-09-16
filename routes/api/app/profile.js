var async = require('async'),
	keystone = require('keystone'),
	RSVP = keystone.list('RSVP'),
	_ = require('underscore'),
	User = keystone.list('User');

var stripe = require('stripe')("sk_test_1Mzo0CdUfkPbwLnYWVRzHWlj");

exports.updateBasic = function (req, res, next) {
	console.log(req.body);
	var userId = req.body.userId;
	var email = req.body.email;
	var phoneNumber = req.body.phoneNumber;

	console.log(userId);
	console.log(email);
	console.log(phoneNumber);
 
	async.series([	
		// Check for user by email
		function(next) {
			
			console.log('[api.app.profile]  - Searching for existing users via [' + email + '] email address...');
			console.log('------------------------------------------------------------');
			
			var query = User.model.findOne();
				query.where('email', email);
				query.where('')
				query.exec(function(err, user) {
					if (err) {
						console.log('[api.app.profile]  - Error finding existing user via email.', err);
						console.log('------------------------------------------------------------');
						return next({ message: 'Sorry, there was an error processing your information, please try again.' });
					}
					// originally if (user){}
					// we use the != operator to skip the case if the email matches the current user's email
					if (user._id != userId) {
						console.log(user._id);
						console.log(userId);
						console.log('[api.app.profile]  - Found existing user via email address...');
						console.log('------------------------------------------------------------');
						return next({ message: 'There\'s already an account with that email address, please sign-in instead.' });
					}
					return next();
				});
		},
		
		// Create user
		function(next) {
		
			console.log('[api.app.profile]  - Updating User...');
			console.log('------------------------------------------------------------');
			
			keystone.list('User').model.findOne({ _id: userId }).exec(function(err, user) {

				user.getUpdateHandler(req).process(req.body, {
					fields:'email, phoneNumber',
					flashErrors: true
				}, function(err){

					if (err) {
						console.log('error');
						return res.apiResponse({
							success: false,
							message: (err && err.message ? err.message : false) || 'Sorry, there was an issue signing you in, please try again.'

						});
					}

					console.log('success')
					return res.apiResponse({
						success: true
					});
				});
			});
		}
		
	], function(err) {
		if (err) {
			console.log('[api.app.profile]  - Issue signing user in.', err);
			console.log('------------------------------------------------------------');
			return res.apiResponse({
				success: false,
				session: false,
				message: (err && err.message ? err.message : false) || 'Sorry, there was an issue signing you in, please try again.'
			});
		}
	});
}

exports.updatePayment = function (req, res, next) {

	var stripeToken = req.body.stripeToken;
	var userId = req.body.userId;

	console.log(stripeToken);
	console.log(userId);

	// var stripeToken ='tok_4zrBeUBqzpau38';
 
	keystone.list('User').model.findOne({ _id: userId }).exec(function(err, user) {
		console.log(user);

		stripe.customers.create({
		  card: stripeToken,
		  description: user.email
		})
		.then(function(customer) {
		  req.body.stripeCustomerId = customer.id;
		  //return stripeCharge;
		})
		.then(function(charge) {

			user.getUpdateHandler(req).process(req.body, {
				fields:'stripeCustomerId',
				flashErrors: true
			}, function(err){

					if (err) {
						console.log('error');
						return res.apiResponse({
							success: false
						});
					}

					console.log('success')
					return res.apiResponse({
						success: true
					});
			});
		})
	});
}




