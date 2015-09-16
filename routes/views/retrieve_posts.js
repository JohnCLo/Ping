var async = require('async'),
    request = require('request'),
    _ = require('underscore'),
    keystone = require('keystone');

var q = require('q'); // Promise Library for .then()

var Post = keystone.list('Post');

var something = Post.model.find().where('state','published').sort('name').exec(function(err, posts){return posts});

// change these damn variable names items, something!!!
exports.findAll = function (req, res, next) {
    var name = req.query.name;
    var items = something.emitted.complete[0];
    if (name) {
        res.send(something.filter(function(something) {
            return (items.name).toLowerCase().indexOf(name.toLowerCase()) > -1;
        }));
    } else {
        res.send(items);
    }
    // need to filter 'off' restaurants that are closed
};

// FUCKING CHANGE THIS SYNCHRONOUS STREAM INTO PROMISE STATEMENTS!

// in the template the get request passes object _id so req.params.id = _id
// loads restaurant details and restaurant items
exports.findById = function (req, res) {

    var id = req.params.id;
    
    Post.model.find().where('_id', id).where('state','published').exec(function(err, post_byid) {
        if (err){
            console.log('error posts');
        } else {
            res.send(post_byid);
            console.log(post_byid);
        }
    });
};

