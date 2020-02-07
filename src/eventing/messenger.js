/*
 * Copyright 2014 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

// Note: There is a single instance of an event bus shared by all messengers

/**
 * Creates the event bus to be used for communication between widgets. If running outside of OWF,
 * If in OWF, a {{#crossLink "neon.eventing.EventBus"}}{{/crossLink}} is returned. If running inside of OWF, a
 * {{#crossLink "neon.eventing.owf.OWFEventBus"}}{{/crossLink}} is returned.
 * @return {neon.eventing.EventBus | neon.eventing.owf.OWFEventBus}
 * @private
 * @method createEventBus_
 */
neon.eventing.createEventBus_ = function () {
    if (neon.util.owfUtils.isRunningInOWF()) {
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

neon.eventing.Messenger = function () {
    this.id_ = uuidv4();
    this.channels = [];
};

/**
 * Publishes a message to a channel
 * @param {String} channel The channel to publish the message to
 * @param {Object} message The message to publish
 * @method publish
 */
neon.eventing.Messenger.prototype.publish = function (channel, message) {
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
neon.eventing.Messenger.prototype.subscribe = function (channel, callback) {
    neon.eventing.eventBus_.subscribe(channel, callback, this.id_);
    if (this.channels.indexOf(channel) < 0) {
        this.channels.push(channel);
    }
};

/**
 * Unsubscribes this messenger from the channel
 * @param {String} channel The channel to unsubscribe from
 * @method unsubscribe
 */
neon.eventing.Messenger.prototype.unsubscribe = function (channel) {
    neon.eventing.eventBus_.unsubscribe(channel, this.id_);
    var index = this.channels.indexOf(channel);
    if (index >= 0) {
        this.channels.splice(index, 1);
    }
};

/**
 * Unsubscribes this messenger from all its channels, including events
 * @method unsubscribeAll
 */
neon.eventing.Messenger.prototype.unsubscribeAll = function () {
    var me = this;
    var allChannels = me.channels.slice();
    allChannels.forEach(function (channel) {
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
neon.eventing.Messenger.prototype.events = function (callbacks) {
    var me = this;
    var globalChannelConfigs = this.createGlobalChannelSubscriptions_(callbacks);
    globalChannelConfigs.forEach(function (channelConfig) {
        me.subscribe(channelConfig.channel, function (payload) {
            if (channelConfig.callback && typeof channelConfig.callback === 'function') {
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
neon.eventing.Messenger.prototype.removeEvents = function () {
    var me = this;
    var globalChannelConfigs = this.createGlobalChannelSubscriptions_({});
    globalChannelConfigs.forEach(function (channelConfig) {
        me.unsubscribe(channelConfig.channel);
    });
};

neon.eventing.Messenger.prototype.createGlobalChannelSubscriptions_ = function (neonCallbacks) {
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
        {
            channel: neon.eventing.channels.DATASET_UPDATED,
            callback: neonCallbacks.datasetUpdated
        }
    ];
};

