// server.js
const express       = require('express');
const WebSocket     = require('ws');
const SocketServer  = WebSocket.Server;
const uuid          = require('uuid');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

let counter = 0;
let totalColors = 4;

// A callback that will run when a client connects to the server.
// A client is represented by the ws parameter when they are assigned a socket.
wss.on('connection', (ws) => {
  console.log('Client connected');
  _increamentUser();

  ws.on('message', function incoming(message) {
    console.log('Receive:', message);
    let msg = JSON.parse(message);
    switch(msg.type) {
      case "postRegister":
        // Randomly generates a class name to display a username in a particular colour.
        ws.color = `name-${Math.floor(Math.random() * totalColors + 1)}`;
        break;
      case "postNotification":
        _incomingNotification(msg);
        break;
      case "postMessage":
        _incomingMessage(msg, ws.color);
        break;
      default:
        console.error("Unknown event type " + msg.type);
    }
  });

  // Sets up a callback in the event that the client closes the socket; usually meaning they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    _decreamentUser();
  });
});

// Broadcasts to everyone.
const _broadcase = (res) => {
  console.log('Broadcast:', res);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(res);
    }
  });
}

const _increamentUser = () => {
  counter++;
  let res = {
    type: "incomingCounter",
    data: counter
  }
  _broadcase(JSON.stringify(res));
}

const _decreamentUser = () => {
  counter--;
  let res = {
    type: "incomingCounter",
    data: counter
  }
  _broadcase(JSON.stringify(res));
}

const _incomingNotification = (msg) => {
  let res = {
    type: "incomingNotification",
    data: {
      id: uuid.v1(),
      prevName: msg.data.prevName,
      newName: msg.data.newName
    }
  }
  _broadcase(JSON.stringify(res));
}

const _incomingMessage = (msg, color) => {
  // Finds all strings that start with http:// or https://, and end with either .jpg, .png, or .gif
  let regExp = new RegExp(/https?:\/{2}\S+?\.(jpg|png|gif)/gi);
  let urls = msg.data.content.match(regExp);
  console.log(urls);
  msg .data.content = msg.data.content.replace(/[&<>"]/g, (tag) => {
    let chars = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&#34;',
      "'": '&#39;',
      ' ': '$nbsp;'
    };
    return chars[tag] || tag;
  });
  let res = {
    type: "incomingMessage",
    data: {
      id: uuid.v1(),
      username: msg.data.username,
      color: color
    }
  };
  if (urls) {
    msg.data.content = _parseURL(msg.data.content, urls);
  }
  res.data.content = msg.data.content;
  _broadcase(JSON.stringify(res));
}

const _parseURL = (content, urls) => {
  var regExp = new RegExp(urls.join('|'), 'gi');
  return content.replace(regExp, (chunk) => {
    if (chunk.match(regExp)) {
      return `<img src="${chunk}">`;
    }
  })
}