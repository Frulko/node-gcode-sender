const Gpio = require('onoff').Gpio;
const led = new Gpio(25, 'out');
// const button = new Gpio(23, 'in', 'both');


const Button = require('./button');

const b = new Button(23);
b.onPush((err, val) => {
  console.log('->', val)
})