import 'autocompleter/autocomplete.css';
import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
import {Attribution, defaults as defaultControls} from 'ol/control';
import LayerGroup from 'ol/layer/Group';
import Link from 'ol/interaction/Link';
import Overlay from 'ol/Overlay';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle as CircleStyle, Stroke, Style, Icon, Fill} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Control from 'ol/control/Control';
import WKT from 'ol/format/WKT';
import * as olExtent from 'ol/extent';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import FullScreen from 'ol/control/FullScreen';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

// ol-ext is a set of extensions, controls, interactions, popup to use with Openlayers, by Jean-Marc Viglino, Software Engineer at IGN-France
// https://github.com/Viglino/ol-ext
import Bar from 'ol-ext/control/Bar';
import 'ol-ext/control/Bar.css';

// Blazing fast and lightweight autocomplete library - https://kraaden.github.io/autocomplete/
import autocomplete from 'autocompleter';

import { baseMapsLayerGroup } from './basiskaartlayers.js';
import { brkLayerGroup, ahnLayer } from './wmslayers.js';
import { anvRegionsVectorLayer } from './collectiefrivierenlandlayers.js';
import { collectiefRegionsVectorLayer } from './collectievenboerennatuurlayers.js';

createDivs();

let messageToast = document.getElementById("toast");

// projectie: het Nederlandse nationale coördinatensysteem Rijksdriehoeksstelsel (RD) met code EPSG:28992 - gedefinieerd in ./basiskaartlayers.js
const baseMapLayers = baseMapsLayerGroup.getLayers();
const projection = baseMapLayers.item(0).get('source').getProjection();

const mapLayerGroup = new LayerGroup({
  title: 'Achtergrondinformatie',
  fold: 'open',
  layers: [ahnLayer,brkLayerGroup]
});

// Reverse geocoding
let reverseGeocoding = false;
let addressFound;
let coordinatesClicked;

// Define reverse geocoding control
class revGeoControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<img src="./svg/info.svg" style="width:20px;height:20px;" alt="info">';
	button.id = 'revGeoButton';

    const element = document.createElement('div');
    element.className = 'rev-geo ol-unselectable ol-control';
	element.title = 'Klik op kaart voor adres\n en coördinaten';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleRevGeoButton.bind(this), false);
  }

  handleRevGeoButton() {
	const button = document.getElementById('revGeoButton');
    if (reverseGeocoding) {
      button.innerHTML = '<img src="./svg/info.svg" style="width:20px;height:20px;" alt="info">';
	  button.style.backgroundColor = 'white';
	  map.getViewport().style.cursor = 'auto';
      addressPopup.setPosition(undefined);
	  reverseGeocoding = false;
	} else {
      button.innerHTML = '<img src="./svg/info-white.svg" style="width:20px;height:20px;" alt="info-white">';
	  button.style.backgroundColor = '#666666';
      reverseGeocoding = true;
	  map.getViewport().style.cursor = 'crosshair';
	}
  }
}

// Define copy url control
class CopyUrlControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<img src="./svg/web-link.svg" style="width:20px;height:20px;" alt="link">';
    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control';
	element.title = 'Kopieer het adres (URL) van deze kaart';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleCopyUrl.bind(this), false);
  }

  handleCopyUrl() {
    const inputc = document.body.appendChild(document.createElement("input"));
    inputc.value = window.location.href;
    inputc.focus();
    inputc.select();
    document.execCommand('copy');
    showMessageToast('URL kaart naar klembord gekopieerd:<br>' + inputc.value);
    inputc.parentNode.removeChild(inputc);
  }
}

