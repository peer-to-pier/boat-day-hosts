define([
'jquery', 
'underscore', 
'parse',
'views/BaseView',
'views/BoatsSelectView',
'text!templates/BoatdayTemplate.html'
], function($, _, Parse, BaseView, BoatsSelectView, BoatdayTemplate){
	var BoatdayView = BaseView.extend({

		className:"view-event",

		template: _.template(BoatdayTemplate),

		debug: true,

		events: {
			
			"submit form" : "save",
			'change [name="activity"]' : "refreshActivity", 
			'change [name="equipmentProvidedFishing"]': "showContingentFieldsFishing", 
			'change [name="equipmentProvidedSport"]': "showContingentFieldsSport"
		}, 

		initialize: function() {

		},

		render: function() {

			BaseView.prototype.render.call(this);

			var self = this;

			var boatsFetchSuccess = function(collection) {

				var boatsView = new BoatsSelectView({ collection: collection });
				self.subViews.push(boatsView);
				self.$el.find('.boats').html(boatsView.render().el);

			};

			var collectionFetchError = function(error) {

				console.log(error);

			};

			Parse.User.current().get('host').relation('boats').query().collection().fetch().then(boatsFetchSuccess, collectionFetchError);


			var dateYear = this.model.get('date') ? this.model.get('date').getFullYear() : new Date().getFullYear();
			for(var i = dateYear; i < new Date().getFullYear() + 3; i++) {
				var opt = $('<option>').val(i).text(i);
				if( dateYear == i ) opt.attr('selected', 1);
				this.$el.find('[name="dateYear"]').append(opt);
			}

			this.refreshActivity();
			return this;

		},

		debugAutofillFields: function() {

			this._in('name').val('Summer sound festival');
			this._in('price').val('25');
			this._in('availableSeats').val('10');
			this._in('minimumSeats').val('5');
			this._in('description').val('This event has many top DJs in the world.');

		},

		refreshActivity: function() {

			var activity = this._in('activity').val();
			this.$el.find('.activityContainer').hide();
			this.$el.find(".activityContainer." + activity).show();

			this.$el.find('.equipmentProvidedFishing').hide();
			this.$el.find('.equipmentProvidedWaterSport').hide();
			this.$el.find('[name="equipmentProvidedFishing"]').prop('checked', false);
			this.$el.find('[name="equipmentProvidedSport"]').prop('checked', false);
		
		},

		showContingentFieldsFishing: function() {

			this.$el.find('.equipmentProvidedFishing').show();
			//this.$el.find('[name="equipmentProvidedSport"]:checked')?$('.equipmentProvidedFishing').show():$('.equipmentProvidedFishing').hide();

		},

		showContingentFieldsSport:function() {

			this.$el.find('.equipmentProvidedWaterSport').show();

		},

		save: function(event) {

			event.preventDefault();
			var self = this;
			var baseStatus = this.model.get('status');

			var data = {

				status: 'complete',

				//name: this._in('name').val(), 
				description: this._in('description').val(),
				date: new Date(
					this._in('dateYear').val(), 
					this._in('dateMonth').val()-1, 
					this._in('dateDay').val(), 
					this._in('dateHours').val(), 
					this._in('dateMinutes').val(),
					0),
				boat: this._in('boat').val(), 
				captain: this._in('captain').val(), 
				location: null,
				duration: parseInt(this._in('duration').val()), 
				price: parseInt(this._in('price').val()), 
				availableSeats: parseInt(this._in('availableSeats').val()), 
				minimumSeats: parseInt(this._in('minimumSeats').val()), 
				bookingPolicy: this.$el.find('[name="bookingPolicy"]:checked').val(),
				cancellationPolicy: this.$el.find('[name="cancellationPolicy"]:checked').val(), 
				category: this._in('activity').val()

			};
			console.log(data);

			var saveSuccess = function( boatday ) {
		
				if( baseStatus == 'creation' ) {

					var hostSaveSuccess = function() {
						Parse.history.navigate('boatday/'+boatday.id, true);
					};

					var hostSaveError = function(error) {
						console.log(error);
					}

					var host = Parse.User.current().get("host");
					host.relation('boatdays').add(boatday);
					host.save().then(hostSaveSuccess, hostSaveError);

				} else {
					
					Parse.history.navigate('dashboard', true);

				}

			};

			var saveError = function(error) {
				
				self.buttonLoader();

				if( error.type && error.type == 'model-validation' ) {
					console.log(error);
					_.map(error.fields, function(message, field) { 
						self.fieldError(field, message);
					});

				} else {

					console.log(error);
					self._error(error);

				}

			};
			
			this.model.save(data).then(saveSuccess, saveError);


		}
	});
	return BoatdayView;

});