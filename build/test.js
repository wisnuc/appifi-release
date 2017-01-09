'use strict';

var crypto = require('crypto');

var md4Encrypt = function md4Encrypt(text) {
  return crypto.createHash('md4').update(Buffer.from(text, 'utf16le')).digest('hex').toUpperCase();
};

console.log(md4Encrypt('hello'));
console.log(md4Encrypt(''));