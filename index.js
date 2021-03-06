const createKeccakHash = require('keccak')
const secp256k1 = require('secp256k1')
const assert = require('assert')
const rlp = require('rlp')
const BN = require('bn.js')
const createHash = require('create-hash')
const Buffer = require('safe-buffer').Buffer

const isHexPrefixed = require('is-hex-prefixed')
const stripHexPrefix = require('strip-hex-prefix')

/**
 * Adds "0x" to a given `String` if it does not already start with "0x"
 * @param {String} str
 * @return {String}
 */
function addHexPrefix (str) {
  if (typeof str !== 'string') {
    return str
  }

  return isHexPrefixed(str) ? str : `0x${str}`
}

/**
 * Pads a `String` to have an even length
 * @param {String} value
 * @return {String} output
 */
function padToEven (value) {
  var a = value // eslint-disable-line

  if (typeof a !== 'string') {
    throw new Error(`[util] while padding to even, value must be string, is currently ${typeof a}, while padToEven.`)
  }

  if (a.length % 2) {
    a = `0${a}`
  }

  return a
}

/**
 * Converts a `Number` into a hex `String`
 * @param {Number} i
 * @return {String}
 */
function intToHex (i) {
  var hex = i.toString(16) // eslint-disable-line

  return `0x${padToEven(hex)}`
}

/**
 * Converts an `Number` to a `Buffer`
 * @param {Number} i
 * @return {Buffer}
 */
function intToBuffer (i) {
  const hex = intToHex(i)

  return new Buffer(hex.slice(2), 'hex')
}

/**
 * Get the binary size of a string
 * @param {String} str
 * @return {Number}
 */
function getBinarySize (str) {
  if (typeof str !== 'string') {
    throw new Error(`[util] while getting binary size, method getBinarySize requires input 'str' to be type String, got '${typeof str}'.`)
  }

  return Buffer.byteLength(str, 'utf8')
}

/**
 * Returns TRUE if the first specified array contains all elements
 * from the second one. FALSE otherwise.
 *
 * @param {array} superset
 * @param {array} subset
 *
 * @returns {boolean}
 */
function arrayContainsArray (superset, subset, some) {
  if (Array.isArray(superset) !== true) { throw new Error(`[util] method arrayContainsArray requires input 'superset' to be an array got type '${typeof superset}'`) }
  if (Array.isArray(subset) !== true) { throw new Error(`[util] method arrayContainsArray requires input 'subset' to be an array got type '${typeof subset}'`) }

  return subset[(Boolean(some) && 'some') || 'every']((value) => (superset.indexOf(value) >= 0))
}

/**
 * Should be called to get utf8 from it's hex representation
 *
 * @method toUtf8
 * @param {String} string in hex
 * @returns {String} ascii string representation of hex value
 */
function toUtf8 (hex) {
  const bufferValue = new Buffer(padToEven(stripHexPrefix(hex).replace(/^0+|0+$/g, '')), 'hex')

  return bufferValue.toString('utf8')
}

/**
 * Should be called to get ascii from it's hex representation
 *
 * @method toAscii
 * @param {String} string in hex
 * @returns {String} ascii string representation of hex value
 */
function toAscii (hex) {
  var str = '' // eslint-disable-line
  var i = 0, l = hex.length // eslint-disable-line

  if (hex.substring(0, 2) === '0x') {
    i = 2
  }

  for (; i < l; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16)
    str += String.fromCharCode(code)
  }

  return str
}

/**
 * Should be called to get hex representation (prefixed by 0x) of utf8 string
 *
 * @method fromUtf8
 * @param {String} string
 * @param {Number} optional padding
 * @returns {String} hex representation of input string
 */
function fromUtf8 (stringValue) {
  const str = new Buffer(stringValue, 'utf8')

  return `0x${padToEven(str.toString('hex')).replace(/^0+|0+$/g, '')}`
}

/**
 * Should be called to get hex representation (prefixed by 0x) of ascii string
 *
 * @method fromAscii
 * @param {String} string
 * @param {Number} optional padding
 * @returns {String} hex representation of input string
 */
