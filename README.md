#Backbone.Permissions (alpha)

Handles rights management for Backbone objects.

#Installation

## via Bower

`bower install --save backbone.permissions`

## Traditional

Include a copy of the plugin after Backbone.

# Define rights globally

First, define a way to retrieve the rights at any point in the application:

	Backbone.Permissions.getRights = function() {
	  return ['can_write', 'can_foo'];
	};
	
Additionally, you can define a hierarchy of rights:

	Backbone.Permissions.hierarchy = {
		'can_read': '',
		'can_write': 'can_read',			// valid also for can_read
		'can_swing': 'can_write',			// valid also for can_read, can_write
		'can_foo': 'can_read can_swing'		// valid also for can_read, can_write, can_swing
	};
	
# Apply to views

Extend your view together with the Permissions mixin:

	var DemoView = Backbone.View.extend(
	_.extend({}, Backbone.Permissions, {
	
		// view code
		
	}));
	
Define the rights map:

	rightsMap: {
		'can_read': {
			allow: 'read'
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