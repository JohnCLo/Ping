// expects an array instead of object
// http://stackoverflow.com/questions/20041306/angular-js-how-fix-error-resourcebadcfg-error-in-resource-configuration-e

angular.module('directory.services', ['ngResource', 'ionic'])
    // .constant('baseUrl', 'http://pronto.aws.af.cm')
    .constant('baseUrl', 'http://ping.aws.af.cm')
    .factory('Restaurants', function ($resource, baseUrl) {
		var myCart = new shoppingCart("AngularStore");
		myCart.addCheckoutParameters("PayPal", "paypaluser@youremail.com");
		myCart.addCheckoutParameters("Google", "xxxxxxx", {
			ship_method_name_1: "UPS Next Day Air",
			ship_method_price_1: "20.00",
			ship_method_currency_1: "USD",
			ship_method_name_2: "UPS Ground",
			ship_method_price_2: "15.00",
			ship_method_currency_2: "USD"
		}
		);
		myCart.addCheckoutParameters("Stripe", "pk_test_EM2utI4NMbHpgGeQpUt9QHT8", {
			chargeurl: "https://localhost:1234/processStripe.aspx"
		});
		return {
			restaurants: $resource(baseUrl + '/posts/:postId/:data'),
			cart: myCart
		};
    })

	// .factory('User', ['$resource', 'SERVER_URL', function($resource, SERVER_URL) {
	// 	return $resource(SERVER_URL + '/api/users/:id', {id : '@id'}, {
	// 		update: { method: 'PUT' }
	// 	});
	// }])
    // .factory('User',function(localStorageService){

    // })

