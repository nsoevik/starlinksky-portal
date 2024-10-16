import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import LineString from 'ol/geom/LineString';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { get as getProjection } from 'ol/proj.js';
import { Style, Stroke } from 'ol/style';
import { Fill, Text, Circle, Icon } from 'ol/style';
import {Control, defaults as defaultControls} from 'ol/control.js';
import helmetIcon from '/helmet-icon.png';
import axios from 'axios';

let sandboxClient;
let loading;
let correctAnswers = 0;
function calculateDistance(coord1, coord2) {
  const dx = coord1[0] - coord2[0];
  const dy = coord1[1] - coord2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function updateStatus(sandboxed) {
  const element = document.getElementById('sandboxed');
  if (loading) {
    element.innerHTML = "Unsandbox request in-flight"
  }
  if (sandboxed) {
    element.style.color = "red";
    element.innerHTML = "You are sandboxed and have restricted WiFi access"
  } else {
    if (sandboxed == null) {
      element.style.color = "green";
      element.innerHTML = "You have full wifi access"
    } else {
      element.style.color = "green";
      element.innerHTML = "You have full wifi access"
    }
  }
}

async function checkSandboxStatus() {
  try {
    await axios.get(`https://connect.starlinkair.com/starlinkrouter/sandbox-client`)
      .then(resp => {
        if (resp.status == 200) {
          sandboxClient = resp.data;
          // sandboxClient.correctAnswers = correctAnswers;
          updateStatus(resp.data.sandboxed);
        } else if (resp.status == 404) {
          updateStatus(true);
        } else {
          throw new Error('Unexpected response');
        }
      })
  }
  catch (error) {
    console.log(`Error getting sandbox information: ${error}`);
    updateStatus();
  }
}

setInterval(checkSandboxStatus, 5000);

async function unsandbox() {
  try {
    loading = true;
    if (!sandboxClient || !sandboxClient.sandboxed) {
      window.location.href = "https://starlink.com";
      return;
    }

    await axios.post(`/api/sandbox/client`, sandboxClient, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(resp => {
        loading = false;
        if (resp.status == 200) {
          console.log("Client unsandboxed");
          window.location.href = "https://www.starlink.com";
	  return;
        }  

        console.log(`Backend returned status code ${resp.status}`);
      })
  }
  catch (error) {
    console.log(`Error unsandboxing client: ${error}`);
    loading = false;
  }
}

// "Scandia Colles": [51986770.366862275, -40319800.329711884],
// "Olympus Rupes": [65717853.88145955, -103384378.48431028],
const proximityThreshold = 30000000;
const locations = {
  "Hellas Planitia": [352125153.7496052, -184528382.421702],
  "Mamers Valles": [289481989.9756099, -69633730.73228805],
  "Elysium Volcanic Region": [461444681.6852895, -93148004.19184442],
};

proj4.defs('EPSG:104905', '+proj=longlat +a=3396190 +rf=169.894447223612 +no_defs +type=crs');
register(proj4);

const tileMatrixSetInfo = {
  Title: 'default',
  Identifier: 'default028mm',
  SupportedCRS: 'urn:ogc:def:crs:EPSG::104905',
  TileMatrices: [
    {
      Identifier: '0',
      ScaleDenominator: 2.7922763629807472E+08,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 2,
      MatrixHeight: 1,
    },
    {
      Identifier: '1',
      ScaleDenominator: 1.3961381814903736E+08,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 4,
      MatrixHeight: 2,
    },
    {
      Identifier: '2',
      ScaleDenominator: 6.9806909074518681E+07,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 8,
      MatrixHeight: 4,
    },
    {
      Identifier: '3',
      ScaleDenominator: 3.4903454537259340E+07,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 16,
      MatrixHeight: 8,
    },
    {
      Identifier: '4',
      ScaleDenominator: 1.7451727268629670E+07,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 32,
      MatrixHeight: 16,
    },
    {
      Identifier: '5',
      ScaleDenominator: 8.7258636343148351E+06,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 64,
      MatrixHeight: 32,
    },
    {
      Identifier: '6',
      ScaleDenominator: 4.3629318171574175E+06,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 128,
      MatrixHeight: 64,
    },
    {
      Identifier: '7',
      ScaleDenominator: 2.1814659085787088E+06,
      TopLeftCorner: [-180.0, 90.0],
      TileWidth: 256,
      TileHeight: 256,
      MatrixWidth: 256,
      MatrixHeight: 128,
    },
  ],
};

const resolutions = tileMatrixSetInfo.TileMatrices.map(tm =>
  parseFloat(tm.ScaleDenominator) / 0.28 / 1000
);
const matrixIds = tileMatrixSetInfo.TileMatrices.map(tm => tm.Identifier);
const origin = tileMatrixSetInfo.TileMatrices[0].TopLeftCorner;

const tileLoadFunction = (tile, src) => {
  const urlTemplate = 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg';
  const style = 'default';
  const tileMatrixSet = 'default028mm';
  const tileCoord = tile.getTileCoord();
  const tileMatrix = tileCoord[0];
  const tileRow = tileCoord[2];
  const tileCol = tileCoord[1];

  const url = urlTemplate
    .replace('{Style}', style)
    .replace('{TileMatrixSet}', tileMatrixSet)
    .replace('{TileMatrix}', tileMatrix)
    .replace('{TileRow}', tileRow)
    .replace('{TileCol}', tileCol);

  tile.getImage().src = url;
};

const tileGrid = new WMTSTileGrid({
  origin: origin,
  resolutions: resolutions,
  matrixIds: matrixIds,
  tileSize: [256, 256],
});

const wmtsSource = new WMTS({
  url: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  layer: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
  matrixSet: "default028mm",
  format: 'image/jpeg',
  projection: getProjection('EPSG:104905'),
  tileGrid: tileGrid,
  style: 'default',
  wrapX: true,
  attributions: '&copy; NASA',
});

wmtsSource.setTileLoadFunction(tileLoadFunction);

const wmtsLayer = new TileLayer({
  source: wmtsSource,
});

try {
  class Instructions extends Control {
    constructor() {
      const instructions = document.createElement('div');
      instructions.id = "instructions"
      const header = document.createElement('div');
      header.id = "instructions-header"
      header.innerHTML =`Find the location`
      header.style.color = "black";
      instructions.appendChild(header);
      const location = document.createElement('div');
      location.id = "location"
      instructions.appendChild(location);
  
      super({
        element: instructions,
      });
    }
  }

  class Game extends Control {
    constructor(map) {
      const container = document.createElement('div');
      container.id = "game";
      const start = document.createElement('button');
      start.innerHTML = "Start";
      start.id = "start";
      container.appendChild(start);

      const joinWifi = document.createElement('button');
      joinWifi.innerHTML = "Join WiFi";
      joinWifi.id = "wifi";
      joinWifi.onclick = async function() {
          await unsandbox();
      };
      container.appendChild(joinWifi);
      joinWifi.style.display = 'none';
  
      super({
        element: container,
      });

      const vectorSource = new VectorSource();
      this.vectorLayer = new VectorLayer({
        source: vectorSource,
      });

      this.gameInProgress = false;
      this.gameComplete = false;
      this.map = map;
      map.addLayer(this.vectorLayer);
      map.on('singleclick', (event) => {
        if (!this.gameInProgress) {
          return;
        }

        const coords = event.coordinate;
        console.log('Clicked coordinates:', coords);
        if (this.currentMarker) {
          vectorSource.removeFeature(this.currentMarker);
        }
        
        const marker = new Feature(new Point(coords));
        marker.setStyle(new Style({
          image: new Circle({
            radius: 2,
            stroke: new Stroke({
              color: 'white',
              width: 10,
            }),
          }),
        }));
        marker.setStyle(new Style({
          image: new Icon({
              src: helmetIcon,
              scale: 0.1,
              anchor: [0.5, 0.5],
          }),
        }));

        vectorSource.addFeature(marker);
        this.currentMarker = marker;
        this.currentCoords = coords;
        this.element.style.display = 'block';
      });

      start.addEventListener('click', this.handleClick.bind(this), false);
    }

    handleClick() {
      if (!this.gameInProgress) {
        this.map.getView().setMinZoom(1);
        this.map.getView().setZoom(2);
        this.randomLocation = Object.keys(locations)[Math.floor(Math.random() * Object.keys(locations).length)];
        this.currentMarker = null
        this.currentCoords = null
        const joinWifi = document.getElementById('wifi');
        joinWifi.style.display = 'none';
        const location = document.getElementById('location');
        location.innerHTML = this.randomLocation;

        this.element.style.top = 'unset';
        this.element.style.bottom = '10px';
        this.element.style.left = '50%';
        this.element.style.transform = 'translateX(-50%)';
        const start = document.getElementById('start');
        start.style.display = 'block';
        start.innerHTML = 'Confirm';

        this.vectorLayer.getSource().clear();
        this.gameInProgress = true;
      } else {
        const randomCoords = locations[this.randomLocation];
        const randomLocationMarker = new Feature(new Point(randomCoords));
        randomLocationMarker.setStyle(new Style({
          text: new Text({
              text: this.randomLocation,
              fill: new Fill({
                  color: 'white'
              }),
              stroke: new Stroke({
                  color: 'white',
                  width: 1
              }),
              offsetX: 15,
              offsetY: -10,
              font: '16px sans-serif'
          })
        }));

        this.vectorLayer.getSource().addFeature(randomLocationMarker);
        const line = new Feature({
          geometry: new LineString([randomCoords, this.currentCoords]),
        });
        line.setStyle(new Style({
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }));
        this.vectorLayer.getSource().addFeature(line);
        this.map.getView().animate(
            {
                center: randomCoords,
                duration: 2000
            })

        let clickedCloseToLocation = false;
        setTimeout(() => {
          const distance = calculateDistance(randomCoords, this.currentCoords);

          if (distance < proximityThreshold) {
            clickedCloseToLocation = true;
            correctAnswers = correctAnswers + 1;
          }

          this.map.getView().setMinZoom(0);
          this.map.getView().setZoom(this.map.getView().getMinZoom());
          this.element.style.top = '50%';
          this.element.style.bottom = 'unset';
          this.element.style.left = '50%';
          this.element.style.transform = 'translate(-50%, -50%)';

          const zoom = this.map.getView().getZoom();
          const scaleFactor = 200;
          const radius = scaleFactor / Math.pow(2, zoom);

          const circleMarker = new Feature(new Point(randomCoords));
          circleMarker.setStyle(new Style({
            image: new Circle({
                radius: radius,
                stroke: new Stroke({
                    color: 'white',
                    width: 1
                }),
            }),
          }));

          this.vectorLayer.getSource().addFeature(circleMarker);

          const joinWifi = document.getElementById('wifi');
          const start = document.getElementById('start');
          joinWifi.style.display = 'block';
          if (!clickedCloseToLocation) {
            start.style.display = 'block';
            start.innerHTML = "Try Again";
          } else {
            start.innerHTML = "Play Again";
          }

          this.gameInProgress = false
        }, 4000);
      }
    }
  }

  const map = new Map({
    controls: defaultControls().extend([new Instructions()]),
    target: 'map',
    layers: [wmtsLayer],
    view: new View({
      projection: getProjection('EPSG:104905'),
      center: [236769970.08131555, -135522799.9096726],
      zoom: 0,
      minZoom: 0,
      maxZoom: 7,
      resolutions: resolutions,
      extent: [324522.6777193472, -255178329.33093852, 481371664.02665454, -576205.223378554]
    }),
  });
  map.addControl(new Game(map));
} catch (error) {
  console.error('Error initializing the map:', error);
}
