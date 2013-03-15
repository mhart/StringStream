var fs   = require('fs')
var strs = require('../stringstream')

var base64Stream = fs.createReadStream('./base64data')
  .pipe(strs('base64', 'utf8'))
  .pipe(strs('utf8', 'base64'))

base64Stream.pipe(fs.createWriteStream('./output'))