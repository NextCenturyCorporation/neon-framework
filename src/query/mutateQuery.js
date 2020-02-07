/*
 * Copyright 2020 Next Century Corporation
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
 * Creates a mutation query.
 * @param datastoreHost
 * @param datastoreType
 * @param databaseName
 * @param tableName
 * @param idFieldName
 * @param dataId
 * @param fieldsWithValues
 * @class neon.query.MutateQuery
 * @constructor
 */
neon.query.MutateQuery = function(datastoreHost, datastoreType, databaseName, tableName, idFieldName, dataId, fieldsWithValues) {
    this.datastoreHost = datastoreHost;
    this.datastoreType = datastoreType;
    this.databaseName = databaseName;
    this.tableName = tableName;
    this.idFieldName = idFieldName;
    this.dataId = dataId;
    this.fieldsWithValues = fieldsWithValues;
};
