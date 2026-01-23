const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')
const stream = require('./controllers/stream')
const rules = require('./controllers/rules')
const api = require('./controllers/api')
const token = require('./controllers/token')
const stripe = require('./controllers/stripe')

const app = express();
const PORT = process.env.PORT || 4060;

app.use(bodyParser.json({strict:false}));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.options('*', cors()) 
app.post('*', cors()) 

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Twitter API Toolkit</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; background-color: #fff; }
        h1 { color: #1da1f2; margin-bottom: 0.5rem; }
        .card { border: 1px solid #e1e8ed; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; transition: box-shadow 0.2s; background-color: #fff; }
        .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        h2 { margin-top: 0; font-size: 1.25rem; }
        a { color: #1da1f2; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; background: #17bf63; color: white; font-size: 0.875rem; font-weight: bold; vertical-align: middle; margin-left: 1rem; }
        .header { display: flex; align-items: center; margin-bottom: 2rem; }
        .desc { color: #657786; margin-bottom: 2rem; font-size: 1.1rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Twitter API Toolkit</h1>
        <span class="status">Active</span>
    </div>
    <p class="desc">Welcome to the Twitter API Toolkit for Google Cloud. Use the endpoints below to interact with the service.</p>

    <div class="card">
        <h2>📊 Stream Control</h2>
        <p>Manage the tweet stream connection and processing.</p>
        <p>Endpoint: <a href="/stream">/stream</a></p>
    </div>

    <div class="card">
        <h2>📝 Rules Management</h2>
        <p>Add, delete, or list filtering rules for the stream.</p>
        <p>Endpoint: <a href="/rules">/rules</a></p>
    </div>

    <div class="card">
        <h2>📈 API Services</h2>
        <p>Access trending data and other analytical services.</p>
        <p>Endpoint: <a href="/api">/api</a></p>
    </div>
</body>
</html>`);
});

app.use('/stream',stream);
app.use('/rules',rules);
app.use('/api', api)
app.use('/token', token)
app.use('/stripe',stripe);

app.listen(PORT, ()=>   {
    console.log("App listening on port",PORT);
    //stream.streamTweets();
});

module.exports = app;
