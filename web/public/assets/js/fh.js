const FileHandler = ( () => {

  const dropzone = document.querySelector('main') || false;
  let collection = [];
  const size = 0;

  const events = ( () => {

    /*
     * init events
     */
    const init = () => {
      dropzone.addEventListener('drop', events.drop, false);
      dropzone.addEventListener('dragover', events.over, false);
      dropzone.addEventListener('dragleave', events.leave, false);
      console.log('init')
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
            const read = () => {
              directory.readEntries( (entries) => {
                count += entries.length;
                if(!entries.length) {
                  resolve(temp);
                } else {
                  Object.keys(entries).forEach( (key) => {
                    entries[key].file(function (file){
                      if(!/^\./.test(file.name)) {
                        temp.push(file);
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
      collection.forEach( (file) => {
          file.id = `file-${id}`;
          main.innerHTML += `
          <div id='${file.id}'class='file-container' file-name="${file.name}">
            <div class='file-name'>${file.name}</div>
            <div class='file-preview'>
              <img src='assets/images/loading.gif'>
            </div>
            <div class='file-progress' style='--width:1%'></div>
          </div>
        `;
        const reader = new FileReader();
        reader.onload = ( (file) => {
          const name = file.name;
          return (e) => {
            document.querySelector(`#${file.id}`).setAttribute('file-name', '');
            document.querySelector(`#${file.id} img`).setAttribute('src', `${e.target.result}`);
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
        id++;
        reader.readAsDataURL(file);
      })
    }

    return {
      process
      ,display
    }
  })();

  /*
   * init dropzone
   */
  if(dropzone) { events.init(); }

})();
