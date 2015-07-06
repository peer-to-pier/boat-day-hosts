
Parse.Cloud.define("createAdminCmsRole", function(request, response) {
	
	var cbBasicSuccess = function() {
		response.success();	
	};

	var cbBasicError = function(error) {
		response.error(error.message);
	}

	var roleACL = new Parse.ACL();
	roleACL.setPublicReadAccess(true);
	var role = new Parse.Role("admin-cms", roleACL);
	role.save().then(cbBasicSuccess, cbBasicError);

});

Parse.Cloud.define("attachPictureToBoat", function(request, response) {
	
	var a = [];
	var _ = require('underscore');

	new Parse.Query(Parse.Object.extend('Boat')).get(request.params.boat).then(function(boat) {
		new Parse.Query(Parse.Object.extend('FileHolder')).get(request.params.fileHolder).then(function(fh) {
			boat.relation('boatPictures').add(fh);
			boat.save().then(function() {
				response.success("done");
			}, function(error) {
				console.log(error);
				response.error("error");
			});
		});
	});

});

Parse.Cloud.define("attachProfileToUser", function(request, response) {
	
	var a = [];
	var _ = require('underscore');

	new Parse.Query(Parse.Object.extend('_User')).find().then(function(users) {
		_.each(users, function(user) {
			new Parse.Query(Parse.Object.extend('Profile')).get(user.get('profile').id).then(function(profile) {
				console.log(profile.id);
				console.log(user.id);
				profile.save({ user: user });
			});
		});
	});

});

Parse.Cloud.define("grantCmsAdmin", function(request, response) {  
	
	if( !request.params.userId ) {
		response.error("please, give a userId in POST param");
	}

	var cbBasicSuccess = function() {
		response.success();	
	};

	var cbBasicError = function(error) {
		response.error(error.message);
	}

	var roleSuccess = function(role) {

		var gotUser = function(user) {
			Parse.Cloud.useMasterKey();
			role.getUsers().add(user);
			role.save().then(cbBasicSuccess, cbBasicError);
		}

		new Parse.Query(Parse.User).get(request.params.userId).then(gotUser, cbBasicError);
	};

	var query = new Parse.Query(Parse.Role); 
	query.equalTo("name", "admin-cms");
	query.first().then(roleSuccess, cbBasicError);

});

Parse.Cloud.define("sendDriverEmail", function(request, response) {

	/**
	  * Params :
	  * - captainRequest
	  **/

	var Mailgun = require('mailgun');

	var captainRequest = request.params.captainRequest;
	var config = null;

	var cbError = function(error) {
		console.log(error);
		response.error("error in 'sendDriverEmail' check logs for more informations [captainRequest="+captainRequest+"].");
	};

	var gotCaptainRequest = function(request) {
		
		var hostlname = request.get('fromHost').get('lastname');
		var hostfname = request.get('fromHost').get('firstname'); 
		var boatname = request.get('boat').get('name');

		var data = {
			to: request.get("email"),
			from: config.get("CAPTAIN_EMAIL_FROM"),
			subject: hostfname+" "+hostlname+" has invited you to join BoatDay",
			text: 	"Hi,\n\n"+hostfname+" "+hostlname+" has invited you to become a Captain for his boat "+boatname+".\nClick the link below to register as a Captain and begin hosting great BoatDays aboard "+boatname+".\n\nhttps://www.boatdayhosts.com\n\nThanks,\nThe BoatDay Team"
		};

		Mailgun.sendEmail(data).then(function(httpResponse) {
			response.success('Email sent');
		}, cbError);
	};

	Parse.Config.get().then(function(c) {

		config = c;

		Mailgun.initialize(config.get("MAILGUN_DOMAIN"), config.get("MAILGUN_API_KEY"));
		
		var query = new Parse.Query(Parse.Object.extend('CaptainRequest'));
		query.include('boat');
		query.include('fromHost');
		query.get(captainRequest).then(gotCaptainRequest, cbError);

	});
	
});

Parse.Cloud.afterSave("CaptainRequest", function(request) {

	Parse.Cloud.run('sendDriverEmail', {captainRequest: request.object.id });
		
});

Parse.Cloud.afterSave("Notification", function(request) {

	var notification = request.object;

	if( notification.get('sendEmail') ) {

		var Mailgun = require('mailgun');

		Parse.Config.get().then(function(config) {
			
			var queryNotification = new Parse.Query(Parse.Object.extend('Notification'));
			queryNotification.include('to');
			queryNotification.include('to.user');
			queryNotification.get(notification.id).then(function(notification) {

				var name = notification.get('to').get('displayName');
				
				Mailgun.initialize(config.get("MAILGUN_DOMAIN"), config.get("MAILGUN_API_KEY"));

				Mailgun.sendEmail({
					to: notification.get('to').get('user').get("email"),
					from: config.get("CAPTAIN_EMAIL_FROM"),
					subject: "You have a new notification",
					text: 	"Hi "+name+",\n\nYou have a new message in your BoatDay inbox, access the BoatDay Host Center - https://www.boatdayhosts.com - to read your messages.\n\nWelcome aboard,\nThe BoatDay Team"
				});

			});

		});

	}
		
});


