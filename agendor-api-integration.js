"use strict"
var userToken = process.env.AGENDOR_TOKEN;
var agendorUrl = "https://api.agendor.com.br/v1/";
var request = require('request');

module.exports.nextTask = function nextTask(sendTextMessage, sender, res) {
  request({
    url: agendorUrl + "tasks",
    headers: {"Authorization": "Token " + userToken},
    qs: {page:1, per_page:1},
    method: 'GET'
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
    console.log("statusCode");
    console.log(JSON.parse(body)[0]);
    console.log("end statusCode");
    if (!error && response.statusCode == 200) {
      var text = formatTask(body);
      sendTextMessage(text, sender);
      res.sendStatus(200);
    }
  });
};

function formatTask(task) {
  var entity;
  var entityDesc;
  if (task.deal) {
    entityDesc = "o negócio";
    entity = task.deal.name;
  } else if (task.organization) {
    entityDesc = "a empresa";
    entity = task.organization.legalName;
  } else if (task.person) {
    entityDesc = "a pessoa";
    entity = task.person.name;
  }

  var text = task.text;
  var dueDate = task.dueDate;

  var textMessage = "Você possuí uma tarefa para " + entityDesc + ": " + entity + " ";
  if (dueDate) {
    textMessage += "às " + dueDate;
  }
  if (text) {
    textMessage += "\n Descrição:\n" + text;
  }
  return textMessage;
}
