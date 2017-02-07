'use strict'
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var agendorApi = require("./agendor-api-integration");

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'dog-test') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
  var messaging_events = req.body.entry[0].messaging
  for (var i = 0; i < messaging_events.length; i++) {
    var event = req.body.entry[0].messaging[i];
    var sender = event.sender.id
    if (event.message && event.message.text) {
      botFlow(event.message.text, sender, req, res);
    }
    if (event.postback) {
      var payload = event.postback.payload;
      agendorApi[payload](sendTextMessage, sender, req, res);
      continue;
    }
  }
  if (!event.postback) {
    res.sendStatus(200);
  }
})

function botFlow(text, sender, req, res) {
  // if (req.session.creatingTask) { //Clicou em criar tarefa
  //   if(!req.session.description) {
  //     req.session.description = text;
  //     agendorApi.createTask(sendTextMessage, sender, req, res);
  //   } else { //Está mandando nome da empresa
  //     req.session.organization = text;
  //     agendorApi.createTask(sendTextMessage, sender, req, res);
  //   }
  // } else
  if (text === 'Agendor') {
      sendGenericMessage(sender);
  } else if (text.match(/A-([\w\s]+):(\d+)/)) {
    var arr = text.match(/A-([\w\s]+):(\d+)/);
    console.log(arr);
    var params = {
      text: arr[1],
      organization: parseInt(arr[2])
    };
    agendorApi.createTask(params, sendTextMessage, sender, req, res);
  } else {
    sendTextMessage(sender, "🐶 au au, eu não entendo isso: " + text.substring(0, 200));
  }
}

function sendTextMessage(sender, text) {
    var messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendGenericMessage(sender) {
    var messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "O que gostaria de fazer? 🐕",
                "buttons": [
                  {
                    "type": "postback",
                    "title": "Minha próxima tarefa?",
                    "payload": "nextTask"
                  }
                ]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

var token = process.env.FB_TOKEN;
