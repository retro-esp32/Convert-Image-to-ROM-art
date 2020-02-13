const FileHandler = ( () => {

  const dropzone = document.querySelector('main') || false;
  let collection = [];
  const processed = [];
  let decollection = [];
  const size = 0;

  const events = ( () => {

    /*
     * init events
     */
    const init = () => {
      dropzone.addEventListener('drop', events.drop, false);
      dropzone.addEventListener('dragover', events.over, false);
      dropzone.addEventListener('dragleave', events.leave, false);
    }

    /*
     * over
     */
    const over = (e) => {
      dropzone.classList.add('over');
      e.stopPropagation();
      e.preventDefault();
    }

    const leave = (e) => {
      dropzone.classList.remove('over');
      e.stopPropagation();
      e.preventDefault();
    }

    /*
     * drop
     */
    const drop = (e) => {
      e.stopPropagation();
      e.preventDefault();

      let folder = false;

      if(e.dataTransfer.types[0] === 'Files') {
        const entries = e.dataTransfer.items;
        const files = e.dataTransfer.files;
        Object.keys(entries).forEach( (key) => {
          const entry = entries[key];
          const file = files[key];
          manager.process(entry, file).then( resolve => {
            if(Array.isArray(resolve)) {
              collection = resolve;
              manager.display();
            } else {
              collection.push(resolve)
              if(collection.length === entries.length) {manager.display()}
            }
          });
        });
      }

    }

    return {
      init
      ,over
      ,leave
      ,drop
    }

  })();

  /*
   * manager
   */
  const manager = ( () => {
    const process = (entry, file) => {
      return new Promise(resolve => {
        entry = entry.getAsEntry || entry.webkitGetAsEntry();
        switch(true) {
          case entry.isDirectory:
            let directory = entry.createReader();
            let count = 0;
            let temp = [];
            let error = 0;
            const read = () => {
              directory.readEntries( (entries) => {
                count += entries.length;
                if(!entries.length && (count == (temp.length + error))) {
                  resolve(temp);
                } else {
                  Object.keys(entries).forEach( (key) => {
                    entries[key].file(function (file){
                      if(!/^\./.test(file.name)) {
                        temp.push(file);
                      } else {
                        error++;
                      }
                      read();
                    });
                  })
                }
              })
            }
            read();
          break;
          case entry.isFile:
            resolve(file);
          break;
        }
      })
    };

    const display = () => {
      const main = document.querySelector('main');
      main.innerHTML = '';
      let id = 0;
      let HTML = ''
      collection.forEach( (file) => {
        file.id = `file-${id}`;
        HTML += `
        <div id='${file.id}' class='file-container' file-name="${file.name}">
          <div class='file-name'>${file.name}</div>
          <div class='file-preview'>
            <img src='assets/images/loading.gif' file-name='${file.name}'>
          </div>
          <div class='file-progress' style='--width:1%'></div>
        </div>`;
        id++;
      });
      main.innerHTML = HTML;
      decollection = collection;
      setTimeout( () => {
        load();
      },1000);
    };

    const load = () => {
      if(decollection.length) {
        file = decollection[0];
        const reader = new FileReader();
        reader.onload = ( (file) => {
          const name = file.name;
          return (e) => {
            document.querySelector(`#${file.id}`).setAttribute('file-name', '');
            document.querySelector(`#${file.id} img`).setAttribute('src', `${e.target.result}`);
            decollection.shift();
            load();
          }
        })(file);

        reader.onprogress = (data) => {
          if(data.lengthComputable) {
            let percent = parseInt( ((data.loaded / data.total) * 100), 10 );
            let progress = document.querySelector(`#${file.id} .file-progress`);
            progress.setAttribute('style', `--width:${percent}%`);

            if(percent === 100) {
              progress.classList.add('hidden');
            }
          }
        };
        reader.readAsDataURL(file);
      } else {
        convert.process();
      }
    }

    return {
      process
      ,display
    }
  })();

  /*
   * convert
   */
  const convert = (() => {

    let saves = [];

    const process = () => {

      const images = document.querySelectorAll('.file-preview img');
      let count = images.length;
      images.forEach( (item) => {
        const image = new Image();
        image.onload = ( () => {
          const art = crc(image);
          let blob = new Blob([art], {type: "octet/stream"});
          let url = window.URL.createObjectURL(blob);
          let name = item.getAttribute('file-name').replace(/\.[^.]*$/,'.art');

          saves.push({name,url});

          count--;
          if(count === 0) {compress();}
        });
        image.src = item.src;
      });
    }

    const crc = (image) => {
      let width = image.width;
      let height = image.height;

      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      c.width = width;
      c.height = height;
      ctx.drawImage(image, 0, 0, width, height);
      const src = ctx.getImageData(0, 0, c.width, c.height);
      const data = src.data;

      let art = new Uint8Array((width * height * 2) + 4);
      art[0] = width & 0xff;
      art[1] = width >> 8;
      art[2] = height & 0xff;
      art[3] = height >> 8;

      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          let ptr = y * width + x;
          let ptrDest = ptr * 4;
          let ptrSrc = (ptr * 2) + 4;
          let r = data[ptrDest];
          let g = data[ptrDest + 1];
          let b = data[ptrDest + 2];
          let word16 = (((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3));
          art[ptrSrc] = word16 & 0xff;
          art[ptrSrc + 1] = word16 >> 8;
        }
      }

      return art;
    }

    const compress = () => {
      let zip = new JSZip();
      let count = 0;
      saves.forEach( (save) => {
        const filename = save.name;

        JSZipUtils.getBinaryContent(save.url, function (err, data) {
          if (err) {
            throw err; // or handle the error
          }
          zip.file(filename, data, {binary: true}) ;
          count++;
          if (count == saves.length) {
            zip.generateAsync({ type: 'blob' }).then(function (content) {
              saveAs(content, 'romart.zip');
            });
          }
        });
      })
    }

    return {
      process
      ,crc
      ,compress
    }
  })();

  /*
   * init dropzone
   */
  if(dropzone) { events.init(); }

})();
