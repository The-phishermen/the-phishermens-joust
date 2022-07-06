const pause_button = document.getElementById("pause-music");
const bpmelem = document.getElementById("music-bpm");

let bpm_offset = 0;
let slowCount = 0;
let fastCount = 0;

const maximum_random_offset = 35;
const minimum_random_offset = 15;
const random_offset_scale = maximum_random_offset - minimum_random_offset;

const minimum_offset = -25;
const maximum_offset = 85;
const offset_range = maximum_offset - minimum_offset;

const minimum_percentage = 0.66;
const maximum_percentage = 1.33;
const percentage_scale = maximum_percentage - minimum_percentage;

let music_socket = io();
let sendingId = document.getElementById('sending-id');

function parseMidi(midi){
  if (midi.header) {
      const midiJSON = JSON.stringify(midi, undefined, null)
      const parsedMidiObject = JSON.parse(midiJSON)
      console.log(parsedMidiObject);
      return parsedMidiObject
  }
}

function convert_offset_to_percentage() {
  let percentage = (bpm_offset - minimum_offset) / offset_range;
  let scaled_percentage = (percentage * percentage_scale) + minimum_percentage;
  return scaled_percentage;
}

function makeSong(midi){
  Tone.Transport.PPQ = midi.header.ppq
  const numofVoices = midi.tracks.length 
  const synths = [] 

  //************** Tell Transport about Time Signature changes  ********************
  for (let i=0; i < midi.header.timeSignatures.length; i++) {
      Tone.Transport.schedule(function(time){
          Tone.Transport.timeSignature = midi.header.timeSignatures[i].timeSignature;
      }, midi.header.timeSignatures[i].ticks + "i");    
  }

  //************** Tell Transport about bpm changes  ********************
  for (let i=0; i < midi.header.tempos.length; i++) {
      Tone.Transport.schedule(function(time){
          Tone.Transport.bpm.value = midi.header.tempos[i].bpm + bpm_offset;
      }, midi.header.tempos[i].ticks + "i");    
  }

  //************ Change time from seconds to ticks in each part  *************
  for (let i = 0; i < numofVoices; i++) {
      midi.tracks[i].notes.forEach(note => {
          note.time = note.ticks + "i"
      })
  }
  
  //************** Create Synths and Parts, one for each track  ********************
  for (let i = 0; i < numofVoices; i++) {
      synths[i] = new Tone.PolySynth(Tone.Synth).toDestination();
      const now = Tone.now();

      let part = new Tone.Part(function(time,value){
          synths[i].triggerAttackRelease(value.name, value.duration, time, value.velocity)
      },midi.tracks[i].notes).start()                  
  }  

  Tone.Transport.scheduleRepeat(function(time){
    let rand_offset = random_bpm_offset();
    if (bpm_offset < 15) {
      fastCount = 0;
      slowCount++;
      if (slowCount > 2) {
        rand_offset = 50 - bpm_offset;
        console.log("JUMP UP");
      }
    } else if (bpm_offset > 30) {
      slowCount = 0;
      fastCount++;
      if (fastCount > 4) {
        rand_offset = -10 - bpm_offset;
        console.log("JUMP DOWN");
      }
    }
    if (bpm_offset + rand_offset > minimum_offset && bpm_offset + rand_offset < maximum_offset) {
      bpm_offset += rand_offset;
      Tone.Transport.bpm.value += rand_offset;
      // if (Math.abs(bpm_offset - 20) >= 40) {
        //   song_counter = Math.min(song_counter + 1, songs.length - 1);
        //   bpm_offset = -5;
        //   updateSong();
        // }
      }
      let threshold_percentage = convert_offset_to_percentage();

      bpmelem.innerText = "Music Speed: " + String(Math.round(100 * threshold_percentage)) + "%";

      music_socket.emit('bpm-change', threshold_percentage);
  }, "9");
}

function updateSong() {
  if (Tone.Transport.state === "started") {
    Tone.Transport.stop();
  }
  Tone.Transport.cancel();
    
  fetch("./../audio_files/party-rock-anthem.json").then(response => {
    return response.json();
  }).then(data => {
    
    makeSong(data);
    
  }).catch(err => {
    console.error(err);
  });

  Tone.Transport.start();
}

document.getElementById("restart-music").addEventListener("click", function() {
  bpm_offset = 0;
  updateSong();
  Tone.Transport.start(0);
});

document.getElementById("start-game").addEventListener("click", function() {
	console.log("STARTING MUSIC");
  if (Tone.Transport.state !== 'started') {
    updateSong();
    Tone.context._context.resume();
  }
});

pause_button.addEventListener("click", function() {
  if (Tone.Transport.state !== 'started') {
    updateSong();
    Tone.context._context.resume();
    pause_button.innerHTML = "Pause";
  } else {
    Tone.Transport.stop()
    pause_button.innerHTML = "Play";
  }
});

document.getElementById("increase-music").addEventListener("click", function() {
  if (bpm_offset + 10 <= maximum_offset) {
    bpm_offset += 10;
    Tone.Transport.bpm.value += 10;
    let threshold_percentage = convert_offset_to_percentage();

    bpmelem.innerText = "Music Speed: " + String(Math.round(100 * threshold_percentage)) + "%";

    music_socket.emit('bpm-change', threshold_percentage);
  }
});

document.getElementById("decrease-music").addEventListener("click", function() {
  if (bpm_offset - 10 >= minimum_offset) {
    bpm_offset -= 10;
    Tone.Transport.bpm.value -= 10;
    let threshold_percentage = convert_offset_to_percentage();

    bpmelem.innerText = "Music Speed: " + String(Math.round(100 * threshold_percentage)) + "%";

    music_socket.emit('bpm-change', threshold_percentage);

  }
});

function random_bpm_offset() {
  let neg = (Math.random() > 0.5 ? 1 : -1);
  let rand = (Math.round(Math.random() * random_offset_scale) + minimum_random_offset);
  return rand * neg
}