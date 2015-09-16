Stripe.setPublishableKey('pk_test_zYxp0bwaMs63kBGMC6j3rRJD');
angular.module('directory.controllers', ['LocalStorageModule', 'ionic', 'angularPayments', 'angularMapbox','leaflet-directive'])
// .constant('baseUrl', 'http://ping.aws.af.cm')
.constant('baseUrl', 'http://ping.aws.af.cm')


/*
-----------------------

Main Controller

-----------------------
*/
.controller('AppCtrl', function($scope,
  $rootScope,
  $ionicNavBarDelegate,
  $ionicViewService,
  $state,
  $ionicModal,
  $ionicLoading,
  $ionicPopup,
  $window,
  $http,
  Authentication,
  localStorageService,
  Restaurants,
  Session,
  Status,
  baseUrl,
  StripeService) {

  $rootScope.$on('onResumeCordova', function(event) {
      if($state.current.name == 'ping.restaurant' || $state.current.name == 'ping.cart') {
        if(Restaurants.cart.getTotalCount() > 0) {
          Restaurants.cart.clearItems();
          $ionicPopup.alert({
             title: 'Cart Cleared',
             template: 'Sorry, we clear your cart once you exit the app.'
           });
        }
        $ionicViewService.nextViewOptions({
          disableBack: true,
          disableAnimate: true,
        });
        $state.go('ping.search');
      }
  });

  $scope.goBack = function(){
    if($state.current.name == 'ping.restaurant' && Restaurants.cart.getTotalCount() > 0){
        var confirmGoBack = $ionicPopup.confirm({
          title: 'Warning',
          template: 'Your cart will be cleared if you navigate back.'
        });
        confirmGoBack.then(function(res) {
          if(res) {
            Restaurants.cart.clearItems();
            $ionicNavBarDelegate.back();
          }
        });
    } else {
      $ionicNavBarDelegate.back();
    }
  };

  var self = this;

  var name = localStorage.getItem('name'),
      avatar = localStorage.getItem('avatar');
  
  $scope.user = false;

  if (name && avatar) {
    $scope.user = {
      name: name,
      avatar: avatar,
    };
    var session = {
      date: localStorage.getItem('session_date'),
      userId: localStorage.getItem('session_userId'),
    }
    Session.populateSession(session);
  }

  $scope.switchToSignUp = function(){
    $scope.loginModal.hide();
    setTimeout(function() {
      $scope.signUpModal.show();
    }, 500);
  };

  $scope.switchToLogin = function(){
    $scope.signUpModal.hide();
    setTimeout(function() {
      $scope.loginModal.show();
    }, 500);
  };


  /* FACEBOOK LOGIN */
  $scope.facebookLogin = function(){
    var url = baseUrl + '/auth/facebook?target=app';
    var options = 'location=no,toolbar=yes,toolbarposition=top,closebuttoncaption=Cancel';
    
    var actionSignup = function(userData){ // Sign up an account on the backend using Facebook Account
      var success = function(data) { // Account created
        self._processingForm = false;
        Session.storeSessionInfo(data);
        Session.populateSession(data);

        Status.getStatus(function(err){ // Retrieve user data from the backend
          $ionicLoading.hide();
          
          if(err){ // Couldn't retrieve user data
            var errorPopUp = $ionicPopup.confirm({
              title: 'Server Error',
              template: 'There was an error communicating with ping server. Would you like to retry?'
            });
          errorPopUp.then(function(res) {
            if(res) {
              setTimeout(function() { success(data); }, 5000);
            } else {
              $scope.loginModal.hide();
            }
          });
          } else { // Data retrieved
            $scope.loginModal.hide();

            var sessionData = Session.data;
            
            $scope.user = {
              name: sessionData.name.full,
              avatar: sessionData.avatar
            };
            // $scope.paymentData.stripeCustomerId = sessionData.stripeCustomerId;
            localStorage.setItem('name',sessionData.name.full);
            localStorage.setItem('avatar',sessionData.avatar);
            localStorage.setItem('email',sessionData.email);
            localStorage.setItem('phoneNumber',sessionData.phoneNumber);
            localStorage.setItem('stripeCustomerId',sessionData.stripeCustomerId);
            if($state.current.name != 'ping.cart'){
              $ionicViewService.nextViewOptions({
                disableBack: true,
                disableAnimate: true,
              });
              $state.go('ping.map');
            }
              }
            });
          };

          var error = function(data) { // Account creation failed
            $ionicLoading.hide();
            self._processingForm = false;
            $ionicPopup.alert({
             title: 'Sign Up Error',
             template: 'Sorry, your account could not be created. Please try again.'
           });
          };
          
          var loginData = { authUser: this._authUser, form: userData };

          Authentication.signUpByService(loginData).success(function(data){
            return data.success ? success(data) : error(data);
          }).error(function(){
            return error();
          });
        };

        var checkExisting = function() { // Check if the Facebook user has an account with us

          var success = function(data) { 
            $ionicLoading.hide();

            if (data.session) { // Account found
              Session.storeSessionInfo(data);
              Session.populateSession(data);    

              var success = Status.getStatus(function(err){ // Retrieve user data
                if(err){
                  var errorPopUp = $ionicPopup.confirm({
                    title: 'Server Error',
                    template: 'There was an error communicating with ping server. Would you like to retry?'
                  });
                  errorPopUp.then(function(res) {
                    if(res) {
                      setTimeout(function() { success(data); }, 5000);
                    } else {
                      $scope.loginModal.hide();
                    }
                  });
                } else {
                  $scope.loginModal.hide();
                  var sessionData = Session.data;
                  $scope.user = {
                    name: sessionData.name.full,
                    avatar: sessionData.avatar
                  };
                  localStorage.setItem('name',sessionData.name.full);
                  localStorage.setItem('avatar',sessionData.avatar);
                  localStorage.setItem('email',sessionData.email);
                  localStorage.setItem('phoneNumber',sessionData.phoneNumber);
                  localStorage.setItem('stripeCustomerId',sessionData.stripeCustomerId);
                  if($state.current.name != 'ping.cart'){
                    $ionicViewService.nextViewOptions({
                      disableBack: true,
                      disableAnimate: true,
                    });
                    $state.go('ping.map');
                  }
                }
              });
            } else { // No account yet, create it

              if (self._processingForm) return;
              self._processingForm = true;
              // app.hideKeyboard();
              
              // Create signup info using user's Facebook info
              var inputData = {
                'name.first': this._authUser.name.first,
                'name.last': this._authUser.name.last,
                email: this._authUser.email,
                  // alertsNotifications: this.field('alertsNotifications').val() == 'yes' ? true : false
                };

              // Validate the form data
              if (!inputData['name.first'] || !inputData['name.first'].trim().length
                || !inputData['name.last'] || !inputData['name.last'].trim().length) {
                self._processingForm = false;
              $ionicPopup.alert({
               title: 'Login Error',
               template: 'Your name cannot be found.'
             }); 
              return;
            }

            if (!inputData.email || !inputData.email.trim().length) {
              self._processingForm = false;
              $ionicPopup.alert({
               title: 'Login Error',
               template: 'Your email cannot be found.'
             }); 
              return;
            }

            actionSignup(inputData);
          }
          }; // end of success

          var error = function(data) {
            $ionicLoading.hide();
            $ionicPopup.alert({
             title: 'Login Error',
             template: 'Sorry, your account could not be processed. Please try again.'
           });
        }; // end of error
        
        Authentication.byService({authUser: this._authUser}).success(function(data){
          return data.success ? success(data) : error(data);
        }).error(function(){
          return error();
        });
    }; // end of checkExisting


    loginWindow = $window.open(url, '_blank', options);
    loginWindow.addEventListener('loadstop', function (){
      var checkAuthUser = setInterval(function() {
        loginWindow.executeScript({ code: "localStorage.getItem('authUser')" },
          function(data) {
            var authUser = _.first(data);
            if (!authUser) return;
            clearInterval(checkAuthUser);
            loginWindow.close();
            this._authUser = JSON.parse(authUser);
            checkExisting();
          }
          );
      }, 100);
      }); // end of addEvenListener

  } /* END OF FACEBOOK LOGIN */




  /* START OF LOGIN  */
  $scope.loginData = {};

  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.loginModal = modal;
  });

  $scope.closeLogin = function() {
    $scope.loginModal.hide();
  };

  $scope.login = function() {
    $scope.loginModal.show();
  };

  $scope.doLogin = function() {
    var self = this;

    if ( self._processingForm ) {
      return;
    }

    self._processingForm = true;

      // app.hideKeyboard();

      // Collect the form data
      var inputData = {
        username: $scope.loginData.email,
        password: $scope.loginData.password
      };


      // Validate the form data
      if (!inputData.username || !inputData.username.trim().length) {
        self._processingForm = false;
        $ionicPopup.alert({
         title: 'Login Error',
         template: 'Please enter your Harvard email.'
       });
        return;
      }

      if (!inputData.password || !inputData.password.trim().length) {
        self._processingForm = false;
        $ionicPopup.alert({
         title: 'Login Error',
         template: 'Please enter your password.'
       }); 
        return;
      }

      $ionicLoading.show({
        template: 'Logging In...'
      });

      var success = function(data) {
        Session.storeSessionInfo(data);
        Session.populateSession(data);
        self._processingForm = false;
        
        Status.getStatus(function(err){
          $ionicLoading.hide();
          if(err){
            var errorPopUp = $ionicPopup.confirm({
              title: 'Server Error',
              template: 'There was an error communicating with ping server. Would you like to retry?'
            });
            errorPopUp.then(function(res) {
              if(res) {
                setTimeout(function() { success(data); }, 5000);
              } else {
                $scope.loginData.email = '';
                $scope.loginData.password = '';
                $scope.loginModal.hide();
              }
            });
          } else {
            $scope.loginData.email = '';
            $scope.loginData.password = '';
            $scope.loginModal.hide();

            var sessionData = Session.data;
            $scope.user = {
              name: sessionData.name.full,
              avatar: sessionData.avatar
            };
            localStorage.setItem('name',sessionData.name.full);
            localStorage.setItem('avatar',sessionData.avatar);
            localStorage.setItem('email',sessionData.email);
            localStorage.setItem('phoneNumber',sessionData.phoneNumber);
            localStorage.setItem('stripeCustomerId',sessionData.stripeCustomerId);
            if($state.current.name != 'ping.cart'){
              // console.log('disableBack');
              $ionicViewService.nextViewOptions({
                disableBack: true,
                disableAnimate: true,
              });
              $state.go('ping.map');
            }
            // console.log('back');

          }
        });
      };

      var error = function(data) {
        $ionicLoading.hide();
        self._processingForm = false;
        $scope.loginData.password = '';
        $ionicLoading.hide();
        $ionicPopup.alert({
         title: 'Login Error',
         template: 'Sorry we couldn\'t sign you in at this time. Please try again. '
       });           
      }
      
      Authentication.byEmail(inputData).success(function(data) {
        data && data.success && data.session ? success(data) : error(data);
      })
      .error(function() { return error(); });
    };
    /* END OF LOGIN */



    /* SIGN UP */
    $scope.signUpData = {};

    $ionicModal.fromTemplateUrl('templates/signup.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.signUpModal = modal;
    });

    $scope.closeSignUp = function() {
      $scope.signUpModal.hide();
    };
    
    $scope.signUp = function() {
      $scope.signUpModal.show();
    };

    $scope.doSignUp = function(){
      var self = this;
      if ( self._processingForm ) {
        return;
      }
      
      self._processingForm = true;
      // app.hideKeyboard();
      
      // Collect the form data
      var inputData = {
        'name.first': $scope.signUpData.name.first,
        'name.last': $scope.signUpData.name.last,
        email: $scope.signUpData.email,
        password: $scope.signUpData.password
      };

      // Validate the form data
      if (!inputData['name.first'] || !inputData['name.first'].trim().length
        || !inputData['name.last'] || !inputData['name.last'].trim().length) {
        self._processingForm = false;
      $ionicPopup.alert({
        title: 'Sign Up Error',
        template: 'Please enter your full name.'
      });
      return;
    }

    if (!inputData.email || !inputData.email.trim().length) {
      self._processingForm = false;
      $ionicPopup.alert({
       title: 'Login Error',
       template: 'Please enter your Harvard email.'
     }); 
      return;
    }

    if (!inputData.password || !inputData.password.trim().length) {
      self._processingForm = false;
      $ionicPopup.alert({
       title: 'Login Error',
       template: 'Please enter your password.'
     }); 
      return;
    }

    inputData.website = 'ping';

      // Show loading spinner
      $ionicLoading.show({
        template: 'Signing you up ...'
      });
      
      var success = function(data) {
        Session.storeSessionInfo(data);
        Session.populateSession(data);
        self._processingForm = false;

        Status.getStatus(function(err){
          $ionicLoading.hide();
          if(err){
            var errorPopUp = $ionicPopup.confirm({
              title: 'Server Error',
              template: 'There was an error communicating with ping server. Would you like to retry?'
            });
            errorPopUp.then(function(res) {
              if(res) {
                setTimeout(function() { success(data); }, 5000);
              } else {
                $scope.signUpData.email = '';
                $scope.signUpData.password = '';
                $scope.signUpModal.hide();
              }
            });
          } else {
            $scope.signUpData.email = '';
            $scope.signUpData.password = '';
            $scope.signUpModal.hide();

            var sessionData = Session.data;
            $scope.user = {
              name: sessionData.name.full,
              avatar: sessionData.avatar
            };
            localStorage.setItem('name',sessionData.name.full);
            localStorage.setItem('avatar',sessionData.avatar);
            localStorage.setItem('email',sessionData.email);
            localStorage.setItem('phoneNumber',sessionData.phoneNumber);
            localStorage.setItem('stripeCustomerId',sessionData.stripeCustomerId);
            if($state.current.name != 'ping.cart'){
              $ionicViewService.nextViewOptions({
                disableBack: true,
                disableAnimate: true,
              });
              $state.go('ping.map');
            }
          }
        });
      };
      
      var error = function(data) {
        $ionicLoading.hide();
        self._processingForm = false;
        $scope.signUpData.password = '';
        $ionicLoading.hide();
        $ionicPopup.alert({
         title: 'Sign Up Error',
         template: 'Sorry, your account could not be created. Please try again.'
       });
      };

      Authentication.signUp(inputData).success(function(data){
        $ionicLoading.hide();
        return data.success ? success(data) : error(data);
      }).error(function(){
        return error();
      });
    };
    /* END OF SIGN UP */

    $scope.logout = function(){
      localStorage.clear();
      Restaurants.cart.clearItems();
      Session.data = {};
      $scope.user = false;
      // $ionicViewService.nextViewOptions({
      //   disableBack: true,
      //   disableAnimate: true,
      // });
      $ionicViewService.clearHistory();
      $state.go('ping.map');
    };


    /* UPDATE CREDIT CARD MODAL */
    $ionicModal.fromTemplateUrl('templates/update-credit.html', {
      scope: $scope
    }).then(function(updateCreditModal) {
      $scope.updateCreditModal = updateCreditModal;
    });

    $scope.closeUpdateCredit = function() {
      $scope.updateCreditModal.hide();
    };
    
    $scope.updateCredit = function() {
      $scope.updateCreditModal.show();
    };

    $scope.onSubmit = function () {
      $ionicLoading.show({
        template: 'Updating Your Credit Card'
      });
    };

    $scope.stripeCallback = function (code, result) {
      $ionicLoading.hide();
      if (result.error) {
        $ionicPopup.alert({
           title: 'Update Failed',
           template: 'Sorry, please enter a valid credit card.'
         });
      } else {
        // $scope.stripeToken = result.id;
        var success = function(data) { 
            updateCCForm.number.value = "";
            updateCCForm.expiry.value = "";
            updateCCForm.cvc.value = "";
            // Session.storeSessionInfo(data);
            // Session.populateSession();
            Status.getStatus(function(err){
              $ionicLoading.hide();
              
              if(err){ // Couldn't retrieve user data
                var errorPopUp = $ionicPopup.confirm({
                  title: 'Server Error',
                  template: 'There was an error communicating with ping server. Would you like to retry?'
                });
              errorPopUp.then(function(res) {
                if(res) {
                  setTimeout(function() { success(data); }, 5000);
                } else {
                  $scope.updateCreditModal.hide();
                }
              });
              } else { // Data retrieved
                // $scope.updateCreditModal.hide();
                 var successPopup = $ionicPopup.alert({
                  title: 'Success',
                  template: 'Your credit card has been updated.'
                }).then(function() {
                  $scope.updateCreditModal.hide();
                });
              }
            });
          };

          var error = function(data){
            updateCCForm.number.value = "";
            updateCCForm.expiry.value = "";
            updateCCForm.cvc.value = "";
            $ionicPopup.alert({
             title: 'Update Error',
             template: 'Sorry, your credit card cannot be updated. Please try again.'
           });
          };

          var stripeData = {
            userId: localStorage.getItem('session_userId'),
            stripeToken: result.id,
          };

          StripeService.updateCredit(stripeData)
          .success(function(data){ return success(data); })
          .error(function(data){ return error(data); });
        }  
    };
    $scope.$on('$destroy', function() {
      $scope.updateCreditModal.remove();
    });
  })





