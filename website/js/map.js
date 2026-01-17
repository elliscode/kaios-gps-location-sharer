// prettier-ignore
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
  key: apiKey,
  v: "weekly",
});

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  map = new Map(document.getElementById("map"), {
    center: { lat: 0, lng: 0 },
    zoom: 1,
    streetViewControl: false,
    mapTypeControl: false,
    mapId: 'GPS_SHARER'
  });
  marker = new AdvancedMarkerElement({ map: map });
  moveMarker();
}

let initialMove = true;

moveMarker = function () {
  var myLatLng = new google.maps.LatLng(lat, lon);
  marker.position = myLatLng;
  map.panTo(myLatLng);
  if (initialMove) {
    map.setZoom(16);
    initialMove = false;
  }
};

initMap();
