var async = require('async'),
    request = require('request'),
    _ = require('underscore'),
    keystone = require('keystone');

var q = require('q'); // Promise Library for .then()

var Restaurant = keystone.list('Restaurant');
var Item = keystone.list('Item');
var Option = keystone.list('Option');

// TODO:
// when the area expands, need to put a .where() conditioned on the user's location
// also need to but a condition on res.locals (user birthday) to filter alcohol stores

// protocol thought: call every 10 min in bulk asking seperate packaging, also negotiate call priority over those in line
// also need to have interface to text when order recieved/delegate orders to carrier users
// get all restaurants
var something = Restaurant.model.find().where('state','published').sort('name').exec(function(err, restaurants){return restaurants});

// Get current day
var date = new Date();
var weekday = new Array(7);
weekday[0]=  "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";

var day = weekday[date.getDay()];

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

    // we can populate categories on posts using mongoose's populate

    Item.model.find().where('restaurant', id).exec(function(err,items){
        keystone.populateRelated(items, 'option', function(err){
            var rtn = _.map(items, function(r) {
                //console.log(r);
                return _.pick(r,'_id','description','name','restaurant','sortOrder','updatedAt','price','option')
            });
            //console.log(rtn);
            Restaurant.model.find().where('_id', id).where('state','published').exec(function(err, restaurant_byid){
                var restaurant = {
                        _id: restaurant_byid[0]._id,
                        description: restaurant_byid[0].description,
                        name: restaurant_byid[0].name,
                        place: restaurant_byid[0].place,
                        address: restaurant_byid[0].address,
                        location: restaurant_byid[0].location,
                        photo_secure_url: restaurant_byid[0].photo.secure_url,
                        Monday: restaurant_byid[0].Monday,
                        Tuesday: restaurant_byid[0].Tuesday,
                        Wednesday: restaurant_byid[0].Wednesday,
                        Thursday: restaurant_byid[0].Thursday,
                        Friday: restaurant_byid[0].Friday,
                        Saturday: restaurant_byid[0].Saturday,
                        Sunday: restaurant_byid[0].Sunday
                    }

                restaurant.items = rtn;
                res.send(restaurant);

            });
        });
    });

    /*

    Restaurant.model.find().where('_id', id).where('state','published').exec(function(err, restaurant) {

        keystone.populateRelated(restaurant, 'item', function(err){
            var rtn = _.map(restaurant, function(r) {
                //var allKeys = _.keys(r);
                //return _.pick(r, allKeys);

                var something = [];
                 for (var i = 0; i < r.item.length; i++) {
                    //encapsulate each item which is a dictionary into an array since keystone.populateRelated function only takes objects [{}]
                    var array = [r.item[i]];
                    //console.log(array);

                    keystone.populateRelated(array, 'option', function(err){
                        var rtn2 = _.map(array, function(r2) {
                            //var allKeys = _.keys(r);
                            //return _.pick(r, allKeys);
                            return _.pick(r2,'_id','description','name','restaurant','sortOrder','updatedAt','price','option')
                        });
                        console.log(rtn2);
                        something.push(rtn2);
                    });
                };

                return _.pick(r,'_id','description','name','maxRSVPs','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','photo','state','item')
            });

            //res.send(rtn);
            
        });
    });
    */

};



exports.findItems = function (req, res, next) {
    var id = req.params.id;
    var restaurants = something.emitted.complete[0];
    var restaurant_id = restaurants[id]._id;

    var restaurant_items =  Item.model.find().where('restaurant', restaurant_id).exec(function(err, items) {
        console.log(items);
        res.send(items);
    });
};

// can be used as findMap (click to see location on map) or something else
/*
exports.findReports = function (req, res, next) {
    var id = parseInt(req.params.id),
        response,
        reports = [],
        employee;

    response = {
        id: id,
        firstName: employees[id].firstName,
        lastName: employees[id].lastName,
        title: employees[id].title,
        pic: employees[id].pic
    }

    for (var i=0; i<employees.length; i++) {
        employee = employees[i];
        if (employee.managerId === id) {
            reports.push({id: employee.id, firstName: employee.firstName, lastName: employee.lastName, title: employee.title, pic: employee.pic});
        }
    }

    response.reports = reports;

    res.send(response);
};
*/

