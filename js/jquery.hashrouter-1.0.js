/*
 * jQuery hashrouter plugin
 *
 * The MIT License
 *
 * Copyright (c) 2011 Emberex Inc / Will Shaver
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function($){
    if(!$.hr){
        $.hr = new function(){
            this.options = {};
            this.defaultOptions = {
                  searchEngineFriendly : true,
                  errorLogging : false,
                  autoParse : true,
                  routes : {}
            };

            var _state, _defaultState, _overrideState, _ignoreNextUpdate,
              _triggerQueue, _bindings, _unique;

            this.init = function(options){
                this.options = $.extend({}, this.defaultOptions, options);
                _state = {};
                _overrideState = {};
                _defaultState = {};
                _ignoreNextUpdate = false;
                _triggerQueue = [];
                _bindings = {};
                _unique = 0;
                $.history.init(function(hash) {
                    _hashUpdated(hash);
                }, {unescape:"/;:"});
                $.hr.parseElement($(document));
            };

            this.get = function(variable) {
                if(variable in _overrideState)
                    return _overrideState[variable];
                if(variable in _state)
                    return _state[variable];
                return _defaultState[variable];
            };

            this.set = function(variable, value) {
              _state[variable] = value;
              return this;
            };

            this.setOverride = function(variable, value) {
                _overrideState[variable] = value;
            };

            this.getOverride = function(variable) {
                return _overrideState[variable];
            };

            this.removeOverride = function(variable){
                delete _overrideState[variable];
            };

            this.resetOverride = function(){
                _overrideState = {};
            };

            this.remove = function(variable){
              delete _state[variable];
              return this;
            }

            this.getDefault = function(variable){
              return _defaultState[variable];
            }

            this.setDefault = function(variable, value){
              _defaultState[variable] = value;
              return this;
            }

            this.removeDefault = function(variable){
              delete _defaultState[variable];
              return this;
            }

            this.getKeys = function() {
              var ret = [];
              for(var k in _state){
                ret.push(k);
              }
              for(var k in _defaultState){
                ret.push(k);
              }
              return ret;
            };

            this.getAll = function() {
              var ret = {};
              var keys = this.getKeys();
              for(var i = 0; i < keys.length; i++){
                var key = keys[i];
                ret[key] = this.get(key);
              }
              return ret;
            };
                                 //variables, [value], reset
            this.setUrl = function(variable, value, reset){
                var update = {};
                if(typeof variable === 'object'){
                    reset = value;
                    update = variable;
                } else {
                    update[variable] = value;
                }

                if(!reset) {
                    update = $.extend({}, _state, update);
                }

                var encoded = _encode(update);
                $.history.load(encoded);
            }

            this.trigger = function(variable) {
                _triggerQueue.push(variable);
                _executeTriggerQueue();
            };

            this.triggerAll = function(){
              var keys = this.getKeys();
              for(var i = 0; i < keys.length; i++){
                _triggerQueue.push(keys[i]);
              }
              _executeTriggerQueue();
            };

            //dom is optional, the document object will be bound if no dom object is supplied
            this.bind = function(dom, key, callback) {
                var keys = [];
                if(typeof key === 'function')
                {
                    callback = key;
                    key = dom;
                    dom = document;
                }
                if(typeof callback !== 'function') {
                    $.hr.options.errorLogging && console.error('non-function declared in bind.');
                    return;
                }
                var element = $(dom);
                if(element.length == 0) {
                    $.hr.options.errorLogging && console.error('unknown dom element in bind ' + dom);
                    return;
                }
                var eventName = 'hr_' + (_unique++);
                var key = _normalizeKey(key);
                _bindings[eventName] = {keys: key, callback: callback, eventName: eventName};
                element.bind(eventName, function(event, value, key) {
                    callback.call(element, value, key); //for group events, value is an object of pairs
                });
            };

            this.parseElement = function(element) {
                if(!element || element.length == 0){
                    element = $(document);
                }
                $('a', element).each(function(index, value) {
                    _parseHref(value);
                });
            };

          //turns all keys into an object of keys and matching values an array
          //{key:[], key2:['value1','value2']}
            var _normalizeKey = function(key){
                if(key instanceof Array){ //['key', 'key2', 'key3']
                    var ret = {};
                    if(key.length == 1 && key[0] == '_'){
                        return ret; //supports older method of specifying catch-all
                    }
                    for(var i=0;i<key.length;i++){
                        ret[key[i]] = [];
                    }
                    return ret;
                }
                if(typeof key === 'string'){ //'key'
                    var ret = {};
                    ret[key] = [];
                    return ret;
                }
                if(typeof key === 'object') {
                    for(var k in key){
                        var values = key[k];
                        if(typeof values === 'string' || typeof values === 'number') { //{key:'value', key2:'value'}
                            key[k] = [values];
                        }
                        values = key[k];
                        for(var i=0;i<values.length;i++){
                            if(values[i] !== null && values[i] !== undefined) {
                                values[i] = values[i].toString();
                            }
                        }
                    }
                }
                return key;
            };

            var _parseHref = function(link) {
                link = $(link);
                var href = link.attr('href');

                if(!href || href.length === 0)
                    return;

                var hashLess = href.substring(0, href.indexOf('#'));
                href = href.substring(href.indexOf('#'));


                if(!href || href.length === 0 || href.charAt(0) != '#')
                    return;

                var sourceHref = link.data('sourceHref');
                if(sourceHref) {
                    href = sourceHref;
                } else {
                    link.data('sourceHref', href);
                }

                var reset = forceTriggers = false;
                if(href.length > 0 && href.charAt(0) == '#') {
                    href = href.substr(1);
                }
                if(href.length > 0 && href.charAt(0) == '#') {
                    reset = true;
                    href = href.substr(1);
                }
                if(href.length > 0 && href.charAt(0) == '!') {
                    forceTriggers = true;
                    href = href.substr(1);
                }
                var decodedHref = _decode(href);

                if(reset)
                    var newState = $.extend({}, decodedHref);
                else
                    var newState = $.extend({}, _state, decodedHref);

                var encodedState = _encode(newState);

                if(forceTriggers) {
                    link.unbind('click').click(function(event) {
                        if(event.which == 1 && event.altKey == false && event.ctrlKey == false && event.metaKey == false) {
                            var current = window.location.hash;
                            if(current == '#' + encodedState) {
                                 for(var key in decodedHref) {
                                     _state[key] = 'bea136d7-a46f-4ed6-ae3b-7cca25a6ae42';
                                 }
                                 _hashUpdated(encodedState);
                            }
                        }
                    });
                }

                link.attr('href', hashLess + '#' + encodedState);
            };

            var _executeTriggerQueue = function() {
                if(!_triggerQueue.length)
                    return;
                _triggerQueue = $.unique(_triggerQueue);
                _orderTriggerQueue();

                //spinning this off into a separate function in case the queue gets updated during the call
                var process = (function(queue) {
                    return function() {
                        //reset all bindings to uncalled
                      for(var eventName in _bindings) {
                        var event = _bindings[eventName];
                          event.called = false;
                      }

                      while(queue.length > 0) {
                        var trigger = queue.shift();
                        var value = $.hr.get(trigger);
                        _trigger(trigger, value);
                      }
                    };
                })(_triggerQueue);

                _triggerQueue = [];
                process();
            };

            var _canCallEvent = function(eventObj){
              if(eventObj.called)
                  return false;
              for(var eventKey in eventObj.keys){
                var validVals = eventObj.keys[eventKey];
                var value = $.hr.get(eventKey);
                if(validVals.length > 0 && $.inArray(value, validVals) == -1){
                  return false;
                }
              }
              return true;
            }

            var _trigger = function(key, value) {
                for(var eventName in _bindings) {
                    var event = _bindings[eventName];
                    //{key:[], key2:['value1','value2']}
                    if((key in event.keys || $.isEmptyObject(event.keys))
                            && _canCallEvent(event, value)){
                        //empty object is used to catch all events
                        var values = {};
                        var first = undefined;
                        for(var k in event.keys){
                            if(first == undefined){
                                first = k;
                            }
                            values[k] = $.hr.get(k);
                        }

                        if(first == undefined){
                            values = $.hr.getAll();
                        } else if(first == k){ //only one value
                            values = values[first];
                        }
                        $.event.trigger(event.eventName, [values, key]);
                        event.called = true; //only call it once
                    }
                }
                $.event.trigger('hr__', value, key);
            };

            var _routeEncode = function(items, routes) {
              if($.isEmptyObject(items))
                  return '';
              for(var key in routes) {
                  if(key in items) {
                      var route = routes[key];
                      var value = items[key];
                      delete items[key];
                      if(value in route) {
                          routes = route[value];
                      }else if('_' in route) { //default route
                          routes = route['_'];
                      }else {
                          return value + '/';
                      }
                      return value + '/' + _routeEncode(items, routes);
                  } else if(key in _defaultState) {
                      items[key] = _defaultState[key];
                      return _routeEncode(items, routes);
                  }
              }
              return '';
          };

         var _encode = function(items) {
              var items = $.extend({}, items);
              for(var key in items){
                  if(items[key] === null){
                      delete items[key];
                  }
              }
              var encoded = '';
              if($.hr.options.searchEngineFriendly){
                encoded += "!";
              }
              encoded += '/';
              var routes = $.extend({}, $.hr.options.routes);
              encoded += _routeEncode(items, routes);
              for(var key in items)
              {
                  encoded += key + ':' + items[key] + '/';
              }
              return encoded;
          };

          var _routeDecode = function(decoded, items, routes) {
              if(!routes || jQuery.isEmptyObject(routes))
                  routes = {_: {}}; //ensures the loop fires once

              for (var key in routes) { //get the current route
                  var route = routes[key];

                  while(items.length) {
                      var item = items.shift();
                      if(item.length == 0)
                          continue;
                      var values = item.split(':');
                      if(values.length == 1) { //using route
                          var value = values[0];
                          if(route && value in route) {
                              _evaluateValue(key, value, decoded);
                              routes = route[value];
                          }else if(route && ('_' in route || $.isEmptyObject(route))) { //default route
                              _evaluateValue(key, value, decoded);
                              routes = route['_'];
                          }else {
                              //using wrong route, unshift item, back out the stack,
                              //go to next route in list
                              items.unshift(item);
                              break;
                          }
                          return _routeDecode(decoded, items, routes);
                      }
                      else if(values.length == 2) { //not using route
                          var variable = values[0];
                          var value = values[1];
                          _evaluateValue(variable, value, decoded);
                      } else {
                        $.hr.options.errorLogging && console.log('invalid url, current items: ' + items);
                      }
                  }
              }
          };

          var _decode = function(str) {
              var decoded = {};
              while(str.length && str.charAt(0) == '!' || str.charAt(0) == '/'){
                  str = str.substring(1);
              }
              var items = str.split('/');
              var routes = $.extend({}, $.hr.options.routes);
              _routeDecode(decoded, items, routes);
              return decoded;
          };

          var _evaluateValue = function(variable, value, decoded){
              try {
                  var value = value.replace(/\[(.*)\]/g, function(string, functionName) {
                      if(functionName === ''){
                          var val = $.hr.get(variable);
                          if(val === undefined){
                          //value.replace always returns a string so we do this to get at the undefined value type
                              throw 'null';
                          }
                          return val;
                      }
                      if(functionName === 'null'){
                          throw 'null';
                      }
                      var namespaces = functionName.split(".");
                      var func = namespaces.pop();
                      var context = window;
                      for(var i = 0; i < namespaces.length; i++) {
                          if(namespaces[i] in context){
                              context = context[namespaces[i]];
                          } else {
                              break;
                          }
                      }
                      var fn = context[func];
                      if(typeof fn === 'function'){
                          return fn(variable, decoded);
                      }
                      return "";
                  });
                  decoded[variable] = value;
              } catch(exception) {
                  if(exception == 'null') {
                      decoded[variable] = null;
                  } else {
                      throw exception;
                  }
              }
          };

          var _hashUpdated = function(state) {
                if(typeof state === "string") {
                    var decoded = _decode(state);
                } else if(typeof state === "object") {
                    var decoded = state;
                } else {
                  $.hr.options.errorLogging && console.log('invalid state');
                    return;
                }

                var changed = [];

                //first check all the url for values
                for(var key in decoded) {
                    if($.hr.get(key) != decoded[key]) {
                      $.hr.set(key, decoded[key]);
                        changed.push(key);
                    }
                }

                //then check existing values to see if aren't in the url
                for(var key in _state) {
                    if($.hr.get(key) != decoded[key] &&
                        (key in decoded || ($.hr.get(key) != _defaultState[key]))) {
                        changed.push(key);
                    }
                }

                if(!_ignoreNextUpdate) {
                    _triggerQueue = $.merge(_triggerQueue, changed);
                }
                _state = decoded;

                if(!_ignoreNextUpdate) {
                    _executeTriggerQueue();
                }
                _ignoreNextUpdate = false;

                if($.hr.options.autoParse) {
                    $.hr.parseElement($(document));
                }
            };

            var _orderTriggerQueue = function() {
                var ordered = [];

                var rCopy = $.extend({}, $.hr.options.routes);
                var orderRoutes = function(routes) {
                    for(var key in routes) {
                        var value = $.hr.get(key);
                        if(value) {
                            var route = routes[key];
                            if(value in route) {
                                routes = route[value];
                            }else if('_' in route || $.isEmptyObject(route)) { //default route
                                routes = route['_'];
                            }else {
                                return;
                            }

                            var index = _triggerQueue.indexOf(key);
                            if(index > -1) {
                                ordered.push(key);
                                _triggerQueue.splice(index, 1);
                            }

                            return orderRoutes(routes);
                        }
                    }
                    return;
                };
                orderRoutes(rCopy);
                while(_triggerQueue.length > 0) {
                    ordered.push(_triggerQueue.shift());
                }
                _triggerQueue = ordered;
            };
        };
    };

    $.fn.hr = function(keys, handler){
      $.hr.bind(this, keys, handler);
      return this;
    };
})(jQuery);