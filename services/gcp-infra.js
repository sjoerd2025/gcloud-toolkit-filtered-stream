const { BigQuery } = require("@google-cloud/bigquery");
const { v1 } = require('@google-cloud/pubsub');
const { PubSub } = require('@google-cloud/pubsub');
const config = require('../config.js');
const bigquery = new BigQuery();
const fs = require('fs');

const pubSubClient = new PubSub();
const subClient = new v1.SubscriberClient();
var counter;

async function synchronousPull(projectId, subscriptionName, maxMessagesToPull) {
    const formattedSubscription = subClient.subscriptionPath(
        projectId,
        subscriptionName
    );

    // The maximum number of messages returned for this request.
    // Pub/Sub may return fewer than the number specified.
    const request = {
        subscription: formattedSubscription,
        maxMessages: maxMessagesToPull,
    };

    // The subscriber pulls a specified number of messages.
    const [response] = await subClient.pull(request);

    // Process the messages.
    const ackIds = [];
    var tweets = [];

    for (const message of response.receivedMessages) {
        //console.log('Received Message :- ',message.message.data.toString());
        tweets.push(JSON.parse(message.message.data.toString()));
        ackIds.push(message.ackId);
    }

    console.log(' Tweets pulled -- ', tweets.length);
    if (tweets.length == 0)
        counter++;
    if (counter > config.reconnectCounter) {
        counter = 0;
        return new Promise(function (resolve, reject) {
            resolve('disconnect')
        });
    }
    // Insert into BQ
    if (tweets.length != 0) {
       await insertStreamResults(tweets);
    }

    if (ackIds.length !== 0) {
        // Acknowledge all of the messages. You could also ackknowledge
        // these individually, but this is more efficient.
        const ackRequest = {
            subscription: formattedSubscription,
            ackIds: ackIds,
        };

        await subClient.acknowledge(ackRequest);
    }
}

async function provisionDB() {
    try {
        const dataSetResponse = await createDataSet(config.gcp_infra.bq.dataSetId);
        console.log('dataSetResponse ', dataSetResponse);
        try {
            const tablesResponse = await createTables(config.gcp_infra.bq.dataSetId);
            console.log('tablesResponse ', tablesResponse);
            return 'Successfully provisioned DB';
        } catch (error) {
            console.log('Error provisioning tables ', error);
            throw { "error": "Error Provisioning tables " };
        }
    } catch (error) {
        if (error.error === "Error Provisioning tables ") throw error;
        console.log('Error provisioning DB ', error);
        throw { "error": error.message };
    }
}

async function setupMsgInfra() {
    await createTopic(config.gcp_infra.topicName);
    await createSubscription(config.gcp_infra.topicName, config.gcp_infra.subscriptionName);
    return config.gcp_infra.topicName;
}

async function cleanUp() {
    deleteDataSet(config.gcp_infra.bq.dataSetId);
    await deleteSubscription(config.gcp_infra.subscriptionName);
    deleteTopic(config.gcp_infra.topicName);

}

async function createDataSet(dataSetName) {

    const options = {
        location: 'US',
    };

    console.log('dataSetName -- ', dataSetName);
    //    Create a new dataset
    const [dataset] = await bigquery.createDataset(dataSetName, options);
    const dataSetId = dataset.id;
    console.log(`Dataset ${dataSetId} created.`);

}

async function createTables(datasetId) {
    //create tables
    // Optimization: Use async file read to avoid blocking the event loop
    const tweets_schema = await fs.promises.readFile('./schema/tweets.json');
    const [tweets_table] = await bigquery.dataset(datasetId).createTable(config.gcp_infra.bq.table.tweets, { schema: JSON.parse(tweets_schema), location: 'US' });
    console.log(`Table ${tweets_table.id} created.`);

    const users_schema = await fs.promises.readFile('./schema/users.json');
    const [users_table] = await bigquery.dataset(datasetId).createTable(config.gcp_infra.bq.table.users, { schema: JSON.parse(users_schema), location: 'US' });
    console.log(`Table ${users_table.id} created.`);
}