.factory('ClockSrv', function($interval,$rootScope){
  var clock = null;
  var weekday = new Array(7);
  weekday[0] = "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";
  var service = {
    startClock: function(restaurant){
        // console.log('startClock');
        var fn = function (){
        var today = new Date();
        var todayDay = today.getDay();
        var hourNow = today.getHours();
        var minNow = today.getMinutes();
        if(hourNow<10) hourNow='0'+hourNow;
        if(minNow<10) minNow='0'+minNow;
        var timeNow = hourNow + ':' + minNow;

        var restaurantDay = weekday[todayDay];

        if(hourNow >= 0 && hourNow < 5){ // if it's passed midnight
            if(todayDay == 0)
              todayDay = 7;
            restaurantDay = weekday[(todayDay-1)];

            var openDay = new Date();
            openDay.setDate(openDay.getDate() - 1);
            openDate = (openDay.getMonth()+1) +'/'+ openDay.getDate() +'/'+ openDay.getFullYear();
            todayDate = (today.getMonth()+1) +'/'+ today.getDate() +'/'+ today.getFullYear();

            var openingHours = restaurant[restaurantDay];
            hours = openingHours.trim().split('-');
            
            var open = new Date(openDate +" "+ hours[0]);          
            var close = new Date (todayDate +" "+ hours[1]);
            var now = new Date (todayDate +" "+timeNow);

            if (!(now > open && now < close)) {
                $rootScope.$broadcast('restaurantClosed');
                service.stopClock();
            // } else {
                // return false;
            }
        } else {
          todayDate = (today.getMonth()+1) +'/'+ today.getDate() +'/'+ today.getFullYear();

          // console.log(restaurant);
        var openingHours = restaurant[restaurantDay];
        hours = openingHours.trim().split('-');
        
        var closeDay = new Date();
        if ((Date.parse('01/01/2011 '+hours[1]) > Date.parse('01/01/2011 00:00')) 
          && (Date.parse('01/01/2011 '+hours[1]) < Date.parse('01/01/2011 05:00'))){
          closeDay.setDate(closeDay.getDate() + 1);
        }
        // console.log(hours[1]);
        // console.log(hours[1]>"00:00");
        closeDate = (closeDay.getMonth()+1) +'/'+ closeDay.getDate() +'/'+ closeDay.getFullYear();

        var open = new Date(todayDate +" "+ hours[0]);          
        var close = new Date (closeDate +" "+ hours[1]);
        var now = new Date (todayDate +" "+timeNow);

        if (!(now > open && now < close)) {
        // if ((now > open && now < close)) { // for testing, comment out later
            $rootScope.$broadcast('restaurantClosed');
            service.stopClock();
        }
          }
        };

      if(clock === null){
        clock = $interval(fn, 1000);
        // console.log('current',clock.$$intervalId);
      }
    },
    stopClock: function(){
        // console.log('stopClock', clock);
      if(clock !== null){
        $interval.cancel(clock);
        clock = null;
      }
    }
  };

  return service;
})

    .factory('Orders', function(){
        var Orders = {
            data: {},
        };
        return Orders;
    })
    .factory('Session', function(localStorageService){
        var Session = {
            data: {},
            storeSessionInfo: function(data) {
                localStorage.setItem( 'session_date', data.date );
                localStorage.setItem( 'session_userId', data.userId );
            },
            populateSession: function(data) {
                _.extend(Session.data, _.pick(data, 'date', 'userId'));
            },
            // resumeSession: function(){
            //     var session = {
            //         date: localStorage.getItem('session_date'),
            //         userId: localStorage.getItem('session_userId'),
            //     };
            //     Session.populateSession(session);
            // }
        };
        return Session;
    })

    // Supposed to load rsvps, meetups, talks related to the server, but commented out
    .factory('Status', function(Session, Orders, baseUrl, localStorageService){
        var Status = {
            getStatus: function(callback){
                var apiData = {};
                if (Session.data.userId) 
                    apiData.user = Session.data.userId;

                var success = function(data) {
                    // console.log(data);
                    if (data.orders) {
                        Orders.data = data.orders; 
                        localStorage['orders']=JSON.stringify(data.orders);
                    }
                    
                    if (apiData.user && data.user) {
                        Session.data = data.user;
                    }
                    
                    if (callback) return callback(false);
                };
                
                var error = function() {
                    if (callback) return callback(true);
                };
                
                $.ajax({
                    url: baseUrl + '/api/app/status',
                    type: 'post',
                    data: apiData,
                    dataType: 'json',
                    cache: false,
                    success: function(data) {
                        console.log('status success',data);
                        return success(data);
                    },
                    error: function() {
                        return error();
                    }
                });
            }
        };
        return Status;
    })
    .factory('Authentication', function ($http, baseUrl){
        return {
            byEmail: function(data){
                return $http({
                    url: baseUrl + '/api/app/signin-email',
                    method: 'post',
                    data: data,
                    responseType: 'json',
                    cache: false,
                  });
            },
            signUp: function(data){
                return $http({
                    url: baseUrl + '/api/app/signup-email',
                    method: 'post',
                    data: data,
                    responseType: 'json',
                    cache: false,
                  });
            },
            signUpByService: function(data){
                return $http({
                    url: baseUrl + '/api/app/signin-service',
                    method: 'post',
                    data: data,
                    responseType: 'json',
                    cache: false,
                  });
            },
            byService: function(data){
                return $http({
                    url: baseUrl + '/api/app/signin-service-check',
                    method: 'post',
                    data: data,
                    responseType: 'json',
                    cache: false,
                  });
            },
            updateInfo: function(data){
                return $http({
                    url: baseUrl + '/api/app/profile/update/basic/',
                    method: 'post',
                    data: data,
                    responseType: 'json',
                    cache: false,
                  });
            }
        }
    })

    .factory('StripeService', function($http, baseUrl){
        return {
            chargeNew: function(data){
                return $http({
                    url: baseUrl + '/api/app/stripe/new/',
                    method: 'post',
                    data: data,
                    responseType: 'json',
                    cache: false,
                  });
            },
            updateCredit: function(data){
                return $http({
                    url: baseUrl + '/api/app/profile/update/payment/',
                    method: 'post',
                    data: data,
                    responseType: 'json',
                    cache: false,
                  });
            }
        }
    })
    .factory('PopUpService', function(){
        var Popup = {
            isShown: false,
            setIsShown: function(tf) {
                Popup.isShown = tf;
            }
        }
        return Popup;
    })
    .factory('GlobalTimerService', function($timeout){
        var GlobalTimer = {
            timer: null,
            setTimer: function(t) {
                GlobalTimer.timer = t;
            },
            cancelTimer: function(){
                $timeout.cancel(GlobalTimer.timer);
                GlobalTimer.timer = null;
            }
        }
        return GlobalTimer;
    })
;