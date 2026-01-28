const { BigQuery } = require("@google-cloud/bigquery");
const config = require('../config.js');
const utils = require('./utils.js');

// Optimization: Reuse BigQuery client to avoid repeated instantiation overhead
const bigqueryClient = new BigQuery();

async function getTrends(minutes) {
    let tableName = config.gcp_infra.bq.dataSetId + '.' + config.gcp_infra.bq.table.tweets;
    console.log('getTrends SQL ', utils.getTrends(tableName, minutes));
    const options = {
        query: utils.getTrends(tableName, minutes),
        location: 'US',
    };

    // Return the promise chain directly
    return bigqueryClient.query(options);
}

module.exports = { getTrends };
