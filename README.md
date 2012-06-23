# Decode streams into strings The Right Way(tm)

```javascript
fs = require('fs')
zlib = require('zlib')
strs = require('stringstream')

var stream = fs.createReadStream('massiveLogFile.gz')
  .pipe(zlib.createGunzip())
  .pipe(strs('utf8'))
```

No need to deal with `setEncoding()` weirdness, just compose streams
like they were supposed to be!

Handles input and output encoding:

```javascript
// Stream from utf8 to hex to base64... Why not ay.
fs.createReadStream('myFile').pipe(strs('utf8', 'hex')).pipe(strs('hex', 'base64'))
```

Also deals with `base64` output correctly by aligning each emitted data
chunk so that there are no dangling `=` characters:

```javascript
var stream = fs.createReadStream('massiveLogFile.gz').pipe(strs('base64'))

var fileStr = ''

stream.on('data', function(data) { fileStr += data })
stream.on('end', function() {
  console.log('My base64 encoded file is: ' + fileStr)
})
```
