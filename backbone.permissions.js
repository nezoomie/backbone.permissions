/*
 * Backbone.Permissions, v0.5.2
 * Copyright (c)2014 Giuseppe Sorce
 * Distributed under MIT license
 */
( function(Backbone, _) {

  var Permissions = Backbone.Permissions = {
      getRights: function() {
        return [];
      },
      hierarchy: {}
    };

  Permissions.add = function(entity) {
    entity.securedMethods = {};
    entity.permissions = entity.permissions || {};
    entity.permissions.hierarchy = entity.permissions.hierarchy || Backbone.Permissions.hierarchy;
    entity.getRights = entity.getRights || function() {
      return Backbone.Permissions.getRights.apply(this, arguments);
    };

    entity._parseArrayString = function(array) {
      return _(array.split(' ')).chain().uniq().compact().value();
    };

    entity._getAllRights = function() {
      var _this = this,
        userRights = _this.getRights(),
        rightsArray = [],
        retrieveRights = function(right) {
          rightsArray.push(right);
          linkedRights = _this.permissions.hierarchy[right]
              ? _this._parseArrayString(_this.permissions.hierarchy[right])
              : [];

          _(linkedRights).each(function(linkedRight) {
            retrieveRights(linkedRight);
          });
        };

      _(userRights).each(retrieveRights);

      return _(rightsArray).compact();
    };

    entity.can = function(rights) {
      rights = this._parseArrayString(rights);
      return _.intersection(rights, this._getAllRights()).length === rights.length;
    };

    entity.cannot = function(rights) {
      rights = this._parseArrayString(rights);
      return _.intersection(rights, this._getAllRights()).length !== rights.length;
    };

    entity.initRights = function() {
      var _this = this,
        securedMethods = {};

      _(this.permissions.map).each(function(permissions, right) {
        var rights = {
            allow: permissions.allow ? _(permissions.allow.split(' ')).compact() : []
          },
          baseRights = _this.permissions.hierarchy[right] ? _this.permissions.hierarchy[right] : null;

        if (baseRights) {
          rights = _extendRights(right, rights, baseRights);
        }

        _(rights).each(function(rightGroup, action) {
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

      this.permissions.securedMethods = securedMethods;
      _secureMethods();
    };

    var _secureMethods = function() {
      var _this = entity;
      _(_this.permissions.securedMethods).each(function(permissions,method) {
        if (!_this[method] || !_.isFunction(_this[method])) return;
        _this[method] = _(_this[method]).wrap(function(func) {
          var funcArgs = _.rest(Array.prototype.slice.call(arguments)),
            userRights = _this._getAllRights(),
            allowedRights = permissions.allow,
            authorized = ( _.isEmpty(allowedRights) || !( _.isEmpty(_.intersection(userRights,allowedRights)) ) );

          if (authorized) {
            if( _.isFunction(_this.onAuthorized) ) _this.onAuthorized.apply(_this,_([method,funcArgs]).flatten());
            func.apply(_this,funcArgs);
          } else {
            if( _.isFunction(_this.onUnauthorized) ) _this.onUnauthorized.apply(_this,_([method,funcArgs]).flatten());
          }
        });
      }, _this);
    };

    var _extendRights = function(rightName,rights,baseRights) {
      var rightsToMixin = entity._parseArrayString(baseRights),
        mixedRights = {
          allow: rights.allow
        };

      _(rightsToMixin).each(function(mixinRight) {
        basePermissions = entity.permissions.map[mixinRight] || {};

        if (entity.permissions.hierarchy[mixinRight]) {
          basePermissions = _extendRights(mixinRight, basePermissions, entity.permissions.hierarchy[mixinRight]);
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

    entity.initRights();
  };
} )( Backbone, _ );
