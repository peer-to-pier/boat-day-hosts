define([
'models/BoatDayModel',
'models/NotificationModel',
'views/BaseView',
'text!templates/BoatDaysTemplate.html',
'text!templates/DashboardBoatDaySingleTemplate.html',
'text!templates/DashboardBoatDayRequestRateTemplate.html'
], function(BoatDayModel, NotificationModel, BaseView, BoatDaysTemplate, DashboardBoatDayTemplate, DashboardBoatDayRequestRateTemplate){
	var BoatDaysView = BaseView.extend({

		className: "view-my-boatdays",
		
		template: _.template(BoatDaysTemplate),
		
		events: {
			'click .boatday-box-close': 'closeBox',
			'click .boatday-box-open': 'openBox',
			'mouseover .stars img': 'rateOver',
			'mouseout .stars img': 'rateOut',
			'click .stars img': 'rate',
		},

		requests: {},

		boatday: {},

		theme: "dashboard",

		rateOver: function(event) {
			var e = $(event.currentTarget);
			e.attr('src', 'resources/star-full.png');
			e.prevAll().attr('src', 'resources/star-full.png');
		},

		rateOut: function(event) {
			var e = $(event.currentTarget);
			e.attr('src', 'resources/star.png');
			e.prevAll().attr('src', 'resources/star.png');
		},

		rate: function(event) {
			var self = this;
			var e = $(event.currentTarget);
			var requestId = e.closest('.request').attr('data-id');
			var boatdayId = e.closest('.my-boatday').attr('data-id');

			self.requests[boatdayId][requestId].save({ ratingHost: parseInt(e.attr('data-rate')) }).then(function(request) {

				var profile = self.requests[boatdayId][requestId].get('profile');
				var rating = typeof profile.get('rating') != typeof undefined && profile.get('rating') ? profile.get('rating') : 0;
				var ratingAmount = profile.get('ratingAmount');

				profile.save({
					rating : ( rating * ratingAmount  + parseInt(e.attr('data-rate')) ) / (ratingAmount + 1),
					ratingAmount: ratingAmount + 1
				});

				new NotificationModel().save({
					action: 'boatday-rating',
					fromTeam: false,
					message: null,
					to: request.get('profile'),
					from:  Parse.User.current().get('profile'),
					boatday: request.get('boatday'),
					sendEmail: false,
					request: request
				}).then(function() {
					self.renderRequests(boatdayId);
				});

			}, function(error) {
				console.log(error);
			});
			
		},

		openBox: function(event) {
			$(event.currentTarget).closest('.my-boatday').find('.boatday-share').hide();
			$(event.currentTarget).closest('.my-boatday').find($(event.currentTarget).attr('data-target')).fadeIn();
		},

		closeBox: function(event) {
			$(event.currentTarget).closest('.my-boatday').find('.boatday-share').show();
			$(event.currentTarget).closest('.box').fadeOut();
		},

		render: function() {

			BaseView.prototype.render.call(this);
			
			var self = this;

			self.$el.find('.left-navigation .menu-my-boatdays').addClass('active');
			//self.$el.find('.left-navigation a.link').hide();
			//self.$el.find('.left-navigation a.menu-my-boatdays').show().css('display', "block");

			self.$el.find('.add-boatday, .my-boatdays').hide();

			var queryBoatDaysComplete = new Parse.Query(BoatDayModel);
			queryBoatDaysComplete.equalTo("status", 'complete');
			queryBoatDaysComplete.lessThan("date", new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

			var queryBoatDaysOthers = new Parse.Query(BoatDayModel);
			queryBoatDaysOthers.notContainedIn("status", ['complete', 'creation']);

			var mainQuery = Parse.Query.or(queryBoatDaysComplete, queryBoatDaysOthers);
			mainQuery.equalTo("host", Parse.User.current().get("host"));
			mainQuery.descending('date,departureTime');
			mainQuery.include('boat');
			mainQuery.include('captain');
			mainQuery.find().then(function(boatdays) {
				
				if(boatdays.length == 0) {
					self.$el.find('.add-boatday').fadeIn();
					return;
				}

				var tpl = _.template(DashboardBoatDayTemplate);
				//var target = self.$el.find('.my-boatdays .content .items');

				var targetPastBoatDays = self.$el.find('.my-boatdays .past-boatdays-tab .content .items');

				var targetCancelledBoatDays = self.$el.find('.my-boatdays .cancelled-boatdays-tab .content .items');
				
				//target.html('');

				targetPastBoatDays.html('');

				targetCancelledBoatDays.html('');


				var left = false;

				_.each(boatdays, function(boatday) {

					//alert(boatday.get('status'));
					
					left = !left;

					var _bDa = boatday.get('date');
					var _bDt = boatday.get('departureTime');

					var SeatRequest = Parse.Object.extend("SeatRequest");
					var qSeatRequest = new Parse.Query(SeatRequest);
					qSeatRequest.equalTo("boatday", boatday);
					qSeatRequest.equalTo("status", "pending");

					qSeatRequest.count().then(function(count){

						var _tpl = tpl({
							pendingRequests: count,
							_class: left ? 'left' : 'right',
							id: boatday.id,
							status: boatday.get('status'),
							date: self.dateParseToDisplayDate(_bDa),
							time: self.departureTimeToDisplayTime(_bDt),
							duration: boatday.get('duration'),
							name: boatday.get('name'),
							availableSeats: boatday.get('availableSeats'),
							bookedSeats: boatday.get('bookedSeats'),
							potEarings: boatday.get('price') * (1 - Parse.User.current().get('host').get('current')) * boatday.get('availableSeats'),
							boatName: boatday.get('boat').get('name'),
							boatType: boatday.get('boat').get('type'),
							boatYear: boatday.get('boat').get('buildYear'),
							captainName: boatday.get('captain').get('displayName'),
							picture: 'resources/boat-placeholder.png',
							description: boatday.get('description'),
							price: boatday.get('price'),
							activity: self.boatdayActivityToDisplay(boatday.get('category')),
							booking: self.boatdayBookingToDisplay(boatday.get('bookingPolicy')),
							cancellation: self.boatdayCancellationToDisplay(boatday.get('cancellationPolicy')),
							location: "Miami Beach",
							active: false,
							host: boatday.get('host'),
							potEarings: boatday.get('earnings') ? boatday.get('earnings') : 0,
						});

						
						//target.append(_tpl);

						if(boatday.get("status") == "cancelled"){
							targetCancelledBoatDays.append(_tpl);
						} else {
							targetPastBoatDays.append(_tpl);
						}

					});



					var q = boatday.get('boat').relation('boatPictures').query();
					q.ascending('order');
					q.first().then(function(fileholder) {
						
						if( fileholder ) {
							self.$el.find('.my-boatdays .my-boatday-'+boatday.id+' .picture').css({ backgroundImage: 'url('+fileholder.get('file').url()+')' });
						}

					});

					// self.requests[boatday.id] = {};

					// var q = boatday.relation('seatRequests').query();
					// q.descending('createdAt');
					// q.equalTo('status', 'approved');
					// q.include('profile');
					// q.include('boatday');
					// q.find().then(function(requests) {

					// 	if( requests.length == 0 ) {
					// 		self.$el.find('.my-boatdays .my-boatday-'+boatday.id+' .box-requests .info').html('<p class="empty"><em>Nobody attended this BoatDay.</em></p>');
					// 		return ;
					// 	}
						
					// 	_.each(requests, function(request) {
					// 		self.requests[boatday.id][request.id] = request;
					// 	});

					// 	self.renderRequests(boatday.id);

					// });
				});

				self.$el.find('.my-boatdays').fadeIn();

			});

			return this;

		},

		renderRequests: function(boatdayId) {
			
			var self = this;
			var tpl = _.template(DashboardBoatDayRequestRateTemplate);

			self.$el.find('.my-boatdays .my-boatday-'+boatdayId+' .box-requests .info').html('');

			_.each(self.requests[boatdayId], function(request) {

				var _tpl = tpl({
					profile: request.get('profile'),
					request: request,
				});

				self.$el.find('.my-boatdays .my-boatday-'+boatdayId+' .box-requests .info').append(_tpl);
				
			});
		}

	});
	return BoatDaysView;
});