// Define screenshot control
class screenshotControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<img src="./svg/print.svg" style="width:20px;height:20px;" alt="print">';
	button.id = 'screenshotButton';

    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control';
	element.title = 'Maak een schermafdruk van de kaart';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleScreenshotButton.bind(this), false);
  }

  handleScreenshotButton() {
	const button = document.getElementById('screenshotButton');
    map.once('rendercomplete', function () {
      const mapCanvas = document.createElement('canvas');
      const size = map.getSize();
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      const mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
        map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
        function (canvas) {
          if (canvas.width > 0) {
            const opacity =
              canvas.parentNode.style.opacity || canvas.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            let matrix;
            const transform = canvas.style.transform;
            if (transform) {
              // Get the transform parameters from the style's transform matrix
              matrix = transform
                .match(/^matrix\(([^\(]*)\)$/)[1]
                .split(',')
                .map(Number);
            } else {
              matrix = [
                parseFloat(canvas.style.width) / canvas.width,
                0,
                0,
                parseFloat(canvas.style.height) / canvas.height,
                0,
                0,
              ];
            }
            // Apply the transform to the export map context
            CanvasRenderingContext2D.prototype.setTransform.apply(
              mapContext,
              matrix,
            );
            const backgroundColor = canvas.parentNode.style.backgroundColor;
            if (backgroundColor) {
              mapContext.fillStyle = backgroundColor;
              mapContext.fillRect(0, 0, canvas.width, canvas.height);
            }
            mapContext.drawImage(canvas, 0, 0);
          }
        },
      );
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      const link = document.getElementById('image-download');
      link.href = mapCanvas.toDataURL();
      link.click();
    });
    map.renderSync();
  }
}



const attribution = new Attribution({
  collapsible: false,
});

// Laag om zoekresultaat te tonen
const searchResultVectorSource = new VectorSource();

const redLine = new Stroke({
  color: [255, 0, 0, 0.8],
  width: 4
});

const searchResultVectorLayer = new VectorLayer({
  source: searchResultVectorSource,
  declutter: true,
  style: [new Style({stroke: redLine}), new Style({image: new CircleStyle({radius: 6, stroke: redLine})})]
});

// Elements that make up the popup.
const container = document.getElementById('popup');
const header = document.getElementById('popup-header');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');
const copyAddressBtn = document.getElementById('copy-address-button');
const copyCoordinatesBtn = document.getElementById('copy-coordinates-button');

copyAddressBtn.addEventListener('click', copyAddressToClipboard);

copyCoordinatesBtn.addEventListener('click', copyCoordinatesToClipboard);

// Create an overlay to anchor the popup to the map.
const addressPopup = new Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});

// Add a click handler to hide the popup.
// @return {boolean} Don't follow the href.
closer.onclick = function () {
  addressPopup.setPosition(undefined);
  copyAddressBtn.style.display = "none";
  copyCoordinatesBtn.style.display = "none";
  searchResultVectorSource.clear(); // remove address search result from map
  document.getElementById('input-loc').value = ''; // clear address search bar
  closer.blur();
  return false;
};

// Create an overlay to anchor the tooltip with parcel information to the map.
const tooltipOverlay = new Overlay({
  element: tooltipinfo,
  offset: [18, 0],
  positioning: 'center-left'
});

const center = [169000, 432000];
const zoom = 5;

const minZoom = 2;
const maxZoom = 19;

// The Link interaction allows you to synchronize the map state with the URL.
// The view center, zoom level, and rotation will be reflected in the URL as you navigate around the map.
// Layer visibility is also reflected in the URL. Reloading the page restores the map view state.
const mapStateLink = new Link();

const map = new Map({
  target: 'map',
  layers: [
    baseMapsLayerGroup,
    mapLayerGroup,
    collectiefRegionsVectorLayer,
    anvRegionsVectorLayer,
    searchResultVectorLayer
  ],
  overlays: [addressPopup, tooltipOverlay],
  controls: defaultControls({attribution: false}).extend([attribution]),
  view: new View({minZoom: minZoom, maxZoom: maxZoom, projection: projection, center: center, zoom: zoom})
});

// Toolbar
const toolBar = new Bar();
map.addControl(toolBar);
toolBar.setPosition('top-left');

