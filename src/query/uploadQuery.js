/*
 * Copyright 2013 Next Century Corporation
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

/**
 * Creates a upload that can be applied to a query.
 * @param database The database of where the new data will be upload to.
 * @param table The table of where the new data will be upload to.
 * @param source The source content of the new data.
 * @class neon.query.Upload
 * @constructor
 */
neon.query.Upload = function(database, table, source) {
    this.database = database;
    this.table = table;
    this.source = source;
};

/**
 * Adds parameters to the upload
 * @param {Object} params Parameters to set on the upload.
 * @return {neon.query.Upload} This upload object
 * @method params
 */
neon.query.Upload.prototype.params = function(params) {
    this.params = params;
    return this;
};
