// // kaios simulator testing
// function mockMethod(thisFunction) {
//   thisFunction({ coords: { longitude: (70 + Math.random()), latitude: (40 + Math.random()) } });
// }
// const navigator = {
//   geolocation: {
//     watchPosition: function (success, failure, options) {
//       return setInterval(mockMethod, 500, success);
//     }, clearWatch: function (x) { clearInterval(x); }
//   }
// }

const LOCAL_STORAGE_ID = 'gps-location-sharer-unique-id';
const UI_DOMAIN = 'https://www.dumbphoneapps.com';
const API_DOMAIN = 'https://gps.dumbphoneapps.com';
const toggleElement = document.getElementById('toggle');
const mainUi = document.getElementById('main-ui');
const helpUi = document.getElementById('help-ui');
const settingsUi = document.getElementById('settings-ui');
const helpElement = document.getElementById('help');
const lonElement = document.getElementById('lon');
const latElement = document.getElementById('lat');
const uniqueIdElement = document.getElementById('unique-id');
const newIdElement = document.getElementById('new-id');
const smsLiveElement = document.getElementById('sms-live');
// const smsMapsElement = document.getElementById('sms-maps');
const leftElement = document.getElementById('left');
const centerElement = document.getElementById('center');
const rightElement = document.getElementById('right');
const settingsExitElement = document.getElementById('settings-exit');
const watchId = [];
const sendToServerId = [];
const dialogs = [];
const scrollIntervals = [];
const adsIntervals = [];

let lat = undefined;
let lon = undefined;
let globalInteractTimer = new Date();
let uniqueId = undefined;