toolBar.addControl(new CopyUrlControl());
toolBar.addControl(new revGeoControl());
toolBar.addControl(new ZoomToExtent({ extent: [122989.99097083893, 402597.5709335268, 215632.3461091611, 473642.32180647325]}));
toolBar.addControl(new screenshotControl());
toolBar.addControl(new FullScreen());

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Lijst met lagen',
  collapseTipLabel: 'Verberg lijst met lagen',
  groupSelectStyle: 'group'
});

map.addControl(layerSwitcher);
map.addControl(mapStateLink);

// Parcel tooltip and highlighting
const parcelLayer = brkLayerGroup.getLayers().item(0);
const parcelSource = parcelLayer.get('source');
const selectedParcelLayer = brkLayerGroup.getLayers().item(1);
const selectedParcelSource = selectedParcelLayer.get('source');

// AHN Informatie
const heightSource = ahnLayer.get('source');

const anvFeatureHighlightStyle = new Style({
  fill: new Fill({color: 'rgba(83,135,128,0.7)'}),
  stroke: new Stroke({color: '#538780', width: 4})
});

const collectiefFeatureHighlightStyle = new Style({
  fill: new Fill({color: 'rgba(35,80,151,0.7)'}),
  stroke: new Stroke({color: '#235097', width: 4})
});

let anvSelected = [];
let collectiefSelected = [];

map.on('click', function (evt) {
  searchResultVectorSource.clear();
  selectedParcelSource.clear();
  tooltipOverlay.setPosition(undefined);
  if (!reverseGeocoding) { // do no no show tooltip when reverse geocoding is activated
    const viewResolution = /** @type {number} */ (map.getView().getResolution());
    let parcelUrl = '';
    let heightUrl = '';
    let info = '';
    for (let i = 0; i < collectiefSelected.length; i++) { collectiefSelected[i].setStyle(undefined); collectiefSelected.splice(i,1); }
    for (let i = 0; i < anvSelected.length; i++) { anvSelected[i].setStyle(undefined); anvSelected.splice(i,1); }
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      const layerID = layer.get('id');
      if (feature && layerID === 'collectiefRegions') {
        if (info.length > 0) {
          info += '<br>---------------<br>';
        }
        info += '<b>Agrarisch Collectief (BoerenNatuur)</b><br>';
        const coll = feature;
        collectiefSelected.push(coll);
        info += '<b> - <a target="_blank" href="' + feature.get('website') + '">' + feature.get('naam') + '</a></b>';
        feature.setStyle(collectiefFeatureHighlightStyle);
      }
      if (feature && layerID === 'anvRegions') {
        if (info.length > 0) {
          info += '<br>---------------<br>';
        }
        info += '<b>Collectief Rivierenland</b><br>';
        const anv = feature;
        anvSelected.push(anv);
        info += '<b> - Agrarische Natuurvereniging <a target="_blank" href="' + feature.get('website') + '">' + feature.get('naam') + '</a></b>';
        feature.setStyle(anvFeatureHighlightStyle);
      }
    })
    if (brkLayerGroup.get('visible') && viewResolution < 1.20) {
      map.getTargetElement().style.cursor = 'pointer';
      parcelUrl = parcelSource.getFeatureInfoUrl(
        evt.coordinate,
        viewResolution,
        projection,
        {'INFO_FORMAT': 'application/json'}
      );
    }
    if (ahnLayer.get('visible')) {
      heightUrl = heightSource.getFeatureInfoUrl(
        evt.coordinate,
        viewResolution,
        projection,
        {'INFO_FORMAT': 'application/json'}
      );
    }
    if (parcelUrl || heightUrl) {
      if (parcelUrl) {
        fetch(parcelUrl)
          .then((response) => response.text())
          .then(function (json) {
            const features = new GeoJSON().readFeatures(json);
            selectedParcelSource.clear();
            selectedParcelSource.addFeatures(features);
            if (info.length > 0) {
              info += '<br>---------------<br>';
            }
            if (features.length > 0) {
              info += '<b>Kadastrale gegevens</b><br>';
              info += '- Kadastrale Gemeente: <b>' + features[0].get('kadastraleGemeenteWaarde') + '</b><br>';
              info += '- Perceelnummer: <b>' + features[0].get('AKRKadastraleGemeenteCodeWaarde') + ' ';
              info += features[0].get('sectie') + ' '; 
              info += features[0].get('perceelnummer') + '</b><br>'; 
              info += '- Oppervlakte: <b>' + new Intl.NumberFormat('nll-NL').format(features[0].get('kadastraleGrootteWaarde')) + ' m<sup>2</sup></b>'; 
            }
            tooltipinfo.innerHTML = info;
            tooltipOverlay.setPosition(evt.coordinate);
          });
      }
      if (heightUrl) {
        fetch(heightUrl)
          .then((response) => response.text())
          .then(function (json) {
            const features = new GeoJSON().readFeatures(json);
            if (info.length > 0) {
              info += '<br>---------------<br>';
            }
            if (features.length > 0) {
              const pointClicked = new Feature({'geometry': new Point(evt.coordinate)});
              searchResultVectorSource.addFeature(pointClicked);
              info += '<b>AHN Hoogtegegevens</b><br>';
              info += '- Hoogte: <b>' + parseFloat(features[0].get('value_list')).toFixed(2) + ' m t.o.v. NAP</b>';
            } else {
              info += '- geen AHN hoogtegegevens</b>';
            }
            tooltipinfo.innerHTML = info;
            tooltipOverlay.setPosition(evt.coordinate);
          });
      }
    } 
    tooltipinfo.innerHTML = info;
    if (info.length > 0) {
      tooltipOverlay.setPosition(evt.coordinate);
    } else {
      selectedParcelSource.clear();
      tooltipOverlay.setPosition(undefined);
      map.getTargetElement().style.cursor = '';
    }
  }
});

