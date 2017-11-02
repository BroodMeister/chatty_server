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

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');
  _increamentUser();

  ws.on('message', function incoming(message) {
    console.log('Receive:', message);
    let msg = JSON.parse(message);
    switch(msg.type) {
      case "postNotification":
        _postNotification(msg);
        break;
      case "postMessage":
        _postMessage(msg);
        break;
      default:
        console.error("Unknown event type " + msg.type);
    }
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    _decreamentUser();
  });
});

// Broadcast to everyone.
_broadcase = (msg) => {
  console.log('Broadcast:', msg);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

_increamentUser = () => {
  counter++;
  let newCount = {
    type: "incomingCounter",
    data: counter
  }
  _broadcase(JSON.stringify(newCount));
}

_decreamentUser = () => {
  counter--;
  let newCount = {
    type: "incomingCounter",
    data: counter
  }
  _broadcase(JSON.stringify(newCount));
}

_postNotification = (msg) => {
  let newNoti = {
    type: "incomingNotification",
    data: {
      id: uuid.va(),
      prevName: msg.data.prevName,
      newName: msg.data.newName
    }
  }
  _broadcase(JSON.stringify(newNoti));
}

_postMessage = (msg) => {
  let newMsg = {
    type: "incomingMessage",
    data: {
      id: uuid.v1(),
      username: msg.data.username,
      content: msg.data.content
    }
  };
  _broadcase(JSON.stringify(newMsg));
}