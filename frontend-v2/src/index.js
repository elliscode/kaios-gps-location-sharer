// // kaios simulator testing
// let mockDelayCounter = 0;
// function mockMethod(thisFunction) {
//   if (mockDelayCounter++ > 10) {
//     thisFunction({ coords: { longitude: (70 + Math.random()), latitude: (40 + Math.random()) } });
//   }
// }
// navigator.geolocation.watchPosition = function (success, failure, options) {
//   mockDelayCounter = 0;
//   return setInterval(mockMethod, 500, success);
// };
// navigator.geolocation.clearWatch = function (x) { clearInterval(x); }

const LOCAL_STORAGE_ID = 'gps-location-sharer-unique-id';
const UI_DOMAIN = 'https://www.dumbphoneapps.com';
const API_DOMAIN = 'https://gpsv3.dumbphoneapps.com';
const ID_REGEX = /^[0-9a-zA-Z]{10}$/;
const characters = '0123456789bcdfjlmpqrstwxzBCDFJLMPQRSTWXZ';
const toggleElement = document.getElementById('toggle');
const mainUi = document.getElementById('main-ui');
const helpUi = document.getElementById('help-ui');
const settingsUi = document.getElementById('settings-ui');
const helpElement = document.getElementById('help');
const coordsElement = document.getElementById('coords');
const uniqueIdElement = document.getElementById('unique-id');
const newIdElement = document.getElementById('new-id');
const smsLiveElement = document.getElementById('sms-live');
const smsMapsElement = document.getElementById('sms-maps');
const leftElement = document.getElementById('left');
const centerElement = document.getElementById('center');
const rightElement = document.getElementById('right');
const settingsExitElement = document.getElementById('settings-exit');
const freqButtons = [].slice.call(document.querySelectorAll(`button[freq]`));
const lengthButtons = [].slice.call(document.querySelectorAll(`button[length]`));
const watchId = [];
const dialogs = [];
const scrollIntervals = [];
const adsIntervals = [];
const wakeLocks = [];

let lat = undefined;
let lon = undefined;
let globalInteractTimer = new Date(0);
let globalSendDataTimer = new Date(0);
let startTime = new Date();