// Functionaliteit om de Link interaction (bijhouden URL) goed te laten verlopen voor de brkLayerGroup
brkLayerGroup.on('change:visible', function(){
  brkLayerGroup.getVisible() ? parcelLayer.setVisible(true) : parcelLayer.setVisible(false);
});

map.on('loadstart', function(){
  parcelLayer.getVisible() ? brkLayerGroup.setVisible(true) : brkLayerGroup.setVisible(false);
});

// Functionaliteit om de Link interaction (bijhouden URL) goed te laten verlopen voor de Achtergrondkaart
const achtergrondkaartLayerGroup = baseMapsLayerGroup.getLayers().item(3);
const brtAchtergrondkaartLayer = achtergrondkaartLayerGroup.getLayers().item(1)

achtergrondkaartLayerGroup.on('change:visible', function(){
  achtergrondkaartLayerGroup.getVisible() ? brtAchtergrondkaartLayer.setVisible(true) : brtAchtergrondkaartLayer.setVisible(false);
});

map.on('loadstart', function(){
  brtAchtergrondkaartLayer.getVisible() ? achtergrondkaartLayerGroup.setVisible(true) : achtergrondkaartLayerGroup.setVisible(false);
});

// Functionaliteit om de Link interaction (bijhouden URL) goed te laten verlopen voor de Achtergrondkaart (Grijs)
const achtergrondkaartGrijsLayerGroup = baseMapsLayerGroup.getLayers().item(2);
const brtAchtergrondkaartGrijsLayer = achtergrondkaartGrijsLayerGroup.getLayers().item(1)

achtergrondkaartGrijsLayerGroup.on('change:visible', function(){
  achtergrondkaartGrijsLayerGroup.getVisible() ? brtAchtergrondkaartGrijsLayer.setVisible(true) : brtAchtergrondkaartGrijsLayer.setVisible(false);
});

