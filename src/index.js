// kaios simulator testing
function mockMethod(thisFunction) {
  thisFunction({coords: {longitude: (70 + Math.random()), latitude: (40 + Math.random())}});
}
const navigator = { geolocation: { watchPosition: function(success, failure, options) {
  return setInterval(mockMethod, 500, success);
}, clearWatch: function(x) { clearInterval(x); }} }

const toggleElement = document.getElementById('toggle');
const lonElement = document.getElementById('lon');
const latElement = document.getElementById('lat');
const smsLiveElement = document.getElementById('sms-live');
const smsMapsElement = document.getElementById('sms-maps');

let watchId = undefined;
let lat = undefined;
let lon = undefined;

function getAllElements() {
  return Array.from(document.querySelectorAll('[nav-selectable="true"]'));
}
function interact(event) {
  event.target.click();
}
function options(event) {

}
function navigate(event) {
  const allElements = getAllElements();
  const direction = event.key == 'ArrowDown' ? 1 : -1;
  let currentIndex = allElements.findIndex(function(x) {
    return x == event.target;
  });
  if (currentIndex < 0) {
    currentIndex = 0;
  }
  const desiredIndex = (currentIndex + direction + allElements.length) % allElements.length;
  if (desiredIndex == 0) {
    window.scrollTo({top: 0});
  } else {
    const rect = allElements[desiredIndex].getBoundingClientRect();
    const diff = (rect.y + 80) - window.innerHeight;
    console.log(rect.y);
    console.log(window.innerHeight);
    if (diff > 0) {
      window.scrollBy({top: diff});
    }
  }
  allElements[desiredIndex].focus();
}
function controlsListener(event) {
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      return navigate(event);
    case "ArrowUp":
      event.preventDefault();
      return navigate(event);
    case "Enter":
      event.preventDefault();
      return interact(event);
    case "SoftRight":
      event.preventDefault();
      return options(event);
    default:
      return;
  }
}
function toggleButtonCallback(event) {
  if (watchId) {
    toggleElement.innerText = 'Enable Location';
    navigator.geolocation.clearWatch(watchId);
    smsLiveElement.setAttribute('nav-selectable', 'false');
    smsMapsElement.setAttribute('nav-selectable', 'false');
    latElement.innerText = '';
    lonElement.innerText = '';
    watchId = undefined;
  } else {
    watchId = navigator.geolocation.watchPosition(showPosition, displayError, {timeout: 30 * 1000});
  }
}
function showPosition(position) {
  toggleElement.innerText = 'Disable Location';
  smsLiveElement.setAttribute('nav-selectable', 'true');
  smsMapsElement.setAttribute('nav-selectable', 'true');
  lat = position.coords.latitude;
  lon = position.coords.longitude;
  latElement.innerText = lat;
  lonElement.innerText = lon;
}
function displayError() {
  showDialog('Geolocation Error', 'Could not fetch device location, ensure Location Services are enabled in Settings');
  navigator.geolocation.clearWatch(watchId);
  smsLiveElement.setAttribute('nav-selectable', 'false');
  smsMapsElement.setAttribute('nav-selectable', 'false');
  latElement.innerText = '';
  lonElement.innerText = '';
  watchId = undefined;
}
function showDialog(title, text) {
  let modalBg = document.createElement('div');
  modalBg.classList.add('dialog-bg');
}
function sendMapsLinkSms(event) {
}
function sendMapsLinkSms(event) {
  const smsLink = document.createElement('a');
  let coordsString = `${lat},${lon}`;
  let googleUrl = "https://www.google.com/maps/search/?api=1&query=" + coordsString;
  smsLink.href = "sms://?&body=" + encodeURIComponent(googleUrl);
  smsLink.click();
}
document.addEventListener("keydown", controlsListener);
smsLiveElement.addEventListener("click", sendLiveLinkSms);
smsMapsElement.addEventListener("click", sendMapsLinkSms);
toggleElement.addEventListener('click', toggleButtonCallback);
{
  const firstElement = document.querySelectorAll("[nav-selectable]")[0];
  firstElement.focus();
}