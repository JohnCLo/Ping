var async = require('async'),
	keystone = require('keystone'),
	RSVP = keystone.list('RSVP'),
	User = keystone.list('User'),
	Post = keystone.list('Post');

exports.createNew = function (req, res, next) {

	var userId = req.body.userId;

	var new_title = req.body.title;
	var content = req.body.content;

	var lat = req.body.lat;
	var lon = req.body.lon;

	console.log(lat);


	keystone.list('User').model.findOne({ _id: userId }).exec(function(err, user) {
		console.log(user);

		//console.log(res.locals);

		// Create New Order Item //////////////////////
		var newPost = new Post.model({
		    title: new_title
		});
		 
		newPost.state = 'published';
		newPost.author = user._id;
		newPost.content.brief = req.body.content;
		newPost.location.geo = [req.body.lat, req.body.lon];
		 
		newPost.save(function(err) {
			//console.log(err);
		    // post has been saved
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
	});
}