map.on('loadstart', function(){
  brtAchtergrondkaartGrijsLayer.getVisible() ? achtergrondkaartGrijsLayerGroup.setVisible(true) : achtergrondkaartGrijsLayerGroup.setVisible(false);
});

map.on ('moveend', manageControls);

function manageControls(evt) {
  const zoomLevel = Math.round(map.getView().getZoom());
  const zoomInBtn = document.querySelector(".ol-zoom-in");
  const zoomOutBtn = document.querySelector(".ol-zoom-out");
  zoomOutBtn.title = 'Zoom uit';
  const rotateBtn = document.querySelector(".ol-rotate-reset");
  rotateBtn.title = 'Draai de kaart weer naar het noorden';
  const zoomToExtentBtn = document.querySelector(".ol-zoom-extent");
  zoomToExtentBtn.firstChild.title = 'Zoom naar gebied Collectief Rivierenland';
  zoomToExtentBtn.firstChild.innerHTML = '<img src="./svg/home.svg" style="width:20px;height:20px;" alt="home">';
  const fullScreenOpenBtn = document.querySelector(".ol-full-screen-false");
  if (fullScreenOpenBtn !== null) fullScreenOpenBtn.title = 'Volledig scherm openen';
  const fullScreenCloseBtn = document.querySelector(".ol-full-screen-true");
  if (fullScreenCloseBtn !== null) fullScreenCloseBtn.title = 'Volledig scherm sluiten';
  // Gray out zoom buttons at maximum and minimum zoom respectively
  zoomLevel === maxZoom ? zoomInBtn.style.color = "#d3d3d3" : zoomInBtn.style.color = "#666666";
  zoomLevel === minZoom ? zoomOutBtn.style.color = "#d3d3d3" : zoomOutBtn.style.color = "#666666";
  // // Make sure the layer switcher is rerendered to set the color (gray or black) for layer titles, depending on their visibility at a certain zoomlevel
  layerSwitcher.renderPanel();
}

// Using the PDOK Location Server --> https://pdok.github.io/webservices-workshop/#using-the-pdok-location-server
// Adding Custom Control

const locatieServerUrl = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1';

//*********************************************************************************************
class LocationServerControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};
    
    const input = document.createElement('input');
    input.id = 'input-loc';
	input.spellcheck = false;
	input.placeholder = 'Zoek adres of perceel in Nederland';
    const element = document.createElement('div');
    element.className = 'input-loc ol-unselectable ol-control';
	element.id = 'addressSearchBar';
    element.appendChild(input);
    super({
      element: element,
      target: options.target
    })
    // suggest - Get Suggestions from Locatie Server
    autocomplete({
      input: input,
      fetch: function (text, update) {
      fetch(`${locatieServerUrl}/suggest?fq=*&q=${text}`)
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            const suggestions = [];
            data.response.docs.forEach(function (item) {
              const name = item.weergavenaam;
              const id = item.id;
              suggestions.push({ label: name, value: id });
            })
            update(suggestions)
          })
      },
      // lookup - Get Result from Locatie Server
      onSelect: function (item) {
        input.value = item.label;
        const id = item.value;
        fetch(`${locatieServerUrl}/lookup?id=${id}&fl=id,weergavenaam,geometrie_rd`)
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            let coord;
            let padding = [0,0,0,0];
            const wktLoc = data.response.docs[0].geometrie_rd;
            const format = new WKT();
            const feature = format.readFeature(wktLoc);
            searchResultVectorSource.clear();
            searchResultVectorSource.addFeature(feature);
            const ext = feature.getGeometry().getExtent();
            const geomType = feature.getGeometry().getType();
            if (geomType === 'Point') {
              coord = feature.getGeometry().getCoordinates();
            } else {
              coord = olExtent.getCenter(ext);
              padding = [60,60,60,60];
            }
            const address = data.response.docs[0].weergavenaam;
            header.innerHTML = '';
            content.innerHTML = '<p>' + address + '</p>';
            copyAddressBtn.style.display = "none";
            copyCoordinatesBtn.style.display = "none";
            addressPopup.setPosition(coord);
            map.getView().fit(ext, {size: map.getSize(), padding: padding, maxZoom: 14});
          })
      }
    })
  }
}
//*********************************************************************************************

