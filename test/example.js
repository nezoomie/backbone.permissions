$(document).ready(function() {

  var User = Backbone.Model.extend({
    defaults: {
      rights: 'can_swing'
    }
  });

  var realUser = new User({
    name: 'Real User'
  });

	Backbone.Permissions.hierarchy = {
		'can_read': '',
		'can_write': 'can_read',
		'can_swing': 'can_write',
		'can_foo': 'can_read can_swing'
	};

  Backbone.Permissions.getRights = function() {
    return realUser.get('rights').split(' ');
  };

  var AppView = Backbone.View.extend(
    _.extend({}, Backbone.Permissions, {
      el: '#globalApp',
			
		  rightsMap: {
			  'can_read': {
				  allow: "read"
			  },
		  
			  'can_write': {
				  allow: 'write'
			  },
		  
			  'can_swing': {
				  allow: 'swing'
			  },
				
				'can_foo': {
					allow: 'foo'
				},
		  },
			
      initialize: function() {
        this.initRights();
        this.$el.append('<h3>Global View, authorizes globally: '+this.getRights().join(', ')+'</h3>');
        this.$el.append('<small>Can read?: '+this.can('can_read')+'</small><br/>');
        this.$el.append('<small>Can read and write?: '+this.can('can_read can_write')+'</small><br/>');
        this.$el.append('<small>Can swing?: '+this.can('can_swing')+'</small><br/>');				
        this.$el.append('<small>Can read and swag?: '+this.can('can_read can_swag')+'</small><br/>');
        this.$el.append('<small>Cannot swag?: '+this.cannot('can_swag')+'</small><br/>');
      },

      onAuthorized: function(method) {
        this.$el.append('<p style="color:green;">'+realUser.get('name')+' can call '+method+'.</p>');
      },

      onUnauthorized: function(method) {
        this.$el.append('<p style="color:red;">'+realUser.get('name')+' cannot call '+method+'.</p>');
      },

      read: function() {
        this.$el.append('<p>Call read.</p>');
      },

      write: function() {
        this.$el.append('<p>Call write.</p>');
      },

      swing: function() {
        this.$el.append('<p>Call swing.</p>');
      },

      bar: function() {
        this.$el.append('<p>(unprotected) Call bar.</p>');
      },

      foo: function() {
        this.$el.append('<p>Call foo.</p>');
      }
    })
  );

  var appView = new AppView();
  console.log(appView);
  appView.read();
  appView.write();
  appView.swing();
  appView.bar();
  appView.foo();
});