function fromAscii (stringValue) {
  var hex = '' // eslint-disable-line
  for (var i = 0; i < stringValue.length; i++) { // eslint-disable-line
    const code = stringValue.charCodeAt(i)
    const n = code.toString(16)
    hex += n.length < 2 ? `0${n}` : n
  }

  return `0x${hex}`
}

/**
 * getKeys([{a: 1, b: 2}, {a: 3, b: 4}], 'a') => [1, 3]
 *
 * @method getKeys get specific key from inner object array of objects
 * @param {String} params
 * @param {String} key
 * @param {Boolean} allowEmpty
 * @returns {Array} output just a simple array of output keys
 */
function getKeys (params, key, allowEmpty) {
  if (!Array.isArray(params)) { throw new Error(`[util] method getKeys expecting type Array as 'params' input, got '${typeof params}'`) }
  if (typeof key !== 'string') { throw new Error(`[util] method getKeys expecting type String for input 'key' got '${typeof key}'.`) }

  var result = [] // eslint-disable-line

  for (var i = 0; i < params.length; i++) { // eslint-disable-line
    var value = params[i][key] // eslint-disable-line
    if (allowEmpty && !value) {
      value = ''
    } else if (typeof (value) !== 'string') {
      throw new Error('invalid abi')
    }
    result.push(value)
  }

  return result
}

/**
 * Is the string a hex string.
 *
 * @method check if string is hex string of specific length
 * @param {String} value
 * @param {Number} length
 * @returns {Boolean} output the string is a hex string
 */
function isHexString (value, length) {
  if (typeof (value) !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false
  }

  if (length && value.length !== 2 + 2 * length) { return false }

  return true
}

/**
 * the max integer that this VM can handle (a ```BN```)
 * @var {BN} MAX_INTEGER
 */
const MAX_INTEGER = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)

/**
 * 2^256 (a ```BN```)
 * @var {BN} TWO_POW256
 */
const TWO_POW256 = new BN('10000000000000000000000000000000000000000000000000000000000000000', 16)

/**
 * Keccak-256 hash of null (a ```String```)
 * @var {String} KECCAK256_NULL_S
 */
const KECCAK256_NULL_S = 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
const SHA3_NULL_S = KECCAK256_NULL_S

/**
 * Keccak-256 hash of null (a ```Buffer```)
 * @var {Buffer} KECCAK256_NULL
 */
const KECCAK256_NULL = Buffer.from(KECCAK256_NULL_S, 'hex')
const SHA3_NULL = KECCAK256_NULL

/**
 * Keccak-256 of an RLP of an empty array (a ```String```)
 * @var {String} KECCAK256_RLP_ARRAY_S
 */
const KECCAK256_RLP_ARRAY_S = '1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347'
const SHA3_RLP_ARRAY_S = KECCAK256_RLP_ARRAY_S

/**
 * Keccak-256 of an RLP of an empty array (a ```Buffer```)
 * @var {Buffer} KECCAK256_RLP_ARRAY
 */
const KECCAK256_RLP_ARRAY = Buffer.from(KECCAK256_RLP_ARRAY_S, 'hex')
const SHA3_RLP_ARRAY = KECCAK256_RLP_ARRAY

/**
 * Keccak-256 hash of the RLP of null  (a ```String```)
 * @var {String} KECCAK256_RLP_S
 */
const KECCAK256_RLP_S = '56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
const SHA3_RLP_S = KECCAK256_RLP_S

/**
 * Keccak-256 hash of the RLP of null (a ```Buffer```)
 * @var {Buffer} KECCAK256_RLP
 */
const KECCAK256_RLP = Buffer.from(KECCAK256_RLP_S, 'hex')
const SHA3_RLP = KECCAK256_RLP

/**
 * [`BN`](https://github.com/indutny/bn.js)
 * @var {Function}
 */
// exports.BN = BN

/**
 * [`rlp`](https://github.com/icjs/rlp)
 * @var {Function}
 */
// exports.rlp = rlp

/**
 * [`secp256k1`](https://github.com/cryptocoinjs/secp256k1-node/)
 * @var {Object}
 */

// exports.secp256k1 = secp256k1

/**
 * Returns a buffer filled with 0s
 * @method zeros
 * @param {Number} bytes  the number of bytes the buffer should be
 * @return {Buffer}
 */
function zeros (bytes) {
  return Buffer.allocUnsafe(bytes).fill(0)
}