let locationServerControl = new LocationServerControl();

map.addControl(locationServerControl);

// The address search bar is sharing the upper right corner of
// the map with the default OpenLayers rotate button, which is
// hidden when map rotation = 0. That's why the address search
// bar gives way to the rotate button when the map is rotated

const lsControl = document.getElementById('addressSearchBar');

map.getView().on('change:rotation', function() {
  let rotation = map.getView().getRotation();
  if (rotation === 0) {
    lsControl.className = 'visible'
  } else {
    lsControl.className = 'invisible'
  }
});

// Add a click handler to the map to reverse geocode
map.on('singleclick', function (evt) {
  if (reverseGeocoding) { // Only retrieve address when revGeoButton is activated
    header.innerHTML = '<b>Gekozen locatie</b>';
    copyAddressBtn.style.display = "block";
    copyCoordinatesBtn.style.display = "block";
    const rdCoordinates = evt.coordinate;
    const rdX = Math.round(rdCoordinates[0]);
    const rdY = Math.round(rdCoordinates[1]);
	coordinatesClicked = 'X = ' + rdX + ' / Y = ' + rdY;
    
    content.innerHTML = '<p><b>RD-coördinaten (EPSG:28992):</b><br>' + coordinatesClicked + '</p>';

    fetch('https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse?X=' + rdX + '&Y=' + rdY + '&type=adres&distance=20').then(function(response) {
      return response.json();
    }).then(function(json) {
      if (json.response.numFound === 0) {
        content.innerHTML += '<p><b>Adres:</b><br>Er is geen adres gevonden voor deze locatie</p>';
      } else {
		addressFound = json.response.docs[0].weergavenaam;
        content.innerHTML += '<p><b>Adres:</b><br>' + addressFound + '</p>';
      }
      addressPopup.setPosition(rdCoordinates);
    })
  }
});

function copyAddressToClipboard(text) {
  const inputc = document.body.appendChild(document.createElement("input"));
  inputc.value = addressFound;
  inputc.focus();
  inputc.select();
  document.execCommand('copy');
  if (addressFound.length > 0) {
    showMessageToast("Adres naar klembord gekopieerd:<br>" + inputc.value);
  }
  inputc.parentNode.removeChild(inputc);
}

function copyCoordinatesToClipboard(text) {
  const inputc = document.body.appendChild(document.createElement("input"));
  inputc.value = coordinatesClicked;
  inputc.focus();
  inputc.select();
  document.execCommand('copy');
  showMessageToast("Coördinaten naar klembord gekopieerd:<br>" + inputc.value);
  inputc.parentNode.removeChild(inputc);
}

// Define show about dialog control
class ShowAboutDialogControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '?';
    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control';
	element.title = 'Over de Collectief Rivierenland viewer';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleShowAboutDialog.bind(this), false);
  }

  handleShowAboutDialog() {
    aboutDialog.style.display = "block";
  }
}

// Toolbar About Dialog
const toolBarAboutDialog = new Bar();
map.addControl(toolBarAboutDialog);
toolBarAboutDialog.setPosition('bottom-left');

toolBarAboutDialog.addControl(new ShowAboutDialogControl());

const modal = document.getElementById("aboutDialog");

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName("ol-modal-close")[0];
  
  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  }

  // Get the button that closes the modal
  const startBtn = document.getElementById("start-button");
  
  // When the user clicks on <span> (x), close the modal
  startBtn.onclick = function() {
    modal.style.display = "none";
  }

