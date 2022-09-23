// ==UserScript==
// @name         Better GeoGuessr map maker v1.6
// @namespace    GeoGuessr scripts
// @version      1.6
// @description  Choose which street view year to show on your map.
// @author       echandler
// @match        https://www.geoguessr.com/map-maker/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @downloadURL  https://github.com/echandler/PanoID-for-Geoguessr-map-maker/raw/main/betterGeoGuessrMapMaker.user.js
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`.betterMapMaker {display: none; position: absolute;font-family: var(--font-neo-sans); background: linear-gradient(155deg, rgba(0, 212, 255, 0.6) 0%, rgba(9, 9, 121, 0.6) 35%, rgba(0, 212, 255, 0.6) 100%); padding: 10px; z-index:1000; border-radius:5px;cursor: all-scroll;} `);
GM_addStyle(`select#panoIds:focus-visible { outline: none; } select#panoIds:focus {background-color: white !Important;}`);

let months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let isActive = false;

const mutationCallback = function (mutationsList, observer) {
     for (let mutation of mutationsList) {
          if (mutation.type === "childList") {
               let el = mutation.addedNodes[0];
               if (el && el.tagName === "SCRIPT" && /maps/.test(el.src)) {
                    observer.disconnect();

                    el.addEventListener("load", function () {
                         isActive = true;
                         unsafeWindow.modify_proto_setPano();
                         makeUI();
                         showLoadMsg();
                    });
               }
          }
     }
};

const targetNode = document.head;
const config = { childList: true, subtree: true };

const observer = new MutationObserver(mutationCallback);
observer.observe(targetNode, config);

let urlChangeDetector = setInterval(function () {
     let el = document.getElementById("betterMapMaker_body");
     if (!el) return;

     if (!/map-maker/.test(location.href)) {
          isActive = false;
          el.style.display = "none";
          return;
     }

     isActive = true;
     el.style.display = "block";
}, 1000);

unsafeWindow.modify_proto_setPano = function (msg) {
     let googleMap = google.maps.Map;
     let setPano = google.maps.StreetViewPanorama.prototype.setPano;

     google.maps.StreetViewPanorama.prototype.setPano = function (panoID) {
          unsafeWindow.newSV = this;

          let that = this;

          let ret = setPano.apply(this, arguments);

          if (isActive === false) {
               return ret;
          }

          setTimeout(async function () {
               // Have to wait for the that.location.latLng to update.

               let SVS = new google.maps.StreetViewService();
               let data1 = await SVS.getPanorama({ location: { lat: that.location.latLng.lat(), lng: that.location.latLng.lng() }, radius: 50 });
               // SVS.getPanorama({pano:panoID, radius: 50} )

               let keys = Object.keys(data1);
               console.log(data1, keys);

               let panoIds = document.getElementById("panoIds");

               let p = that.location.pano;

               panoIds.innerHTML = "";

               let option = document.createElement("option");
               option.value = panoID;
               option.innerHTML = "&nbsp;Current Pano ID = " + panoID + "&nbsp;";
               option.selected = true;
               panoIds.appendChild(option);

               for (var n = 0; n < data1.data.time.length; n++) {
                    let d = new Date(data1.data.time[n].wn);
                    let option = document.createElement("option");
                    option.style.paddingLeft = "1em";
                    option.value = data1.data.time[n].pano;
                    option.innerHTML = "&nbsp;" + months[d.getMonth()] + "&nbsp;" + d.getFullYear();
                    option.title = option.value;
                    if (option.value === panoID) {
                         option.selected = true;
                    }
                    console.log(data1.data.time[n].pano, that.location.pano);
                    panoIds.appendChild(option);
               }
          }, 500);

          return ret;
     };
};

