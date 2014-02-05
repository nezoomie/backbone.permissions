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

		hierarchy: {},

    _parseArrayString: function(array) {
      return _(array.split(' ')).chain().uniq().compact().value();
    },

    _getAllRights: function() {
      var _this = this,
          userRights = this.getRights(),
          rightsArray = [],
          retrieveRights = function(right) {
            rightsArray.push(right);
            linkedRights = _this.hierarchy[right] ? _this._parseArrayString(_this.hierarchy[right]) : [];
            _(linkedRights).each(function(linkedRight) {
              retrieveRights(linkedRight);
            });
          };

      _(userRights).each(retrieveRights);

      return _(rightsArray).compact();
    },

    can: function(rights) {
      rights = this._parseArrayString(rights);
      return _.intersection(rights, this._getAllRights()).length === rights.length;
    },

    cannot: function(rights) {
      rights = this._parseArrayString(rights);
      return _.intersection(rights, this._getAllRights()).length !== rights.length;
    },

		initRights: function() {
			var _this = this,
					securedMethods = {},
					extendRights = function(rightName,rights,baseRights) {
						var rightsToMixin = _this._parseArrayString(baseRights),
                mixedRights = {
									allow: rights.allow
								};
						
						_(rightsToMixin).each(function(mixinRight) {
							basePermissions = _this.rightsMap[mixinRight];
							if (!basePermissions) throw new Error('No mappings specified for right "'+mixinRight+'"');
							if (_this.hierarchy[mixinRight]) {
								basePermissions = extendRights(mixinRight, basePermissions, _this.hierarchy[mixinRight]);
							}

							var baseAllow = _(basePermissions.allow).isString()
								? _(basePermissions.allow.split(' ')).compact()
								: _(basePermissions.allow).compact();
								
							mixedRights = {
								allow: _(mixedRights.allow).chain()
								.union(baseAllow)
								.uniq()
								.value()
							}
						});
						
						return mixedRights;						
					};

			_(this.rightsMap).each(function(permissions, right) {
				var rights = {
							allow: permissions.allow ? _(permissions.allow.split(' ')).compact() : []
						},
						baseRights = _this.hierarchy[right] ? _this.hierarchy[right] : null;
				
				if (baseRights) {
					rights = extendRights(right, rights, baseRights);
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
					securedMethods[method][action] = _(rights).chain().uniq().compact().value();	
				});
			});
			
//			console.log('secured roles', securedMethods);
			this.securedMethods = securedMethods;
			this._secureMethods();
		},

    _secureMethods: function() {
      var _this = this;
      _(this.securedMethods).each(function(permissions,method) {
        if (!_this[method] || !_.isFunction(_this[method])) return;
        _this[method] = _(_this[method]).wrap(function(func) {
          var funcArgs = _.rest(Array.prototype.slice.call(arguments)),
            userRights = _this.getRights(),
            allowedRights = permissions.allow,
            authorized = ( _.isEmpty(allowedRights) || !( _.isEmpty(_.intersection(userRights,allowedRights)) ) );

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