angular.module('directory', ['ionic', 'directory.controllers', 'directory.services', ])

    .filter('dateToLocale', function() {
      return function(input) {
        var inputDate = new Date(input);
        var date = inputDate.toLocaleDateString().replace(/\b[a-z]+\b/gi,function($0){return $0.substring(0,3)});
        var ampm= 'am';
        var h= inputDate.getHours();
        var m= inputDate.getMinutes();
        if(h>= 12){
            if(h>12)h-= 12;
            ampm= 'pm';
        }
        if(h<10) h= '0'+h;
        if(m<10) m= '0'+m;
        var weekdayNames = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
        var weekday = weekdayNames[inputDate.getDay()];
        var dateString = weekday + ', ' + date;
        var input = dateString +' '+h+':'+m+' '+ampm;
        return input;
      };
    })

    .filter('titlecase', function() {
      return function(s) {
        s = ( s === undefined || s === null ) ? '' : s;
        return s.toString().toLowerCase().replace( /\b([a-z])/g, function(ch) {
            return ch.toUpperCase();
        });
      }
    })

    .filter('showIfOpen', function(){
      return function (restaurants) {
        var filtered = [];

        var weekday = new Array(7);
        weekday[0] = "Sunday";
        weekday[1] = "Monday";
        weekday[2] = "Tuesday";
        weekday[3] = "Wednesday";
        weekday[4] = "Thursday";
        weekday[5] = "Friday";
        weekday[6] = "Saturday";

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

            for (var i = 0; i < restaurants.length; i++) {
              var restaurant = restaurants[i];
              var openingHours = restaurant[restaurantDay];
              hours = openingHours.trim().split('-');

              var open = new Date(openDate +" "+ hours[0]);          
              var close = new Date (todayDate +" "+ hours[1]);
              var now = new Date (todayDate +" "+timeNow);

              if (now > open && now < close) {
                restaurant['url'] = "#/ping/restaurants/"+restaurant._id;
                restaurant['closed'] = false;
              } else {
                restaurant['url'] = "";
                restaurant['closed'] = true;
              }
              filtered.push(restaurant);
            }
        } else {
          todayDate = (today.getMonth()+1) +'/'+ today.getDate() +'/'+ today.getFullYear();
          
          for (var i = 0; i < restaurants.length; i++) {
            var restaurant = restaurants[i];
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
            // console.log(restaurant.name, now, open, close);
            if (now > open && now < close) {
              restaurant['url'] = "#/ping/restaurants/"+restaurant._id;
              restaurant['closed'] = false;
            } else {
              restaurant['url'] = "";
              restaurant['closed'] = true;
            }
            filtered.push(restaurant);
          }
        }
        return filtered;
      };

      // return function(restaurant){
      //   var weekday = new Array(7);
      //   weekday[0] = "Sunday";
      //   weekday[1] = "Monday";
      //   weekday[2] = "Tuesday";
      //   weekday[3] = "Wednesday";
      //   weekday[4] = "Thursday";
      //   weekday[5] = "Friday";
      //   weekday[6] = "Saturday";

      //   var today = new Date();
      //   var todayDay = today.getDay();
      //   var hourNow = today.getHours();
      //   var minNow = today.getMinutes();
      //   var now = hourNow + ':' + minNow;

      //   var restaurantDay = weekday[todayDay];
      //   var previousDay = new Date();

      //   // if(now>'00:00' & now<'05:00') {
      //     restaurantDay = weekday[(todayDay-1)];
      //     var openingHours = restaurant[restaurantDay];
      //     hours = openingHours.trim().split('-');
      //     previousDay.setDate(previousDay.getDate() - 1);
      //     prevDate = previousDay.getDate();
      //     var open = prevDate + hours[0];
      //     todayDate = today.getDate();
      //     var close = todayDate + hours[1];
      //   // }
        
        

      //   // if()
      //     // return restaurant;

      // };
    })

    .run(function ($ionicPlatform, $location, $rootScope, Restaurants) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
        document.addEventListener("resume", resume, false);
        function resume(){          
            var div = document.getElementsByTagName('body')[0];
            var scope = angular.element(div).scope();
            var rootScope = scope.$root;
            // rootScope.$apply(function() {
                rootScope.$broadcast('onResumeCordova');
            // });
        }
    })

    .config(function ($stateProvider, $urlRouterProvider) {

        $stateProvider

            .state('ping', {
              url: "/ping",
              abstract: true,
              templateUrl: "templates/menu.html",
              controller: 'AppCtrl'
            })

            .state('ping.search', {
                url: '/search',
                views: {
                  'menuContent' :{
                    templateUrl: 'templates/restaurant-list.html',
                    controller: 'RestaurantListCtrl'
                  }
                }
            })

            .state('ping.restaurant', {
                url: '/restaurants/:restaurantId',
                views: {
                  'menuContent' :{
                    templateUrl: 'templates/restaurant-detail.html',
                    controller: 'RestaurantDetailCtrl'
                  }
                }
            })

            .state('ping.cart',{
              url: '/cart',
              views: {
                'menuContent' :{
                  templateUrl: 'templates/cart.html',
                  controller: 'CartController'
                }
              }
            })

            .state('ping.about-us',{
              url: '/about-us',
              views: {
                'menuContent' :{
                  templateUrl: 'templates/about-us.html',
                  // controller: 'AboutUsController'
                }
              }
            })

            .state('ping.my-orders',{
              url: '/my-orders',
              views: {
                'menuContent' :{
                  templateUrl: 'templates/my-orders.html',
                  controller: 'MyOrdersCtrl'
                }
              }
            })

            .state('ping.map',{
              url: '/map',
              views: {
                'menuContent' :{
                  templateUrl: 'templates/map.html',
                  controller: 'MapCtrl'
                }
              }
            })

            .state('ping.order-queue',{
              url: '/order-queue',
              views: {
                'menuContent' :{
                  templateUrl: 'templates/order-queue.html',
                  controller: 'OrderQueueCtrl'
                }
              }
            })

            .state('ping.post-new',{
              url: '/post-new',
              views: {
                'menuContent' :{
                  templateUrl: 'templates/post-new.html',
                  controller: 'PostNewCtrl'
                }
              }
            })

            .state('ping.update-info',{
              url: '/update-info',
              views: {
                'menuContent' :{
                  templateUrl: 'templates/update-info.html',
                  controller: 'UpdateInfoCtrl'
                }
              }
            });

        $urlRouterProvider.otherwise('/ping/map');
    })

    .directive('fallbackSrc', function () {
      var fallbackSrc = {
        link: function postLink(scope, iElement, iAttrs) {
          iElement.bind('error', function() {
            angular.element(this).attr("src", iAttrs.fallbackSrc);
          });
        }
       };
       return fallbackSrc;
     });
    