/*
-----------------------

Update Info Controller

-----------------------
*/
.controller('UpdateInfoCtrl',function($scope, 
  $ionicPopup,
  $ionicLoading,
  $ionicModal,
  Session,
  Authentication,
  StripeService,
  Status,
  localStorageService){
    var self = this;

    if (self._processingForm) return;

    self._processingForm = true;

    console.log(localStorage.getItem('phoneNumber'));

    $scope.updateData = {
      email: localStorage.getItem('email'),
      phoneNumber: localStorage.getItem('phoneNumber'),
    };
      
    // Collect the form data
    $scope.updateInfo = function(){
      var updateData = {
        email: $scope.updateData.email,
        phoneNumber: $scope.updateData.phoneNumber,
        userId: localStorage.getItem('session_userId'),
      };

      if (!updateData.email || !updateData.email.trim().length) {
        self._processingForm = false;
        $ionicPopup.alert({
         title: 'Login Error',
         template: 'Please enter your Harvard email.'
       }); 
        return;
      }

      if (!updateData.phoneNumber || !updateData.phoneNumber.trim().length) {
        self._processingForm = false;
        $ionicPopup.alert({
         title: 'Login Error',
         template: 'Please enter a valid phone number.'
       }); 
        return;
      }

      $ionicLoading.show({
        template: 'Updating your particulars ...'
      });
      
      var success = function(data) {
        // Session.storeSessionInfo(data);
        // Session.populateSession(data);

        // console.log('succes',data);
        self._processingForm = false;

        Status.getStatus(function(err){
          $ionicLoading.hide();
          if(err){
            var errorPopUp = $ionicPopup.confirm({
              title: 'Server Error',
              template: 'There was an error communicating with ping server. Would you like to retry?'
            });
            errorPopUp.then(function(res) {
              if(res) {
                setTimeout(function() { success(data); }, 5000);
              }
            });
          } else {
            var sessionData = Session.data;
            // console.log('session1',sessionData);
            localStorage.setItem('email',sessionData.email);
            localStorage.setItem('phoneNumber',sessionData.phoneNumber);
            $scope.updateData.email = sessionData.email;
            $scope.updateData.phoneNumber = sessionData.phoneNumber;
            var successPopup = $ionicPopup.alert({
              title: 'Success',
              template: 'Your info has been updated.'
            });
          }
        });
      };
      
      var error = function(data) {
        $ionicLoading.hide();
        self._processingForm = false;
        $ionicPopup.alert({
         title: 'Update Error',
         template: 'Sorry, your info cannot be updated. Please try again.'
       });
      };

      Authentication.updateInfo(updateData)
      .success(function(data){
        $ionicLoading.hide();
        return data.success ? success(data) : error(data);
      }).error(function(){
        return error();
      });
    };
})