/*
var employees = [
    {"id": 0, "firstName": "James", "lastName": "King", "reports": 4, "title": "President and CEO", "department": "Corporate", "cellPhone": "617-000-0001", "officePhone": "781-000-0001", "email": "jking@fakemail.com", "city": "Boston, MA", "pic": "James_King.jpg", "twitterId": "@fakejking", "blog": "http://coenraets.org"},
    {"id": 1, "firstName": "Julie", "lastName": "Taylor", "managerId": 0, "managerName": "James King", "reports": 2, "title": "VP of Marketing", "department": "Marketing", "cellPhone": "617-000-0002", "officePhone": "781-000-0002", "email": "jtaylor@fakemail.com", "city": "Boston, MA", "pic": "Julie_Taylor.jpg", "twitterId": "@fakejtaylor", "blog": "http://coenraets.org"},
    {"id": 2, "firstName": "Eugene", "lastName": "Lee", "managerId": 0, "managerName": "James King", "reports": 0, "title": "CFO", "department": "Accounting", "cellPhone": "617-000-0003", "officePhone": "781-000-0003", "email": "elee@fakemail.com", "city": "Boston, MA", "pic": "Eugene_Lee.jpg", "twitterId": "@fakeelee", "blog": "http://coenraets.org"},
    {"id": 3, "firstName": "John", "lastName": "Williams", "managerId": 0, "managerName": "James King", "reports": 3, "title": "VP of Engineering", "department": "Engineering", "cellPhone": "617-000-0004", "officePhone": "781-000-0004", "email": "jwilliams@fakemail.com", "city": "Boston, MA", "pic": "John_Williams.jpg", "twitterId": "@fakejwilliams", "blog": "http://coenraets.org"},
    {"id": 4, "firstName": "Ray", "lastName": "Moore", "managerId": 0, "managerName": "James King", "reports": 2, "title": "VP of Sales", "department": "Sales", "cellPhone": "617-000-0005", "officePhone": "781-000-0005", "email": "rmoore@fakemail.com", "city": "Boston, MA", "pic": "Ray_Moore.jpg", "twitterId": "@fakermoore", "blog": "http://coenraets.org"},
    {"id": 5, "firstName": "Paul", "lastName": "Jones", "managerId": 3, "managerName": "John Williams", "reports": 0, "title": "QA Manager", "department": "Engineering", "cellPhone": "617-000-0006", "officePhone": "781-000-0006", "email": "pjones@fakemail.com", "city": "Boston, MA", "pic": "Paul_Jones.jpg", "twitterId": "@fakepjones", "blog": "http://coenraets.org"},
    {"id": 6, "firstName": "Paula", "lastName": "Gates", "managerId": 3, "managerName": "John Williams", "reports": 0, "title": "Software Architect", "department": "Engineering", "cellPhone": "617-000-0007", "officePhone": "781-000-0007", "email": "pgates@fakemail.com", "city": "Boston, MA", "pic": "Paula_Gates.jpg", "twitterId": "@fakepgates", "blog": "http://coenraets.org"},
    {"id": 7, "firstName": "Lisa", "lastName": "Wong", "managerId": 1, "managerName": "Julie Taylor", "reports": 0, "title": "Marketing Manager", "department": "Marketing", "cellPhone": "617-000-0008", "officePhone": "781-000-0008", "email": "lwong@fakemail.com", "city": "Boston, MA", "pic": "Lisa_Wong.jpg", "twitterId": "@fakelwong", "blog": "http://coenraets.org"},
    {"id": 8, "firstName": "Gary", "lastName": "Donovan", "managerId": 1, "managerName": "Julie Taylor", "reports": 0, "title": "Marketing Manager", "department": "Marketing", "cellPhone": "617-000-0009", "officePhone": "781-000-0009", "email": "gdonovan@fakemail.com", "city": "Boston, MA", "pic": "Gary_Donovan.jpg", "twitterId": "@fakegdonovan", "blog": "http://coenraets.org"},
    {"id": 9, "firstName": "Kathleen", "lastName": "Byrne", "managerId": 4, "managerName": "Ray Moore", "reports": 0, "title": "Sales Representative", "department": "Sales", "cellPhone": "617-000-0010", "officePhone": "781-000-0010", "email": "kbyrne@fakemail.com", "city": "Boston, MA", "pic": "Kathleen_Byrne.jpg", "twitterId": "@fakekbyrne", "blog": "http://coenraets.org"},
    {"id": 10, "firstName": "Amy", "lastName": "Jones", "managerId": 4, "managerName": "Ray Moore", "reports": 0, "title": "Sales Representative", "department": "Sales", "cellPhone": "617-000-0011", "officePhone": "781-000-0011", "email": "ajones@fakemail.com", "city": "Boston, MA", "pic": "Amy_Jones.jpg", "twitterId": "@fakeajones", "blog": "http://coenraets.org"},
    {"id": 11, "firstName": "Steven", "lastName": "Wells", "managerId": 3, "managerName": "John Williams", "reports": 0, "title": "Software Architect", "department": "Engineering", "cellPhone": "617-000-0012", "officePhone": "781-000-0012", "email": "swells@fakemail.com", "city": "Boston, MA", "pic": "Steven_Wells.jpg", "twitterId": "@fakeswells", "blog": "http://coenraets.org"}
];
*/




///////////////////////////////////////////////////
// Demonstration code for employees example above
/*
    var name = req.query.name;
    if (name) {
        res.send(employees.filter(function(employee) {
            return (employee.firstName + ' ' + employee.lastName).toLowerCase().indexOf(name.toLowerCase()) > -1;
        }));
    } else {
        res.send(employees);
    }
*/

///////////////////////////////////////////////////
// Item Prototype
/*
    Item.model.find().where('restaurant', '5407d2641691b8512c3140cd').exec(function(err, items) {
        console.log(items);
    });

*/

///////////////////////////////////////////////////
//Prototypes
/*

    Restaurant.model.find().where('item').in([Item.id]).exec(function(err, restaurants) {
        console.log(restaurants);
        res.send(restaurants);
    // ...
    });
*/
/*

    Post.model.find().where('categories').in([category.id]).exec(function(err, posts) {
        // ...
    });
*/
/*
    view.query('restaurants',
        Restaurant.model.find()
            .where('state', 'published')
            .sort('name')
    , 'items[what]');
*/


