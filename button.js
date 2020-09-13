const Gpio = require('onoff').Gpio;


function debounce(callback, wait) {
  let timeout;
  return (...args) => {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => callback.apply(context, args), wait);
  };
}


class Button {
  constructor(pin) {
    this.button = new Gpio(pin, 'in', 'both');
    this.callbackPushEvent = () => {};
    const deb = debounce(this.handlePushButton.bind(this), 50);
    this.button.watch(deb);
  }

  onPush(cb) {
    this.callbackPushEvent = cb;
  }

  handlePushButton = (err, val) => {
    this.callbackPushEvent(err, val);
  }

}

module.exports = Button;