async function publishMessage(topicName, message) {
    const dataBuffer = Buffer.from(message);
    try {
        const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);
        //console.log(`Message ${messageId} published.`);
    } catch (error) {
        console.error(`Received error while publishing: ${error.message}`);
        process.exitCode = 1;
    }
}

async function createTopic(topicName) {
    // Creates a new topic
    await pubSubClient.createTopic(topicName);
    console.log(`Topic ${topicName} created.`);
}

async function createSubscription(topicName, subscriptionName) {
    // Creates a new subscription
    await pubSubClient.topic(topicName).createSubscription(subscriptionName);
    console.log(`Subscription ${subscriptionName} created.`);
}

async function deleteTopic(topicName) {
    await pubSubClient.topic(topicName).delete();
    console.log(`Topic ${topicName} deleted.`);
}

async function deleteSubscription(subscriptionName) {
    await pubSubClient.subscription(subscriptionName).delete();
    console.log(`Subscription ${subscriptionName} deleted.`);
}

async function deleteDataSet(dataSetName) {
    const dataset = bigquery.dataset(dataSetName);
    dataset.delete({ force: true }, (err, apiResponse) => { });
    console.log()
}

async function insertRowsAsStream(datasetId, tableId, rows) {
    // Insert data into a table
    try {
        await bigquery
            .dataset(datasetId)
            .table(tableId)
            .insert(rows);
        console.log(`Inserted ${rows.length} rows into ${tableId} for dataset ${datasetId}`);
        return rows;
    } catch (error) {
        console.log("----BQ JSON Error --- \n ", JSON.stringify(error), "\n");
        throw new Error(error);
    }
}

async function insertTweets(data) {
    var resultRows = [];
    data.forEach(function (tweetData, index) {
        // Optimize: Handle both string (legacy/double-serialized) and object (single-serialized) formats
        // This avoids double parsing when upstream provides objects directly
        let tweet = (typeof tweetData === 'string' ? JSON.parse(tweetData) : tweetData).data;
        if (tweet) {
            var cDate = new Date(tweet.created_at);
            if (tweet.context_annotations === undefined)
                tweet.context_annotations = [];
            if (tweet.referenced_tweets === undefined)
                tweet.referenced_tweets = [];
            let row = {
                id: tweet.id,
                text: tweet.text,
                source: tweet.source,
                author_id: tweet.author_id,
                conversation_id: tweet.conversation_id,
                created_at: BigQuery.datetime(cDate.toISOString()),
                lang: tweet.lang,
                in_reply_to_user_id: tweet.in_reply_to_user_id,
                possibly_sensitive: tweet.possibly_sensitive,
                entities: tweet.entities,
                public_metrics: tweet.public_metrics,
                referenced_tweets: tweet.referenced_tweets,
                geo: tweet.geo,
                context_annotations: tweet.context_annotations,
                withheld: tweet.withheld,
                tweet_url: 'http://twitter.com/twitter/status/' + tweet.id
            };
            resultRows.push(row);
        }
    });
    // insert Tweets
    insertRowsAsStream(config.gcp_infra.bq.dataSetId, config.gcp_infra.bq.table.tweets, resultRows);
}

async function insertUsers(usersData) {
    var resultRows = [];
    let users = JSON.parse(usersData).includes.users;
    console.log('users ',users);
    users.forEach(function (user, index) {
        if (user) {
            var cDate = new Date(user.created_at);
            let row = {
                id: user.id,
                name: user.name,
                username: user.username,
                created_at: BigQuery.datetime(cDate.toISOString()),
                description: user.description,
                entities: user.entities,
                location: user.location,
                pinned_tweet_id: user.pinned_tweet_id,
                profile_image_url: user.profile_image_url,
                protected: user.protected,
                public_metrics: user.public_metrics,
                url: user.url,
                verified: user.verified,
                withheld: user.withheld
            };
            resultRows.push(row);
        }
    });
    insertRowsAsStream(reqBody.dataSet.dataSetName, config.bq.table.users, resultRows);
}


async function insertStreamResults(results) {
    console.log('insertStreamResults ', results.length);
    let data = results;
    if (data != undefined)  {
        insertTweets(data);
        //insertUsers(data);
    }
}

module.exports = { provisionDB, setupMsgInfra, cleanUp, publishMessage, synchronousPull };
