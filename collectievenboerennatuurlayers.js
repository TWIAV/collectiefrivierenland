import GeoJSON from 'ol/format/GeoJSON';
import {Circle as CircleStyle, Fill, Stroke, Style, Text, Icon} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

/*******************************************************************************
** Laag met agrarische collectieven, de leden van BoerenNatuur (vlakken)
********************************************************************************/
// Collectieven Feature Style
const collectiefFeatureFill = new Fill({
  color: 'rgba(35,80,151,0.2)'
});

const collectiefFeatureStroke = new Stroke({
  color : '#235097',
  width : 2    
});

const collectiefFeatureStyle = new Style({
  image: new CircleStyle({
    fill: collectiefFeatureFill,
    stroke: collectiefFeatureStroke,
    radius: 5,
  }),
  fill : collectiefFeatureFill,
  stroke : collectiefFeatureStroke
 });

const collectiefLabelStyle = new Style({
  text: new Text({
    font: '11px sans-serif',
    fill: new Fill({
      color: '#235097',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 6,
    }),
  }),
});

const collectiefStyle = [collectiefFeatureStyle, collectiefLabelStyle];

// Bestand (GeoJSON) met de agrarische collectieven (BoerenNatuur)
const collectiefRegionsVectorSource = new VectorSource({
  format: new GeoJSON(),
  url: './data/collectieven-rd.geojson'
});

const collectiefRegionsVectorLayer = new VectorLayer({
  title: 'Agrarische Collectieven (BoerenNatuur)',
  id: 'collectiefRegions',
  source: collectiefRegionsVectorSource,
  style: function (feature) {
    collectiefLabelStyle
      .getText()
      .setText(feature.get('naam'));
    return collectiefStyle;
  },
  visible: false
});

export { collectiefRegionsVectorLayer };