/*
-----------------------

Restaurant List Controller

-----------------------
*/

.controller('RestaurantListCtrl', function ($scope, $state, Restaurants, $location, $timeout, GlobalTimerService) {

  $scope.searchKey = "";

  // $scope.clearSearch = function () {
  //   $scope.searchKey = "";
  //   $scope.restaurants = Restaurants.restaurants.query();
  // };

  // $scope.search = function () {
  //   $scope.restaurants = Restaurants.restaurants.query({name: $scope.searchKey});
  // };

  $scope.restaurants = Restaurants.restaurants.query();
  $scope.cart = Restaurants.cart;

  $scope.refreshRestaurants = function() {
    $scope.restaurants = Restaurants.restaurants.query();
    $scope.$broadcast('scroll.refreshComplete');
  };

  // if(GlobalTimerService.timer != null)
    GlobalTimerService.cancelTimer();
})






/*
-----------------------

Restaurant Detail Controller

-----------------------
*/

.controller('RestaurantDetailCtrl', function($scope, 
  $rootScope, 
  $state, 
  $stateParams, 
  $ionicPopup, 
  Restaurants, 
  $ionicNavBarDelegate, 
  ClockSrv, 
  PopUpService, 
  GlobalTimerService) {

  // if(GlobalTimerService.timer != null){
    // var timer = GlobalTimerService.timer;
    // console.log(GlobalTimerService.timer)
  GlobalTimerService.cancelTimer();
  // }

  var restaurant = Restaurants.restaurants.get({restaurantId: $stateParams.restaurantId});
  console.log($stateParams.restaurantId);
  $scope.restaurant = restaurant;
  var cart = Restaurants.cart;
  $scope.cart = cart;

  $scope.goToCart = function (){
      $state.go('ping.cart');
  };

  // if(ClockSrv.startClock(restaurant)){
  //   ClockSrv.stopClock();
  //   var alertGoBack = $ionicPopup.alert({
  //     title: 'Sorry!',
  //     template: 'This restaurant is already closed. We\'ll take you back to the restaurant list.'
  //   });
  //   alertGoBack.then(function(res) {
  //     if(res) {
  //       Restaurants.cart.clearItems();
  //       $ionicNavBarDelegate.back();
  //     }
  //   });
  // }
  // console.log(ClockSrv.startClock(restaurant));
  ClockSrv.startClock(restaurant);
  // var popupShown = false;
  $rootScope.$on('restaurantClosed', function(){
    if($state.current.name=='ping.restaurant'){
      if(PopUpService.isShown == false){
        PopUpService.setIsShown(true);
        var alertGoBack = $ionicPopup.alert({
          title: 'Sorry!',
          template: 'This restaurant is already closed. We\'ll take you back to the restaurant list.'
        });
        
        alertGoBack.then(function(res) {
          if(res){
            Restaurants.cart.clearItems();
            $ionicNavBarDelegate.back();
            PopUpService.setIsShown(false);
          }
        });
      }
    }
  });

  $scope.addItemWithLimit = function(id,name,price){
    if(cart.getTotalPrice() + price > cart.orderLimit) {
     $ionicPopup.alert({
       title: 'Max Order Total Exceeded',
       template: 'For our beta, we limit the order to total to $50. Sorry for the inconvenience!'
     });
   }
   else
    cart.addItem(id, name, price, 1);
};
})


