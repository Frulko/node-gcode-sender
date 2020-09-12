const SerialPort = require('serialport')
const fs = require('fs')
const readline = require('readline')
var ProgressBar = require('progress');

class GCodeSender {

  constructor() {

    this.OKCommand = new Uint8Array([0x6f, 0x6b, 0x0d, 0x0a]); // eg: o k \r \n
    this.isWaitingApprove = false;
    this.isConnected = false;
    this.isReady = false;


    this.serialInstance = null;
    this.connexionPortAddress = '/dev/tty.wchusbserial14430'; 
    this.connexionBaudRate = 115200;

    this.firstStart = true;
    this.queueCommand = [];

    
    this.send('M3S20');
  
    const rl = readline.createInterface({
        input: fs.createReadStream('./test.gcode'),
        output: process.stdout,
        terminal: false
    });

    this.cpt = 0;

    rl.on('line', (line) => {
      if (line[0] !== ';') {
        this.send(line);

        this.cpt += 1;
      }
    });

    this.bar = null;

    rl.on('close', () => {
      console.log('end of file');
      this.bar = new ProgressBar(':bar', { total: this.cpt });
      setTimeout(() => {
        this.connect();
      }, 2000);
    });

 
  }

  connect() {
    console.log('cc', this.connexionPortAddress)
    this.serialInstance = new SerialPort(this.connexionPortAddress, { autoOpen: false, baudRate: this.connexionBaudRate });
    this.serialInstance.open((err) => {
      if (err) {
        return this.onError(err);
      }
    });

    this.serialInstance.on('open', this.onOpen.bind(this))
    this.serialInstance.on('data', this.onData.bind(this))
  }

  onOpen() {
    console.log('OPEN');
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
    this.executeCommand();
  }

  executeCommand() {

    if (!this.isConnected) {
      return;
    }

    if (typeof this.queueCommand[0] === 'undefined' && this.isWaitingApprove) {
      return;
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

const s = new GCodeSender();