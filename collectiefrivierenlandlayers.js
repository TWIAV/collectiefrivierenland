import GeoJSON from 'ol/format/GeoJSON';
import {Circle as CircleStyle, Fill, Stroke, Style, Text, Icon} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

/*******************************************************************************
** Laag met inliggende agrarische natuurverenigingen (ANV’s) Collectief Rivierenland (vlakken)
********************************************************************************/
// ANV Feature Style
const anvFeatureFill = new Fill({
  color: 'rgba(83,135,128,0.4)'
});

const anvFeatureStroke = new Stroke({
  color : '#538780',
  width : 2    
});

const anvFeatureStyle = new Style({
  image: new CircleStyle({
    fill: anvFeatureFill,
    stroke: anvFeatureStroke,
    radius: 5,
  }),
  fill : anvFeatureFill,
  stroke : anvFeatureStroke
 });

const anvLabelStyle = new Style({
  text: new Text({
    font: '11px sans-serif',
    fill: new Fill({
      color: '#538780',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 6,
    }),
  }),
});

const anvStyle = [anvFeatureStyle, anvLabelStyle];

// Bestand (GeoJSON) met de inliggende agrarische natuurverenigingen (ANV’s) Collectief Rivierenland
const anvRegionsVectorSource = new VectorSource({
  format: new GeoJSON(),
  url: './data/anv_rivierenland.geojson'
});

const anvRegionsVectorLayer = new VectorLayer({
  title: 'Agrarische Natuurverenigingen Collectief Rivierenland',
  id: 'anvRegions',
  source: anvRegionsVectorSource,
  style: function (feature) {
    anvLabelStyle
      .getText()
      .setText(feature.get('naam'));
    return anvStyle;
  },});

export { anvRegionsVectorLayer };