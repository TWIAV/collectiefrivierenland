import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import LayerGroup from 'ol/layer/Group';

// Actueel Hoogtebestand Nederland (AHN)
const ahnUrlWms = 'https://service.pdok.nl/rws/ahn/wms/v1_0';

const ahnSource = new TileWMS({
  url: ahnUrlWms,
  params: {'LAYERS': 'dtm_05m', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/actueel-hoogtebestand-nederland-ahn" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Actueel Hoogtebestand Nederland (AHN)</a>'
});

const ahnLayer = new TileLayer({
  title: 'Actueel Hoogtebestand Nederland (AHN)',
  source: ahnSource,
  visible: false,
});

// Kadastrale kaart - Basisregistratie Kadaster (BRK)
const kadUrlWms = 'https://service.pdok.nl/kadaster/kadastralekaart/wms/v5_0';

const kadParcelsSource = new TileWMS({
  url: kadUrlWms,
  params: {'LAYERS': 'Perceel', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/kadastrale-kaart" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Kadastrale percelen (BRK)</a>'
});

const kadParcelsLayer = new TileLayer({
  title: 'Kadastrale percelen',
  source: kadParcelsSource,
  visible: false,
  maxResolution: 1.20
});

// Styling voor geselecteerd perceel
const selectedFeatureFill = new Fill({
  color: 'rgba(51, 153, 204, 0.6)'
});

const selectedFeatureStroke = new Stroke({
  color : '#3399CC',
  width : 1.25    
});

const selectedFeatureStyle = new Style({
  image: new CircleStyle({
    fill: selectedFeatureFill,
    stroke: selectedFeatureStroke,
    radius: 5,
  }),
  fill : selectedFeatureFill,
  stroke : selectedFeatureStroke
 });

// Laag om geselecteerd perceel te tonen
const parcelSelectionVectorSource = new VectorSource();

const parcelSelectionVectorLayer = new VectorLayer({
  // title: '', --> geen titel; deze laag moet wel op de kaart getoond worden, maar niet in de layer switcher
  source: parcelSelectionVectorSource,
  declutter: true,
  style: selectedFeatureStyle
});

const brkLayerGroup = new LayerGroup({
  title: 'Kadastrale percelen (BRK)',
  combine: true,
  //fold: 'open',
  layers: [kadParcelsLayer, parcelSelectionVectorLayer],
  maxResolution: 1.20,
  visible: false,
});

export { brkLayerGroup, ahnLayer };