/**
 * Returns a zero address
 * @method zeroAddress
 * @return {String}
 */
function zeroAddress () {
  var addressLength = 20
  var zeroAddress2 = zeros(addressLength)
  return bufferToHex(zeroAddress2)
}

/**
 * Left Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @method lsetLength
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @param {Boolean} [right=false] whether to start padding form the left or right
 * @return {Buffer|Array}
 */
function setLengthLeft (msg, length, right) {
  const buf = zeros(length)
  msg = toBuffer(msg)
  if (right) {
    if (msg.length < length) {
      msg.copy(buf)
      return buf
    }
    return msg.slice(0, length)
  } else {
    if (msg.length < length) {
      msg.copy(buf, length - msg.length)
      return buf
    }
    return msg.slice(-length)
  }
}

const setLength = setLengthLeft

/**
 * Right Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @return {Buffer|Array}
 */
function setLengthRight (msg, length) {
  return setLength(msg, length, true)
}

/**
 * Trims leading zeros from a `Buffer` or an `Array`
 * @param {Buffer|Array|String} a
 * @return {Buffer|Array|String}
 */
function stripZeros (a) {
  a = stripHexPrefix(a)
  let first = a[0]
  while (a.length > 0 && first.toString() === '0') {
    a = a.slice(1)
    first = a[0]
  }
  return a
}

const unpad = stripZeros

/**
 * Attempts to turn a value into a `Buffer`. As input it supports `Buffer`, `String`, `Number`, null/undefined, `BN` and other objects with a `toArray()` method.
 * @param {*} v the value
 */
function toBuffer (v) {
  if (!Buffer.isBuffer(v)) {
    if (Array.isArray(v)) {
      v = Buffer.from(v)
    } else if (typeof v === 'string') {
      if (isHexString(v)) {
        v = Buffer.from(padToEven(stripHexPrefix(v)), 'hex')
      } else {
        v = Buffer.from(v)
      }
    } else if (typeof v === 'number') {
      v = intToBuffer(v)
    } else if (v === null || v === undefined) {
      v = Buffer.allocUnsafe(0)
    } else if (BN.isBN(v)) {
      v = v.toArrayLike(Buffer)
    } else if (v.toArray) {
      // converts a BN to a Buffer
      v = Buffer.from(v.toArray())
    } else {
      throw new Error('invalid type')
    }
  }
  return v
}

/**
 * Converts a `Buffer` to a `Number`
 * @param {Buffer} buf
 * @return {Number}
 * @throws If the input number exceeds 53 bits.
 */
function bufferToInt (buf) {
  return new BN(toBuffer(buf)).toNumber()
}

/**
 * Converts a `Buffer` into a hex `String`
 * @param {Buffer} buf
 * @return {String}
 */
function bufferToHex (buf) {
  buf = toBuffer(buf)
  return '0x' + buf.toString('hex')
}

/**
 * Interprets a `Buffer` as a signed integer and returns a `BN`. Assumes 256-bit numbers.
 * @param {Buffer} num
 * @return {BN}
 */
function fromSigned (num) {
  return new BN(num).fromTwos(256)
}

/**
 * Converts a `BN` to an unsigned integer and returns it as a `Buffer`. Assumes 256-bit numbers.
 * @param {BN} num
 * @return {Buffer}
 */
function toUnsigned (num) {
  return Buffer.from(num.toTwos(256).toArray())
}

/**
 * Creates Keccak hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the Keccak width
 * @return {Buffer}
 */
function keccak (a, bits) {
  a = toBuffer(a)
  if (!bits) bits = 256

  return createKeccakHash('keccak' + bits).update(a).digest()
}

/**
 * Creates SHA-3 (Keccak) hash of the input [OBSOLETE]
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the SHA-3 width
 * @return {Buffer}
 */
const sha3 = keccak

/**
 * Creates SHA256 hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
function sha256 (a) {
  a = toBuffer(a)
  return createHash('sha256').update(a).digest()
}

/**
 * Creates RIPEMD160 hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Boolean} padded whether it should be padded to 256 bits or not
 * @return {Buffer}
 */
function ripemd160 (a, padded) {
  a = toBuffer(a)
  const hash = createHash('rmd160').update(a).digest()
  if (padded === true) {
    return setLength(hash, 32)
  } else {
    return hash
  }
}