function makeUI() {
     let bodyXY = localStorage["geoBetterMapMakerCoords"] ? JSON.parse(localStorage["geoBetterMapMakerCoords"]) : { x: 1, y: 1 };
     let dce = document.createElement.bind(document);

     let body = dce("div");
     body.id = "betterMapMaker_body";
     body.className = "betterMapMaker";
     body.style.top = bodyXY.y + "%";
     body.style.left = bodyXY.x + "%";

     let panoIds = dce("select");
     panoIds.id = "panoIds";
     panoIds.style.cssText = "width:12em;height: 25px; border-radius: 10px; cursor: pointer; background-color: rgb(230,230, 230);";
     panoIds.addEventListener("change", function (e) {
          let val = this.value;
          let sv = unsafeWindow.newSV;

          sv.setPano(this.value);

          setTimeout(() => {
               this.value = val;
          }, 10);
     });

     body.appendChild(panoIds);

     let save = dce("button");
     save.style.cssText = "margin-left: 10px; height:25px;border:0px; border-radius: 10px; cursor: pointer;";
     save.innerText = "Save & Reload";

     save.addEventListener("click", function (e) {
          saveData();
          save.style.backgroundColor = "rebeccapurple";
          setTimeout(() => {
               this.style.backgroundColor = "";
          }, 100);
     });

     body.appendChild(save);
     document.body.appendChild(body);

     body.addEventListener("mousedown", function (e) {
          if (e.target != this) return;

          document.body.addEventListener("mousemove", mmove);
          document.body.addEventListener("mouseup", mup);
          let _y = document.body.clientHeight * (bodyXY.y / 100);
          let _x = document.body.clientWidth * (bodyXY.x / 100);

          let yy = _y - e.y;
          let xx = e.x - _x;

          function mmove(evt) {
               if (Math.abs(evt.x - e.x) > 2 || Math.abs(evt.y - e.y) > 2) {
                    document.body.removeEventListener("mousemove", mmove);
                    document.body.addEventListener("mousemove", _mmove);
               }
          }

          function _mmove(evt) {
               body.style.top = evt.y + yy + "px";
               body.style.left = evt.x - xx + "px";
          }

          function mup(evt) {
               document.body.removeEventListener("mousemove", mmove);
               document.body.removeEventListener("mousemove", _mmove);
               document.body.removeEventListener("mouseup", mup);

               bodyXY.y = ((evt.y + yy) / document.body.clientHeight) * 100;
               bodyXY.x = ((evt.x - xx) / document.body.clientWidth) * 100;

               body.style.top = bodyXY.y + "%";
               body.style.left = bodyXY.x + "%";

               localStorage["geoBetterMapMakerCoords"] = JSON.stringify(bodyXY);
          }
     });
}

async function saveData() {
     let cData = await getExistingMapData();
     let coords = cData.customCoordinates;
     let y = unsafeWindow.newSV.location.latLng.lat();
     let x = unsafeWindow.newSV.location.latLng.lng();
     let found = false;
     let curID = document.getElementById("panoIds").value;
     let pov = unsafeWindow.newSV.getPov();

     for (let n = 0; n < coords.length; n++) {
          if (y === coords[n].lat && x === coords[n].lng) {
               coords[n].panoId = curID;
               //  coords[n].heading = pov.heading;
               //  coords[n].pitch = pov.pitch;
               //  coords[n].zoom = pov.zoom;
               found = true;
               break;
          }
     }

     if (found === false) {
          alert("Couldn't find location coordinates in map data. Please save location and try again.");
          return;
     }

     updateMap(cData, function () {/*Function that does nothing*/});
}

// Copied from https://openuserjs.org/scripts/slashP/Copypaste_Geoguessr_map_data version 2.3.0.
const newMapMakerContainerSelector = "[class*='sidebar_container']";
const isNewMapMaker = () => document.querySelector(newMapMakerContainerSelector) !== null;
const mapId = () => location.href.split("/").pop();

async function getExistingMapData() {
     // Copied from https://openuserjs.org/scripts/slashP/Copypaste_Geoguessr_map_data version 2.3.0.
     const url = isNewMapMaker() ? `https://www.geoguessr.com/api/v4/user-maps/drafts/${mapId()}` : `https://www.geoguessr.com/api/v3/profiles/maps/${mapId()}`;
     const coordinatesPropertyName = isNewMapMaker() ? "coordinates" : "customCoordinates";
     let map = await fetch(url).then((response) => response.json());

     return {
          id: map.id,
          name: map.name,
          description: map.description,
          avatar: map.avatar,
          highlighted: map.highlighted,
          published: map.published,
          customCoordinates: map[coordinatesPropertyName],
     };
}
unsafeWindow.getExistingMapData1 = getExistingMapData;

function updateMap(newMap, setFeedback) {
     // Copied from https://openuserjs.org/scripts/slashP/Copypaste_Geoguessr_map_data version 2.3.0.
     const url = isNewMapMaker() ? `https://www.geoguessr.com/api/v4/user-maps/drafts/${mapId()}` : `https://www.geoguessr.com/api/v3/profiles/maps/${mapId()}`;
     const httpMethod = isNewMapMaker() ? "PUT" : "POST";
     fetch(url, {
          method: httpMethod,
          credentials: "same-origin",
          headers: {
               "Content-Type": "application/json",
          },
          body: JSON.stringify(newMap),
     })
          .then((response) => {
               if (!response.ok) {
                    setFeedback("Something went wrong when calling the server.");
                    return;
               }
               return response.json();
          })
          .then((mapResponse) => {
               if (mapResponse.id || mapResponse.message === "OK") {
                    setFeedback(`Map updated. Reloading page in 5 seconds.`);
                    // setTimeout(() => {
                    window.location.reload();
                    // }, 1000);
               }
          });
}
unsafeWindow.updateMap = updateMap;

function showLoadMsg() {
     let msg = document.createElement("div");
     msg.innerText = "Better map maker loaded!";
     msg.style.cssText = "position: absolute; top: 10px; left: 10px; transition: 1000ms ease-in; font-weight: bold; background: white;";

     document.body.appendChild(msg);

     setTimeout(function () {
          msg.style.top = "-20px";
          setTimeout(function () {
               msg.parentElement.removeChild(msg);
          }, 1100);
     }, 5000);
}
