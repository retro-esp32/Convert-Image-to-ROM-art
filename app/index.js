/*
 * npm packages
 */
const fs = require('fs');
const shell = require('shelljs');
const prompt = require('prompt');
const PNG = require('png-js');
const JPG = require('jpeg-js');
const FileReader = require('filereader'), fileReader = new FileReader();
const Blob = require('node-blob');

/*
 * consts
 */
const png = '../png';
const jpg = '../jpg';
const confirm = {
  name: 'yesno',
  message: 'Would you like to run the conversion script now? (Y/n)',
  validator: /y[es]*|n[o]?/,
  warning: 'Must respond yes or no',
  default: 'n'
};

/*
 * prompt
 */
prompt.start();

const resizer = () => {
  prompt.get(confirm, (err, result) => {
    const response = result.yesno.toLowerCase();
    if(response.length > 1) {response.slice(1);}
    if(response === 'y') {
      shell.exec('./convert.sh');
      folders();
    }
  })
}

const folders = () => {
 fs.readdir(png, (err, systems) => {
    systems.forEach( (system) => {
      if(system != '.DS_Store') {
        images(`${png}/${system}`, system);
      }
    });
 })
}

const images = (folder, system) => {
  fs.readdir(folder, (err, images) => {
    images.map( (image) => {
      if(image != '.DS_Store') {
        convert(`${folder}/${image}`, image, system);
      }
    });
  });
  shell.exec('clear');
}

const convert = (file, name, system) => {
  fs.readFile( file, (err, data) => {
    const image = new JPG(data);
    JPG.decode(file, (pixels) => {
      const width = image.width;
      const height = image.height;
      let art = new Uint8ClampedArray((width * height * 2) + 4);
      art[0] = width & 0xff;
      art[1] = width >> 8;
      art[2] = height & 0xff;
      art[3] = height >> 8;
      const src = pixels;
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          let ptr = y * width + x;
          let ptrDest = ptr * 4;
          let ptrSrc = (ptr * 2) + 4;
          let word16 = null;
          const dither = false;
          if(dither) {
            word16 = dither_888xy565(x, y, src[ptrDest], src[ptrDest+ 1], src[ptrDest + 2]);
          }
          else {
            word16 = convertToRGB565(src[ptrDest], src[ptrDest+ 1], src[ptrDest + 2]);
          }
          art[ptrSrc] = word16 & 0xff;
          art[ptrSrc + 1] = word16 >> 8;
        }
      }
      name = (name.slice(0,-4));
      file = `../romart/${system}/${name}.art`;
      fs.writeFile(file, art, (err) => {
        if(err) throw err;
      })
    })
  })
}

function convertToRGB565(r, g, b) {
  return (((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3));
}

function dither_888xy565(x, y, r, g, b) {
  let tresshold_id = ((y & 7) << 3) + (x & 7);
  let r2 = closest_rb(Math.min(r + dither_tresshold_r[tresshold_id], 0xff));
  let g2 = closest_g(Math.min(g + dither_tresshold_g[tresshold_id], 0xff));
  let b2 = closest_rb(Math.min(b + dither_tresshold_b[tresshold_id], 0xff));
  return convertToRGB565(r2, g2, b2);
}

fs.access(png, error => {
  if(!error) {
    folders();
  } else {
    resizer();
  }
});

//prompt.stop();