/**
 * Creates SHA-3 hash of the RLP encoded version of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
function rlphash (a) {
  return keccak(rlp.encode(a))
}

/**
 * Checks if the private key satisfies the rules of the curve secp256k1.
 * @param {Buffer} privateKey
 * @return {Boolean}
 */
function isValidPrivate (privateKey) {
  return secp256k1.privateKeyVerify(privateKey)
}

/**
 * Checks if the public key satisfies the rules of the curve secp256k1
 * and the requirements of IrChain.
 * @param {Buffer} publicKey The two points of an uncompressed key, unless sanitize is enabled
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Boolean}
 */
function isValidPublic (publicKey, sanitize) {
  if (publicKey.length === 64) {
    // Convert to SEC1 for secp256k1
    return secp256k1.publicKeyVerify(Buffer.concat([Buffer.from([4]), publicKey]))
  }

  if (!sanitize) {
    return false
  }

  return secp256k1.publicKeyVerify(publicKey)
}

/**
 * Returns the irchain address of a given public key.
 * Accepts "IrChain public keys" and SEC1 encoded keys.
 * @param {Buffer} pubKey The two points of an uncompressed key, unless sanitize is enabled
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Buffer}
 */
function publicToAddress (pubKey, sanitize) {
  pubKey = toBuffer(pubKey)
  if (sanitize && (pubKey.length !== 64)) {
    pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1)
  }
  assert(pubKey.length === 64)
  // Only take the lower 160bits of the hash
  return keccak(pubKey).slice(-20)
}

const pubToAddress = publicToAddress

/**
 * Returns the irchain public key of a given private key
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
function privateToPublic (privateKey) {
  privateKey = toBuffer(privateKey)
  // skip the type flag and use the X, Y points
  return secp256k1.publicKeyCreate(privateKey, false).slice(1)
}

/**
 * Converts a public key to the IrChain format.
 * @param {Buffer} publicKey
 * @return {Buffer}
 */
function importPublic (publicKey) {
  publicKey = toBuffer(publicKey)
  if (publicKey.length !== 64) {
    publicKey = secp256k1.publicKeyConvert(publicKey, false).slice(1)
  }
  return publicKey
}

/**
 * ECDSA sign
 * @param {Buffer} msgHash
 * @param {Buffer} privateKey
 * @return {Object}
 */
function ecsign (msgHash, privateKey) {
  const sig = secp256k1.sign(msgHash, privateKey)

  const ret = {}
  ret.r = sig.signature.slice(0, 32)
  ret.s = sig.signature.slice(32, 64)
  ret.v = sig.recovery + 27
  return ret
}

/**
 * Returns the keccak-256 hash of `message`, prefixed with the header used by the `irc_sign` RPC call.
 * The output of this function can be fed into `ecsign` to produce the same signature as the `irc_sign`
 * call for a given `message`, or fed to `ecrecover` along with a signature to recover the public key
 * used to produce the signature.
 * @param message
 * @returns {Buffer} hash
 */
function hashPersonalMessage (message) {
  const prefix = toBuffer('\u0019IrChain Signed Message:\n' + message.length.toString())
  return keccak(Buffer.concat([prefix, message]))
}

/**
 * ECDSA public key recovery from signature
 * @param {Buffer} msgHash
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @return {Buffer} publicKey
 */
function ecrecover (msgHash, v, r, s) {
  const signature = Buffer.concat([setLength(r, 32), setLength(s, 32)], 64)
  const recovery = v - 27
  if (recovery !== 0 && recovery !== 1) {
    throw new Error('Invalid signature v value')
  }
  const senderPubKey = secp256k1.recover(msgHash, signature, recovery)
  return secp256k1.publicKeyConvert(senderPubKey, false).slice(1)
}

/**
 * Convert signature parameters into the format of `irc_sign` RPC method
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @return {String} sig
 */
function toRpcSig (v, r, s) {
  // NOTE: with potential introduction of chainId this might need to be updated
  if (v !== 27 && v !== 28) {
    throw new Error('Invalid recovery id')
  }

  return bufferToHex(Buffer.concat([
    setLengthLeft(r, 32),
    setLengthLeft(s, 32),
    toBuffer(v - 27),
  ]))
}

