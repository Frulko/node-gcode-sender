const express = require('express')
const app = express()
const port = 3000

Array.prototype.sample = function(){
  return this[Math.floor(Math.random()*this.length)];
}

const scripts = [
  require('./plop')
];

app.get('/', (req, res) => { // HOMEPAGE CONTROL ROUTE
  res.send('Hello World!')
})

app.get('/calibrate', (req, res) => { // SEND CALIBRATE COMMAND
  res.send('calibrate')

})

app.get('/add', (req, res) => { // SEND CALIBRATE COMMAND
  res.send('add')
  var name = require.resolve('./' +req.query.s);
  if (typeof name !== 'undefined') {
    delete require.cache[name];
  }

  scripts.push(require('./' + req.query.s))
})

app.get('/run', (req, res) => { // SEND CALIBRATE COMMAND
  res.send('run')
  
  const runnableScript = scripts[scripts.length -1];
  runnableScript();
})

app.get('/delete', (req, res) => { // SEND CALIBRATE COMMAND
  res.send('delete')
  var name = require.resolve('./' +req.query.s);
  delete require.cache[name];
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})