function getAllElements() {
  var a = document.querySelectorAll('[active="true"] [nav-selectable="true"]');
  var b = document.querySelectorAll('[active="true"] .nav-selectable-ad');
  return Array.prototype.concat.call([], a, b);
}
function findIndex(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i])) return i;
  }
  return -1;
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
  const panels = [].slice.call(document.getElementsByClassName('panel'));
  panels.forEach(function (x) {
    x.setAttribute('active', 'false');
  });
  panel.setAttribute('active', 'true');
  window.scrollTo(0, 0);
  selectFirstElement();
}
function setSoftkeys(left, center, right) {
  leftElement.innerText = left ? left : '';
  centerElement.innerText = center ? center : '';
  rightElement.innerText = right ? right : '';
}
function navigate(event, allElements) {
  if (['ArrowLeft', 'ArrowRight'].indexOf(event.key) !== -1 && event.target.hasAttribute('horz-selectable-group')) {
    const horzGroupName = event.target.getAttribute('horz-selectable-group');
    const horzElements = [].slice.call(document.querySelectorAll(`[active="true"] [horz-selectable-group="${horzGroupName}"]`));
    const direction = event.key == 'ArrowRight' ? 1 : -1;
    let currentIndex = findIndex(horzElements, function (x) {
      return x == event.target;
    });
    if (currentIndex < 0) {
      currentIndex = 0;
    }
    const desiredIndex = (currentIndex + direction + horzElements.length) % horzElements.length;
    horzElements[desiredIndex].focus();
  } else if (['ArrowUp', 'ArrowDown'].indexOf(event.key) !== -1) {
    const direction = event.key == 'ArrowDown' ? 1 : -1;
    let currentIndex = findIndex(allElements, function (x) {
      return x == getNavSelectableParent(event.target);
    });
    if (currentIndex < 0) {
      currentIndex = 0;
    }
    const desiredIndex = (currentIndex + direction + allElements.length) % allElements.length;
    if (desiredIndex == 0) {
      window.scrollTo(0, 0);
    } else {
      const rect = allElements[desiredIndex].getBoundingClientRect();
      const diff = (rect.y + 80) - window.innerHeight;
      if (diff > 0) {
        window.scrollBy(0, diff);
      }
    }
    var el = findFocusableElement(allElements[desiredIndex]);
    if (el && el.focus) {
      el.focus();
    }
  }
}
function getNavSelectableParent(element) {
  let output = element;
  while (output) {
    if (output.hasAttribute('nav-selectable') || output.classList.contains('nav-selectable-ad')) {
      return output;
    }
    output = output.parentElement;
  }
  return output;
}
function findFocusableElement(element) {
  if ((element.tagName.toLower() == 'button' && element.getAttribute('nav-selectable') == "true") || 
      element.classList.contains('nav-selectable-ad')) {
    return element;
  }
  return element.querySelector(`button[nav-selectable="true"], button[horz-selectable-group]`);
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
  window.scrollBy(0, direction * 60);
}
function controlsListener(event) {
  const allElements = getAllElements();
  if (allElements.length <= 0 && ['ArrowDown', 'ArrowUp'].indexOf(event.key) !== -1) {
    handleScroll(event);
  } else if (event.type == 'keydown') {
    if (allElements.length > 0 && ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].indexOf(event.key) !== -1) {
      event.preventDefault();
      navigate(event, allElements);
    } else {
      const currentDate = new Date();
      if (currentDate - globalInteractTimer < 250) {
        return;
      }
      globalInteractTimer = currentDate;

      if (['Enter'].indexOf(event.key) !== -1) {
        event.preventDefault();
        interact(event);
      } else if (["SoftLeft", "Backspace"].indexOf(event.key) !== -1) {
        closeDialogs();
        showPanel(mainUi);
        setSoftkeys('', 'SELECT', 'Options');
      } else if (["SoftRight"].indexOf(event.key) !== -1) {
        closeDialogs();
        if (rightElement.innerText == 'Options') {
          showPanel(settingsUi);
          setSoftkeys('Back', 'SELECT', 'Done');
        } else {
          showPanel(mainUi);
          setSoftkeys('', 'SELECT', 'Options');
        }
      } else if (["2"].indexOf(event.key) !== -1) {
        window.scrollTo(0, 0);
      } else if (["0"].indexOf(event.key) !== -1) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    }
  }
}
function clearIntervals() {
  while (watchId.length > 0) {
    navigator.geolocation.clearWatch(watchId.pop());
  }
  while (wakeLocks.length > 0) {
    try {
      wakeLocks.pop().unlock();
    } catch (e) {
      // dont care
    }
  }
}
function setUiBasedOnCurrentStatus(statusOverride) {
  if (statusOverride == 'stop-sharing') {
    coordsElement.innerText = '';
    toggleElement.innerText = 'Share Location Data';
    toggleElement.setAttribute('nav-selectable', 'true');
    smsLiveElement.setAttribute('nav-selectable', 'false');
    smsMapsElement.setAttribute('nav-selectable', 'false');
  } else if (statusOverride == 'awaiting-location') {
    toggleElement.setAttribute('nav-selectable', 'false');
    toggleElement.blur();
    coordsElement.innerText = 'Getting GPS, please wait...';
  } else if (statusOverride == 'active-location') {
    toggleElement.innerText = 'Stop Sharing Location';
    smsLiveElement.focus();
    toggleElement.setAttribute('nav-selectable', 'true');
    smsLiveElement.setAttribute('nav-selectable', 'true');
    smsMapsElement.setAttribute('nav-selectable', 'true');
  }
}
function stopSharingLocation() {
  clearIntervals();
  setUiBasedOnCurrentStatus('stop-sharing');
}
function toggleButtonCallback(event) {
  if (watchId.length > 0) {
    stopSharingLocation();
  } else {
    startTime = new Date();
    if (navigator && navigator.requestWakeLock) {
      try {
        wakeLocks.push(navigator.requestWakeLock('gps'));
      } catch (e) {
        // dont care
      }
    }
    watchId.push(navigator.geolocation.watchPosition(showPosition, displayError, { timeout: 60 * 1000 }));
    setUiBasedOnCurrentStatus('awaiting-location');
  }
}
function showPosition(position) {
  let localStorageData = getLocalStorage();
  let currentTime = new Date();
  if (currentTime - startTime > localStorageData.length * 60 * 1000) {
    showDialog("Sharing stopped", `Sharing stopped due to ${localStorageData.length} minute time limit being reached, please press "Share Location Data" if you wish to continue`);
    stopSharingLocation();
    return;
  }
  if (toggleElement.innerText != 'Stop Sharing Location') {
    setUiBasedOnCurrentStatus('active-location');
  }
  lat = position.coords.latitude;
  lon = position.coords.longitude;
  const currentDate = new Date();
  if (lat && lon && (currentDate - globalSendDataTimer > localStorageData.freq * 1000)) {
    reportPosition();
    globalSendDataTimer = currentDate;
  }
  coordsElement.innerText = lat.toFixed(5) + ', ' + lon.toFixed(5);
}
function reportPosition() {
  let localStorageData = getLocalStorage();
  const url = API_DOMAIN + "/share";
  const payload = {
    lat: lat,
    lon: lon,
    id: localStorageData.id
  };
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.open("POST", url, true);
  xmlHttp.onload = handleResponse;
  xmlHttp.send(JSON.stringify(payload));
}