function getAllElements() {
  return Array.from(document.querySelectorAll('[active="true"]>[nav-selectable="true"]'));
}
function selectFirstElement() {
  const allElements = getAllElements();
  if (allElements.length > 0) {
    allElements[0].focus();
  }
}
function interact(event) {
  if (centerElement.innerText == 'OKAY') {
    closeDialogs();
    setSoftkeys('', 'SELECT', 'Options');
    showPanel(mainUi);
  } else {
    event.target.click();
  }
}
function showPanel(panel) {
  const panels = Array.from(document.getElementsByClassName('panel'));
  panels.forEach(function (x) {
    x.setAttribute('active', 'false');
  });
  panel.setAttribute('active', 'true');
  window.scrollTo({ top: 0 });
  selectFirstElement();
}
function setSoftkeys(left, center, right) {
  leftElement.innerText = left ? left : '';
  centerElement.innerText = center ? center : '';
  rightElement.innerText = right ? right : '';
}
function navigate(event, allElements) {
  const direction = event.key == 'ArrowDown' ? 1 : -1;
  let currentIndex = allElements.findIndex(function (x) {
    return x == event.target;
  });
  if (currentIndex < 0) {
    currentIndex = 0;
  }
  const desiredIndex = (currentIndex + direction + allElements.length) % allElements.length;
  if (desiredIndex == 0) {
    window.scrollTo({ top: 0 });
  } else {
    const rect = allElements[desiredIndex].getBoundingClientRect();
    const diff = (rect.y + 80) - window.innerHeight;
    console.log(rect.y);
    console.log(window.innerHeight);
    if (diff > 0) {
      window.scrollBy({ top: diff });
    }
  }
  allElements[desiredIndex].focus();
}
function handleScroll(event) {
  if (event.type == 'keydown' && scrollIntervals.length <= 0) {
    actuallyScroll(event);
    scrollIntervals.push(setInterval(actuallyScroll, 200, event));
  } else if (event.type == 'keyup') {
    while (scrollIntervals.length > 0) {
      clearInterval(scrollIntervals.pop());
    }
  }
}
function actuallyScroll(event) {
  const direction = event.key == 'ArrowDown' ? 1 : -1;
  window.scrollBy({ top: direction * 60, behavior: "smooth" });
}
function controlsListener(event) {
  const allElements = getAllElements();
  if (allElements.length <= 0 && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
    handleScroll(event);
  } else if (event.type == 'keydown') {
    if (allElements.length > 0 && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      navigate(event, allElements);
    } else {
      const currentDate = new Date();
      if (currentDate - globalInteractTimer < 250) {
        return;
      }
      globalInteractTimer = currentDate;

      if (['Enter'].includes(event.key)) {
        event.preventDefault();
        interact(event);
      } else if (["SoftLeft", "Backspace"].includes(event.key)) {
        closeDialogs();
        showPanel(mainUi);
        setSoftkeys('', 'SELECT', 'Options');
      } else if (["SoftRight"].includes(event.key)) {
        closeDialogs();
        if (rightElement.innerText == 'Options') {
          uniqueIdElement.innerText = uniqueId;
          showPanel(settingsUi);
          setSoftkeys('Back', 'SELECT', 'Done');
        } else {
          showPanel(mainUi);
          setSoftkeys('', 'SELECT', 'Options');
        }
      } else if (["2"].includes(event.key)) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (["0"].includes(event.key)) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }
  }
}
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
function toggleButtonCallback(event) {
  if (watchId.length > 0) {
    toggleElement.innerText = 'Share Location Data';
    while (watchId.length > 0) {
      navigator.geolocation.clearWatch(watchId.pop());
    }
    while (sendToServerId.length > 0) {
      clearInterval(sendToServerId.pop());
    }
    smsLiveElement.setAttribute('nav-selectable', 'false');
    // smsMapsElement.setAttribute('nav-selectable', 'false');
    latElement.innerText = '';
    lonElement.innerText = '';
  } else {
    watchId.push(navigator.geolocation.watchPosition(showPosition, displayError, { timeout: 30 * 1000 }));
    sendToServerId.push(setInterval(reportPosition, 5000))
  }
}
function showPosition(position) {
  toggleElement.innerText = 'Stop Sharing Location';
  smsLiveElement.setAttribute('nav-selectable', 'true');
  // smsMapsElement.setAttribute('nav-selectable', 'true');
  lat = position.coords.latitude;
  lon = position.coords.longitude;
  latElement.innerText = lat;
  lonElement.innerText = lon;
}
function displayError() {
  showDialog('Geolocation Error', 'Could not fetch device location, ensure Location Services are enabled in Settings');
  while (watchId.length > 0) {
    navigator.geolocation.clearWatch(watchId.pop());
  }
  while (sendToServerId.length > 0) {
    clearInterval(sendToServerId.pop());
  }
  smsLiveElement.setAttribute('nav-selectable', 'false');
  // smsMapsElement.setAttribute('nav-selectable', 'false');
  latElement.innerText = '';
  lonElement.innerText = '';
}
function closeDialogs() {
  while (dialogs.length > 0) {
    dialogs.pop().remove();
  }
}
function showDialog(title, text) {
  closeDialogs();
  setSoftkeys('Back', 'OKAY', 'Done');
  let modalBg = document.createElement('div');
  modalBg.classList.add('dialog-bg');
  dialogs.push(modalBg);
  let modal = document.createElement('div');
  modal.classList.add('dialog');
  let header = document.createElement('div');
  header.classList.add('title');
  header.innerText = title;
  modal.appendChild(header);
  let body = document.createElement('div');
  body.classList.add('body');
  body.innerText = text;
  modal.appendChild(body);
  modalBg.appendChild(modal);
  document.body.appendChild(modalBg);
}
function sendMapsLinkSms(event) {
  const smsLink = document.createElement('a');
  let coordsString = `${lat},${lon}`;
  let googleUrl = "https://www.google.com/maps/search/?api=1&query=" + coordsString;
  smsLink.href = "sms://?&body=" + encodeURIComponent(googleUrl);
  smsLink.click();
}
function sendLiveLinkSms(event) {
  const smsLink = document.createElement('a');
  smsLink.href = "sms://?&body=" + encodeURIComponent("I'm sharing my location: " + UI_DOMAIN.substring(8) + "/lv/?id=" + uniqueId);
  smsLink.click();
}
function showHelp(event) {
  setSoftkeys('Back', 'OKAY', 'Done');
  showPanel(helpUi);
}
function generateCharacterArray() {
  const characters = [];
  for (let i = 0; i <= 9; i++) {
    characters.push(i.toString());
  }
  for (let i = 97; i <= 122; i++) {
    characters.push(String.fromCharCode(i));
  }
  for (let i = 65; i <= 90; i++) {
    characters.push(String.fromCharCode(i));
  }
  return characters;
}
function getLocalStorage() {
  return localStorage.getItem(LOCAL_STORAGE_ID);
}
function setLocalStorage(value) {
  localStorage.setItem(LOCAL_STORAGE_ID, value);
}
function generateNewId() {
  let output = '';
  const characters = generateCharacterArray();
  for (let i = 0; i < 10; i++) {
    let i = Math.floor(Math.random() * 62);
    output += characters[i];
  }
  return output;
}
function getUniqueId() {
  let output = getLocalStorage();
  if (!/[0-9a-f]{32}/.exec(output)) {
    output = generateNewId();
    setLocalStorage(output);
  }
  return output;
}
function generateNewIdUi() {
  uniqueId = getUniqueId();
  uniqueIdElement.innerText = uniqueId;
}
uniqueId = getUniqueId();
document.addEventListener("keydown", controlsListener);
document.addEventListener("keyup", controlsListener);
smsLiveElement.addEventListener("click", sendLiveLinkSms);
// smsMapsElement.addEventListener("click", sendMapsLinkSms);
toggleElement.addEventListener("click", toggleButtonCallback);
helpElement.addEventListener("click", showHelp);
newIdElement.addEventListener("click", generateNewIdUi);
settingsExitElement.addEventListener("click", function (event) {
  closeDialogs();
  showPanel(mainUi);
  setSoftkeys('', 'SELECT', 'Options');
});
{
  const firstElement = document.querySelectorAll("[nav-selectable]")[0];
  firstElement.focus();
}
function displayAd() {
    getKaiAd({
      publisher: '91b81d86-37cf-4a2f-a895-111efa5b36bb',
      app: 'gpslocationsharer',
      slot: 'containerad',
      w: 240,
      h: 60,
	    container: document.getElementById('ad-container'),
      onerror: function (err) {
        showDialog('Ad Display Error', 'Could not display ad ' + err.toString());
      },
      onready: function (ad) {
        ad.call('display')
      }
    });
  }
document.addEventListener("DOMContentLoaded", function () {
<<<<<<< Updated upstream
  adsIntervals.push(setInterval(displayAd, 60 * 1000));
=======
  getKaiAd({
    publisher: '91b81d86-37cf-4a2f-a895-111efa5b36bb',
    app: 'gpslocationsharer',
    slot: 'fullscreenad',
    onerror: function (err) {
      showDialog('Ad Display Error', 'Could not display ad ' + err.toString());
    },
    onready: function (ad) {
        // user clicked the ad
        ad.on("click", function () {
          open_options();
        });

        // user closed the ad (currently only with fullscreen)
        ad.on("close", function () { console.log("close event"); });

        // the ad succesfully displayed
        ad.on("display", () => console.log("display event"));

        // Ad is ready to be displayed
        // calling 'display' will display the ad
        ad.call("display", {
          navClass: "item",
          tabindex: 9,
          display: "block",
        });
    }
  });
>>>>>>> Stashed changes
});