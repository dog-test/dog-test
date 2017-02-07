"use strict"
var userToken = process.env.AGENDOR_TOKEN;
var agendorUrl = "https://api.agendor.com.br/v1/";
var request = require('request');
var moment = require('moment');

module.exports.nextTask = function nextTask(sendTextMessage, sender, req, res) {
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
    if (!error && response.statusCode == 200) {
      var text = "🐶 au au! Fui lá no agendor e achei! \n\n " + formatTask(JSON.parse(body)[0]);
      sendTextMessage(sender, text);
      res.sendStatus(200);
    }
  });
};

module.exports.createTask = function createTask(sendTextMessage, sender, req, res) {
  if (!req.session.creatingTask) { //Iniciar criação de tarefa
    req.session.creatingTask = true;
    var text = "Qual a descrição da tarefa?";
    sendTextMessage(sender, text);
  } else if (req.session.creatingTask && req.session.description) { //Cadastrou descrição
    var text = "Para qual empresa? (ID 😭)";
    sendTextMessage(sender, text);
  } else { //enviando tarefa
    request({
      url: agendorUrl + "tasks",
      headers: {"Authorization": "Token " + userToken},
      params: {
        organization: parseInt(req.session.organization),
        text: req.session.description
      },
      method: 'POST'
    }, function(error, response, body) {
      if (error) {
        console.log('Error sending messages: ', error)
      } else if (response.body.error) {
        console.log('Error: ', response.body.error)
      }
      if (!error && response.statusCode == 200) {
        var text = "🐶 au au! Deu certo! Cadastrei esta tarefa!";
        sendTextMessage(sender, text);
        req.session.destroy();
        res.sendStatus(200);
      }
    });
  }
};

function formatTask(task) {
  var entity;
  var entityDesc;
  if (task.deal && task.deal.name) {
    entityDesc = "o negócio";
    entity = task.deal.name;
  } else if (task.organization && task.organization.name) {
    entityDesc = "a empresa";
    entity = task.organization.name;
  } else if (task.person && task.person.name) {
    entityDesc = "a pessoa";
    entity = task.person.name;
  }

  var text = task.text;
  var dueDate = task.dueDate;

  var textMessage = "Você possuí uma tarefa para " + entityDesc + ": " + entity + " ";
  if (dueDate) {
    textMessage += "às " + moment(dueDate).format("DD/MM/YYYY hh:mm");
  }
  if (text) {
    textMessage += "\n Descrição:\n" + text;
  }
  return textMessage;
}