function handleResponse(event) {
  const response = event.target;
  if (response.status === 429) {
    showDialog("Sharing stopped", 'Sharing stopped due to too many requests, please try again later.');
    stopSharingLocation();
  }
}

function displayError() {
  showDialog('Geolocation Error', 'Could not fetch device location, ensure Location Services are enabled in Settings');
  clearIntervals();
  setUiBasedOnCurrentStatus('stop-sharing');
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
  let coordsString = lat.toFixed(5) + ', ' + lon.toFixed(5);
  let googleUrl = "https://www.google.com/maps/search/?api=1&query=" + coordsString;
  smsLink.href = "sms://?&body=" + encodeURIComponent(googleUrl);
  smsLink.click();
}
function sendLiveLinkSms(event) {
  let localStorageData = getLocalStorage();
  const smsLink = document.createElement('a');
  smsLink.href = "sms://?&body=" + encodeURIComponent("I'm sharing my location: " + UI_DOMAIN.substring(8) + "/lv/?id=" + localStorageData.id);
  smsLink.click();
}
function showHelp(event) {
  setSoftkeys('Back', 'OKAY', 'Done');
  showPanel(helpUi);
}
function getLocalStorage() {
  let output = { id: generateNewId(), freq: 30, length: 15 };
  let saveStorage = true;
  try {
    const stringValue = localStorage.getItem(LOCAL_STORAGE_ID);
    if (ID_REGEX.exec(stringValue)) {
      output = { id: stringValue, freq: 30, length: 15 };
    } else if (stringValue) {
      let temp = JSON.parse(stringValue);
      if (!(temp.freq && temp.id && temp.length)) {
        throw Error("localStorage is missing fields");
      }
      output = temp;
      saveStorage = false;
    }
  } catch (e) {
    // dont care
  }
  if (saveStorage) {
    localStorage.setItem(LOCAL_STORAGE_ID, JSON.stringify(output));
  }
  return output;
}
function setGuiBasedOnLocalStorage() {
  let value = getLocalStorage();
  uniqueIdElement.innerText = value.id;
  freqButtons.forEach(function (button) { button.classList.remove('selected'); });
  lengthButtons.forEach(function (button) { button.classList.remove('selected'); });
  document.querySelector(`button[freq="${value.freq}"]`).classList.add('selected');
  document.querySelector(`button[length="${value.length}"]`).classList.add('selected');
}
function setLocalStorage(value) {
  let fullValue = getLocalStorage();
  if (value.id) {
    fullValue.id = value.id;
  }
  if (value.freq) {
    fullValue.freq = value.freq;
  }
  if (value.length) {
    fullValue.length = value.length;
  }
  localStorage.setItem(LOCAL_STORAGE_ID, JSON.stringify(fullValue));
}
function generateNewId() {
  let output = '';
  for (let j = 0; j < 10; j++) {
    let i = Math.floor(Math.random() * characters.length);
    output += characters[i];
  }
  return output;
}
function getUniqueId() {
  let output = getLocalStorage();
  setGuiBasedOnLocalStorage();
  return output.id;
}
function generateNewIdUi() {
  setLocalStorage({id: generateNewId()});
  setGuiBasedOnLocalStorage();
  let localStorageData = getLocalStorage();
  uniqueIdElement.innerText = localStorageData.id;
}
function setFreq(event) {
  const value = parseInt(event.target.getAttribute('freq'));
  setLocalStorage({freq: value});
  setGuiBasedOnLocalStorage();
}
function setLength(event) {
  const value = parseInt(event.target.getAttribute('length'));
  setLocalStorage({length: value});
  setGuiBasedOnLocalStorage();
}
document.addEventListener("keydown", controlsListener);
document.addEventListener("keyup", controlsListener);
smsLiveElement.addEventListener("click", sendLiveLinkSms);
smsMapsElement.addEventListener("click", sendMapsLinkSms);
toggleElement.addEventListener("click", toggleButtonCallback);
helpElement.addEventListener("click", showHelp);
newIdElement.addEventListener("click", generateNewIdUi);
freqButtons.forEach(function(button) { button.addEventListener("click", setFreq); });
lengthButtons.forEach(function(button) { button.addEventListener("click", setLength); });
settingsExitElement.addEventListener("click", function (event) {
  closeDialogs();
  showPanel(mainUi);
  setSoftkeys('', 'SELECT', 'Options');
});
{
  const firstElement = document.querySelectorAll("[nav-selectable]")[0];
  if (firstElement) {
    firstElement.focus();
  }
}
function displayAd() {
  let oldAds = [].slice.call(document.querySelectorAll('.nav-selectable-ad'));
  for (let i = 0; i < oldAds.length; i++) {
    if (oldAds[i].parentNode) {
      oldAds[i].parentNode.removeChild(oldAds[i]);
    }
  }
  getKaiAd({
    publisher: '91b81d86-37cf-4a2f-a895-111efa5b36bb',
    app: 'gpslocationsharer',
    slot: 'topbarad',

    h: 60,
    w: 240,

    // Max supported size is 240x264
    // container is required for responsive ads
    container: document.getElementById('ad-container'),
    onerror: function (err) {
      console.log('Ad Display Error', 'Could not display ad');
    },
    onready: function (ad) {

      // Ad is ready to be displayed
      // calling 'display' will display the ad
      ad.call('display', {

        // In KaiOS the app developer is responsible
        // for user navigation, and can provide
        // navigational className and/or a tabindex
        tabindex: -1,

        // if the application is using
        // a classname to navigate
        // this classname will be applied
        // to the container
        navClass: 'nav-selectable-ad',

        // display style will be applied
        // to the container block or inline-block
        display: 'block',
      })
    }
  });
}
document.addEventListener("DOMContentLoaded", function () {
  while (adsIntervals.length > 0) {
    clearInterval(adsIntervals.pop());
  }
  adsIntervals.push(setInterval(displayAd, 300 * 1000));
  displayAd();
});
window.addEventListener("focus", function() {
  let status = 'stop-sharing';
  if (watchId.length > 0) {
    status = 'active-location';
  }
  setUiBasedOnCurrentStatus(status);
});
getLocalStorage();
setGuiBasedOnLocalStorage();