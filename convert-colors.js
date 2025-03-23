// functions apply grayscale or sepia to every pixel in the canvas element of the layer
// based on an example found here: https://medium.com/@xavierpenya/openlayers-3-osm-map-in-grayscale-5ced3a3ed942
// and further explanation here: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
export function convertToGrayScale(context) {

  const imgd = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const data = imgd.data;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i], green = data[i + 1], blue = data[i + 2];
    let gray = 0.2126 * red + 0.7152 * green + 0.0722 * blue; // CIE luminance weighted values for red, green and blue
    gray === 0.0 ? gray = 255.0 : gray = gray; // Show white background (instead of black) while loading new tiles
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    data[i + 3] = 255; // alpha (fully opaque)
  }

  context.putImageData(imgd,0,0);
}

export function convertToSepia(context) {

  const imgd = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const data = imgd.data;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i], green = data[i + 1], blue = data[i + 2];
    data[i] = Math.min(Math.round(0.393 * red + 0.769 * green + 0.189 * blue), 255);
    data[i + 1] = Math.min(Math.round(0.349 * red + 0.686 * green + 0.168 * blue), 255);
    data[i + 2] = Math.min(Math.round(0.272 * red + 0.534 * green + 0.131 * blue), 255);
  }

  context.putImageData(imgd,0,0);
}