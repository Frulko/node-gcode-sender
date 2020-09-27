const SerialPort = require('serialport')
const fs = require('fs')
const readline = require('readline')
var ProgressBar = require('progress');
var stream = require('stream');

class GCodeSender {

  constructor() {
    this.config = {
      "address": '/dev/ttyUSB0',
      "port": 115200,
      "fileName": "./output.gcode"
    };

    this.OKCommand = new Uint8Array([0x6f, 0x6b, 0x0d, 0x0a]); // eg: o k \r \n
    this.isWaitingApprove = false;
    this.isConnected = false;
    this.isReady = false;
    this.firstStart = true;
    this.queueCommand = [];
    this.isFinished = true;
    this.handleLoadClose = () => {};

    
    // this.send('M3S20');
    // this.send('M3S45');

    // this.init();
  // this.loadFile();

    // this.calibrate(false);
  }

  loadConfig() {
    
  }

  loadFile(fileName) {
    this.stream = fs.createReadStream(fileName)
    this.readLineByLine();
  }

  setGCode(gcode) {
    var buf = new Buffer.from(gcode);
    var bufferStream = new stream.PassThrough();
    this.stream = bufferStream.end(buf);
    this.readLineByLine();
  }

  readLineByLine() {
    const rl = readline.createInterface({
        input: this.stream,
        output: process.stdout,
        terminal: false
    });


    rl.on('line', (line) => {
      if (line[0] !== ';') {
        this.send(line);
      }
    });


    rl.on('close', () => {
      setTimeout(() => {
        // this.init();
        this.handleLoadClose();
      }, 500);
    });
  }

  onLoadFinished(cb) {
    this.handleLoadClose = cb;
  }

  calibrate(isDown) {
  
    this.send('M3S20');
    if (isDown) {
      this.send('M3S90');
    }

    this.init();
  }

  init() {
    this.serialInstance = null;
    this.connexionPortAddress = this.config.address; 
    this.connexionBaudRate = this.config.port;
    this.bar = new ProgressBar(':bar', { total: this.queueCommand.length });
    console.log('-', this.queueCommand.length)
    this.connect();
  }

  connect() {
    if (this.serialInstance !== null) {
      this.disconnect();
    }

    console.log('Atempt to connect to', this.connexionPortAddress)
    this.serialInstance = new SerialPort(this.connexionPortAddress, { autoOpen: false, baudRate: this.connexionBaudRate });
    this.serialInstance.open((err) => {
      if (err) {
        return this.onError(err);
      }
    });

    this.serialInstance.on('open', this.onOpen.bind(this))
    this.serialInstance.on('data', this.onData.bind(this))
  }

  disconnect() {
    this.serialInstance.disconnect();
  }

  onOpen() {
    console.log('Connected to plotter !');
    this.isConnected = true;
    this.executeCommand();
  }
  
  onError(err) {
    console.log('[ERROR] Cannot open port', err.message);
  }
  
  onData(data) {
    const stringData = data.toString();
    if (this.isConnected && !this.isReady && stringData.indexOf('Grbl 0.9i') !== -1) {
      this.isReady = true;
    }

    if (this.queueCommand.length > 0 && this.firstStart) {
      this.executeCommand();
      this.isFinished = false;
      this.firstStart = false;
    }

    
    if (this.queueCommand.length > 0 && this.isWaitingApprove && this.checkApprove(data) ) {
      this.isWaitingApprove = false;
      this.queueCommand.shift();
      this.bar.tick();
      this.executeCommand();
    }
  }

  send(command) {
    this.queueCommand.push(command);
    // this.executeCommand();
  }

  executeCommand() {

    if (!this.isConnected) {
      return;
    }

    if (typeof this.queueCommand[0] === 'undefined' && this.isWaitingApprove) {
      return;
    }

    if (this.queueCommand.length < 1) {
      this.isFinished = true;
    }

    this.isWaitingApprove = true;
    const formattedCommand = `${this.queueCommand[0]}\r\n`;
    this.serialInstance.write(Buffer.from(formattedCommand));
  }

  checkApprove(data) {
    // console.log('>>>', data.toString().indexOf('ok'));
    return data.toString().indexOf('ok') !== -1;
  }

}

module.exports = GCodeSender;