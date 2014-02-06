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

  var DemoView = Backbone.View.extend({
    el: '#globalApp',

    permissions: {
      map: {
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
        }
      }
    },

    initialize: function() {
      Backbone.Permissions.add(this);
    },

    render: function() {
      this.$el.html('');
      this.$el.append(_.template($('#viewTemplate').text(), this));
    },

    onAuthorized: function(method) {
      this.$el.append('<p style="color:green;">'+realUser.get('name')+' can call '+method+'('+this.cid+').</p>');
    },

    onUnauthorized: function(method) {
      this.$el.append('<p style="color:red;">'+realUser.get('name')+' cannot call '+method+'('+this.cid+').</p>');
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
  });

  var LocalDemoView = DemoView.extend({
      el: '#localApp',

      getRights: function() {
        return ['can_read'];
      }
    }
  );

  var appView = new DemoView();
  console.log('appView',appView.getRights(),appView);
  appView.render();
  appView.read();
  appView.write();
  appView.swing();
  appView.bar();
  appView.foo();

  var localView = new LocalDemoView();
  localView.render();
  localView.read();
  localView.write();
  localView.swing();
  localView.bar();
  localView.foo();
console.log('localView',localView.getRights(),localView);
});