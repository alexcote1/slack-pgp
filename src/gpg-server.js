import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import { spawn } from 'child_process';
import request from 'request';

require('dotenv').config();

const app = express();
http.createServer(app).listen(process.env.PORT);
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * GPG endpoint
 */
app.post('/api/v1/gpg', (req, res) => {
  const msg = parseMessage(req.body.text);
  // Need to be able to use | so we use sh
  const process = spawn('sh', ['-c', `echo ${msg.message} | gpg --encrypt --armor -r ${msg.key}`]);

  process.stdout.on('data', data => {
    res.status(200).json({ text: data.toString() });
  });

  process.stderr.on('data', err => {
    res.status(400).json({ text: err.toString() });
  });
});

app.get('/api/v1/auth', (req, res) => {
  const options = {
    uri: `https://slack.com/api/oauth.access?code=${req.query.code}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&redirect_uri=${process.env.REDIRECT_URI}`,
    method: 'GET',
  };
  request(options, (error, response, body) => {
      const success = JSON.parse(body).ok;
      if (success) {
        res.send('GPG has successfully been added to your slack team! Click <a href="https://github.com/kaplanmaxe/slack-gpg">here</a> to go home.');
      } else {
        res.send('An error occurred. Please email info@kaplankomputing.com');
      }
  });
});

/**
 * Parses message for key and message
 * @param {string} msg Message coming from slack
 * @return {string}
 */
function parseMessage(msg) {
  const message = msg.split(' ');
  return {
    message: message[0],
    key: message[1],
  };
}