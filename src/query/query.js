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
    this.isDistinct = false;
    this.selectClause = new neon.query.SelectClause(undefined, undefined);
    this.whereClause = undefined;
    this.aggregateClauses = [];
    this.groupByClauses = [];
    this.orderByClauses = [];
    this.limitClause = undefined;
    this.offsetClause = undefined;
};

/**
 * Produce a human-readable representation of the query
 * @method toString
 * @return {string}
 */
neon.query.Query.prototype.toString = function() {
    var fields = this.selectClause.fieldClauses.map((field) => field.databaseName + "." + field.tableName + "." + field.fieldName).join(", ");
    return ("SELECT " + (this.selectClause.fieldClauses.length ? fields : "*" ) + " ") +
        (" FROM " + this.selectClause.databaseName + "." + this.selectClause.tableName + " ") +
        (this.whereClause ? ("WHERE " + this.whereClause.toString() + " ") : "") +
        (this.aggregateClauses.length ? ("AGGREGATE " + this.aggregateClauses.map((agg) => agg.operation + " ON " + agg.field + " (NAMED " + agg.name + ")").join(", ") + " ") : "") +
        (this.groupByClauses.length ? ("GROUP_BY " + this.groupByClauses.map((group) => group.field).join(", ") + " ") : "") +
        (this.orderByClauses.length ? ("ORDER_BY " + this.orderByClauses.map((order) => order.fieldName + " (" + order.order + ")").join(", ") + " ") : "") +
        (this.limitClause ? ("LIMIT " + this.limitClause.limit) : "");
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
 * The order parameter for clauses to order ascending
 * @property ASCENDING
 * @type {int}
 */
neon.query.ASCENDING = 1;

/**
 * The order parameter for clauses to order descending
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
    this.selectClause.databaseName = databaseName;
    this.selectClause.tableName = tableName;
    return this;
};

/**
 * Sets the *select* clause of the query to select data from the specified field
 * @method selectField
 * @param {String} databaseName
 * @param {String} tableName
 * @param {String} fieldName
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.selectField = function(databaseName, tableName, fieldName) {
    this.selectClause.fieldClauses.push(new neon.query.FieldClause(databaseName, tableName, fieldName));
    return this;
};

/**
 * Removes the fields from the *select* clause of the query to select data from all fields
 * @method selectAllFields
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.selectAllFields = function() {
    this.selectClause.fieldClauses = [];
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
    if(arguments.length === 3) {
        this.whereClause = neon.query.where(arguments[0], arguments[1], arguments[2]);
    } else {
        this.whereClause = arguments[0];
    }
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
            clause = new neon.query.GroupByFieldClause(field, field);
        } else if(typeof field === 'object' && !(field instanceof neon.query.GroupByFunctionClause)) {
            clause = new neon.query.GroupByFieldClause(field.columnName, field.prettyName);
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
    this.aggregateClauses.push(new neon.query.AggregateClause(aggregationOperation, aggregationField, newFieldName));
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
 * @method orderBy
 * @param {String | Array} fieldName The name of the field to sort on OR single array in the form
 * of ['field1', neon.query.ASC, ... , 'fieldN', neon.query.DESC]
 * @param {int} order The sort order (see the constants in this class)
 * @return {neon.query.Query} This query object
 * @example
 *     new neon.query.Query(...).orderBy('field1',neon.query.ASC,'field2',neon.query.DESC);
 */
neon.query.Query.prototype.orderBy = function(fields) {
    // even though internally each orderBy clause is a separate object, the user will think about a single orderBy
    // operation which may include multiple fields, so this method does not append to the existing
    // orderBy fields, but replaces them
    this.orderByClauses.length = 0;

    var list;
    if(arguments.length === 1 && $.isArray(fields)) {
        list = fields;
    } else {
        list = neon.util.arrayUtils.argumentsToArray(arguments);
    }

    for(var i = 1; i < list.length; i += 2) {
        var field = list[i - 1];
        var order = list[i];
        this.orderByClauses.push(new neon.query.OrderByClause(field, order));
    }
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
    return new neon.query.SingularWhereClause(fieldName, op, value);
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
        return new neon.query.CompoundWhereClause('and', clauses);
    } else {
        return new neon.query.CompoundWhereClause('and', neon.util.arrayUtils.argumentsToArray(arguments));
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
        return new neon.query.CompoundWhereClause('or', clauses);
    } else {
        return new neon.query.CompoundWhereClause('or', neon.util.arrayUtils.argumentsToArray(arguments));
    }
};

/**
 * A generic function that can be applied to a field (on the server side). For example, this could be an aggregation
 * function such as an average or it could be a function to manipulate a field value such as extracting the month
 * part of a date
 * @param {String} operation The name of the operation to perform
 * @param {String} field The name of the field to perform the operation on
 * @param {String} name The name of the field created by performing this operation
 * @class neon.query.AggregateClause
 * @constructor
 * @private
 */
neon.query.AggregateClause = function(operation, field, name) {
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
    this.operation = operation;
    this.field = field;
    this.name = name;
};

// These are not meant to be instantiated directly but rather by helper methods
neon.query.GroupByFieldClause = function(field, prettyField) {
    this.type = 'single';
    this.field = field;
    this.prettyField = ((prettyField.indexOf(".") >= 0) ? prettyField.replace(/\./g, "->") : prettyField);
};

neon.query.CompoundWhereClause = function(type, whereClauses) {
    this.type = type;
    this.whereClauses = whereClauses;
};

neon.query.CompoundWhereClause.prototype.toString = function() {
    return this.type.toUpperCase() + " (" + this.whereClauses.map((where) => where.toString()).join(", ") + ")";
}

neon.query.SingularWhereClause = function(lhs, operator, rhs) {
    this.type = 'where';
    this.lhs = lhs;
    this.operator = operator;
    this.rhs = rhs;
};

neon.query.SingularWhereClause.prototype.toString = function() {
    return this.lhs + " " + this.operator + " " + this.rhs;
}

neon.query.OrderByClause = function(databaseName, tableName, fieldName, order) {
    this.database = databaseName;
    this.table = tableName;
    this.field = fieldName;
    this.order = order;
};

neon.query.LimitClause = function(limit) {
    this.limit = limit;
};

neon.query.OffsetClause = function(offset) {
    this.offset = offset;
};

neon.query.SelectClause = function(databaseName, tableName) {
    this.databaseName = databaseName;
    this.tableName = tableName;
    this.fieldClauses = [];
};

neon.query.FieldClause = function(databaseName, tableName, fieldName) {
    this.databaseName = databaseName;
    this.tableName = tableName;
    this.fieldName = fieldName;
};

