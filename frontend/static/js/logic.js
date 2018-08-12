'use strict';

// helpers
// (adapted) Function from David Walsh: http://davidwalsh.name/css-animation-callback
function whichAnimationEvent() {
  var t,
      el = document.createElement("fakeelement");

  var animations = {
    "animation"      : "animationend",
    "OAnimation"     : "oAnimationEnd",
    "MozAnimation"   : "animationend",
    "WebkitAnimation": "webkitAnimationEnd"
  }

  for (t in animations){
    if (el.style[t] !== undefined){
      return animations[t];
    }
  }
}

// custom axios instance
const http = axios.create({
  baseURL: $('base').attr('href')
});

// create vue app
const app = new Vue({

  // root element
  el: '#app',

  // options & settings
  data: {
    files: [],
    fileFilter: '',
    selected: -1,
    log: '',
    filterMode: 'grep',
    grepMode: 'grep',
    grep: '', // TODO: Add more filters
    lineMode: 'head',
    line: '',
    lineToGoTo: 1,
    error: 'Select a file on the left.',
    isLoading: false,
    socket: null
  },

  // computed values (cached; only re-computed when data changes)
  computed: {
    filesFiltered() {
      return this.files.filter(el => el.path.indexOf(this.fileFilter) !== -1);
    },
    linesFiltered() {
      // check if an item is selected
      if (this.selected === -1 || this.log === '')
        return this.log;

      // split raw text into an array of lines
      let linesArray = this.log.split('\n');

      // perform grep or fuzzy search
      if (this.grep !== '') {
        if (this.grepMode === 'grep') {
          linesArray = linesArray.filter(el => el.indexOf(this.grep) !== -1);
        } else if (this.grepMode === 'fuzzy') {
          linesArray = fuzzysearch(this.grep, linesArray);
        }
      }

      // TODO: add head and tail functions

      return linesArray;
    },
    filteredLinesAmount() {
      return this.linesFiltered.length;
    },
    downloadUrl() {
      return this.selected + '/download';
    }
  },

  // public functions
  methods: {
    reset: function() {
      this.selected = -1;
      this.log = '';
      this.fileFilter = '';
      this.grep = '';
      this.files = [];
      this.error = 'Select a file on the left.';
    },
    refresh: function () {
      this.reset();
      return http.post('/all').then(response => {
        this.files = response.data;
      }).catch(err => {
        this.error = err.message;
      });
    },
    select: function (index, silent = false) {
      if (!silent) {
        this.log = '';
        this.grep = '';
        this.error = '';
        this.isLoading = true;
      }
      this.selected = index;
      http.post(`/${index}`).then(response => {
        let data = response.data;

        // convert json objects to a string
        if (typeof response.data === 'object')
          data = JSON.stringify(data);

        data = data.trim();
        if (data === '') {
          this.error = `The file ${this.files[index].path} is empty!`;
        } else {
          this.log = data;
        }

        // make sure socket is not destroyed
        if (this.socket) this.socket.send(index);
      }).catch(err => {
        this.error = err.message;
      })
      .finally(() => {
        if (silent) {
          $('#logContent')
            .scrollTop(19.5 * this.filteredLinesAmount)
        } else {
          this.isLoading = false;
        }
      });
    },
    totalLinesAmount: function () {
      return this.linesFiltered === '' ? 0 : this.log.split('\n').length;
    },
    isFiltered: function () {
      return this.grep !== '';
    },
    reloadFile: function () {
      if (this.selected > -1) {
        // just re-select the selected file ;)
        this.select(this.selected);
      }
    },
    openGoToLine: function () {
      if (this.selected === -1) {
        alert('Select a file first.');
      } else {
        $('#goToLineModal')
          .addClass('is-active')
          .find('input')
          .focus();
      }
    },
    closeGoToLine: function () {
      $('#goToLineModal').removeClass('is-active');
    },
    goToLine: function () {
      this.closeGoToLine();
      $('#logContent')
        .scrollTop(19.5 * this.lineToGoTo)
        .find('div[data-line="' + this.lineToGoTo + '"]')
          .addClass('blink')
          .one(whichAnimationEvent(), function (event) {
            $(this).removeClass('blink');
          });
    },
    showGoToLineError: function () {
      return this.lineToGoTo > this.filteredLinesAmount;
    }
  },

  // watch data props
  watch: {
    // TODO: Only log in debug mode
    // TODO: Deliver debug mode to frontend
    error: (e) => {
      if (e !== '') console.log(`Error: ${e}`);
    }
  },

  // called when Vue is ready
  mounted() {
    // websocket connection
    const protocol = location.protocol === 'http:' ? 'ws' : 'wss';
    this.socket = new WebSocket(`${protocol}://${location.host}/socket`);

    this.socket.onopen = function (event) {
      console.log('WebSocket connection established.');
    }.bind(this);

    this.socket.onclose = function (event) {
      alert('WebSocket connection closed!\nAutomatic file refresh disabled.');
      this.socket = null;
    }.bind(this);

    this.socket.onerror = function (error) {
      this.error = error;
    }.bind(this);

    this.socket.onmessage = function (message) {
      console.log(message);
      if (message.data === 'file-was-updated') {
        this.select(this.selected, true);
      }
    }.bind(this);


    // initially refresh
    this.refresh().then(() => {
      $('#fader').fadeOut(500, () => $('#fader').remove());
    });
  }
});
