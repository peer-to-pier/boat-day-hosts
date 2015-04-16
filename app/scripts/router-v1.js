// Filename: router.js
define([
	'jquery',
	'underscore',
	'parse',
	'views/HomeView',
	'views/DashboardView',
	'views/TermsView',
	'views/SignUpView',
	'views/HostRegistrationView',
	'views/DriverRegistrationView',
	'views/ProfileView'
], function($, _, Parse, HomeView, DashboardView, TermsView, SignUpView, HostRegistrationView, DriverRegistrationView, ProfileView) {
	
	var AppRouter = Parse.Router.extend({

		routes: {
			// Define some URL routes
			'home': 'showHomeView',
			// 'sign-up': 'showSignUpView',
			'sign-up-host': 'showSignUpHost',
			'sign-up-driver': 'showSignUpDriver',
			'terms': 'showTermsView',
			'host-registration': 'showHostRegistration',
			'driver-registration': 'showDriverRegistration',
		 	'profile': 'showProfileView',
		 	'dashboard': 'showDashboardView',
			
			'sign-out': 'signOut',

			'*actions': 'showHomeView'
		},

		currentView: null,

		signOut: function() {

			console.log("signing out")
			Parse.User.logOut();
			this.showHomeView();

		},
		
		showHomeView: function() {

			this.render(new HomeView());

		},

		showSignUpHost: function() {
			
			this.showSignUpView('host');

		},

		showSignUpDriver: function() {
			
			this.showSignUpView('driver');

		},

		showSignUpView: function(type) {

			if( !Parse.User.current() ) {
				
				this.render(new SignUpView({ type: type }));
					
			} else {

				this.showDashboardView();

			}

		},

		showTermsView: function() {

			if( Parse.User.current() && this.isUserCreationSteps() && !this.userAcceptedTos() ) {

				this.render(new TermsView());

			} else {

				this.showDashboardView();

			}

		},

		showHostRegistration: function() {

			if( Parse.User.current() && this.isUserCreationSteps() && this.userAcceptedTos() && !this.hasProfile() ) {

				var self = this;

				var hostFetchSuccess = function(host) {
					self.render(new HostRegistrationView({ model: host }));	
				};

				var hostFetchError = function(error) {
					console.log(error);
				};

				Parse.User.current().get("host").fetch().then(hostFetchSuccess, hostFetchError);

			} else {

				this.showDashboardView();

			}
			
		},

		showDriverRegistration: function() {

			if( Parse.User.current() && this.isUserCreationSteps() && this.userAcceptedTos() && !this.hasProfile() ) {

				var self = this;

				var driverFetchSuccess = function(driver) {
					self.render(new DriverRegistrationView({ model: driver }));	
				};

				var driverFetchError = function(error) {
					console.log(error);
				};

				Parse.User.current().get("driver").fetch().then(driverFetchSuccess, driverFetchError);

			} else {

				this.showDashboardView();

			}
			
		},

		showProfileView: function() {

			if( Parse.User.current() && this.isUserCreationSteps() && this.userAcceptedTos() && this.hasProfile()) {

				var self = this;

				var profileFetchSuccess = function(profile) {
					self.render(new ProfileView({ model: profile }));
				};

				var profileetchError = function(error) {
					console.log(error);
				};

				Parse.User.current().get("profile").fetch().then(profileFetchSuccess, profileetchError);

			} else {

				this.showDashboardView();

			}
			
		},

		showDashboardView: function() {

			if(this.handleSignOut()) {
				
				this.render(new DashboardView());
			
			}

		},

		isUserCreationSteps: function() {

			return Parse.User.current().get("status") == "creation";

		},

		isUserHost: function() {

			return Parse.User.current().get('host');

		},

		isUserDriver: function() {

			return Parse.User.current().get('driver');

		},

		hasProfile: function() {

			return Parse.User.current().get('profile') != undefined;

		},

		userAcceptedTos: function() {

			return Parse.User.current().get("tos");

		},

		handleSignOut: function() {
			
			if( Parse.User.current() ) {
				
				if( this.isUserCreationSteps() ) {

					if( this.userAcceptedTos() ) {
						
						if( this.hasProfile() ) {

							this.showProfileView();

						} else {

							if( this.isUserDriver() ) {

								this.showDriverRegistration();

							} else {

								this.showHostRegistration();

							}

						}

					} else {
						
						this.showTermsView();

					}

				} else {

					return true;

				}

			} else {

				this.showHomeView();

			}

		},

		render: function(view) {

			if(this.currentView != null) {

				this.currentView.teardown();

			}

			$("#app").html( view.render().el );
			
			this.currentView = view;
		}
	});
	return AppRouter;
});