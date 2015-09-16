var async = require('async'),
	keystone = require('keystone'),
	RSVP = keystone.list('RSVP'),
	User = keystone.list('User'),
	Order = keystone.list('Order');


// Set your secret key: remember to change this to your live secret key in production
// See your keys here https://dashboard.stripe.com/account
var stripe = require('stripe')("sk_test_1Mzo0CdUfkPbwLnYWVRzHWlj");

// (Assuming you're using express - expressjs.com)
// Get the credit card details submitted by the form

exports.stripeNewCharge = function (req, res, next) {
	//if user does not have stripe token
	var stripeToken = req.body.stripeToken;
	// redundant with req.user using passport auth
	var userId = req.body.userId;
	var items = req.body.items;
	var total_amount = req.body.total;
	var phoneNumber = req.body.phoneNumber;
	// var stripeToken ='tok_4zrBeUBqzpau38';
	console.log(items);


	//console.log(stripeToken);
	//console.log(items);
	//console.log(userId);
	//console.log(req.body);
	//console.log(res.locals.user.email);

	//console.log(res.locals.user.stripeCustomerId);

	//var hello = User.model.findOne({ email: 'first@c.harvard.edu'}).exec(function(err, users){return users});

	//console.log(hello);

	keystone.list('User').model.findOne({ _id: userId }).exec(function(err, user) {
		console.log(user);

		//console.log(res.locals);

		// Create New Order Item //////////////////////
		var newOrder = new Order.model({
		    amount: total_amount
		});
		 
		newOrder.state = 'ordered';
		newOrder.who = user._id;
		newOrder.itemsOrdered = req.body.itemsOrdered;
		newOrder.total = req.body.total;
		 
		newOrder.save(function(err) {
			//console.log(err);
		    // post has been saved	
		});

		// if user has a Customer Id
		if (user.stripeCustomerId) {

			var customerId = user.stripeCustomerId;

			stripe.charges.create({
			  amount: total_amount * 100, // amount in cents, again
			  currency: "usd",
			  customer: customerId
			}, function(err, customer) {
			  //console.log(err, customer);
			  //return next();
			  if (err){
			  	return res.apiResponse({
					success: false
			  	});

			  } else {
			  	return res.apiResponse({
					success: true
			  	});
			  }
			});
		// if User does not have a customer ID, charge, then create customer ID
		} else {
			stripe.customers.create({
			  card: stripeToken,
			  description: user.email
			})
			.then(function(customer) {
			  //console.log(customer)
			  var stripeCharge = stripe.charges.create({
			  	// pass me total amount in cents
			    amount: total_amount * 100, // amount in cents, again
			    currency: "usd",
			    customer: customer.id
			  });

			  req.body.stripeCustomerId = customer.id;
			  return stripeCharge;
			})
			.then(function(charge) {
				// really need to use req.body
				//console.log(req.body);
				//console.log(req.user);
				user.getUpdateHandler(req).process(req.body, {
					fields:'stripeCustomerId, phoneNumber',
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
		};
	});
}


// Customer Object
// { object: 'customer',
//   created: 1413855575,
//   id: 'cus_4zrLsYtFD5VGKq',
//   livemode: false,
//   description: 'payinguser@example.com',
//   email: null,
//   delinquent: false,
//   metadata: {},
//   subscriptions: 
//    { object: 'list',
//      total_count: 0,
//      has_more: false,
//      url: '/v1/customers/cus_4zrLsYtFD5VGKq/subscriptions',
//      data: [],
//      count: 0 },
//   discount: null,
//   account_balance: 0,
//   currency: null,
//   cards: 
//    { object: 'list',
//      total_count: 1,
//      has_more: false,
//      url: '/v1/customers/cus_4zrLsYtFD5VGKq/cards',
//      data: [ [Object] ],
//      count: 1 },
//   default_card: 'card_4zrLuO1dwAQFhe',
//   active_card: 
//    { id: 'card_4zrLuO1dwAQFhe',
//      object: 'card',
//      last4: '4242',
//      brand: 'Visa',
//      funding: 'credit',
//      exp_month: 11,
//      exp_year: 2015,
//      fingerprint: '7PFaPwSHDkd2iGhw',
//      country: 'US',
//      name: 'undefined',
//      address_line1: 'undefined',
//      address_line2: 'undefined',
//      address_city: 'undefined',
//      address_state: 'undefined',
//      address_zip: 'undefined',
//      address_country: 'undefined',
//      cvc_check: 'pass',
//      address_line1_check: 'pass',
//      address_zip_check: 'pass',
//      dynamic_last4: null,
//      customer: 'cus_4zrLsYtFD5VGKq',
//      type: 'Visa' },
//   subscription: null }