/*
-----------------------

Cart Controller

-----------------------
*/

.controller('CartController', function(
  $ionicViewService,
  $location,
  $scope,
  $ionicPopup,
  $ionicModal,
  $timeout,
  Restaurants,
  $ionicLoading,
  $state,
  $ionicNavBarDelegate,
  Session,
  Status,
  StripeService,
  localStorageService,
  baseUrl,
  Orders,
  ClockSrv,
  GlobalTimerService){

  var cart = Restaurants.cart;

  // var restaurant = Restaurants.restaurants.get({restaurantId: $stateParams.restaurantId});
  // ClockSrv.startClock(restaurant);
  // var popupShown = false;
  // $rootScope.$on('restaurantClosed', function(){
  //   if(popupShown == false){
  //     popupShown = true;
  //     var alertGoBack = $ionicPopup.alert({
  //       title: 'Sorry!',
  //       template: 'This restaurant is already closed. We\'ll take you back to the restaurant list.'
  //     });
  //     alertGoBack.then(function(res) {
  //       if(res){
  //         Restaurants.cart.clearItems();
  //         $state.go('ping.search');
  //       }
  //     });
  //   }
  // });

  // Give user 10 minutes to checkout
  var timer = $timeout(function() {
    alertGoBack = $ionicPopup.alert({
       title: 'App Inactivity',
       template: 'Due to app inactivity, we\'ll take you back to your restaurant list.'
     });
    alertGoBack.then(function(res) {
      if(res){
        $scope.loginModal.hide();
        $scope.checkoutModal.hide();
        $scope.checkoutExistingModal.hide();
        $ionicViewService.nextViewOptions({
            disableBack: true,
            disableAnimate: true,
        });
        $state.go('ping.search');
      }
    });
  }, 600000); // ten minutes
  GlobalTimerService.setTimer(timer);

  $scope.cart = cart;
  $scope.addItemWithLimit = function(id,name,price){
    if(cart.getTotalPrice() + price > cart.orderLimit) {
     $ionicPopup.alert({
       title: 'Max Order Total Exceeded',
       template: 'For our beta, we limit the order to total to $50. Sorry for the inconvenience!'
     });
   }
   else
    cart.addItem(id, name, price, 1);
  };

    // Login Modal
    $scope.loginData = {};

    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.closeLogin = function() {
      $scope.modal.hide();
    };
    
    $scope.login = function() {
      $scope.modal.show();
    };

    // $scope.doLogin = function() {
    //   // console.log('Doing login', $scope.loginData);
    //   $timeout(function() {
    //     $scope.closeLogin();
    //   }, 1000);
    // };

    // first time
    $ionicModal.fromTemplateUrl('templates/checkout.html', {
      scope: $scope
    }).then(function(checkoutModal) {
      $scope.checkoutModal = checkoutModal;
    });

    $scope.closeCheckout = function() {
      $scope.checkoutModal.hide();
    };
    
    $scope.checkout = function() {
      $scope.checkoutModal.show();
    };

    $scope.attemptCheckout = function(){
      var user = localStorage.getItem('session_userId');
      if(user) {
        $scope.paymentData = {
          'phoneNumber': localStorage.getItem('phoneNumber'),
          'stripeCustomerId': localStorage.getItem('stripeCustomerId'),
        };
        if($scope.paymentData.stripeCustomerId){ // this is not available
          this.checkoutExisting();
        } else {
          this.checkout();
        }
      } else {
        $scope.loginModal.show();
      }
    };

    $scope.onSubmit = function () {
      // console.log('onsubmit');
      $ionicLoading.show({
        template: 'Processing Your Payment'
      });
    };

    $scope.stripeCallback = function (code, result) {
      $ionicLoading.hide();
      if (result.error) {
        $ionicPopup.alert({
           title: 'Payment Failed',
           template: 'Sorry, please enter a valid credit card.'
         });
        // $scope.stripeError = result.error.message;
      } else {

        // $scope.stripeToken = result.id;
        var success = function(data) { 
            // console.log('success');
            // console.log(data);
            Session.populateSession();
            Status.getStatus(function(err){
              $ionicLoading.hide();
              
              if(err){ // Couldn't retrieve user data
                var errorPopUp = $ionicPopup.confirm({
                  title: 'Server Error',
                  template: 'There was an error communicating with ping server. Would you like to retry?'
                });
              errorPopUp.then(function(res) {
                if(res) {
                  setTimeout(function() { success(data); }, 5000);
                } else {
                  $scope.checkoutModal.hide();
                }
              });
              } else { // Data retrieved
                var ordersData = Orders.data;
                $scope.orders = ordersData;

                var sessionData = Session.data;
                console.log('session2',sessionData);
                localStorage.setItem('email',sessionData.email);
                localStorage.setItem('phoneNumber',sessionData.phoneNumber);
                $scope.updateData.email = sessionData.email;
                $scope.updateData.phoneNumber = sessionData.phoneNumber;

                cart.clearItems();
                $scope.checkoutModal.hide();
                $ionicViewService.nextViewOptions({
                    disableBack: true,
                    disableAnimate: true,
                });
                $location.path('/');
              }
            });
          };

          var error = function(data) { 
            $ionicPopup.alert({
               title: 'Payment Failed',
               template: 'There was an error communicating with ping server. Would you like to retry?'
             });
          };

          var listOfItemIds = [];
          cart.items.forEach(function(item){
            for(i=0; i<item.quantity; i++)
              listOfItemIds.push(item.sku);
          });


          var stripeData = {
                userId: localStorage.getItem('session_userId'),
                phoneNumber: $scope.paymentData.phoneNumber,
                location: $scope.paymentData.location,
                stripeToken: result.id,
                total: cart.getTotalPriceWithDelivery(),
                itemsOrdered: listOfItemIds,
                items: cart.items,
            };
            // console.log('stripeData',stripeData);
          StripeService.chargeNew(stripeData)
          .success(function(data){ return success(data); })
          .error(function(data){ return error(data); });
        }
    };

    // when making payment with existing token
    $ionicModal.fromTemplateUrl('templates/checkout-existing.html', {
      scope: $scope
    }).then(function(checkoutExistingModal) {
      $scope.checkoutExistingModal = checkoutExistingModal;
    });

    $scope.closeCheckoutExisting = function() {
      $scope.checkoutExistingModal.hide();
    };
    
    $scope.checkoutExisting = function() {
      $scope.checkoutExistingModal.show();
    };

    $scope.onSubmitExisting = function(){
      var success = function(data){
        Status.getStatus(function(err){  
          if(err){ // Couldn't retrieve user data
            var errorPopUp = $ionicPopup.confirm({
              title: 'Server Error',
              template: 'There was an error communicating with ping server. Would you like to retry?'
            });
          errorPopUp.then(function(res) {
            if(res) {
                  setTimeout(function() { success(data); }, 5000);
            } else {
              $scope.checkoutExistingModal.hide();
            } 
          });
          } else { // Data retrieved
            var ordersData = Orders.data;
            $scope.orders = ordersData;

            var sessionData = Session.data;
            console.log('session',sessionData);
            localStorage.setItem('stripeCustomerId', sessionData.stripeCustomerId);
            localStorage.setItem('phoneNumber', sessionData.phoneNumber);
            $scope.paymentData.phoneNumber = sessionData.phoneNumber;

            $scope.checkoutExistingModal.hide();
            cart.clearItems();
            $ionicViewService.nextViewOptions({
                disableBack: true,
                disableAnimate: true,
            });
            $location.path('/');
          }
        });
      };

      var error = function(data) {
        $ionicPopup.alert({
           title: 'Payment Failed',
           template: 'There was an error communicating with ping server. Would you like to retry?'
         });
      };

      var listOfItemIds = [];
      cart.items.forEach(function(item){
        for(i=0; i<item.quantity; i++)
          listOfItemIds.push(item.sku);
      });

      var stripeData = {
          userId: localStorage.getItem('session_userId'),
          phoneNumber: $scope.paymentData.phoneNumber,
          location: $scope.paymentData.location,
          total: cart.getTotalPriceWithDelivery(),
          itemsOrdered: listOfItemIds,
          items: cart.items,
        };

      StripeService.chargeNew(stripeData)
        .success(function(data){ return success(data); })
        .error(function(data){ return error(data); });
    }

    $scope.showFIY = true;
      $scope.hideFIY = function() {
      $scope.showFIY = false;
    };

    $scope.updateCredit = function(){
      $scope.checkoutExistingModal.hide();
      setTimeout(function() {
        $scope.updateCreditModal.show();
      }, 500);
    };

    //   $scope.updateCredit = function(){
    //   $scope.
    //   $scope.updateCreditModal.show();
    // }

})




