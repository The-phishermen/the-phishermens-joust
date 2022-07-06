var audio = new Audio("./../audio_files/intro1.mp3");
let isplaying = false;


document.onclick = function() {
  if(!isplaying){
    audio.play();
    isplaying= true;
  }
  else{
    audio.pause();
    isplaying= false;
  }
  
}

audio.addEventListener('ended', function() {
  this.currentTime = 0;
  this.play();
}, false);