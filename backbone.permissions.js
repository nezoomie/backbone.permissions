/*
 * Backbone.Permissions, v0.1
 * Copyright (c)2014 Giuseppe Sorce
 * Distributed under MIT license
 */
( function(Backbone, _) {

  var __getRights__ = Backbone._getRights = function() {
    return [];
  };

  var Permissions = Backbone.Permissions = function() {};

  _.extend(Permissions, {
    securedMethods: {},

    onAuthorized: function() {},

    onUnauthorized: function() {},

    extend: Backbone.Model.extend,

    getRights: function() {
      return Backbone._getRights.apply(this, arguments);
    },

    _parseArrayString: function(array) {
      return _(array.split(' ')).chain().uniq().compact().value();
    },

    can: function(rights) {
      rights = this._parseArrayString(rights);
      return _.intersection(rights, this.getRights()).length === rights.length;
    },

    cannot: function(rights) {
      rights = this._parseArrayString(rights);
      return _.intersection(rights, this.getRights()).length !== rights.length;
    },

		initRights: function() {
			var _this = this,
					securedMethods = {},
					extendRights = function(rights,baseRight) {
						basePermissions = _this.rightsMap[baseRight];
						
						if (!basePermissions) throw new Error('No mappings specified for right "'+baseRight+'"');
						if (basePermissions.extend) {
							basePermissions = extendRights(basePermissions, basePermissions.extend);
						}

						console.log('allow',basePermissions)
						var baseAllow = _(basePermissions.allow).isString()
							? _(basePermissions.allow.split(' ')).compact()
							: _(basePermissions.allow).compact();
						return {
							allow: _(rights.allow).chain()
							.union(baseAllow)
							.uniq()
							.value()
						} 						
					};

			_(this.rightsMap).each(function(permissions, right) {
				var rights = {
							allow: permissions.allow ? _(permissions.allow.split(' ')).compact() : []
						},
						baseRight = permissions.extend;
				
				if (baseRight) {
					rights = extendRights(rights, baseRight)
					// basePermissions = _this.rightsMap[baseRight];
					// if (!basePermissions) throw new Error('No mappings specified for right "'+baseRight+'"');
					// rights.allow = _(rights.allow).chain()
					// 	.union(basePermissions.allow ? _(basePermissions.allow.split(' ')).compact() : [])
					// 	.uniq()
					// 	.value();
				}
				
				_(rights).each(function(rightGroup, action) {
						if (action=='extend') return;
						_(rightGroup).each(function(method) {
							securedMethods[method] = securedMethods[method] || {};
							securedMethods[method][action] = securedMethods[method][action] || [];
							securedMethods[method][action].push(right);
						});
				});
			});
			
			_(securedMethods).each(function(rightGroup, method) {
				_(rightGroup).each(function(rights, action) {
					console.log(rights);
					securedMethods[method][action] = _(rights).chain().uniq().compact().value();	
				});
			});
			
			console.log('secured roles', securedMethods);
		},

    secureMethods: function() {
      var _this = this;
      _(this.securedMethods).each(function(permissions,method) {
        if (!_this[method] || !_.isFunction(_this[method])) return;
        _this[method] = _(_this[method]).wrap(function(func) {
          var funcArgs = _.rest(Array.prototype.slice.call(arguments)),
            userRights = _this.getRights(),
            allowedRights = permissions.allow
              ? permissions.allow.split(' ')
              : [],
            deniedRights = _this.securedMethods[method].deny
              ? permissions.deny.split(' ')
              : [],
            authorized = ( _.isEmpty(deniedRights) || _.isEmpty(_.intersection(userRights,deniedRights)) )
              && ( _.isEmpty(allowedRights) || !( _.isEmpty(_.intersection(userRights,allowedRights)) ) );

          if (authorized) {
            this.onAuthorized.apply(_this,_([method,funcArgs]).flatten());
            func.apply(_this,funcArgs);
          } else {
            _this.onUnauthorized.apply(_this,_([method,funcArgs]).flatten());
          }
        });
      }, _this);
    }
  });

} )( Backbone, _ );