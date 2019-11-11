/*
 * Copyright 2016 Next Century Corporation
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
 * Represents export parameters to be used when exporting data from a datasource to a file
 * @param hostName the host name where the datastore exists in
 * @param dataStoreType the data store type (elastic search, sql, etc)
 * @param fileName the name of the file where the data is exported to.
 * @param query query for pulling the data to export
 * @param fieldNamePrettyNamePairs mapping of actual field names to user friendly field names
 * @class neon.query.exportQuery
 * @constructor
 */
neon.query.ExportQuery = function(hostName, dataStoreType, fileName, query, fieldNamePrettyNamePairs) {
    this.hostName = hostName;
    this.dataStoreType = dataStoreType;
    this.fileName = fileName;
    this.query = new neon.query.Query();
    this.fieldNamePrettyNamePairs = fieldNamePrettyNamePairs;
};