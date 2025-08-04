// worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim()); // Control clients immediately
});

self.addEventListener('message', (event) => {
  console.log('Received message from page:', event.data);
});

const API_DOMAIN = 'https://gps.dumbphoneapps.com'; // Replace with your real endpoint

function reportPosition(event) {
  let url = API_DOMAIN + "/share";
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.open("POST", url, true);
  xmlHttp.onload = handleShare;
  let payload = {
    lat: lat,
    lon: lon,
    id: uniqueId
  };
  xmlHttp.send(JSON.stringify(payload));
}
function handleShare(event) {
  let xmlHttp = event.target;
  if (xmlHttp.status != 200) {
    console.log(xmlHttp.status);
    while (sendToServerId.length > 0) {
      clearInterval(sendToServerId.pop());
    }
  }
}

const sendToServerId = [];
let lat = undefined;
let lon = undefined;
let uniqueId = undefined;

self.addEventListener('message', function (e) {
  const message = JSON.parse(e.data);
  if ("command" in message) {
    if (message.command == "start") {
      while (sendToServerId.length > 0) {
        clearInterval(sendToServerId.pop());
      }
      sendToServerId.push(setInterval(reportPosition, 5000));
    } else if (message.command == "stop") {
      while (sendToServerId.length > 0) {
        clearInterval(sendToServerId.pop());
      }
    }
  } else if ("lat" in message && "lon" in message && "id" in message) {
    lat = message.lat;
    lon = message.lon;
    uniqueId = message.id;
  }
});
