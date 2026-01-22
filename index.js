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
app.use('/stream',stream);
app.use('/rules',rules);
app.use('/api', api)
app.use('/token', token)
app.use('/stripe',stripe);

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GCloud Toolkit Status</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; line-height: 1.5; }
        @media (prefers-color-scheme: dark) { body { background: #1a1a1a; color: #eee; } a { color: #8ab4f8; } li { border-color: #333; } }
        h1 { margin-bottom: 0.5rem; }
        ul { list-style: none; padding: 0; margin: 2rem 0; }
        li { padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        li:last-child { border-bottom: none; }
        a { text-decoration: none; color: #0066cc; font-weight: 500; }
        a:hover { text-decoration: underline; }
        .subtle { font-size: 0.9rem; opacity: 0.7; }
    </style>
</head>
<body>
    <h1>🎨 GCloud Toolkit</h1>
    <p class="subtle">Twitter Filtered Stream Service is active.</p>

    <ul>
        <li>
            <span>Service Health</span>
            <a href="/stream/alive" aria-label="Check service health status">/stream/alive</a>
        </li>
        <li>
            <span>Active Rules</span>
            <a href="/rules" aria-label="View active filtering rules">/rules</a>
        </li>
        <li>
            <span>Trend Data</span>
            <a href="/api/trends" aria-label="View trend analysis data">/api/trends</a>
        </li>
    </ul>

    <p class="subtle">
        <strong>Admin Actions:</strong>
        <a href="/stream">Start Stream</a> •
        <a href="/stream/clean">Clean Resources</a>
    </p>
</body>
</html>`);
});

app.listen(PORT, ()=>   {
    console.log("App listening on port",PORT);
    //stream.streamTweets();
});

module.exports = app;
