$(document).ready(function() {

  var User = Backbone.Model.extend({
    defaults: {
      rights: 'read write swing swang'
    }
  });

  var realUser = new User({
    name: 'Real User'
  });

  Backbone._getRights = function() {
    return realUser.get('rights').split(' ');
  };

  var AppView = Backbone.View.extend(
    _.extend({}, Backbone.Permissions, {
      el: '#globalApp',

		  roles: {
			  'can_read': {
				  allow: "read"
			  },
		  
			  'can_write': {
				  allow: 'read write only_can_write',
				  deny: 'bar'
			  },
		  
			  'can_admin': {
				  extend: 'can_write', 
				  allow: 'read write'
			  }
		  },

      securedMethods: {
        'read': {
          allow: 'read write'
        },

        'write': {
          allow: 'write'
        },

        'swing': {
          allow: 'swing'
        },

        'bar': {
          allow: 'bar',
          deny: 'foo'
        },

        'foo': {
          deny: 'bar'
        }
      },

      initialize: function() {
        this.secureMethods();
        this.secureRoles();		
        this.$el.append('<h3>Global View, authorizes globally: '+this.getRights().join(', ')+'</h3>');
        this.$el.append('<small>Can read?: '+this.can('read')+'</small><br/>');
        this.$el.append('<small>Can read and write?: '+this.can('read write')+'</small><br/>');
        this.$el.append('<small>Can read and swag?: '+this.can('read swag')+'</small><br/>');
        this.$el.append('<small>Cannot swag?: '+this.cannot('swag')+'</small><br/>');
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
        this.$el.append('<p>Call bar.</p>');
      },

      foo: function() {
        this.$el.append('<p>(unprotected) Call foo.</p>');
      }
    })
  );

  var LocalView = Backbone.View.extend(
    _.extend({}, Backbone.Permissions, {
      el: '#localApp',

      securedMethods: {
        'read': {
          allow: 'read write'
        },

        'write': {
          allow: 'write'
        },

        'swing': {
          allow: 'swing'
        },

        'bar': {
          allow: 'bar',
          deny: 'foo'
        },

        'foo': {
          deny: 'bar'
        }
      },

      initialize: function() {
        this.secureMethods();
        this.$el.append('<h3>Local View, authorizes locally: '+this.getRights().join(', ')+'</h3>');
        this.$el.append('<small>Can read?: '+this.can('read')+'</small><br/>');
        this.$el.append('<small>Can read and write?: '+this.can('read write')+'</small><br/>');
        this.$el.append('<small>Can read and swag?: '+this.can('read swag')+'</small><br/>');
        this.$el.append('<small>Cannot swag?: '+this.cannot('swag')+'</small><br/>');
        this.$el.append('<small>Cannot swag and write?: '+this.cannot('swag')+'</small><br/>');
      },

      getRights: function() {
        return ['read', 'foo'];
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
        this.$el.append('<p>Call bar.</p>');
      },

      foo: function() {
        this.$el.append('<p>(unprotected) Call foo.</p>');
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

  var localView = new LocalView();
  console.log(localView);
  localView.read();
  localView.write();
  localView.swing();
  localView.bar();
  localView.foo();
});