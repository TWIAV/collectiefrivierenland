import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import WMTSSource from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import Projection from 'ol/proj/Projection';
import { getTopLeft } from 'ol/extent';

import { convertToGrayScale } from './convert-colors.js';

// Tiling schema for the Netherlands (Amersfoort / RD New): EPSG:28992
const proj28992Extent = [-285401.92, 22598.08, 595401.92, 903401.92];
const proj28992 = new Projection({ code: 'EPSG:28992', units: 'm', extent: proj28992Extent });
const resolutions = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210, 0.105, 0.0525, 0.02625, 0.013125, 0.0065625];
const matrixIds = [];
for (let i = 0; i < 20; ++i) {
  matrixIds[i] = 'EPSG:28992:' + i;
}

const dutchWMTSTileGrid = new WMTSTileGrid({
  origin: getTopLeft(proj28992Extent),
  resolutions: resolutions,
  matrixIds: matrixIds
});

//Basiskaartengroep
const brtAchtergrondkaartLayer = new TileLayer({
  title: 'BRT Achtergrondkaart',
  minResolution: 1.10,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0',
    layer: 'standaard',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/basisregistratie-topografie-achtergrondkaarten-brt-a-" target="_blank" title="Publieke Dienstverlening Op de Kaart">BRT Achtergrondkaart</a>'
  })
});

const bgtAchtergrondkaartLayer = new TileLayer({
  title: 'BGT Achtergrondkaart',
  maxResolution: 1.20,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/lv/bgt/wmts/v1_0',
    layer: 'achtergrondvisualisatie',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/basisregistratie-grootschalige-topografie-bgt-" target="_blank" title="Publieke Dienstverlening Op de Kaart">BGT Achtergrondkaart</a>'
  })
});

// add a brt grayscale layer
let brtAchtergrondkaartGrijsLayer = new TileLayer(brtAchtergrondkaartLayer.getProperties());

brtAchtergrondkaartGrijsLayer.set('title', 'BRT Achtergrondkaart (grijs)');

brtAchtergrondkaartGrijsLayer.on('postrender', function(event) {
  convertToGrayScale(event.context);
});

// add a bgt grayscale layer
let bgtAchtergrondkaartGrijsLayer = new TileLayer(bgtAchtergrondkaartLayer.getProperties());

bgtAchtergrondkaartGrijsLayer.set('title', 'BGT Achtergrondkaart (grijs)');

bgtAchtergrondkaartGrijsLayer.on('postrender', function(event) {
  convertToGrayScale(event.context);
});

const luchtfotoActueelOrtho25cmRGBLayer = new TileLayer({
  title: 'Luchtfoto (actueel / 25 cm)',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: 'Actueel_ortho25',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/pdok-luchtfoto-rgb-open-" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto (25 cm)</a>'
  })
});

const luchtfotoActueelOrthoHRRGBLayer = new TileLayer({
  title: 'Luchtfoto (actueel / 7,5 cm)',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: 'Actueel_orthoHR',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/pdok-luchtfoto-rgb-open-" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto (7,5 cm)</a>'
  })
});

const achtergrondkaartLayerGroup = new LayerGroup({
  title: 'Achtergrondkaart',
  combine: true,
  layers: [bgtAchtergrondkaartLayer, brtAchtergrondkaartLayer],
  type: 'base',
});

const achtergrondkaartGrijsLayerGroup = new LayerGroup({
  title: 'Achtergrondkaart (grijs)',
  combine: true,
  layers: [bgtAchtergrondkaartGrijsLayer, brtAchtergrondkaartGrijsLayer],
  type: 'base',
});

const baseMapsLayerGroup = new LayerGroup({
  title: 'Basiskaarten',
  fold: 'close',
  layers: [luchtfotoActueelOrthoHRRGBLayer, luchtfotoActueelOrtho25cmRGBLayer, achtergrondkaartGrijsLayerGroup, achtergrondkaartLayerGroup]
});

export { baseMapsLayerGroup };