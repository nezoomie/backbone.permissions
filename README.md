#Backbone.Permissions (beta)

Rights management for Backbone objects.

#Installation

## via Bower

`bower install --save backbone.permissions`

## Traditional

Include the script after Backbone:

	<script src="backbone.js"></script>
	<script src="backbone.permissions.js"></script>
	
## Enable permissions on objects

Add Permissions support to any Backbone object:

	var DemoView = Backbone.View.extend({
	    initialize: function() {
	        Backbone.Permissions.add(this);
	    }
	});
	
Or to any custom object (controllers, routers...):

	var controller = {
		home : function() {},
		login: function() {},
		entityIndex : function() {},
		entityShow : function() {},
		entityCreate: function() {},
		entityEdit: function() {},		
		adminIndex: function() {}
	};
	
	Backbone.Permissions.add(controller);

## Provide the rights

`getRights` is the function used by Permissions to get the array of strings representing each available right for the specific object:

	var controller = {
		getRights: function() {
			return ['can_read'];
		}
		
		// methods
	}
	
	Backbone.Permissions.add(controller);
	
If missing, Permissions will use the global `Backbone.Permissions.getRights`. Override this function to get a global behavior across the application:

	Backbone.Permissions.getRights = function() {
	  return ['can_write', 'can_foo'];
	};
	
A more realistic example:

	var User = Backbone.Model.extend({
		defaults: {
			rights: 'can_read'
		}
	});
	
	var realUser = new User({ name: 'Real User' });
	
	Backbone.Permissions.getRights = function() {
		return realUser.get('rights').split(' ');
	};

## Define the rights map:

Given the previous controller example, let's secure the methods `entityCreate` and `entityEdit` for the users with `can_write` access. We also want to secure `adminIndex` for admin users with `can_administrate` rights:

	var controller = {
		permissions: {
			map: {
				'can_write': {
					allow: 'entityCreate entityEdit'
				},
				
				'can_administrate': {
					allow: 'adminIndex'
				}
			}
		},
		
		home : function() {},
		login: function() {},
		entityIndex : function() {},
		entityShow : function() {},
		entityCreate: function() {},
		entityEdit: function() {},		
		adminIndex: function() {}
	}

	Backbone.Permissions.add(controller);
	
Now `entityCreate`, `entityEdit` and `adminIndex` are available only if the respective rights are present. All the other methods (`home`,`login`,`entityIndex`,`entityShow`) are not mentioned in the map, so they are accessible regardless of rights.

## Rights Hierarchy

With the current configuration our `can_administrate` right doesn't allow the access to any editorial method. To achieve this we can specify all the additional methods:

	var controller = {
		permissions: {
			map: {
				'can_write': {
					allow: 'entityCreate entityEdit'
				},
				
				'can_administrate': {
					// Not really DRY...
					allow: 'adminIndex entityCreate entityEdit'
				}
			}
		},
		
		// methods
	}

or we could specify this right as an extension of `can_write`, using `permissions.hierarchy`:

	var controller = {
		permissions: {
			hierarchy: {
				'can_administrate'  :  'can_write'
			},
			
			map: {
				'can_write': {
					allow: 'entityCreate entityEdit'
				},
				
				'can_administrate': {
					allow: 'adminIndex'
				}
			}
		},
		
		// methods
	}

`can_administrate` now grants access to every method available for `can_write`.
One right can extend one or more from other rights:

	var controller = {
		permissions: {
			hierarchy: {
				'can_administrate'  :   'can_write',
				'can_edit_admin'    :   'can_administrate',
				'can_edit_all'      :   'can_edit_admin can_configure'
			},
			
			map: {
				'can_write': {
					allow: 'entityCreate entityEdit'
				},
				
				'can_administrate': {
					allow: 'adminIndex'
				},
				
				'can_configure': {
					allow: 'configEdit'
				},
				
				'can_edit_admin' {
					allow: 'adminEdit adminUpdate'
				}
			}
		},
		
		// methods
	} 

In this example, `can_edit_all` is a combination of `can_edit_admin` and `can_configure`, allowing access to all the methods covered by each one of them.

Usually you may want to share this hierarchy between all your objects. To do this, override `Backbone.Permissions.hierarchy`:


	Backbone.Permissions.hierarchy = {
		'can_administrate'  :   'can_write',
		'can_edit_admin'    :   'can_administrate',
		'can_edit_all'      :   'can_edit_admin can_configure'
	};
	
## onAuthorized/onUnauthorized callbacks

When a protected method is accessed and authorized/unauthorized, the relative callback is called if defined:

	var controller = {
		getRights: function() {
			return ['can_read'];
		},
	
		permissions: {			
			map: {
				'can_read': {
					allow: 'read'
				},
				'can_write': {
					allow: 'write'
				}
			}
		},
		
		onAuthorized: function(method) {
			console.log(method,'authorized!');
		},
		
		onUnauthorized: function(method) {
			console.log('Sorry,'method,'unauthorized...');
		},
		
		read: function() {
			console.log('Reading.');
		},
		write: function() {
			console.log('Writing.');
		}
	};
	
	Backbone.Permissions.add(controller);
	
	controller.read();			// 'read authorized!' 'Reading.'
	controller.write();			// 'Sorry, write unauthorized...'
	
The first argument passed to the callbacks is the method name, followed by the original arguments used to call the function.

## can/cannot methods

When an object extends Permissions it get two methods, `can` and `cannot`, which allow to easily test for the presence of a specific right:

	this.can('can_read');
	// Returns true if current rights include 'can_read'
	
	this.can('can_read can_swing');
	// Returns true if current rights include BOTH 'can_read' AND 'can_swing' 
	
These methods can be useful for templates when some parts of the UI needs to adapt to specific rights. Keep in mind that those methods fully check through the hierarchy:

	Backbone.Permissions.hierarchy = {
		'can_swing'  :   'can_read'
	};
	
	Backbone.Permissions.getRights = function() {
		return ['can_swing'];
	};
	
	// Later:
	this.can('can_read')				// true, extended by can_swing
	this.can('can_swing can_read')		// true, see above

	