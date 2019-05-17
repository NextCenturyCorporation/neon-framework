(function (root, factory) {
  if (root === undefined && window !== undefined) root = window;
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["log4javascript","postal","lodash","jquery","uuid"], function (a0,b1,c2,d3,e4) {
      return (root['neon'] = factory(a0,b1,c2,d3,e4));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("log4javascript"),require("postal"),require("lodash"),require("jquery"),require("uuid"));
  } else {
    root['neon'] = factory(root["log4javascript"],root["postal"],root["lodash"],root["jquery"],root["uuid"]);
  }
}(this, function (log4javascript, postal, _, $, uuidv4) {

var neon = neon || {};
neon.eventing = neon.eventing || {};
neon.eventing.owf = neon.eventing.owf || {};
neon.query = neon.query || {};
neon.query.connection = neon.query.connection || {};
neon.util = neon.util || {};
neon.widget = neon.widget || {};

/**
 * Provides utility methods for working with a log4javascript logger
 * @class neon.util.loggerUtils
 * @static
 */

neon.util.loggerUtils = (function() {
    var popupAppender = new log4javascript.PopUpAppender();
    var browserConsoleAppender = new log4javascript.BrowserConsoleAppender();
    var layout = new log4javascript.PatternLayout("%d{HH:mm:ss} %-5p - %m%n");

    popupAppender.setLayout(layout);
    browserConsoleAppender.setThreshold(log4javascript.Level.ALL);

    /**
     * Sets whether or not the popup appender should be used for the logger
     * @method usePopupAppender
     * @param {Object} logger The log4javascript logger from which to attach/detach the popup appender
     */
    function usePopupAppender(logger) {
        logger.addAppender(popupAppender);
    }

    /**
     * Sets whether or not the browser console appender should be used for the logger
     * @method useBrowserConsoleAppender
     * @param {Object} logger The log4javascript logger from which to attach/detach the popup appender
     */
    function useBrowserConsoleAppender(logger) {
        logger.addAppender(browserConsoleAppender);
    }

    /**
     * Gets a global logger (with no name) that can be used by different classes. Any configuration changes to the
     * global logger will affect all usages of it.
     * @method getGlobalLogger
     * @return {Object} The global logger
     */
    function getGlobablLogger() {
        return log4javascript.getLogger("[global]");
    }

    /**
     * Creates a log4javascript logger
     * @method getLogger
     * @param {String} name The name of the logger
     * @return {Object} a log4javascript logger
     *
     */
    function getLogger(name) {
        return log4javascript.getLogger(name);
    }

    return {
        usePopupAppender: usePopupAppender,
        useBrowserConsoleAppender: useBrowserConsoleAppender,
        getGlobalLogger: getGlobablLogger,
        getLogger: getLogger
    };
})();

/**
 * Utility methods for working with OWF
 * @class neon.util.owfUtils
 * @static
 */
neon.util.owfUtils = (function() {
    /**
     * Indicates if neon is running within an OWF environment
     * @return {boolean} true if running in OWF, false if not
     * @method isRunningInOWF
     */
    function isRunningInOWF() {
        return typeof(OWF) !== "undefined" && OWF.Util.isRunningInOWF();
    }

    return {
        isRunningInOWF: isRunningInOWF
    };
})();

/**
 * An implementation of an event bus that uses OWF's publish/subscribe messaging
 * @class neon.eventing.owf.OWFEventBus
 * @constructor
 */
neon.eventing.owf.OWFEventBus = function() {
    this.subscriptions = {};
};

// The OWF publish/subscribe methods are "static", but we still encapsulate them in an instance
// of the OWFEventBus to make it easier for messaging implementations to be swapped. They all run
// from their own widget and each call is specific to the widget it is running in.

/**
 * Publishes the message to the specified channel
 * @param {String} channel The name of the channel to publish to
 * @param {Object} message The message to publish to the channel
 * @method publish
 */
neon.eventing.owf.OWFEventBus.prototype.publish = function(channel, message) {
    OWF.Eventing.publish(channel, message);
};

/**
 * Subscribes to the channel so the callback is invoked when a message is published to the channel
 * Note OWF cannot handle multiple channel subscriptions, so this will replace the existing subscription.
 * @param {String} channel The name of the channel to subscribe to
 * @param {Function} callback The callback to invoke when a message is published to the channel. It takes
 * one parameter, the message.
 * @method subscribe
 * @return {Object} The subscription to the channel. Pass this to the unsubscribe method to remove this
 */
neon.eventing.owf.OWFEventBus.prototype.subscribe = function(channel, callback) {
    var subscriptionHandler;

    if(this.subscriptions[channel]) {
        var existing = this.subscriptions[channel];
        subscriptionHandler = function(message) {
            existing(message);
            callback(message);
        };
    } else {
        subscriptionHandler = callback;
    }
    this.subscriptions[channel] = subscriptionHandler;

    OWF.Eventing.subscribe(channel, function(sender, message) {
        if(sender !== OWF.getInstanceId()) {
            subscriptionHandler(message);
        }
    });
    return channel;
};

/**
 * Unsubscribes from the specified channel.
 * Note OWF cannot remove a single channel subscription, so this will unsubscribe from all channels.
 * @param {Object} subscription The subscription to remove.
 * @method unsubscribe
 */
neon.eventing.owf.OWFEventBus.prototype.unsubscribe = function(channel) {
    delete this.subscriptions[channel];
    OWF.Eventing.unsubscribe(channel);
};

/**
 * @class neon
 */

/**
 * The url of the query server. Defaults to http://localhost:8080/neon.
 * @property SERVER_URL
 * @type {String}
 */
neon.SERVER_URL = 'http://localhost:8080/neon';

neon.serviceUrl = function(servicePath, serviceName, queryParamsString) {
    var queryString = '';

    if(queryParamsString) {
        queryString = '?' + queryParamsString;
    }

    return neon.SERVER_URL + '/services/' + servicePath + '/' + serviceName + queryString;
};

neon.setNeonServerUrl = function(serverUrl) {
    neon.SERVER_URL = serverUrl;
};

/**
 * This class has a list of the available channels that are used for messaging between widgets
 * @class neon.eventing.channels
 */

neon.eventing.channels = {
    /**
     * @property SELECTION_CHANGED
     * @type {string}
     */
    SELECTION_CHANGED: 'selection_changed',

    /**
     * @property FILTERS_CHANGED
     * @type {string}
     */
    FILTERS_CHANGED: 'filters_changed',

    /**
     * @property CONNECT_TO_HOST
     * @type {string}
     */
    CONNECT_TO_HOST: 'connect_to_host',


    /**
     * @property DATASET_UPDATED
     * @type {string}
     */
    DATASET_UPDATED: 'dataset_updated'
};

/**
 * The neon event bus that is used to coordinate messages between widgets. This implementation
 * is used when not running in an OWF environment (the {{#crossLink "neon.eventing.owf.OWFEventBus"}}{{/crossLink}}
 exists for that).
 * @class neon.eventing.EventBus
 * @constructor
 */
neon.eventing.EventBus = function() {
    // postal.js has channels and topics. channels provide ways to group multiple topics. neon only
    // uses one postal channel, and each neon channel will correspond to a postal topic
    this.channel_ = postal.channel();
    this.subscriptions_ = {};
};

/**
 * Publishes a message to the channel. The message can be any type of object. Those subscribed to
 * the channel will be notified of the message.
 * @param {String} channel The name of the channel to publish the message to
 * @param {String|Object} The message published to the given channel
 * @param {String} messengerId The id of the owning neon messenger
 * @method publish
 *
 */
neon.eventing.EventBus.prototype.publish = function(channel, message, messengerId) {
    var data = {
        payload: message,
        sender: messengerId
    };
    this.channel_.publish(channel, data);
};

/**
 * Subscribes to messages on the channel. The callback will be invoked synchronously
 * when a message is received on the channel.
 * @param {String} channel The name of the channel to subscribe to
 * @param {Function} callback The callback to invoke when a message is published to the channel.
 * @param {String} messengerId The id of the owning neon messenger
 * @method subscribe
 * @return {Object} The subscription to the channel. Pass this to unsubscribe to stop receiving
 * messages for this subscription.
 */
neon.eventing.EventBus.prototype.subscribe = function(channel, callback, messengerId) {
    var subscription = this.channel_.subscribe(channel, function(data) {
        if(data.sender !== messengerId) {
            callback(data.payload);
        }
    });
    // Save the messenger ID to allow unsubscribing by id.
    subscription.messengerId = messengerId;

    if(this.subscriptions_[channel]) {
        this.subscriptions_[channel].push(subscription);
    } else {
        this.subscriptions_[channel] = [subscription];
    }
    return subscription;
};

/**
 * Unsubscribes the subscription created from the subscribe method.
 * @param {String|Object} subscription The channel or individual subscription to remove from the bus
 * @param {String} messengerId The id of the owning neon messenger
 * @method unsubscribe
 */
neon.eventing.EventBus.prototype.unsubscribe = function(subscription, messengerId) {
    // If given a channel name string, unsubscribe all subscriptions on that channel.  Otherwise, unsubscribe just that subscription.
    if(typeof(subscription) === "string" && this.subscriptions_[subscription]) {
        var length = this.subscriptions_[subscription].length;
        for(var i = 0; i < length; i++) {
            if(this.subscriptions_[subscription][i].messengerId === messengerId) {
                // Remove the item from our array, unsubscribe and adjust our array counters.
                var removedItem = this.subscriptions_[subscription].splice(i, 1);
                removedItem[0].unsubscribe();
                length--;
                i--;
            }
        }
    } else if(typeof(subscription) === "object" && subscription !== null) {
        subscription.unsubscribe();
    }
};

// Note: There is a single instance of an event bus shared by all messengers

/**
 * Creates the event bus to be used for communication between widgets. If running outside of OWF,
 * If in OWF, a {{#crossLink "neon.eventing.EventBus"}}{{/crossLink}} is returned. If running inside of OWF, a
 * {{#crossLink "neon.eventing.owf.OWFEventBus"}}{{/crossLink}} is returned.
 * @return {neon.eventing.EventBus | neon.eventing.owf.OWFEventBus}
 * @private
 * @method createEventBus_
 */
neon.eventing.createEventBus_ = function() {
    if(neon.util.owfUtils.isRunningInOWF()) {
        return new neon.eventing.owf.OWFEventBus();
    }
    return new neon.eventing.EventBus(this.id_);
};

/**
 * The event bus used for communication between widgets
 * @property eventBus_
 * @type {neon.eventing.EventBus|neon.eventing.owf.OWFEventBus}
 * @private
 */
neon.eventing.eventBus_ = neon.eventing.createEventBus_();

/**
 * A messenger is a widget's gateway to the event bus used for communication between widgets. Widgets publish and
 * subscribe to messages through a messenger. Each messenger has a unique id to identify which widget published the
 * message to ensure that widgets are not receiving their own messages to facilitate simpler widget code.
 * @class neon.eventing.Messenger
 * @constructor
 */

neon.eventing.Messenger = function() {
    this.id_ = uuidv4();
    this.channels = [];
};

/**
 * Publishes a message to a channel
 * @param {String} channel The channel to publish the message to
 * @param {Object} message The message to publish
 * @method publish
 */
neon.eventing.Messenger.prototype.publish = function(channel, message) {
    //var data = { payload: message, sender: this.id_ };
    neon.eventing.eventBus_.publish(channel, message, this.id_);
};

/**
 * Subscribes to the channel to receives any messages published to it. Note that messengers will not receive their
 * own messages even if they are subscribed to that channel.
 * @param {String} channel The channel to subscribe to
 * @param {Function} callback The callback to invoke when a message is received on the channel. The function takes
 * @param {Object|String} callback.message the message that was published
 * @method subscribe
 */
neon.eventing.Messenger.prototype.subscribe = function(channel, callback) {
    neon.eventing.eventBus_.subscribe(channel, callback, this.id_);
    if(this.channels.indexOf(channel) < 0) {
        this.channels.push(channel);
    }
};

/**
 * Unsubscribes this messenger from the channel
 * @param {String} channel The channel to unsubscribe from
 * @method unsubscribe
 */
neon.eventing.Messenger.prototype.unsubscribe = function(channel) {
    neon.eventing.eventBus_.unsubscribe(channel, this.id_);
    var index = this.channels.indexOf(channel);
    if(index >= 0) {
        this.channels.splice(index, 1);
    }
};

/**
 * Unsubscribes this messenger from all its channels, including events
 * @method unsubscribeAll
 */
neon.eventing.Messenger.prototype.unsubscribeAll = function() {
    var me = this;
    var allChannels = me.channels.slice();
    _.each(allChannels, function(channel) {
        me.unsubscribe(channel);
    });
};

/**
 * Subscribe to events notifications
 * @param callbacks {object} An object containing callback functions. Each function takes one
 * parameter, the message that was published.
 * <ul>
 *     <li>selectionChanged - function to execute when the selection has changed</li>
 *     <li>filtersChanged - function to execute when the filters have been changed</li>
 *     <li>connectToHost - function to execute when the Connection.connect() has been called on a host.</li>
 * </ul>
 * @method events
 */
neon.eventing.Messenger.prototype.events = function(callbacks) {
    var me = this;
    var globalChannelConfigs = this.createGlobalChannelSubscriptions_(callbacks);
    _.each(globalChannelConfigs, function(channelConfig) {
        me.subscribe(channelConfig.channel, function(payload) {
                if(channelConfig.callback && typeof channelConfig.callback === 'function') {
                    channelConfig.callback(payload);
                }
            }
        );
    });
};

/**
 * Unsubscribe from all events:  selection changes, filters changes, active dataset changed.
 * @method removeEvents
 */
neon.eventing.Messenger.prototype.removeEvents = function() {
    var me = this;
    var globalChannelConfigs = this.createGlobalChannelSubscriptions_({});
    _.each(globalChannelConfigs, function(channelConfig) {
        me.unsubscribe(channelConfig.channel);
    });
};

neon.eventing.Messenger.prototype.createGlobalChannelSubscriptions_ = function(neonCallbacks) {
    // some of the callbacks may be null/undefined, which is ok since they will be ignored
    return [
        {
            channel: neon.eventing.channels.SELECTION_CHANGED,
            callback: neonCallbacks.selectionChanged
        },
        {
            channel: neon.eventing.channels.FILTERS_CHANGED,
            callback: neonCallbacks.filtersChanged
        },
        {
            channel: neon.eventing.channels.CONNECT_TO_HOST,
            callback: neonCallbacks.connectToHost
        },
        ,
        {
            channel: neon.eventing.channels.DATASET_UPDATED,
            callback: neonCallbacks.datasetUpdated
        }
    ];
};

/**
 * Adds a filter to the data being viewed, so only data matching that filter is returned from queries. This will
 * fire a filter changed event to notify other widgets that the filters have changed. If a filter with this id
 * already exists, the filter is appended to that one with an AND clause. To replace the filter entirely, use
 * {{#crossLink "neon.eventing.Messenger/replaceFilter:method"}}{{/crossLink}}.
 * @param {String} id The id of the filter to apply. A typical value to use for the id is the return value of
 * {{#crossLink "neon.widget/getInstanceId:method"}}{{/crossLink}}
 * @param {neon.query.Filter} filter The filter to add
 * @param {Function} successCallback The callback to invoke when the filter is added
 * @param {Function} errorCallback The callback to invoke if an error occurs.
 * @method addFilter
 */
neon.eventing.Messenger.prototype.addFilter = function(id, filter, successCallback, errorCallback) {
    var filterKey = this.createFilterKey_(id, filter);
    return neon.util.ajaxUtils.doPostJSON(
        filterKey,
        neon.serviceUrl('filterservice', 'addfilter'),
        {
            success: this.createChannelCallback_(neon.eventing.channels.FILTERS_CHANGED, successCallback),
            error: errorCallback
        }
    );
};

neon.eventing.Messenger.prototype.addFilters = function(idAndFilterList, successCallback, errorCallback) {
    var me = this;
    var successes = [];
    var completedQueries = 0;
    var successCB = function(returnedData) {
        successes.push(returnedData.addedFilter);
        checkIfComplete();
    };
    var checkIfComplete = function() {
        if (++completedQueries === idAndFilterList.length) {
            if (successes.length > 0) {
                var channelCallback = me.createChannelCallback_(neon.eventing.channels.FILTERS_CHANGED, successCallback);
                channelCallback(successes);
            } else {
                errorCallback();
            }
        }
    };
    idAndFilterList.forEach(function(idAndFilterPair) {
        var filterKey = me.createFilterKey_(idAndFilterPair[0], idAndFilterPair[1]);
        neon.util.ajaxUtils.doPostJSON(
            filterKey,
            neon.serviceUrl('filterservice', 'addfilter'),
            {
                success: successCB,
                error: checkIfComplete
            }
        );
    });
};

/**
 * Removes a previously added filter. This will fire a filter changed event to notify other widgets that the filters
 * have changed.
 * @param {String} id The id of the filter to remove. This will be the same id used to create the filter.
 * @param {Function} successCallback The callback to invoke when the filter is removed
 * @param {Function} errorCallback The callback to invoke if an error occurs.
 * @method removeFilter
 */
neon.eventing.Messenger.prototype.removeFilter = function(id, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doPost(
        neon.serviceUrl('filterservice', 'removefilter'),
        {
            success: this.createChannelCallback_(neon.eventing.channels.FILTERS_CHANGED, successCallback),
            error: errorCallback,
            data: id,
            contentType: 'text/plain',
            responseType: 'json'
        }
    );
};

neon.eventing.Messenger.prototype.removeFilters = function(idList, successCallback, errorCallback) {
    var me = this;
    var successes = [];
    var completedQueries = 0;
    var successCB = function(returnedData) {
        successes.push(returnedData.removedFilter);
        checkIfComplete();
    };
    var checkIfComplete = function() {
        if (++completedQueries === idList.length) {
            if (successes.length > 0) {
                var channelCallback = me.createChannelCallback_(neon.eventing.channels.FILTERS_CHANGED, successCallback);
                channelCallback(successes);
            } else {
                errorCallback();
            }
        }
    };
    idList.forEach(function(id) {
        neon.util.ajaxUtils.doPost(
            neon.serviceUrl('filterservice', 'removefilter'),
            {
                success: successCB,
                error: checkIfComplete,
                data: id,
                contentType: 'text/plain',
                responseType: 'json'
            }
        );
    });
};

/**
 * Replaces a previously added filter. This is a similar to calling remove and then add, but does so with one
 * notification event.
 * @param {String} id The id of the filter to replace.
 * @param {neon.query.Filter} filter The filter to replace the old one with
 * @param {Function} successCallback The callback to invoke when the filter is replaced
 * @param {Function} errorCallback The callback to invoke if an error occurs.
 * @method replaceFilter
 */
neon.eventing.Messenger.prototype.replaceFilter = function(id, filter, successCallback, errorCallback) {
    var filterKey = this.createFilterKey_(id, filter);
    return neon.util.ajaxUtils.doPostJSON(
        filterKey,
        neon.serviceUrl('filterservice', 'replacefilter'),
        {
            success: this.createChannelCallback_(neon.eventing.channels.FILTERS_CHANGED, successCallback),
            error: errorCallback
        }
    );
};

neon.eventing.Messenger.prototype.replaceFilters = function(idAndFilterList, successCallback, errorCallback) {
    var me = this;
    var successes = [];
    var completedQueries = 0;
    var successCB = function(returnedData) {
        successes.push({
            added: returnedData.addedFilter,
            removed: returnedData.removedFilter
        });
        checkIfComplete();
    };
    var checkIfComplete = function() {
        if (++completedQueries === idAndFilterList.length) {
            if (successes.length > 0) {
                var channelCallback = me.createChannelCallback_(neon.eventing.channels.FILTERS_CHANGED, successCallback);
                channelCallback(successes);
            } else {
                errorCallback();
            }
        }
    };
    idAndFilterList.forEach(function(idAndFilterPair) {
        var filterKey = me.createFilterKey_(idAndFilterPair[0], idAndFilterPair[1]);
        neon.util.ajaxUtils.doPostJSON(
            filterKey,
            neon.serviceUrl('filterservice', 'replacefilter'),
            {
                success: successCB,
                error: checkIfComplete
            }
        );
    });
};

/**
 * Clears all filters. This will fire a filter changed event to notify other widgets that the filters have changed.
 * @method clearFilters
 */
neon.eventing.Messenger.prototype.clearFilters = function(successCallback, errorCallback) {
    return neon.util.ajaxUtils.doPost(
        neon.serviceUrl('filterservice', 'clearfilters'),
        {
            success: this.createChannelCallback_(neon.eventing.channels.FILTERS_CHANGED, successCallback),
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Clears all filters but does not notify other widgets that the filters have been changed. This is useful if this is
 * part of another event that may result in the widgets updating themselves
 * @method clearFiltersSilently
 */
neon.eventing.Messenger.prototype.clearFiltersSilently = function(successCallback, errorCallback) {
    return neon.util.ajaxUtils.doPost(
        neon.serviceUrl('filterservice', 'clearfilters'),
        {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Adds any elements matching the filter to the current selection. This will fire a selection changed event to notify
 * other widgets that the selection has changed.
 * @param {String} id The id of the selection to apply. A typical value to use for the id is the return value of
 * {{#crossLink "neon.widget/getInstanceId:method"}}{{/crossLink}}
 * @param {neon.query.Filter} filter Items matching this filter will be marked as selected
 * @param {Function} successCallback The callback to invoke when the selection is added
 * @param {Function} errorCallback The callback to invoke if an error occurs.
 * @method addSelection
 */
neon.eventing.Messenger.prototype.addSelection = function(id, filter, successCallback, errorCallback) {
    var filterKey = this.createFilterKey_(id, filter);
    return neon.util.ajaxUtils.doPostJSON(
        filterKey,
        neon.serviceUrl('selectionservice', 'addselection'),
        {
            success: this.createChannelCallback_(neon.eventing.channels.SELECTION_CHANGED, successCallback),
            error: errorCallback,
            global: false
        }
    );
};

/**
 * Removes this filter from the selected items. This will fire a selection changed event to notify
 * other widgets that the selection has changed.
 * @param {String} id The id of the selection to remove. This will be the same id used to create the selection.
 * @param {Function} successCallback The callback to invoke when the selection is removed
 * @param {Function} errorCallback The callback to invoke if an error occurs.
 * @method removeSelection
 */
neon.eventing.Messenger.prototype.removeSelection = function(id, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doPost(
        neon.serviceUrl('selectionservice', 'removeselection'),
        {
            success:  this.createChannelCallback_(neon.eventing.channels.SELECTION_CHANGED, successCallback),
            error: errorCallback,
            global: false,
            data: id,
            contentType: 'text/plain',
            responseType: 'json'
        }
    );
};

/**
 * Replaces a previously added selection. This is a similar to calling remove and then add, but does so with one
 * notification event.
 * @param {String} id The id of the selection to replace.
 * @param {neon.query.Filter} filter The filter that defines the new selection
 * @param {Function} successCallback The callback to invoke when the selection is replaced
 * @param {Function} errorCallback The callback to invoke if an error occurs.
 * @method replaceSelection
 */

neon.eventing.Messenger.prototype.replaceSelection = function(id, filter, successCallback, errorCallback) {
    var filterKey = this.createFilterKey_(id, filter);
    return neon.util.ajaxUtils.doPostJSON(
        filterKey,
        neon.serviceUrl('selectionservice', 'replaceselection'),
        {
            success: this.createChannelCallback_(neon.eventing.channels.SELECTION_CHANGED, successCallback),
            error: errorCallback,
            global: false
        }
    );
};

/**
 * Clears the currently selected items. This will fire a selection changed event to notify
 * other widgets that the selection has changed.
 * @method clearSelection
 */
neon.eventing.Messenger.prototype.clearSelection = function(successCallback, errorCallback) {
    return neon.util.ajaxUtils.doPost(
        neon.serviceUrl('selectionservice', 'clearselection'),
        {
            success: this.createChannelCallback_(neon.eventing.channels.SELECTION_CHANGED, successCallback),
            error: errorCallback,
            global: false,
            responseType: 'json'
        }
    );
};

neon.eventing.Messenger.prototype.createFilterKey_ = function(id, filter) {
    return {
        id: id,
        filter: filter
    };
};

neon.eventing.Messenger.prototype.createChannelCallback_ = function(channelName, successCallback) {
    var me = this;
    var callback = function(results) {
        // pass the results in the callback and publish them to the channel so callers can listen
        // in either place
        if(successCallback && typeof successCallback === 'function') {
            successCallback(results);
        }
        me.publish(channelName, results || {});
    };
    return callback;
};

/**
 * Stores the parameters a user is using to connect to the database. Queries will be executed through this connection.
 * @class neon.query.Connection
 * @example
 *     var connection = new neon.query.Connection();
 *     // use a mongo database on localhost
 *     connection.connect(neon.query.Connection.MONGO, "localhost");
 *
 *     // queries through this connection will use the parameters specified above
 *     connection.executeQuery(query1, callback);
 *     connection.executeQuery(query2, callback);
 * @constructor
 */
neon.query.Connection = function() {
    this.host_ = undefined;
    this.databaseType_ = undefined;
    this.messenger = new neon.eventing.Messenger();
};

/**
 * Indicates the database type is mongo
 * @property MONGO
 * @type {String}
 */
neon.query.Connection.MONGO = 'mongo';

/**
 * Indicates the database type is spark sql
 * @property SPARK
 * @type {String}
 */
neon.query.Connection.SPARK = 'sparksql';

/**
 * Indicates the database type is elasticsearch
 * @property ELASTICSEARCH
 * @type {String}
 */
neon.query.Connection.ELASTICSEARCH = 'elasticsearch';

/**
 * Specifies what database type and host the queries will be executed against and publishes a CONNECT_TO_HOST event.
 * @method connect
 * @param {String} databaseType What type of database is being connected to. The constants in this class specify the
 * valid database types.
 * @param {String} host The host the database is running on.  This can be an address (e.g., localhost) or an
 * address:port pair (e.g., localhost:9300).  If no port is provided, the Neon server will assume the default port
 * for the databaseType:  27017 for Mongo, 10000 for Spark via a Hive2 Thrift connection, and 9300 for an
 * Elasticsearch transport client.
 * @param {Boolean} listenForUpdates [true] Whether or not the connection should automatically listen for updates on connection
 */
neon.query.Connection.prototype.connect = function(databaseType, host, listenForUpdates) {
    this.host_ = host;
    this.databaseType_ = databaseType;
    this.messenger.publish(neon.eventing.channels.CONNECT_TO_HOST, {
        host: host,
        type: databaseType
    });
    if (listenForUpdates !== false) {
        this.listenForDatasetUpdates();
    }
};

/**
 * Registers callbacks to listen for data updates against the neon server
 * @method listenForDatasetUpdates
 */
neon.query.Connection.prototype.listenForDatasetUpdates = function() {
    if (!this._dataUpdateSource) {
        this._dataUpdateSource = new EventSource(neon.serviceUrl('dataset', 'listen'));
        this._dataUpdateSource.addEventListener('message', (msg) => {
            this.messenger.publish(neon.eventing.channels.DATASET_UPDATED, { message: msg })
        });
    }
    return this._dataUpdateSource;
}

/**
 * Executes the specified query and fires the callback when complete.
 * @method executeQuery
 * @param {neon.query.Query} query the query to execute
 * @param {Function} successCallback The callback to fire when the query successfully completes
 * @param {Function} [errorCallback] The optional callback when an error occurs. This is a 3 parameter function that contains the xhr, a short error status and the full error message.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.executeQuery = function(query, successCallback, errorCallback) {
    return this.executeQueryService_(query, successCallback, errorCallback, 'query');
};

/**
 * Executes the specified query group (a series of queries whose results are aggregate),
 * and fires the callback when complete.
 * @method executeQueryGroup
 * @param {neon.query.QueryGroup} queryGroup the query to execute
 * @param {Function} successCallback The callback to fire when the query successfully completes
 * @param {Function} [errorCallback] The optional callback when an error occurs. This is a 3 parameter function that
 * contains the xhr, a short error status and the full error message.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.executeQueryGroup = function(queryGroup, successCallback, errorCallback) {
    return this.executeQueryService_(queryGroup, successCallback, errorCallback, 'querygroup');
};

/**
 * Executes a query that returns a sorted list of key, count pairs for an array field in the database.
 * @method executeArrayCountQuery
 * @param {String} databaseName The name of the database
 * @param {String} tableName The name of the collection or table
 * @param {String} fieldName The name of the array field to count
 * @param {Number} limit The number of pairs to return (default:  50)
 * @param {Object} whereClause The where clause to apply to the array counts query, or null to apply no where clause
 * @param {Function} successCallback The callback to call when the list of key,count pairs is returned
 * @param {Function} [errorCallback] The optional callback when an error occurs. This is a 3 parameter
 * function that contains the xhr, a short error status and the full error message.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.executeArrayCountQuery = function(databaseName, tableName, fieldName, limit, whereClause, successCallback, errorCallback) {
    var serviceName = encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_) + '/' + encodeURIComponent(databaseName) + '/' + encodeURIComponent(tableName) + '/' + encodeURIComponent(fieldName);
    var serviceUrl = neon.serviceUrl('queryservice/arraycounts', serviceName, (limit ? 'limit=' + limit : ''));
    var options = {
        success: successCallback,
        error: errorCallback,
        responseType: 'json'
    };
    return neon.util.ajaxUtils.doPostJSON(whereClause, serviceUrl, options);
};

neon.query.Connection.prototype.executeQueryService_ = function(query, successCallback, errorCallback, serviceName) {
    var opts = [];
    if(query.ignoreFilters_) {
        opts.push("ignoreFilters=true");
    } else if(query.ignoredFilterIds_) {
        var filterIds = [];
        query.ignoredFilterIds_.forEach(function(id) {
            filterIds.push("ignoredFilterIds=" + encodeURIComponent(id));
        });
        if(filterIds.length) {
            opts.push(filterIds.join("&"));
        }
    }
    if(query.selectionOnly_) {
        opts.push("selectionOnly=true");
    }
    return neon.util.ajaxUtils.doPostJSON(
        query,
        neon.serviceUrl('queryservice', serviceName + '/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_), opts.join('&')),
        {
            success: successCallback,
            error: errorCallback
        }
    );
};

/**
 * Executes the specified export request and fires the callback when complete.
 * @method executeExport
 * @param {neon.query.Query} query the query to export data for
 * @param {Function} successCallback The callback to fire when the export request successfully completes. Takes
 * a JSON object with the export URL stored in it's data field as a parameter.
 * @param {Function} [errorCallback] The optional callback when an error occurs. This function takes the server's
 * response as a parameter.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.executeExport = function(query, successCallback, errorCallback, fileType) {
    query.fileType = fileType;
    return neon.util.ajaxUtils.doPostJSON(
        query,
        neon.serviceUrl('exportservice', 'export/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_), ''),
        {
            success: successCallback,
            error: errorCallback
        }
    );
};

/**
 * Sends a file to be imported into a database and fires the callback when complete.
 * @method executeUploadFile
 * @param {FormData} data A FormData object containing the file to upload, as well as its type and a username and name of the database to upload it to.
 * @param {Function} successCallback The function to call when the request successfully completes. This function takes the server's response as a parameter.
 * @param {Function} errorCallback The function to call when an error occurs. This function takes the server's response as a parameter.
 * @param {String} [host] The host to upload a file to when you don't want to upload to the default.
 * @param {String} [databaseType] The type of database to upload a file to when you don't want the default.
 */
neon.query.Connection.prototype.executeUploadFile = function(data, successCallback, errorCallback, host, databaseType) {
    neon.util.ajaxUtils.doPostBinary(data, neon.serviceUrl('importservice', 'upload/' + encodeURIComponent(host || this.host_) + '/' + encodeURIComponent(databaseType || this.databaseType_), ''),
        successCallback, errorCallback);
};

/**
 * Checks on the status of a type-guessing operation with the given uuid and fires the callback when complete.
 * @method executeCheckTypeGuesses
 * @param {String} uuid The uuid associated with the type-guessing operation to check on.
 * @param {Function} successCallback The function to call when the request successfully completes. This function takes the server's response as a parameter.
 * @param {String} [host] The host to upload a file to when you don't want to upload to the default.
 * @param {String} [databaseType] The type of database to upload a file to when you don't want the default.
 */
neon.query.Connection.prototype.executeCheckTypeGuesses = function(uuid, successCallback, host, databaseType) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('importservice', 'guesses/' + encodeURIComponent(host || this.host_) + '/' + encodeURIComponent(databaseType || this.databaseType_) + '/' + encodeURIComponent(uuid), ''), {
            success: successCallback
        }
    );
};

/**
 * Initiates the process of importing records from a file into a database and converting them from strings to more appropriate types, and fires the callback when complete.
 * @method executeLoadFileIntoDB
 * @param {Object} data An object that contains a date formatting string and a list of objects that contain field names and type names to go with them.
 * @param {string} uuid The job ID to associate with the data to be parsed and converted.
 * @param {Function} successCallback The function to call when the request successfully completes. This function takes the server's response as a parameter.
 * @param {Function} errorCallback The function to call when an error occurs. This function takes the server's response as a parameter.
 * @param {String} [host] The host to upload a file to when you don't want to upload to the default.
 * @param {String} [databaseType] The type of database to upload a file to when you don't want the default.
 */
neon.query.Connection.prototype.executeLoadFileIntoDB = function(data, uuid, successCallback, errorCallback, host, databaseType) {
    neon.util.ajaxUtils.doPostJSON(data, neon.serviceUrl('importservice', 'convert/' + encodeURIComponent(host || this.host_) + '/' + encodeURIComponent(databaseType || this.databaseType_) +
        '/' + encodeURIComponent(uuid), ''), {
            success: successCallback,
            error: errorCallback
        }
    );
};

/**
 * Checks on the status of an import and conversion operation with the given uuid and fires the callback when complete.
 * @method executeCheckImportProgress
 * @param {String} uuid The uuid associated with the import and conversion operation to check on.
 * @param {Function} successCallback The function to call when the request successfully completes. This function takes the server's response as a parameter.
 * @param {String} [host] The host to upload a file to when you don't want to upload to the default.
 * @param {String} [databaseType] The type of database to upload a file to when you don't want the default.
 */
neon.query.Connection.prototype.executeCheckImportProgress = function(uuid, successCallback, host, databaseType) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('importservice', 'progress/' + encodeURIComponent(host || this.host_) + '/' + encodeURIComponent(databaseType || this.databaseType_) + '/' + encodeURIComponent(uuid), ''), {
            success: successCallback
        }
    );
};

/**
 * Sends a request to remove a dataset associated with the given username and satabase name, and fires the callback when complete.
 * @method executeRemoveDataset
 * @param {String} user The username associated with the database to drop.
 * @param {String} data The database name associated with the database to drop.
 * @param {Function} successCallback The function to call when the request successfully completes. This function takes the server's response as a parameter.
 * @param {Function} errorCallback The function to call when an error occurs. This function takes the server's response as a parameter.
 * @param {String} [host] The host to upload a file to when you don't want to upload to the default.
 * @param {String} [databaseType] The type of database to upload a file to when you don't want the default.
 */
neon.query.Connection.prototype.executeRemoveDataset = function(user, data, successCallback, errorCallback, host, databaseType) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('importservice', 'drop/' + encodeURIComponent(host || this.host_) + '/' + encodeURIComponent(databaseType || this.databaseType_) + '?user=' + encodeURIComponent(user) +
            '&data=' + encodeURIComponent(data), ''), {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Gets a list of database names
 * @method getDatabaseNames
 * @param {Function} successCallback The callback that contains the database names in an array.
 * @param {Function} errorCallback The function to call when an error occurs. This function takes the server's response as a parameter.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getDatabaseNames = function(successCallback, errorCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('queryservice', 'databasenames/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_)), {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Gets the tables names available for the current database
 * @method getTableNames
 * @param {String} databaseName
 * @param {Function} successCallback The callback that contains the table names in an array.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getTableNames = function(databaseName, successCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('queryservice', 'tablenames/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_) + '/' + encodeURIComponent(databaseName)), {
            success: successCallback,
            responseType: 'json'
        }
    );
};

/**
 * Executes a query that returns the field names from table
 * @method getFieldNames
 * @param {String} databaseName
 * @param {String} tableName The table name whose fields are being returned
 * @param {Function} successCallback The callback to call when the field names are successfully retrieved
 * @param {Function} [errorCallback] The optional callback when an error occurs. This is a 3 parameter
 * function that contains the xhr, a short error status and the full error message.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getFieldNames = function(databaseName, tableName, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('queryservice', 'fields/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_) +
          '/' + encodeURIComponent(databaseName) + '/' + encodeURIComponent(tableName)), {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Executes a query that returns a map of the table names available in the database and the field names in each table
 * @method getTableNamesAndFieldNames
 * @param {String} databaseName
 * @param {Function} successCallback The callback to call when the field names are successfully retrieved
 * @param {Function} [errorCallback] The optional callback when an error occurs. This is a 3 parameter
 * function that contains the xhr, a short error status and the full error message.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getTableNamesAndFieldNames = function(databaseName, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('queryservice', 'tablesandfields/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_) + '/' + encodeURIComponent(databaseName)), {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Requests and returns the translation cache.
 * @method getTranslationCache
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getTranslationCache = function(successCallback, errorCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl("translationservice", "getcache"), {
            success: successCallback,
            error: errorCallback,
            responseType: "json"
        }
    );
};

/**
 * Requests to save the given translation cache.
 * @method setTranslationCache
 * @param {Object} cache
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.setTranslationCache = function(cache, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doPostJSON(
        cache,
        neon.serviceUrl("translationservice", "setcache"), {
            success: successCallback,
            error: errorCallback,
            responseType: "json"
        }
    );
};

/**
 * Requests to save the state with the given parameters.
 * @method saveState
 * @param {Object} stateParams
 * @param {Array} stateParams.dashboard
 * @param {Object} stateParams.dataset
 * @param {String} [stateParams.stateName]
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.saveState = function(stateParams, successCallback, errorCallback) {
    var opts = "";

    if(stateParams.stateName) {
        opts = "stateName=" + stateParams.stateName;
        delete stateParams.stateName;
    }

    return neon.util.ajaxUtils.doPostJSON(
        stateParams,
        neon.serviceUrl("stateservice", "savestate", opts), {
            success: successCallback,
            error: errorCallback,
            responseType: "json"
        }
    );
};

/**
 * Requests to load the state with the given name, or dashboard and/or filter state IDs.
 * @method loadState
 * @param {Object} stateParams
 * @param {String} stateParams.dashboardStateId
 * @param {String} stateParams.filterStateId
 * @param {String} stateParams.stateName
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.loadState = function(stateParams, successCallback, errorCallback) {
    var opts = [];
    if(stateParams.stateName) {
        opts.push("stateName=" + stateParams.stateName);
    } else {
        if(stateParams.dashboardStateId) {
            opts.push("dashboardStateId=" + stateParams.dashboardStateId);
        }
        if(stateParams.filterStateId) {
            opts.push("filterStateId=" + stateParams.filterStateId);
        }
    }
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl("stateservice", "loadstate", opts.join('&')), {
            success: successCallback,
            error: errorCallback,
            responseType: "json"
        }
    );
};

/**
 * Requests to delete the states with the given name.
 * @method deleteState
 * @param {String} stateName
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.deleteState = function(stateName, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doDelete(
        neon.serviceUrl("stateservice", "deletestate/" + stateName), {
            success: successCallback,
            error: errorCallback,
            responseType: "json"
        }
    );
};

/**
 * Requests to retrieve all the states names.
 * @method getAllStateNames
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getAllStateNames = function(successCallback, errorCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl("stateservice", "allstatesnames"), {
            success: successCallback,
            error: errorCallback,
            responseType: "json"
        }
    );
};

/**
 * Requests to retrieve the state name for the given state IDs.
 * @method getStateName
 * @param {Object} stateParams
 * @param {String} stateParams.dashboardStateId
 * @param {String} stateParams.filterStateId
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getStateName = function(stateParams, successCallback, errorCallback) {
    var opts = [];
    opts.push("dashboardStateId=" + stateParams.dashboardStateId);
    opts.push("filterStateId=" + stateParams.filterStateId);
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl("stateservice", "statename", opts.join('&')), {
            success: successCallback,
            error: errorCallback,
            responseType: "json"
        }
    );
};

/**
 * Requests for field types from the table
 * @method getFieldTypes
 * @param {String} databaseName
 * @param {String} tableName The table name whose fields are being returned
 * @param {Function} successCallback The callback to call when the field types are successfully retrieved
 * @param {Function} [errorCallback] The optional callback when an error occurs. This is a 3 parameter
 * function that contains the xhr, a short error status and the full error message.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getFieldTypes = function(databaseName, tableName, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('queryservice', 'fields/types/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_) +
          '/' + encodeURIComponent(databaseName) + '/' + encodeURIComponent(tableName)), {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Requests for field types from the tables
 * @method getFieldTypesForGroup
 * @param {Object} databaseToTableNames A mapping of database names to a list of table names to get field
 * types for.
 * @param {Function} successCallback The callback to call when the field types are successfully retrieved
 * @param {Function} [errorCallback] The optional callback when an error occurs. This is a 3 parameter
 * function that contains the xhr, a short error status and the full error message.
 * @return {neon.util.AjaxRequest} The xhr request object
 */
neon.query.Connection.prototype.getFieldTypesForGroup = function(databaseToTableNames, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doPostJSON(
        databaseToTableNames,
        neon.serviceUrl('queryservice', 'fields/types/' + encodeURIComponent(this.host_) + '/' + encodeURIComponent(this.databaseType_)), {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Creates a filter that can be applied to a dataset
 * @class neon.query.Filter
 * @constructor
 */
neon.query.Filter = function() {
    this.filterName = undefined;
    this.databaseName = undefined;
    this.tableName = undefined;
    this.whereClause = undefined;
};

neon.query.Filter.prototype.name = function(name) {
    this.filterName = name;
    return this;
};

/**
 * Sets the *select* clause of the filter to select data from the specified table
 * @method selectFrom
 * @param {String} databaseName
 * @param {String} tableName Table to select from
 * @return {neon.query.Filter} This filter object
 */
neon.query.Filter.prototype.selectFrom = function(databaseName, tableName) {
    this.databaseName = databaseName;
    this.tableName = tableName;
    return this;
};

/**
 * Adds a *where* clause to the filter.
 * See {{#crossLink "neon.query.Query/where"}}{{/crossLink}} for documentation on how to structure the parameters
 * @method where
 * @return {neon.query.Filter} This filter object
 */
neon.query.Filter.prototype.where = function() {
    if(arguments.length === 3) {
        this.whereClause = neon.query.where(arguments[0], arguments[1], arguments[2]);
    } else {
        // single argument is a boolean or a geospacial clause
        this.whereClause = arguments[0];
    }
    return this;
};

/**
 * Adds a *withinDistance* clause to the filter.
 * @param {String} locationField The name of the field containing the location value
 * @param {neon.util.LatLon} center The point from which the distance is measured
 * @param {number} distance The maximum distance from the center point a result must be within to be returned in the query
 * @param {String} distanceUnit The unit of measure for the distance. See the constants in this class.
 * @method withinDistance
 * @return {neon.query.Filter} This filter object
 */
neon.query.Filter.prototype.withinDistance = function(locationField, center, distance, distanceUnit) {
    return this.where(neon.query.withinDistance(locationField, center, distance, distanceUnit));
};

neon.query.Filter.prototype.geoIntersection = function(locationField, points, geometryType) {
    return this.where(neon.query.withinDistance(locationField, points, geometryType));
};

neon.query.Filter.prototype.geoWithin = function(locationField, points) {
    return this.where(neon.query.withinDistance(locationField, points));
};

neon.query.Filter.getFilterState = function(databaseName, tableName, successCallback, errorCallback) {
    return neon.util.ajaxUtils.doGet(
        neon.serviceUrl('filterservice', 'filters/' + encodeURIComponent(databaseName) + '/' + encodeURIComponent(tableName)), {
            success: successCallback,
            error: errorCallback,
            responseType: 'json'
        }
    );
};

/**
 * Represents a query to be constructed against some data source. This class is built so query
 * clauses can be chained together to create an entire query.
 * @example
 *     var where = neon.query.where;
 *     var and = neon.query.and;
 *     var query = new neon.query.Query(where(and(where('someProperty','=',5), where('someOtherProperty','<',10))));
 * @class neon.query.Query
 * @constructor
 */
neon.query.Query = function() {
    this.filter = new neon.query.Filter();
    this.fields = ['*'];
    this.aggregateArraysByElement = false;
    this.ignoreFilters_ = false;
    this.selectionOnly_ = false;

    // use this to ignore specific filters
    this.ignoredFilterIds_ = [];

    this.groupByClauses = [];
    this.isDistinct = false;
    this.aggregates = [];
    this.sortClauses = [];
    this.limitClause = undefined;
    this.transforms = undefined;
};

/**
 * Produce a human-readable representation of the query
 * @method toString
 * @return {string}
 */
neon.query.Query.prototype.toString = function() {
    var s = " ";
    this.fields.forEach(function(d) {
        s = s + " SELECT " + d;
    });
    this.sortClauses.forEach(function(d) {
        s = s + ", SORTBY " + d.fieldName + " (" + d.sortOrder + ")";
    });
    this.groupByClauses.forEach(function(d) {
        s = s + ", GROUPBY " + d.field;
    });
    this.aggregates.forEach(function(d) {
        s = s + ", AGGREGATE " + d.operation +  " ON " + d.field + " (named " + d.name + ")";
    });
    if(this.limitClause !== undefined) {
        s = s + ", LIMIT " + this.limitClause.limit;
    }
    return s;
};

/**
 * The aggregation operation to count items
 * @property COUNT
 * @type {String}
 */
neon.query.COUNT = 'count';

/**
 * The aggregation operation to sum items
 * @property SUM
 * @type {String}
 */
neon.query.SUM = 'sum';

/**
 * The aggregation operation to get the maximum value
 * @property MAX
 * @type {String}
 */
neon.query.MAX = 'max';

/**
 * The aggregation operation to get the minimum value
 * @property MIN
 * @type {String}
 */
neon.query.MIN = 'min';

/**
 * The aggregation operation to get the average value
 * @property AVG
 * @type {String}
 */
neon.query.AVG = 'avg';

/**
 * The sort parameter for clauses to sort ascending
 * @property ASCENDING
 * @type {int}
 */
neon.query.ASCENDING = 1;

/**
 * The sort parameter for clauses to sort descending
 * @property DESCENDING
 * @type {int}
 */
neon.query.DESCENDING = -1;

/**
 * The function name to get the month part of a date field
 * @property MONTH
 * @type {String}
 */
neon.query.MONTH = 'month';

/**
 * The function name to get the day part of a date field
 * @property DAY
 * @type {String}
 */
neon.query.DAY = 'dayOfMonth';

/**
 * The function name to get the year part of a date field
 * @property YEAR
 * @type {String}
 */
neon.query.YEAR = 'year';

/**
 * The function name to get the hour part of a date field
 * @property HOUR
 * @type {String}
 */
neon.query.HOUR = 'hour';

/**
 * The function name to get the minute part of a date field
 * @property MINUTE
 * @type {String}
 */
neon.query.MINUTE = 'minute';

/**
 * The function name to get the second part of a date field
 * @property SECOND
 * @type {String}
 */
neon.query.SECOND = 'second';

/**
 * The distance unit for geospatial queries in meters
 * @property METER
 * @type {String}
 */
neon.query.METER = 'meter';

/**
 * The distance unit for geospatial queries in kilometers
 * @property KM
 * @type {String}
 */
neon.query.KM = 'km';

/**
 * The distance unit for geospatial queries in miles
 * @property MILE
 * @type {String}
 */
neon.query.MILE = 'mile';

/**
 * Sets the *select* clause of the query to select data from the specified table
 * @method selectFrom
 * @param {String} databaseName
 * @param {String} tableName table to select from
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.selectFrom = function(databaseName, tableName) {
    this.filter.selectFrom(databaseName, tableName);
    return this;
};

/**
 * Sets the fields that should be included in the result. If not specified,
 * all fields will be included (equivalent to SELECT *).
 * @method withFields
 * @param {...String | Array} fields A variable number of strings or single Array of Strings indicating which fields should be included
 * @return {neon.query.Query} This query object
 * @example
 *     new neon.query.Query(...).withFields("field1","field2");
 */
neon.query.Query.prototype.withFields = function(fields) {
    if(arguments.length === 1 && $.isArray(fields)) {
        this.fields = fields;
    } else {
        this.fields = neon.util.arrayUtils.argumentsToArray(arguments);
    }
    return this;
};

/**
 * Sets the *where* clause of the query to determine how to select the data
 * The arguments can be either<br>
 * 3 arguments as follows:
 *  <ul>
 *      <li>arguments[0] - The property to filter on in the database</li>
 *      <li>arguments[1] - The filter operator</li>
 *      <li>arguments[2] - The value to filter against</li>
 *  </ul>
 * OR <br>
 * A boolean operator (neon.Query.and or neon.Query.or)
 * </ol>
 * @example
 *     where('someProperty','=',5)
 *
 *     where(neon.Query.and(where('someProperty','=',5), where('someOtherProperty','<',10)))
 * @method where
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.where = function() {
    this.filter.where.apply(this.filter, arguments);
    return this;
};

/**
 * Groups the results by the specified field(s)
 * @method groupBy
 * @param {...String|...neon.query.GroupByFunctionClause|Array} fields One or more fields to group the results by.
 * Each parameter can be a single field name, a {{#crossLink "neon.query.GroupByFunctionClause"}}{{/crossLink}}. Alternatively a
 * single array containing field names and/or GroupByFunctionClause objects.
 * @return {neon.query.Query} This query object
 * @example
 *    var averageAmount = new neon.query.GroupByFunctionClause(neon.query.AVG, 'amount', 'avg_amount');
 *    new neon.query.Query(...).groupBy('field1',averageAmount);
 */
neon.query.Query.prototype.groupBy = function(fields) {
    // even though internally each groupBy clause is a separate object (since single field and functions
    // are processed differently), the user will think about a single groupBy operation which may include
    // multiple fields, so this method does not append to the existing groupBy fields, but replaces them
    this.groupByClauses.length = 0;
    var me = this;

    var list;
    if(arguments.length === 1 && $.isArray(fields)) {
        list = fields;
    } else {
        list = neon.util.arrayUtils.argumentsToArray(arguments);
    }

    list.forEach(function(field) {
        var clause = field;

        // if the user provided a string or object with a columnName and prettyName, convert that to the groupBy
        // representation of a single field, otherwise, they provided a groupBy function so just use that
        if(typeof field === 'string') {
            clause = new neon.query.GroupBySingleFieldClause(field, field);
        } else if(typeof field === 'object' && !(field instanceof neon.query.GroupByFunctionClause)) {
            clause = new neon.query.GroupBySingleFieldClause(field.columnName, field.prettyName);
        }
        me.groupByClauses.push(clause);
    });
    return this;
};

/**
 * Creates a new field with the specified name that aggregates the field with the given operation
 * @param {String} aggregationOperation The operation to aggregate by. See the constants in this
 * class for operators (e.g. SUM, COUNT). This function may be called multiple times to include
 * multiple aggregation fields.
 * @param {String} aggregationField The field to perform the aggregation on
 * @param {String} [name] The name of the new field generated by this operation. If not specified, a name
 * will be generated based on the operation name and the field name
 * @method aggregate
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.aggregate = function(aggregationOperation, aggregationField, name) {
    var newFieldName = name != null ? name : (aggregationOperation + '(' + aggregationField + ')');
    this.aggregates.push(new neon.query.FieldFunction(aggregationOperation, aggregationField, newFieldName));
    return this;
};

/**
 * Specifies the query return distinct results
 * @method distinct
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.distinct = function() {
    this.isDistinct = true;
    return this;
};

/**
 * Specifies a limit on the maximum number of results that should be returned from the query
 * @method limit
 * @param {int} limit The maximum number of results to return from the query
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.limit = function(limit) {
    this.limitClause = new neon.query.LimitClause(limit);
    return this;
};

/**
 * Specifies an offset to start the results from. This can be used in combination with limit for pagination
 * @method offset
 * @param {int} offset The number of rows to skip in the results
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.offset = function(offset) {
    this.offsetClause = new neon.query.OffsetClause(offset);
    return this;
};

/**
 *
 * Configures the query results to be sorted by the specified field(s). To sort by multiple fields, repeat the
 * 2 parameters multiple times
 * @method sortBy
 * @param {String | Array} fieldName The name of the field to sort on OR single array in the form
 * of ['field1', neon.query.ASC, ... , 'fieldN', neon.query.DESC]
 * @param {int} sortOrder The sort order (see the constants in this class)
 * @return {neon.query.Query} This query object
 * @example
 *     new neon.query.Query(...).sortBy('field1',neon.query.ASC,'field2',neon.query.DESC);
 */
neon.query.Query.prototype.sortBy = function(fields) {
    // even though internally each sortBy clause is a separate object, the user will think about a single sortBy
    // operation which may include multiple fields, so this method does not append to the existing
    // sortBy fields, but replaces them
    this.sortClauses.length = 0;

    var list;
    if(arguments.length === 1 && $.isArray(fields)) {
        list = fields;
    } else {
        list = neon.util.arrayUtils.argumentsToArray(arguments);
    }

    for(var i = 1; i < list.length; i += 2) {
        var field = list[i - 1];
        var order = list[i];
        this.sortClauses.push(new neon.query.SortClause(field, order));
    }
    return this;
};

/**
 * Adds a transform to this query
 * @method transform
 * @param {neon.query.Transform} transformObj a transform to be applied to the data
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.transform = function(transformObj) {
    var transforms;
    if(arguments.length === 1 && $.isArray(transformObj)) {
        transforms = transformObj;
    } else {
        transforms = neon.util.arrayUtils.argumentsToArray(arguments);
    }

    this.transforms = transforms;
    return this;
};

/**
 * Sets the query to ignore any filters that are currently applied
 * @method ignoreFilters
 * @param {...String | Array} [filterIds] An optional, variable number of filter ids to ignore OR an array of
 * filter ids to ignore. If specified, only these filters will be ignored. Otherwise, all will be ignored.
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.ignoreFilters = function(filterIds) {
    var filters;
    if(arguments.length === 1 && $.isArray(filterIds)) {
        filters = filterIds;
    } else {
        filters = neon.util.arrayUtils.argumentsToArray(arguments);
    }

    if(filters.length > 0) {
        this.ignoredFilterIds_ = filters;
    } else {
        this.ignoreFilters_ = true;
    }
    return this;
};

/**
 * Sets the query to return just the current selection
 * @method selectionOnly
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.selectionOnly = function() {
    this.selectionOnly_ = true;
    return this;
};

neon.query.Query.prototype.enableAggregateArraysByElement = function() {
    this.aggregateArraysByElement = true;
    return this;
};

neon.query.Query.prototype.geoIntersection = function(locationField, points, geometryType) {
    this.filter.geoIntersection(locationField, points, geometryType);
    return this;
};

neon.query.Query.prototype.geoWithin = function(locationField, points) {
    this.filter.geoWithin(locationField, points);
    return this;
};

/**
 * Adds a query clause to specify that query results must be within the specified distance from
 * the center point. This is used instead of a *where* query clause (or in conjuction with where
 * clauses in boolean operators).
 * @method withinDistance
 * @param {String} locationField The name of the field containing the location value
 * @param {neon.util.LatLon} center The point from which the distance is measured
 * @param {double} distance The maximum distance from the center point a result must be within to be returned in the query
 * @param {String} distanceUnit The unit of measure for the distance. See the constants in this class.
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.withinDistance = function(locationField, center, distance, distanceUnit) {
    this.filter.withinDistance(locationField, center, distance, distanceUnit);
    return this;
};

/**
 * Utility methods for working with Queries
 * @class neon.query
 * @static
 */

/**
 * Creates a simple *where* clause for use with filters or queries
 * @method where
 * @param {String} fieldName The field name to group on
 * @param {String} op The operation to perform
 * @param {Object}  value The value to compare the field values against
 * @example
 *     where('x','=',10)
 * @return {Object}
 */
neon.query.where = function(fieldName, op, value) {
    return new neon.query.WhereClause(fieldName, op, value);
};

/**
 * Creates an *and* boolean clause for the query
 * @method and
 * @param  {Object | Array} clauses A variable number of *where* clauses to apply OR an single array of *where* clauses
 * @example
 *     and(where('x','=',10),where('y','=',1))
 * @return {Object}
 */
neon.query.and = function(clauses) {
    if(arguments.length === 1 && $.isArray(clauses)) {
        return new neon.query.BooleanClause('and', clauses);
    } else {
        return new neon.query.BooleanClause('and', neon.util.arrayUtils.argumentsToArray(arguments));
    }
};

/**
 * Creates an *or* boolean clause for the query
 * @method or
 * @param {Object} clauses A variable number of *where* clauses to apply OR a single array of *where* clauses
 * @example
 *     or(where('x','=',10),where('y','=',1))
 * @return {Object}
 */
neon.query.or = function(clauses) {
    if(arguments.length === 1 && $.isArray(clauses)) {
        return new neon.query.BooleanClause('or', clauses);
    } else {
        return new neon.query.BooleanClause('or', neon.util.arrayUtils.argumentsToArray(arguments));
    }
};

/**
 * Creates a query clause to specify that query results must be within the specified distance from
 * the center point.
 * @method withinDistance
 * @param {String} locationField The name of the field containing the location value
 * @param {neon.util.LatLon} center The point from which the distance is measured
 * @param {double} distance The maximum distance from the center point a result must be within to be returned in the query
 * @param {String} distanceUnit The unit of measure for the distance. See the constants in this class.
 * @return {neon.query.WithinDistanceClause}
 */
neon.query.withinDistance = function(locationField, center, distance, distanceUnit) {
    return new neon.query.WithinDistanceClause(locationField, center, distance, distanceUnit);
};

/**
 * A generic function that can be applied to a field (on the server side). For example, this could be an aggregation
 * function such as an average or it could be a function to manipulate a field value such as extracting the month
 * part of a date
 * @param {String} operation The name of the operation to perform
 * @param {String} field The name of the field to perform the operation on
 * @param {String} name The name of the field created by performing this operation
 * @class neon.query.FieldFunction
 * @constructor
 * @private
 */
neon.query.FieldFunction = function(operation, field, name) {
    this.operation = operation;
    this.field = field;
    this.name = name;
};

/**
 * A function for deriving a new field to use as a group by. For example, a month field might be
 * generated from a date
 * @param {String} operation The name of the operation to perform
 * @param {String} field The name of the field to perform the operation on
 * @param {String} name The name of the field created by performing this operation
 * @class neon.query.GroupByFunctionClause
 * @constructor
 */
neon.query.GroupByFunctionClause = function(operation, field, name) {
    this.type = 'function';
    neon.query.FieldFunction.call(this, operation, field, name);
};
// TODO: NEON-73 (Javascript inheritance library)
neon.query.GroupByFunctionClause.prototype = new neon.query.FieldFunction();

// These are not meant to be instantiated directly but rather by helper methods
neon.query.GroupBySingleFieldClause = function(field, prettyField) {
    this.type = 'single';
    this.field = field;
    this.prettyField = ((prettyField.indexOf(".") >= 0) ? prettyField.replace(/\./g, "->") : prettyField);
};

neon.query.BooleanClause = function(type, whereClauses) {
    this.type = type;
    this.whereClauses = whereClauses;
};

neon.query.WhereClause = function(lhs, operator, rhs) {
    this.type = 'where';
    this.lhs = lhs;
    this.operator = operator;
    this.rhs = rhs;
};

neon.query.SortClause = function(fieldName, sortOrder) {
    this.fieldName = fieldName;
    this.sortOrder = sortOrder;
};

neon.query.LimitClause = function(limit) {
    this.limit = limit;
};

neon.query.OffsetClause = function(offset) {
    this.offset = offset;
};

neon.query.WithinDistanceClause = function(locationField, center, distance, distanceUnit) {
    this.type = 'withinDistance';
    this.locationField = locationField;
    this.center = center;
    this.distance = distance;
    this.distanceUnit = distanceUnit;
};

neon.query.intersectionClause = function(locationField, points, geometryType) {
    this.type = "geoIntersection";
    this.locationField = locationField;
    this.points = points;
    this.geometryType = geometryType;
};

neon.query.withinClause = function(locationField, points) {
    this.type = "geoIntersection";
    this.locationField = locationField;
    this.points = points;
};

/**
 * A query group is one that encompasses multiple queries. The results of all queries in the group are
 * combined into a single json object.
 * @constructor
 * @class neon.query.QueryGroup
 */
neon.query.QueryGroup = function() {
    this.queries = [];
    this.ignoreFilters_ = false;
    this.selectionOnly_ = false;

    // use this to ignore specific filters
    this.ignoredFilterIds_ = [];
};

/**
 * Adds a query to execute as part of the query group
 * @method addQuery
 * @param {neon.query.Query} query The query to execute as part of the query group
 * @return {neon.query.QueryGroup} This object
 */
neon.query.QueryGroup.prototype.addQuery = function(query) {
    this.queries.push(query);
    return this;
};

/**
 * Sets all queries to ignore any filters that are currently applied. This overrides any ignored filters set
 * on queries in the query group.
 * @method ignoreFilters
 * @param {...String | Array} [filterIds] An optional, variable number of filter ids to ignore OR an array of
 * filter ids to ignore. If specified, only these filters will be ignored. Otherwise, all will be ignored.
 * @return {neon.query.Query} This query group object
 */
neon.query.QueryGroup.prototype.ignoreFilters = function(filterIds) {
    var filters;
    if(arguments.length === 1 && $.isArray(filterIds)) {
        filters = filterIds;
    } else {
        filters = neon.util.arrayUtils.argumentsToArray(arguments);
    }

    if(filters.length > 0) {
        this.ignoredFilterIds_ = filters;
    } else {
        this.ignoreFilters_ = true;
    }
    return this;
};

/**
 * Sets the query to return just the current selection
 * @method selectionOnly
 * @return {neon.query.QueryGroup} This query group object
 */
neon.query.QueryGroup.prototype.selectionOnly = function() {
    this.selectionOnly_ = true;
    return this;
};

/**
 * Creates a transform that can be applied to a query.
 * @param name The fully qualified name of the transform to be used.
 * @class neon.query.Transform
 * @constructor
 */
neon.query.Transform = function(name) {
    this.transformName = name;
};

/**
 * Adds parameters to the transform
 * @param {Object} params Parameters to set on the transform.
 * @return {neon.query.Transform} This transform object
 * @method params
 */
neon.query.Transform.prototype.params = function(params) {
    this.params = params;
    return this;
};

/**
 * @class neon
 */

/**
 * Runs a function after the dom is loaded. The implementation will vary depending on whether the widgets are
 * running in an OWF environment.
 * @param functionToRun  the function to run.
 * @method ready
 */
neon.ready = function(functionToRun) {
    $(function() {
        if(neon.util.owfUtils.isRunningInOWF()) {
            OWF.ready(functionToRun);
        } else {
            // Make sure the function is always called asynchronously for consistency
            setTimeout(functionToRun, 0);
        }
    });
};

/**
 * Utility methods for working with ajax calls
 * @class neon.util.ajaxUtils
 * @static
 */

neon.util.ajaxUtils = (function() {
    var overlayId = 'neon-overlay';
    var logger = neon.util.loggerUtils.getGlobalLogger();
    var errorLogger = neon.util.loggerUtils.getLogger('neon.util.ajaxUtils.error');

    neon.util.loggerUtils.useBrowserConsoleAppender(errorLogger);
    $(function() {
        //document ready is used here so that this call is not overwritten by other jquery includes
        useDefaultStartStopCallbacks();
    });

    /**
     * Executes the request using an ajax call
     * @method doAjaxRequest
     * @private
     * @param {String} type The type of request, e.g. <code>GET</code> or <code>POST</code>
     * @param {String} url The url of the request
     * @param {Object} opts An associative array of options to configure the call
     * <ul>
     *  <li>data: Any data to include with the request (typically for POST requests)</li>
     *  <li>contentType: The mime type of data being sent, such as <code>application/json</code></li>
     *  <li>responseType: The type of data expected as a return value, such as <code>json</code> or <code>text</code></li>
     *  <li>success: The callback function to execute on success. It will be passed the return value of the call</li>
     *  <li>async: If the call should be asynchronous (defaults to true)</li>
     *  <li>global: If the call should trigger global ajax handlers</li>
     *  <li>error: The callback function to execute on error. It will have 3 parameters - the xhr, a short error status message and the error message</li>
     * </ul>
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function doAjaxRequest(type, url, opts) {
        var params = {};
        params.type = type;
        params.url = url;

        // don't just do a blind copy of params here. we want to restrict what can be used to avoid any jquery specific options.
        params.data = opts.data;
        params.contentType = opts.contentType;
        params.dataType = opts.responseType;
        params.success = opts.success;
        params.error = opts.error;
        params.global = opts.global;
        params.async = opts.async;
        logRequest(params);
        var xhr = $.ajax(params);
        return new neon.util.AjaxRequest(xhr);
    }

    function logRequest(params) {
        logger.debug('Making', params.type, 'request to URL', params.url, 'with data', params.data);
    }

    /**
     * Asynchronously makes a post request to the specified URL
     * @method doPost
     * @param {String} url The URL to post the data to
     * @param {Object} opts See {{#crossLink "neon.util.ajaxUtils/doAjaxRequest"}}{{/crossLink}}
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function doPost(url, opts) {
        return doAjaxRequest('POST', url, opts);
    }

    /**
     * Asynchronously posts the object in its json form (it is converted to json in this method). This method
     * also assumes that if any data is returned it will be in json format
     * @method doPostJSON
     * @param {Object} object The object to post
     * @param {String} url The URL to post to
     * @param {Object} opts See {{#crossLink "neon.util.ajaxUtils/doAjaxRequest"}}{{/crossLink}}
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function doPostJSON(object, url, opts) {
        var data = JSON.stringify(object);
        var fullOpts = _.extend({}, opts, {
            data: data,
            contentType: 'application/json',
            responseType: 'json'
        });
        return doPost(url, fullOpts);
    }

    /**
     * Asynchronously posts binary data to the specified URL.
     * @method doPostBinary
     * @param {Blob} binary The binary data to be uploaded.
     * @param {String} url The URL to post to.
     * @param {Function} successCallback The function to call when the post successfuly completes.
     * This function takes the server's response as its parameter.
     * @param {Function} errorCallback The function to call when an error occurs. This function
     * takes the server's response as its parameter.
     */
    function doPostBinary(binary, url, successCallback, errorCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.onload = function() {
            if(xhr.status === 200) {
                successCallback(xhr.response);
            } else {
                errorCallback(xhr.response);
            }
            hideDefaultSpinner();
        };
        showDefaultSpinner();
        xhr.send(binary);
    }

    /**
     * Makes an ajax GET request
     * @method doGet
     * @param {String} url The url to get
     * @param {Object} opts See {{#crossLink "neon.util.ajaxUtils/doAjaxRequest"}}{{/crossLink}}
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function doGet(url, opts) {
        return doAjaxRequest('GET', url, opts);
    }

    /**
     * Makes an ajax DELETE request
     * @method doDelete
     * @param {String} url The url to get
     * @param {Object} opts See {{#crossLink "neon.util.ajaxUtils/doAjaxRequest"}}{{/crossLink}}
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function doDelete(url, opts) {
        return doAjaxRequest('DELETE', url, opts);
    }

    /**
     * Sets the callbacks to be called when ajax requests start/stop. This is a good place to
     * setup the display/hiding of "working" indicators
     * @method setStartStopCallbacks
     * @param {Function} requestStart
     * @param {Function} requestEnd
     */
    function setStartStopCallbacks(requestStart, requestEnd) {
        $(document).ajaxStart(requestStart);
        $(document).ajaxStop(requestEnd);
    }

    function showDefaultSpinner() {
        $('body').append($('<div>').attr('id', overlayId).addClass('overlay-container'));
        $('#' + overlayId).append($('<div>').addClass('loader'));
    }

    function hideDefaultSpinner() {
        $('#' + overlayId).remove();
    }

    /**
     * Uses a default spinner when ajax queries are made.
     * If this method is used, the neon.css file needs to be included.
     * @method useDefaultStartStopCallbacks
     */
    function useDefaultStartStopCallbacks() {
        neon.util.ajaxUtils.setStartStopCallbacks(showDefaultSpinner, hideDefaultSpinner);
    }

    return {
        doPost: doPost,
        doPostJSON: doPostJSON,
        doPostBinary: doPostBinary,
        doGet: doGet,
        doDelete: doDelete,
        setStartStopCallbacks: setStartStopCallbacks,
        useDefaultStartStopCallbacks: useDefaultStartStopCallbacks
    };
})();

/**
 * Stores an ajax request that is in progress (returned by any of the ajax method calls in this class)
 * @class neon.util.AjaxRequest
 * @param {Object} xhr The jquery xhr being wrapped
 * @constructor
 */
neon.util.AjaxRequest = function(xhr) {
    // this really just wraps a jquery xhr
    this.xhr = xhr;
};

/**
 * Aborts the request if it is in progress. This will call the error/fail handler with status set to
 * 0.
 * @method abort
 */
neon.util.AjaxRequest.prototype.abort = function() {
    this.xhr.abort();
    return this;
};

/**
 * Takes a function that will be called if/when the request is successful.
 *
 * @method done
 * @param {Function} callback
 */
neon.util.AjaxRequest.prototype.done = function(callback) {
    this.xhr.done(callback);
    return this;
};

/**
 * Takes a function that will be called if/when the request fails.
 *
 * @method fail
 * @param {Function} callback
 */
neon.util.AjaxRequest.prototype.fail = function(callback) {
    this.xhr.fail(callback);
    return this;
};

/**
 * Takes a function that will be called if/when the request completes, whether it succeeds or fails
 *
 * @method always
 * @param {Function} callback
 */
neon.util.AjaxRequest.prototype.always = function(callback) {
    this.xhr.always(callback);
    return this;
};

/**
 * Utility methods for working with arrays
 * @class neon.util.arrayUtils
 */

neon.util.arrayUtils = {

    /**
     * Converts the javascript *arguments* to an array.
     * @method argumentsToArray
     * @param args The *arguments* variable from another function to convert to an array
     * @return {Array}
     */
    argumentsToArray: function(args) {
        return Array.prototype.slice.call(args);
    }
};

/**
 * Provides utility methods for getting information about neon
 * @class neon.util.infoUtils
 * @static
 */

neon.util.infoUtils = (function() {
    /*
     * Gets the version information for Neon
     * @method getNeonVersion
     * @return {neon.util.AjaxRequest}
     */
    function getNeonVersion(successCallback) {
        return neon.util.ajaxUtils.doGet(
            neon.serviceUrl('infoservice', 'version'), {
                success: successCallback,
                responseType: 'text'
            }
        );
    }

    return {
        getNeonVersion: getNeonVersion
    };
})();

/**
 * Creates a new latitude/longitude pair with the specified values in degrees
 * @class neon.util.LatLon
 * @constructor
 * @param {double} latDegrees
 * @param {double} lonDegrees

 */
neon.util.LatLon = function(latDegrees, lonDegrees) {
    this.validateArgs_(latDegrees, lonDegrees);

    /**
     * The latitude in degrees
     * @property latDegrees
     * @type {double}
     */
    this.latDegrees = latDegrees;

    /**
     * The longitude in degrees
     * @property lonDegrees
     * @type {double}
     */
    this.lonDegrees = lonDegrees;
};

neon.util.LatLon.prototype.validateArgs_ = function(latDegrees, lonDegrees) {
    if(latDegrees > 90 || latDegrees < -90) {
        throw new Error('Invalid latitude ' + latDegrees + '. Must be in range [-90,90]');
    }

    if(lonDegrees > 180 || lonDegrees < -180) {
        throw new Error('Invalid longitude ' + lonDegrees + '. Must be in range [-180,180]');
    }
};

/**
 * Utility methods for working with widgets
 * @class neon.widget
 * @static
 */
neon.widget = (function() {
    /**
     * Save the current state of a widget.
     * @method saveState
     * @param {String} instanceId a unique identifier of an instance of a widget
     * @param {Object} stateObject an object that is to be saved.
     * @param {Function} successCallback The callback to execute when the state is saved. The callback will have no data.
     * @param {Function} errorCallback The optional callback when an error occurs. This is a 3 parameter function that contains the xhr, a short error status and the full error message.
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function saveState(instanceId, stateObject, successCallback, errorCallback) {
        var strObject = JSON.stringify(stateObject);
        return neon.util.ajaxUtils.doPostJSON({
            instanceId: instanceId,
            state: strObject
        }, neon.serviceUrl('widgetservice', 'savestate'), {
            success: successCallback,
            error: errorCallback,
            global: false
        });
    }

    /**
     * Gets the current state that has been saved.
     * @method getSavedState
     * @param {String} id an unique identifier of a client widget
     * @param {Function} successCallback The callback that contains the saved data.
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function getSavedState(id, successCallback) {
        return neon.util.ajaxUtils.doGet(
            neon.serviceUrl('widgetservice', 'restorestate/' + encodeURIComponent(id)), {
                success: function(data) {
                    if(!data) {
                        return;
                    }
                    if(successCallback && typeof successCallback === 'function') {
                        successCallback(data);
                    }
                },
                error: function() {
                    //Do nothing, the state does not exist.
                },
                responseType: 'json'
            }
        );
    }

    /**
     * Gets the list of property keys
     * @method getPropertyKeys
     * @param {Function} successCallback The callback that contains the array of key names
     * @param {Function} errorCallback The optional callback when an error occurs. This is a 3 parameter function that contains the xhr, a short error status and the full error message.
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function getPropertyKeys(successCallback, errorCallback) {
        return neon.util.ajaxUtils.doGet(
            neon.serviceUrl('propertyservice', '*'), {
                success: successCallback,
                error: errorCallback,
                responseType: 'json'
            }
        );
    }

    /**
     * Gets a property
     * @method getProperty
     * @param {String} the property key to look up
     * @param {Function} successCallback The callback which takes the property as its argument, in an object of the form {key: "...", value: "..."}. If the property doesn't exist, the value field will be null
     * @param {Function} errorCallback The optional callback when an error occurs. This is a 3 parameter function that contains the xhr, a short error status and the full error message.
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function getProperty(key, successCallback, errorCallback) {
        return neon.util.ajaxUtils.doGet(
            neon.serviceUrl('propertyservice', key), {
                success: successCallback,
                error: errorCallback,
                responseType: 'json'
            }
        );
    }

    /**
     * Remove a property
     * @method removeProperty
     * @param {String} the property key to remove
     * @param {Function} successCallback The callback
     * @param {Function} errorCallback The optional callback when an error occurs. This is a 3 parameter function that contains the xhr, a short error status and the full error message.
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function removeProperty(key, successCallback, errorCallback) {
        return neon.util.ajaxUtils.doDelete(
            neon.serviceUrl('propertyservice', key), {
                success: successCallback,
                error: errorCallback,
                responseType: 'json'
            }
        );
    }

    /**
     * Sets a property
     * @method setProperty
     * @param {String} the property key to set
     * @param {String} the new value for the property
     * @param {Function} successCallback The callback
     * @param {Function} errorCallback The optional callback when an error occurs. This is a 3 parameter function that contains the xhr, a short error status and the full error message.
     * @return {neon.util.AjaxRequest} The xhr request object
     */
    function setProperty(key, value, successCallback, errorCallback) {
        return neon.util.ajaxUtils.doPost(
            neon.serviceUrl('propertyservice', key), {
                data: value,
                contentType: 'text/plain',
                success: successCallback,
                error: errorCallback,
                responseType: 'json'
            }
        );
    }

    /**
     * Gets a unique id for a widget for a particular session. Repeated calls to this method in a single session with the
     * same parameters will result in the same id being returned.
     * @param {String} [qualifier] If a qualifier is specified, the id will be tied to that qualifier. This
     * allows multiple ids to be created for a single session. If a qualifier is not specified, the id returned
     * will be unique to the session.
     * If running within OWF, the OWF instanceId is appended to the identifier so the same widget can be reused in
     * multiple windows without conflict.
     * @param {Function} successCallback The callback that contains the unique id string
     * @method getInstanceId
     * @return {String} The xhr request object
     */
    function getInstanceId(qualifier, successCallback) {
        // If the first argument is a function, assume that is the callback and that the caller
        // wants the session id
        if(typeof qualifier === 'function') {
            successCallback = qualifier;
            qualifier = null;
        }
        return neon.util.ajaxUtils.doGet(
            neon.serviceUrl('widgetservice', 'instanceid', buildInstanceIdQueryString(qualifier)), {
                success: function(instanceId) {
                    if(!instanceId) {
                        return;
                    }
                    if(successCallback && typeof successCallback === 'function') {
                        successCallback(instanceId);
                    }
                },
                error: function() {
                }
            }
        );
    }

    /**
     * Given the text qualifier value, if running in OWF, the OWF instance id is appended to it. Otherwise, the original
     * value is returned.
     * @method buildQualifierString
     * @param {String} [qualifier]
     * @return {string} The full qualifier, which may include the OWF instance id if running in OWF
     */
    function buildQualifierString(qualifier) {
        var fullQualifier = qualifier || '';
        // when running in OWF, it is possible to have the same widget running multiple times so append
        // the owf widget instanceid to the qualifier
        if(neon.util.owfUtils.isRunningInOWF()) {
            fullQualifier += OWF.getInstanceId();
        }
        return fullQualifier;
    }

    function buildInstanceIdQueryString(qualifier) {
        var queryString = '';
        if(qualifier) {
            queryString = 'qualifier=' + encodeURIComponent(buildQualifierString(qualifier));
        }
        return queryString;
    }

    return {
        saveState: saveState,
        getSavedState: getSavedState,
        getPropertyKeys: getPropertyKeys,
        getProperty: getProperty,
        setProperty: setProperty,
        removeProperty: removeProperty,
        getInstanceId: getInstanceId
    };
})();

return neon;

}));
