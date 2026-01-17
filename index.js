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
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GCloud Toolkit Filtered Stream</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
          h1 { color: #1da1f2; }
          code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
          ul { list-style: none; padding: 0; }
          li { padding: 1rem; border-bottom: 1px solid #eee; }
          .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; background: #e6fffa; color: #047481; font-size: 0.875rem; font-weight: bold; }
        </style>
      </head>
      <body>
        <header>
          <h1>GCloud Toolkit Filtered Stream</h1>
          <p><span class="status">● System Operational</span></p>
        </header>
        <main>
          <p>Welcome to the filtered stream API service.</p>
          <h2>Available Endpoints</h2>
          <ul>
            <li><code>/stream</code> - Manage stream connection</li>
            <li><code>/rules</code> - Manage filtering rules</li>
            <li><code>/api</code> - General API services</li>
            <li><code>/token</code> - Token management</li>
            <li><code>/stripe</code> - Billing endpoints</li>
          </ul>
        </main>
      </body>
      </html>
    `);
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
