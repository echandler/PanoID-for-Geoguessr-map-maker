// ==UserScript==
// @name         Better GeoGuessr map maker v2.2
// @namespace    GeoGuessr scripts
// @version      2.2
// @description  Choose which street view year to show on your map.
// @author       echandler
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @downloadURL  https://github.com/echandler/PanoID-for-Geoguessr-map-maker/raw/main/betterGeoGuessrMapMaker.user.js
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`.betterMapMaker {position: absolute;font-family: var(--font-neo-sans); background: linear-gradient(155deg, rgba(0, 212, 255, 0.6) 0%, rgba(9, 9, 121, 0.6) 35%, rgba(0, 212, 255, 0.6) 100%); padding: 10px; z-index:1000; border-radius:5px;cursor: all-scroll;} `);
GM_addStyle(`select#panoIds:focus-visible { outline: none; } select#panoIds:focus {background-color: white !Important;}`);

let months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let isActive = false;
let _setPano = null;

let googleDetector = setInterval(function(){
    if (!unsafeWindow.google) return;
    clearInterval(googleDetector);
    _setPano = google.maps.StreetViewPanorama.prototype.setPano;
    initUrlChangeDetector();
}, 1000);

function initUrlChangeDetector(){
    let urlChangeDetector = setInterval(function () {
        if (/map-maker/.test(location.href)) {
            if (isActive) return;
            isActive = true;
            unsafeWindow.modify_proto_setPano(isActive);
            UI.make();
            return;
        }
        if (!isActive) return;
        isActive = false;
        UI.delete();
        unsafeWindow.modify_proto_setPano(isActive);
    }, 1000);
}

unsafeWindow.modify_proto_setPano = function (doModify) {
    google.maps.StreetViewPanorama.prototype.setPano = doModify? customSetPano : _setPano;
}

function customSetPano(panoID){
    unsafeWindow.newSV = this;

    let that = this;

    setTimeout(async function(){
        // Have to wait for the that.location.latLng to update.
        let panoIds = document.getElementById("panoIds");

        let ErrorMsg = setTimeout(()=>{
            panoIds.innerHTML = "";

            let option = document.createElement("option");
            option.style.paddingLeft = "1em";
            option.innerHTML = "No data found.";
            option.selected = true;

            panoIds.appendChild(option);
        }, 1000);

        let SVS = new google.maps.StreetViewService();
        let loc = that.location.latLng;
        let data1 = await SVS.getPanorama({ location: { lat: loc.lat(), lng: loc.lng() }, radius: 50 }).catch((e)=>{ console.error(e); });
        // SVS.getPanorama({pano:panoID, radius: 50} )

        let p = that.location.pano;

        panoIds.innerHTML = "";

        if (!data1) return;

        let option = document.createElement("option");
        option.value = panoID;
        option.innerHTML = "&nbsp;Current Pano ID = " + panoID + "&nbsp;";
        option.selected = true;
        panoIds.appendChild(option);

        for (var n = 0; n < data1.data.time.length; n++) {
            let keys = Object.keys(data1.data.time[n]);
            let key = null;
            keys.forEach(_key =>{
                if (data1.data.time[n][_key].constructor === Date)
                    key = _key;
            });

            let d = new Date(data1.data.time[n][key]);
            let option = document.createElement("option");
  
            option.style.paddingLeft = "1em";
            option.value = data1.data.time[n].pano;
            option.innerHTML = "&nbsp;" + months[d.getMonth()] + "&nbsp;" + d.getFullYear();
            option.title = option.value;
            
            if (option.value === panoID) {
                option.selected = true;
            }

            panoIds.appendChild(option);
        }

        clearTimeout(ErrorMsg);
    }, 500);

    return _setPano.apply(this, arguments);


};

let UI = {
    el: null,
    delete: function(){ this.el.parentElement.removeChild(this.el); this.el = null; },
    make: function (){
        let bodyXY = localStorage["geoBetterMapMakerCoords"] ? JSON.parse(localStorage["geoBetterMapMakerCoords"]) : { x: 1, y: 1 };
        let dce = document.createElement.bind(document);

        let body = dce("div");
        body.id = "betterMapMaker_body";
        body.className = "betterMapMaker";
        body.style.top = bodyXY.y + "%";
        body.style.left = bodyXY.x + "%";
        body.delete =

        this.el = body;

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
};

function getCurPanoId(){
    return document.getElementById("panoIds").value;
}

async function saveData() {
    let cData = await getExistingMapData();
    let coords = cData.customCoordinates;
    let y = unsafeWindow.newSV.location.latLng.lat();
    let x = unsafeWindow.newSV.location.latLng.lng();
    let pov = unsafeWindow.newSV.getPov();

    for (let n = 0; n < coords.length; n++) {
        if (y === coords[n].lat && x === coords[n].lng) {
            coords[n].panoId = getCurPanoId();
            //  coords[n].heading = pov.heading;
            //  coords[n].pitch = pov.pitch;
            //  coords[n].zoom = pov.zoom;

            updateMap(cData, function () {/*Function that does nothing*/});

            return;
        }
    }

    alert("Couldn't find location coordinates in map data. Please save location and try again.");

    return;
}

// --- Copied from https://openuserjs.org/scripts/slashP/Copypaste_Geoguessr_map_data version 2.3.0. ---
const newMapMakerContainerSelector = "[class*='sidebar_container']";
const isNewMapMaker = () => document.querySelector(newMapMakerContainerSelector) !== null;
const mapId = () => location.href.split("/").pop();
//------------------------------------------------------------------------------------------------------

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
