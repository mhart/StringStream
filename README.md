# Decode streams into strings without setEncoding

```js
const fs = require('fs')
const zlib = require('zlib')
const strs = require('stringstream')

const utf8Stream = fs.createReadStream('massiveLogFile.gz')
  .pipe(zlib.createGunzip())
  .pipe(strs('utf8'))

utf8Stream.on('data', str => console.log(`This will be a string: ${str}`))
```

## API

  - `strs(to, [options])` – creates a transform stream that converts the input into strings in `to` encoding (eg, `utf8`, `hex`, `base64`)
  - `strs(from, to, [options])` – creates a transform stream converts the input from strings in `from` encoding to strings in `to` encoding

`options` can be anything compatible with the standard Node.js [`new stream.Transform([options])` constructor](https://nodejs.org/api/stream.html#stream_new_stream_transform_options)

## NB: This library was originally written before Node.js [correctly encoded base64 strings from streams](https://github.com/nodejs/node/commit/061f2075cf81017cdb40de80533ba18746743c94)

Back in the day, calling `.setEncoding('base64')` on a readable stream didn't
align correctly, which was one of the main reasons I wrote this library –
however this hasn't been the case for a long time, so this library is
now really only useful in scenarios where you don't want to call
`.setEncoding()` for whatever reason.

It also handles input and output text encodings:

```js
// Stream from utf8 to hex to base64... Why not, ay.
const hex64Stream = fs.createReadStream('myFile.txt')
  .pipe(strs('utf8', 'hex'))
  .pipe(strs('hex', 'base64'))
```

Also deals with `base64` output correctly by aligning each emitted data
chunk so that there are no dangling `=` characters:

```js
const stream = fs.createReadStream('myFile.jpg').pipe(strs('base64'))

let base64Str = ''

stream.on('data', data => base64Str += data)
stream.on('end', () => {
  console.log('My base64 encoded file is: ' + base64Str)
  console.log('Original file is: ' + Buffer.from(base64Str, 'base64'))
})
```
