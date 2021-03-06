define([
'parse'
], function(Parse){
	var HostModel = Parse.Object.extend("Host", {

		defaults: {

			status: 'creation',
			type: null,
			phone: null,
			accountHolder: null,
			accountNumber: null,
			accountRouting: null,
			stripeId: null,
			
			rate: 0.15,
			coupon: null,

			street: null,
			city: null,
			zipCode: null,
			state: null,
			country: "US",

			businessName: null,
			businessEin: null,

			firstname: null, 
			lastname: null, 
			birthdate: null,
			SSN: null,

			//for boatDay cms
			bgCheck:null, 
			bgCheckDate: null, 
			validationText: null, 
			validationTextInternal: null, 

			bgCheckQ1: false, 
			bgCheckQ2: false,
			bgCheckQ3: false,
			bgCheckQ4: false,
			bgCheckQ5: false,
			bgCheckQ6: false,
			bgCheckQ7: false,
			bgCheckQ8: false,
			bgCheckQ9: false,

			certBSC: null,
			certStatusBSC: "pending",
			certResponseBSC: null,
			
			certCCL: null,
			certStatusCCL: "pending",
			certResponseCCL: null,

			certFAC: null,
			certStatusFAC: "pending",
			certResponseFAC: null,
			
			certFL: null,
			cerStatustFL: "pending",
			certResponseFL: null,

			certMCL: null,
			certStatusMCL: "pending",
			certResponseMCL: null,
			
			certSL: null,
			cerStatustSL: "pending",
			certResponseSL: null,

			notificationSent: false,
		},

		isPhoneValid: function(phone) {
			
			var phoneNumberPattern = /^\(?([0-9]{3})\)?([ .-]?)([0-9]{3})([ .-]?)([0-9]{4})$/;
   			return phoneNumberPattern.test(phone.trim());

		},

		isEmailValid: function(email) {

			var emailPattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    		return emailPattern.test(email);

		},

		isBusinessEIN: function(ein) {

			var einPattern = /^[0-9]\d?-\d{7}$/;
			return einPattern.test(ein);

		},

		validate: function(attributes){

			var _return = { 
				fields: {},
				type: 'model-validation'
			};

			if( attributes.status == 'creation' ) {
				// if the status is creation is because we are trying to update user field and not submitting the form.
				return ;
			}
			// Global fields

			if( !attributes.phone ) {
				_return.fields.phone = 'Oops, you missed one!';
			}
			
			if( !attributes.street ) {
				_return.fields.street = 'Oops, you missed one!';
			}

			if( !attributes.city ) {
				_return.fields.city = 'Oops, you missed one!';
			}

			if( !/^\d{5}$/.test(attributes.zipCode) ) {
				_return.fields.zipCode = 'Oops, you missed one! Please enter your 5 digit zip code.';
			}

			if( !attributes.street ) {
				_return.fields.street = 'Oops, you missed one!';
			}

			if( !this.isPhoneValid(attributes.phone) ) {
				_return.fields.phone = 'Oops, you missed one! Enter your phone number, area code and all.';
			}

			if( !attributes.firstname ) {
				_return.fields.firstname = 'Oops, you missed one!';
			}
			 
			if( !attributes.lastname ) {
				_return.fields.lastname = 'Oops, you missed one!';
			}

			if( !/^\d{4}$/.test(attributes.SSN) ) {
				_return.fields.SSN = 'Soc. Sec. # (last 4 digits) is required.';
			}

			if( attributes.businessEin && !this.isBusinessEIN(attributes.businessEin) ) {
				_return.fields.businessEin = 'The EIN number must be in a valid 9 digit format.';
			}	

			if( _.size(_return.fields) > 0 ) {
				return _return;
			}

		}
 
	});
	return HostModel;
});