/*
-----------------------

My Orders Controller

-----------------------
*/
.controller('MyOrdersCtrl', function($scope, Restaurants,$ionicViewService,$state, $rootScope, $ionicPopup, Status, Orders){
  if(!localStorage.getItem('session_userId')){
      $ionicViewService.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      $state.go('ping.search');
  }
  $scope.cart = Restaurants.cart;
  $scope.orders = false;

  var orders = JSON.parse(localStorage.getItem('orders'));

  if (orders) {
    $scope.orders = orders;
  }

  $scope.doRefresh = function() {
    // alert('refreshed');
      Status.getStatus(function(){
        $scope.orders = Orders.data;
        $scope.$broadcast('scroll.refreshComplete');
      });
  };
  $scope.goToRestaurant = function(){
    $ionicViewService.nextViewOptions({
      disableBack: true,
      disableAnimate: true,
    });
    $state.go('ping.search');
  }

})

/*
-----------------------

Map Controller

-----------------------
*/

.controller('MapCtrl', function($scope, Restaurants,$ionicViewService,$state, $rootScope, $ionicPopup, Status, Orders, $ionicModal, $http, baseUrl){
  $scope.farmerMarkets = Restaurants.restaurants.query();

  $ionicModal.fromTemplateUrl('templates/story.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.storyModal = modal;
  });

  $scope.closeStory = function() {
    $scope.storyModal.hide();
  };

  $scope.openStory = function() {
    $scope.storyModal.show();
  };

  $scope.getStory = function(id) {
    $http({
      url: baseUrl+'/posts/'+ id,
      method: 'get',
      responseType: 'json',
      cache: false,
    })
    .success(function(data) {
        // do something if success
        // console.log('success');
        //$state.go('ping.map');
        $scope.title = data[0].title;
        $scope.content = data[0].content.brief;    
        $scope.storyModal.show();
    })
    .error(function() { 
        console.log('error');
    });

  }

  $scope.mapMovedCallback = function(bounds) {
    console.log('You repositioned the map to:');
    console.log(bounds);
  };

  $scope.mapZoomedCallback = function(bounds) {
    console.log('You zoomed the map to:');
    console.log(bounds);
  };

})


