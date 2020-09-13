const Button = require('./button');
const GCodeSender = require('./app');
const script1 = require('../canvas-sketch-headless-gcode/script-01');
const script2 = require('../canvas-sketch-headless-gcode/script-02');
const script3 = require('../canvas-sketch-headless-gcode/script-03');
const scriptTest = require('../canvas-sketch-headless-gcode/script-test');

const scripts = [
  // scriptTest
  script1,
  script2,
  script3
];

Array.prototype.sample = function(){
  return this[Math.floor(Math.random()*this.length)];
}


// const d = script1();
// console.log(d)

const s = new GCodeSender();
// s.setGCode(d);
// s.loadFile('./output.gcode');
s.init();
s.onLoadFinished(() => {
  console.log('finish load');
  s.executeCommand();
});

const b = new Button(23);
b.onPush((err, val) => {
  // console.log('->', val)
  if (val == 1 && s.isFinished) {
    // s.init();
    const sc = scripts.sample();
    s.setGCode(sc());
    
    // s.init();
    // console.log('here');
  } 

  if (val == 1) {
    console.log('>>', s.isFinished);
  }
})