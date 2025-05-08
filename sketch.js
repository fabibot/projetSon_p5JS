function preload() {
  soundFormats('mp3');
  her1Sound = loadSound('/son/her1.mp3');
  her2Sound = loadSound('/son/her2.mp3');

  bladeRunner1Sound = loadSound('/son/bladeRunner1.mp3');
  bladeRunner2Sound = loadSound('/son/bladeRunner2.mp3');

  walle1Sound = loadSound('/son/walle1.mp3');
  walle2Sound = loadSound('/son/walle2.mp3');
}

let lerpAmt = 0; // facteur d'interpolation
let currentColor; 
let transitioning = false;
let startColor;
let endColor;

let soundIsRunning = false;
let squares = [];

let fft;

let setUpBottomText = ""
let bottomText = setUpBottomText;


function setup() {
  createCanvas(windowWidth, windowHeight);
  setupColor = color(162, 173, 153);

  background(setupColor);
  currentColor = setupColor;

  let herButton = createButton('Her');
  herButton.position(0, 0);
  let HerManager = new AudioManager(
    herButton, false, [ her1Sound, her2Sound ], color(181, 24, 40), 
    "Her de Spike Jonze, musique composée par Arcade Fire"
  );

  let bladeRunnerButton = createButton('Blade Runner');
  bladeRunnerButton.position(0, 60);
  let BladeRunnerManager = new AudioManager(
    bladeRunnerButton, false, [ bladeRunner1Sound, bladeRunner2Sound ], color(28, 30, 148), 
    "Blade Runner de Ridley Scott, musique composée par Vangelis"
  );

  let walleButton = createButton('Wall-e');
  walleButton.position(0, 120);
  let WalleManager = new AudioManager(
    walleButton, false, [ walle1Sound, walle2Sound ], color(227, 197, 30), 
    "Wall-e d'Andrew Stanton, musique composée par Thomas Newman"
  );

  herButton.mousePressed(herClick);
  bladeRunnerButton.mousePressed(bladeRunnerClick);
  walleButton.mousePressed(walleClick);


  function herClick() {
    BladeRunnerManager.pauseAudio();
    WalleManager.pauseAudio();
    HerManager.playPauseAudio();
  }
  
  function bladeRunnerClick() {
    HerManager.pauseAudio();
    WalleManager.pauseAudio();
    BladeRunnerManager.playPauseAudio();
  }

  function walleClick() {
    BladeRunnerManager.pauseAudio();
    HerManager.pauseAudio();
    WalleManager.playPauseAudio();
  }

  amplitude = new p5.Amplitude();
  amplitudeVoice = new p5.Amplitude();

  fft = new p5.FFT();

}

function draw() {
  background(currentColor);

  if (transitioning) {
    let currentColor = lerpColor(startColor, endColor, lerpAmt);
    background(currentColor);

    lerpAmt += 0.03; // vitesse de transition
    if (lerpAmt >= 1) {
      lerpAmt = 1; // bloque à 1
      transitioning = false; // transition terminée
    }
  }

  for (let i = squares.length - 1; i >= 0; i--) {
    squares[i].update();
    squares[i].show();
    
    // remove if outside canvas
    if (squares[i].isOffScreen()) {
      squares.splice(i, 1);
    }
  }


  let levels = amplitude.getLevel()
  let levelVoice = amplitudeVoice.getLevel();
  if(soundIsRunning) {
    if(levels > 0.04) {
      drawSquarres();
    }
  }

  // On récupère l'énergie des graves et des aigus
  let bass = fft.getEnergy("bass");
  let treble = fft.getEnergy("treble");
  

  fill('black');
  stroke('black');
  strokeWeight(2);
  let shapeHeight = windowHeight/1.25;

  let maxLift = 500; // hauteur max du "soulèvement" en pixels
  let lift = map(levelVoice, 0, 0.5, 0, maxLift);

  let weightedBass = bass * 1.6;  // renforce le grave
  let weightedTreble = treble * 0.2; // réduit l'aigu

  let balance = map(weightedBass - weightedTreble, -255, 255, 0, windowWidth);

  beginShape();
  vertex(0, shapeHeight);   
  bezierVertex(
    0, shapeHeight,
    balance/1.5, shapeHeight - lift, 
    windowWidth, shapeHeight);
  vertex(windowWidth, shapeHeight);  
  vertex(windowWidth, windowHeight);
  vertex(0, windowHeight)
  vertex(0, shapeHeight)    
  endShape(CLOSE);   

  textSize(11);
  textFont('Verdana');
  fill("#cfcfcf");
  strokeWeight(0)
  stroke("white");
  text(bottomText, 10, windowHeight-10);
}

class AudioManager {
  constructor(btn, isAudioPlaying, audioElement, backgroundColor, description) {
    this.btn = btn; 
    this.isAudioPlaying = false;
    this.audioElement = audioElement;
    this.backgroundColor = backgroundColor;
    this.description = description;
  }
  playPauseAudio() {
    if(!this.isAudioPlaying) {
      this.isAudioPlaying = true;
      soundIsRunning = true;
      bottomText = this.description;
      amplitude.setInput(this.audioElement[0]);
      amplitudeVoice.setInput(this.audioElement[1]);
      for(let i = 0; i < this.audioElement.length; i++) {
          this.audioElement[i].play();
      }
      this.changeBackgroundColor(this.backgroundColor);
    } else {
      this.isAudioPlaying = false;
      soundIsRunning = false;
      bottomText = setUpBottomText;
      for(let i = 0; i < this.audioElement.length; i++) {
        this.audioElement[i].pause();
      }
      this.changeBackgroundColor(setupColor);

    }
  }
  pauseAudio() {
    this.isAudioPlaying = false;
    soundIsRunning = false;
    bottomText = setUpBottomText;
    for(let i = 0; i < this.audioElement.length; i++) {
      this.audioElement[i].pause();
    }
  }
  changeBackgroundColor(goalColor) {
    lerpAmt = 0; // réinitialise la transition
    startColor = currentColor;
    endColor = goalColor;
    currentColor = endColor;
    transitioning = true; // active la transition

  }
}

function drawSquarres() {
  let s = new Square();
  squares.push(s);
  if(squares.length > 500) {
    squares.shift();
  }

}


// classe Square
class Square {
  constructor() {
    this.size = random(5, 15);
    
    // position au centre
    this.pos = createVector(width/2.6, height/3.2);
    
    // direction aléatoire
    let angle = random(TWO_PI);
    let speed = random(0.25, 1);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);
    
    // couleur aléatoire parmi gris, blanc, noir
    let colors = ['#32323240', '#eeeeee6e', '#1818186e', '#f5f5f5'];
    this.col = random(colors);
  }
  
  update() {
    this.pos.add(this.vel);
  }
  
  show() {
    fill(this.col);
    noStroke();
    rectMode(CENTER);
    rect(this.pos.x, this.pos.y, this.size, this.size);
  }
  
  isOffScreen() {
    return (
      this.pos.x < -this.size ||
      this.pos.x > width + this.size ||
      this.pos.y < -this.size ||
      this.pos.y > height + this.size
    );
  }
}

// gestion du message d'introcution
document.addEventListener("DOMContentLoaded", (event) => {
  let msgIntro = document.getElementsByClassName("msg-intro");

  console.log(msgIntro);

  document.addEventListener('click', ()=> {
    msgIntro[0].classList.add("display-none");
  });
}); 