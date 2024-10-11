import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import {get as getProjection} from 'ol/proj.js';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';

function calculateDistance(coord1, coord2) {
  const dx = coord1[0] - coord2[0];
  const dy = coord1[1] - coord2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

const proximityThreshold = 30000000;

const locations = {
  "Scandia Colles": [51986770.366862275, -40319800.329711884],
  "Olympus Rupes": [65717853.88145955, -103384378.48431028],
  "Hellas Planitia": [352125153.7496052, -184528382.421702],
  "Mamers Valles": [289481989.9756099, -69633730.73228805],
  "Elysium Volcanic Region": [461444681.6852895, -93148004.19184442],
}

proj4.defs('EPSG:104905', '+proj=longlat +a=3396190 +rf=169.894447223612 +no_defs +type=crs');
register(proj4);

const parser = new WMTSCapabilities();

fetch('https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml')
  .then(response => response.text())
  .then(text => {
    const result = parser.read(text);
    initializeMap(result);
  })
  .catch(error => {
    console.error('Error fetching WMTS Capabilities:', error);
    displayErrorMessage('Failed to load map capabilities.');
  });

function initializeMap() {
  try {
    // Manually create TileMatrixSet
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
      console.log(tileCoord);
  
      // Construct the URL
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
    console.log('TileGrid:', tileGrid);

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

    const map = new Map({
      target: 'map',
      layers: [wmtsLayer],
      view: new View({
        projection: getProjection('EPSG:104905'),
        center: [236769970.08131555, -135522799.9096726],
        zoom: 0,
        minZoom: 0,  // Minimum zoom level
        maxZoom: 4,  // Maximum zoom level
        resolutions: resolutions,
        extent: [324522.6777193472, -255178329.33093852, 481371664.02665454, -576205.223378554]
      }),
    });

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    map.addLayer(vectorLayer);
    map.on('singleclick', function (event) {
      const coords = event.coordinate;
      console.log(coords);
      let clickedCloseToLocation = false;
      for (const [locationName, locationCoords] of Object.entries(locations)) {
        const distance = calculateDistance(coords, locationCoords);
    
        if (distance < proximityThreshold) {
          console.log(`Success! You clicked near ${locationName}. Distance: ${distance}`);
          clickedCloseToLocation = true;
          break;  // Stop checking once a close location is found
        }
      }

      if (!clickedCloseToLocation) {
        console.log('Failed! You did not click close to any known location.');
      }

      const marker = new Feature(new Point(coords));
      marker.setStyle(new Style({
        image: new CircleStyle({
          radius: 50,
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }));

      // Add the marker to the vector source
      vectorSource.addFeature(marker);
    });
  } catch (error) {
    console.error('Error initializing the map:', error);
  }
}
  

