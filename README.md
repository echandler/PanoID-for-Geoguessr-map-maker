# PanoID-for-Geoguessr-map-maker
Choose which street view year to show on your playable map.

#### *So far this works with the beta version of the new map maker that is supposed to replace the old map maker on October 12, 2022.

##### Workflow: open the map maker -> refresh the screen (!important) -> choose a location -> choose a year -> save the location -> select that location and year (!important) again -> then click "Save and Reload".
###### (On the beta version of the new map maker, the new saved locations won't show up on the playable map until the "Publish" button is clicked.)

If the widget doesn't appear on the map maker page (which it won't initially) refresh the page a few times, it has to hook into the GeoGuessr code early in the load cycle and sometimes it loads too late for whatever reason. Also, refresh the page once you are out of the map maker so that the script will stop running in the background; it should load on the map maker page only (but it won't do it automatically, refresh the page when first opening the map maker so the script will load).

On the map maker page, the street view coverage will show the default year automatically instead of the year you choose previously, but should (if everything worked) show up on the finished map. So if you suspect that it didn't work, make sure to test on the finished playable map...if you can.

[Click here to install](https://github.com/echandler/PanoID-for-Geoguessr-map-maker/raw/main/betterGeoGuessrMapMaker.user.js). If this doesn't work, open a new file in Tampermonkey and copy and paste the user.js script above into it.

If you plan to make a map with many locations, try https://map-making.app/ which has many more additional features that make map making alot easier.