Parse.Cloud.afterSave("Host", function(request) {

	var host = request.object;

	if( host.get('status') == 'complete' && !host.get('notificationSent') ) {

		var Notification = Parse.Object.extend('Notification');
		
		var data = {
			action: 'bd-message',
			fromTeam: true,
			message: 'Welcome to BoatDay! We are currently reviewing your Host application. In the meantime, you can register a boat and start creating BoatDays.',
			to: host.get('profile'),
			sendEmail: false
		};
		
		new Notification().save(data).then(function() {
			host.save({ notificationSent: true }).then(function() {
				console.log('Notification sent / Host updated');
			});
		});

		var Mailgun = require('mailgun');

		Parse.Config.get().then(function(config) {

			Mailgun.initialize(config.get("MAILGUN_DOMAIN"), config.get("MAILGUN_API_KEY"));

			Mailgun.sendEmail({
				to: "registration@boatdayapp.com",
				from: config.get("CAPTAIN_EMAIL_FROM"),
				subject: "New BoatDay Host",
				text: "go to the CMS motherfucker"
			});

		});
	}
		
});

Parse.Cloud.afterSave("HelpCenter", function(request) {

	var Mailgun = require('mailgun');

	var feedback = request.object;

	Parse.Config.get().then(function(config) {

		var query = new Parse.Query(Parse.User);
		query.include('profile');
		query.get(feedback.get('user').id).then(function(user) {

			Mailgun.initialize(config.get("MAILGUN_DOMAIN"), config.get("MAILGUN_API_KEY"));

			Mailgun.sendEmail({
				to: "support@boatdayapp.com",
				from: config.get("CAPTAIN_EMAIL_FROM"),
				subject: 'HelpCenter from ' + user.get('profile').get('displayName') + ' <'+user.get('email')+'> : ' + feedback.get('category'),
				text: feedback.get('feedback')
			});

		});

	});

});

Parse.Cloud.beforeSave("FileHolder", function(request, response) {
	
	var fh = request.object;

	if( !fh.get('order') ) {
		var query = new Parse.Query(Parse.Object.extend('FileHolder'));
		query.equalTo("host", fh.get('host'));
		query.descending('order');
		query.count().then(function(t) {
			if( t > 0 ) {
				query.first().then(function(_fh) {
					fh.set('order', _fh.get('order') + 1);
					response.success();
				});
			} else {
				fh.set('order', 1);
				response.success();	
			}
		});
	} else {
		response.success();	
	}

});

Parse.Cloud.afterSave("SeatRequest", function(request) {
	
	var seatRequest = request.object;
	var Notification = Parse.Object.extend('Notification');

	new Parse.Query(Parse.Object.extend('BoatDay')).get(seatRequest.get('boatday').id).then(function(boatday) {
		
		var data = {};

		if( boatday.get('bookingPolicy') == 'automatically' && seatRequest.get('status') == 'pending' ) {
			data.status = 'approved';

			var Notification = Parse.Object.extend('Notification');
				
			new Notification().save({
				action: 'request-approved',
				fromTeam: false,
				message: null,
				to: seatRequest.get('profile'),
				from:  boatday.get('captain'),
				boatday: boatday,
				sendEmail: false,
				request: seatRequest
			});
		}

		if( seatRequest.get('addToBoatDay') ) {

			data.addToBoatDay = false;

			boatday.relation('seatRequests').add(seatRequest);
			boatday.save().then(function() {

				new Parse.Query(Parse.Object.extend('Host')).get(boatday.get('host').id).then(function(host) {
					new Notification().save({
						action: 'boatday-request',
						fromTeam: false,
						message: null,
						to: host.get('profile'),
						from: seatRequest.get('profile'),
						boatday: boatday,
						request: seatRequest,
						sendEmail: true
					});
				});

			});

		} 

		seatRequest.save(data);

	});

});

Parse.Cloud.afterSave("ChatMessage", function(request) {
	
	var message = request.object;
	var Notification = Parse.Object.extend('Notification');
	var _ = require('underscore');

	if( message.get('addToBoatDay') ) {

		message.save({ addToBoatDay: false });

		new Parse.Query(Parse.Object.extend('BoatDay')).get(message.get('boatday').id).then(function(boatday) {

			boatday.relation('chatMessages').add(message);
			boatday.save().then(function() {
	
				// Notify host				
				new Parse.Query(Parse.Object.extend('Host')).get(boatday.get('host').id).then(function(host) {
					if( message.get('profile').id != host.get('profile').id ) {
						console.log('** Notify Host ***');
						new Notification().save({
							action: 'boatday-message',
							fromTeam: false,
							message: null,
							to: host.get('profile'),
							from: message.get('profile'),
							boatday: boatday,
							sendEmail: false
						});
					}
				});

				// Notify Captain
				if( message.get('profile').id != boatday.get('captain').id ) {
					console.log('** Notify Captain ***');
					new Notification().save({
						action: 'boatday-message',
						fromTeam: false,
						message: null,
						to: boatday.get('captain'),
						from: message.get('profile'),
						boatday: boatday,
						sendEmail: false
					});
				}


				// Notify Users approved
				var query = boatday.relation('seatRequests').query();
				query.equalTo('status', 'approved');
				query.notEqualTo('profile', message.get('profile').id);
				query.find().then(function(requests) {
					_.each(requests, function(request) {
						new Notification().save({
							action: 'boatday-message',
							fromTeam: false,
							message: null,
							to: request.get('profile'),
							from: message.get('profile'),
							boatday: boatday,
							sendEmail: false
						});
					});
				});

			});

		});

	}

});