.controller('PostNewCtrl',function($scope,baseUrl,$http,$state){
   var tilesDict = {
    mapbox_streets: {
        name: 'Mapbox Streets',
        url: 'http://api.tiles.mapbox.com/v4/{mapid}/{z}/{x}/{y}.png?access_token={apikey}',
        type: 'xyz',
        options: {
            apikey: 'pk.eyJ1IjoidG9tYmF0b3NzYWxzIiwiYSI6Imo3MWxyTHMifQ.TjXg_IV7ZYMHX6tqjMikPg',
            mapid: 'tombatossals.map-fmyyujjl'
        }
    }
  };
  $scope.newPost = {};
  $scope.onSubmit = function(){
    var newPost = {
        userId: localStorage.getItem('session_userId'),
        title: $scope.newPost.title,
        content: $scope.newPost.content,
        lat: $scope.markers.m2.lat,
        lon: $scope.markers.m2.lng,
      };
    $http({
      url: baseUrl+'/api/app/post/new/',
      method: 'post',
      data: newPost,
      responseType: 'json',
      cache: false,
    }).success(function(data) {
        // do something if success
        // console.log('success');
        $state.go('ping.map');
      }).error(function() { 
        console.log('error');
      });
  };
  angular.extend($scope, {
      london: {
          lat: 42.378925,
          lng: -71.123841,
          zoom: 17,  
      },
      tiles: tilesDict.mapbox_streets,
      markers: {}
  });

  $scope.addMarkers = function() {
      angular.extend($scope, {
          markers: {
              m2: {
                  lat: 42.378925,
                  lng: -71.123841,
                  focus: true,
                  draggable: true
              }
          }
      });
  };

  $scope.removeMarkers = function() {
      $scope.markers = {};
  }
  $scope.addMarkers();
  console.log($scope.markers);
})


/*
-----------------------

Order Queue Controller

-----------------------
*/
.controller('OrderQueueCtrl', function($scope, Restaurants){
  $scope.cart = Restaurants.cart;
})