/*******************************************************************************/
function createDivs() {
  // Create Map div
  const mapDiv = document.createElement('div');
  mapDiv.innerHTML = `<div id="map" tabindex="0"></div>`;
  document.body.appendChild(mapDiv);
  // Create a little Toast div
  const toastDiv = document.createElement('div');
  toastDiv.innerHTML = `<div id="toast"></div>`;
  document.body.appendChild(toastDiv);
  // Create tooltip cadastral parcel information
  const tooltipDiv = document.createElement('div');
  tooltipDiv.innerHTML = `<div id="tooltipinfo" class="tooltip"></div>`;
  document.body.appendChild(tooltipDiv);
  // Create popup
  const popupDiv = document.createElement('div');
  popupDiv.innerHTML =
    `<div id="popup" class="ol-popup">
      <div><div id="popup-header"></div><a href="#" id="popup-closer" class="ol-popup-closer"></a></div>
      <div id="popup-content"></div>
      <div class="flex-end">
        <button id="copy-coordinates-button" class="action-button" style="display:none">Kopieer coördinaten</button>
        <button id="copy-address-button" class="action-button" style="display:none">Kopieer adres</button>
      </div>
    </div>`;
  document.body.appendChild(popupDiv);
  const imageDownloadLink = document.createElement('a');
  imageDownloadLink.innerHTML = `<a id="image-download" download="map.png"></a>`;
  document.body.appendChild(imageDownloadLink);

  // Create about dialog
  const aboutDialogDiv = document.createElement('div');
  aboutDialogDiv.innerHTML =
    `<div class="ol-modal" id="aboutDialog" style="display: none;">
      <div class="ol-modal-content">
        <div class="ol-modal-header"><h1>Collectief Rivierenland viewer</h1><span class="ol-modal-close">×</span></div>
        <div class="ol-modal-body">
        <table class="ol-modal-table"><tr class="ol-modal-table-row"><td class="ol-modal-table-data"><p><a href="https://collectiefrivierenland.nl/" target="blank">Collectief Rivierenland</a>  is een organisatie die zich inzet voor agrarisch natuur- en landschapsbeheer. Samen met de agrarische natuurverenigingen, boeren, burgers en vrijwilligers zetten we ons in voor behoud en ontwikkeling van het karakteristieke landschap van het rivierengebied, mét de flora en fauna die daarbij hoort.<br><br><button id="start-button" class="start-button">Klik op de kaart om te starten</button><p></p></td>
        <td class="ol-modal-table-data"><p></p></td></tr>
        </table></div>
      <div class="ol-modal-footer"><p>Deze kaartviewer is gebouwd met <a href="https://openlayers.org/" title="A high-performance, feature-packed library for all your mapping needs." target="blank">OpenLayers</a> - Heb je <a id="wm" href="#"></a>&nbsp;over deze applicatie? Stuur dan een&nbsp;<a id="wm2" href="#"></a>.</p></div>
    </div>
    </div>`;
  document.body.appendChild(aboutDialogDiv);

  // Create headerDiv
  const headerDiv = document.createElement('div');
  headerDiv.innerHTML = `<div id="header">
      <a href="http://www.collectiefrivierenland.nl/"><img src="./svg/CollectiefRivierenland.svg" id="crl" style="position:absolute; left:6px; top:6px" title="Agrarisch Natuurbeheer" width="150" height="57" alt="Agrarisch Natuurbeheer"></a>
      <div id="headertext">Collectief Rivierenland</div>
      <a id="gh-a" href="https://github.com/TWIAV/collectiefrivierenland" title="De broncode van deze applicatie staat op GitHub"><svg class="octicon octicon-mark-github v-align-middle" height="32" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg></a>
  </div>`;
  document.body.appendChild(headerDiv);
}
/*******************************************************************************/

function showMessageToast(msg) {
  messageToast.className = "show";
  messageToast.innerHTML = msg;
  setTimeout(function(){ messageToast.className = messageToast.className.replace("show", ""); }, 3500);
}