/**
 * Convert signature format of the `irc_sign` RPC method to signature parameters
 * NOTE: all because of a bug in girc: https://github.com/irchain/go-irchain/issues/2053
 * @param {String} sig
 * @return {Object}
 */
function fromRpcSig (sig) {
  sig = toBuffer(sig)

  // NOTE: with potential introduction of chainId this might need to be updated
  if (sig.length !== 65) {
    throw new Error('Invalid signature length')
  }

  let v = sig[64]
  // support both versions of `irc_sign` responses
  if (v < 27) {
    v += 27
  }

  return {
    v: v,
    r: sig.slice(0, 32),
    s: sig.slice(32, 64),
  }
}

/**
 * Returns the irchain address of a given private key
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
function privateToAddress (privateKey) {
  return publicToAddress(privateToPublic(privateKey))
}

/**
 * Checks if the address is a valid. Accepts checksummed addresses too
 * @param {String} address
 * @return {Boolean}
 */
function isValidAddress (address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

/**
 * Checks if a given address is a zero address
 * @method isZeroAddress
 * @param {String} address
 * @return {Boolean}
 */
function isZeroAddress (address) {
  const zeroAddress2 = zeroAddress()
  return zeroAddress2 === addHexPrefix(address)
}

/**
 * Returns a checksummed address
 * @param {String} address
 * @return {String}
 */
function toChecksumAddress (address) {
  address = stripHexPrefix(address).toLowerCase()
  const hash = keccak(address).toString('hex')
  let ret = '0x'

  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

/**
 * Checks if the address is a valid checksummed address
 * @param {Buffer} address
 * @return {Boolean}
 */
function isValidChecksumAddress (address) {
  return isValidAddress(address) && (toChecksumAddress(address) === address)
}

/**
 * Generates an address of a newly created contract
 * @param {Buffer} from the address which is creating this new address
 * @param {Buffer} nonce the nonce of the from account
 * @return {Buffer}
 */
function generateAddress (from, nonce) {
  from = toBuffer(from)
  nonce = new BN(nonce)

  if (nonce.isZero()) {
    // in RLP we want to encode null in the case of zero nonce
    // read the RLP documentation for an answer if you dare
    nonce = null
  } else {
    nonce = Buffer.from(nonce.toArray())
  }

  // Only take the lower 160bits of the hash
  return rlphash([from, nonce]).slice(-20)
}

/**
 * Returns true if the supplied address belongs to a precompiled account (Byzantium)
 * @param {Buffer|String} address
 * @return {Boolean}
 */
function isPrecompiled (address) {
  const a = unpad(address)
  return a.length === 1 && a[0] >= 1 && a[0] <= 8
}

/**
 * Validate ECDSA signature
 * @method isValidSignature
 * @param {Buffer} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @param {Boolean} [homestead=true]
 * @return {Boolean}
 */

function isValidSignature (v, r, s, homestead) {
  const SECP256K1_N_DIV_2 = new BN('7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0', 16)
  const SECP256K1_N = new BN('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16)

  if (r.length !== 32 || s.length !== 32) {
    return false
  }

  if (v !== 27 && v !== 28) {
    return false
  }

  r = new BN(r)
  s = new BN(s)

  if (r.isZero() || r.gt(SECP256K1_N) || s.isZero() || s.gt(SECP256K1_N)) {
    return false
  }

  if ((homestead === false) && (new BN(s).cmp(SECP256K1_N_DIV_2) === 1)) {
    return false
  }

  return true
}

/**
 * Converts a `Buffer` or `Array` to JSON
 * @param {Buffer|Array} ba
 * @return {Array|String|null}
 */
function baToJSON (ba) {
  if (Buffer.isBuffer(ba)) {
    return '0x' + ba.toString('hex')
  } else if (ba instanceof Array) {
    const array = []
    for (let i = 0; i < ba.length; i++) {
      array.push(baToJSON(ba[i]))
    }
    return array
  }
}

/**
 * Defines properties on a `Object`. It make the assumption that underlying data is binary.
 * @param {Object} self the `Object` to define properties on
 * @param {Array} fields an array fields to define. Fields can contain:
 * * `name` - the name of the properties
 * * `length` - the number of bytes the field can have
 * * `allowLess` - if the field can be less than the length
 * * `allowEmpty`
 * @param {*} data data to be validated against the definitions
 */
function defineProperties (self, fields, data) {
  self.raw = []
  self._fields = []

  // attach the `toJSON`
  self.toJSON = function (label) {
    if (label) {
      const obj = {}
      self._fields.forEach((field) => {
        obj[field] = '0x' + self[field].toString('hex')
      })
      return obj
    }
    return baToJSON(this.raw)
  }

  self.serialize = function serialize () {
    return rlp.encode(self.raw)
  }

  fields.forEach((field, i) => {
    self._fields.push(field.name)

    function getter () {
      return self.raw[i]
    }

    function setter (v) {
      v = toBuffer(v)

      if (v.toString('hex') === '00' && !field.allowZero) {
        v = Buffer.allocUnsafe(0)
      }

      if (field.allowLess && field.length) {
        v = stripZeros(v)
        assert(field.length >= v.length, 'The field ' + field.name + ' must not have more ' + field.length + ' bytes')
      } else if (!(field.allowZero && v.length === 0) && field.length) {
        assert(field.length === v.length, 'The field ' + field.name + ' must have byte length of ' + field.length)
      }

      self.raw[i] = v
    }

    Object.defineProperty(self, field.name, {
      enumerable  : true,
      configurable: true,
      get         : getter,
      set         : setter,
    })

    if (field.default) {
      self[field.name] = field.default
    }

    // attach alias
    if (field.alias) {
      Object.defineProperty(self, field.alias, {
        enumerable  : false,
        configurable: true,
        set         : setter,
        get         : getter,
      })
    }
  })

  // if the constuctor is passed data
  if (data) {
    if (typeof data === 'string') {
      data = Buffer.from(stripHexPrefix(data), 'hex')
    }

    if (Buffer.isBuffer(data)) {
      data = rlp.decode(data)
    }

    if (Array.isArray(data)) {
      if (data.length > self._fields.length) {
        throw (new Error('wrong number of fields in data'))
      }

      // make sure all the items are buffers
      data.forEach((d, i) => {
        self[self._fields[i]] = toBuffer(d)
      })
    } else if (typeof data === 'object') {
      const keys = Object.keys(data)
      fields.forEach((field) => {
        if (keys.indexOf(field.name) !== -1) self[field.name] = data[field.name]
        if (keys.indexOf(field.alias) !== -1) self[field.alias] = data[field.alias]
      })
    } else {
      throw new Error('invalid data')
    }
  }
}

module.exports = {
  arrayContainsArray,
  intToBuffer,
  getBinarySize,
  isHexPrefixed,
  stripHexPrefix,
  padToEven,
  intToHex,
  fromAscii,
  fromUtf8,
  toAscii,
  toUtf8,
  getKeys,
  isHexString,
  addHexPrefix,

  MAX_INTEGER,
  TWO_POW256,
  KECCAK256_NULL_S,
  SHA3_NULL_S,
  KECCAK256_NULL,
  SHA3_NULL,
  KECCAK256_RLP_ARRAY_S,
  SHA3_RLP_ARRAY_S,
  KECCAK256_RLP_ARRAY,
  SHA3_RLP_ARRAY,
  KECCAK256_RLP_S,
  SHA3_RLP_S,
  KECCAK256_RLP,
  SHA3_RLP,
  rlp,
  BN,
  secp256k1,
  zeros,
  zeroAddress,
  setLengthLeft,
  setLength,
  setLengthRight,
  stripZeros,
  unpad,
  toBuffer,
  bufferToInt,
  bufferToHex,
  fromSigned,
  toUnsigned,
  keccak,
  sha3,
  sha256,
  ripemd160,
  rlphash,
  isValidPrivate,
  isValidPublic,
  publicToAddress,
  pubToAddress,
  privateToPublic,
  importPublic,
  ecsign,
  hashPersonalMessage,
  ecrecover,
  toRpcSig,
  fromRpcSig,
  privateToAddress,
  isValidAddress,
  isZeroAddress,
  toChecksumAddress,
  isValidChecksumAddress,
  generateAddress,
  isPrecompiled,
  isValidSignature,
  baToJSON,
  defineProperties,
}
