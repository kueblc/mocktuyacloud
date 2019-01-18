const dgram = require('dgram');
const delay = require('delay');
const { debug } = require('./logger').log("TuyaLink")

/**
* A lower level option for linking
* devices. Use only if you're not generating
* a token through `@tuyapi/cloud`. Exported
* as `(@tuyapi/link).manual`.
* Currently has no options, but some may
* be added in the future.
* @class
* @param {Object} options construction options
* @example
* const register = new TuyaLink.manual({});
*/
function TuyaLink(options) {
  this.abortBroadcasting = false;

  return options;
}

/**
* Thin wrapper for this.sendSmartLinkStart()
* and this.sendSmartLinkData(). Unless you
* have a special use case, prefer this method
* over calling this.sendSmartLinkStart() and
* this.sendSmartLinkData() directly.
* @param {Object} options
* options
* @param {String} options.region
* region (see smartLinkEncode() for options)
* @param {String} options.token
* generated token to send
* @param {String} options.secret
* generated secret to send
* @param {String} options.ssid
* SSID to connect to
* @param {String} options.wifiPassword
* password of WiFi
* @example
* device.registerSmartLink({region: 'AZ',
*                           token: '00000000',
*                           secret: '0101',
*                           ssid: 'Example SSID',
*                           wifiPassword: 'example-password'}).then(() => {
*  console.log('Done!');
* });
* @returns {Promise<Undefined>} A Promise that resolves when all data has been transmitted
*/
TuyaLink.prototype.registerSmartLink = function (options) {
  // Check arguments
  if (options.region.length !== 2) {
    throw new Error('Invalid region');
  }
  if (options.token.length !== 8) {
    throw new Error('Invalid token');
  }
  if (options.secret.length !== 4) {
    throw new Error('Invalid secret');
  }
  if (options.ssid.length > 32) {
    throw new Error('Invalid SSID');
  }
  if (options.wifiPassword.length > 64) {
    throw new Error('Invalid WiFi password');
  }

  debug('Sending SmartLink initialization packets');
  const that = this;
  return new Promise(async (resolve, reject) => {
    try {
      await this.sendSmartLinkStart();
      debug('Sending SmartLink data packets');
//      await delay(120)
      await this.sendSmartLinkData(that.smartLinkEncode(options));
      debug('Finished sending packets.');
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

/**
* Transmits start pattern of packets
* (1, 3, 6, 10) 144 times with
* a delay between transmits.
* @returns {Promise<Undefined>} A Promise that resolves when data has been transmitted
*/
let gap = 2

TuyaLink.prototype.sendSmartLinkStart = function () {
  const that = this;
  return new Promise((async (resolve, reject) => {
    try {
      /* eslint-disable no-await-in-loop */ //143/2
      for (let x = 0; x < 32; x++) {
        await that._broadcastUDP(1);
        await delay(gap)
        await that._broadcastUDP(3);
        await delay(gap)
        await that._broadcastUDP(6);
        await delay(gap)
        await that._broadcastUDP(10);
        await delay(gap)
        await that._broadcastUDP(1);
        await delay(gap)
        await that._broadcastUDP(3);
        await delay(gap)
        await that._broadcastUDP(6);
        await delay(gap)
        await that._broadcastUDP(10);
        await delay(40)//70+x%8)
      }
      /* eslint-enable no-await-in-loop */

      resolve();
    } catch (err) {
      reject(err);
    }
  }));
};

/**
* Transmits provided data
* as UDP packet lengths 30
* times with a delay between
* transmits.
* @param {Array} data of packet lengths to send
* @returns {Promise<Undefined>} A Promise that resolves when data has been transmitted
*/
TuyaLink.prototype.sendSmartLinkData = function (data) {
  const that = this;

  return new Promise(async (resolve, reject) => {
    try {

      /* eslint-disable no-await-in-loop */
      for (let x = 0; x < 10 && !this.abortBroadcasting; x++) {
        await delay(160);

        await that._asyncForEach(data, async b => {
          await that._broadcastUDP(b);
          await delay(gap)
        }); // 17, 40, 53, 79

      }
      /* eslint-enable no-await-in-loop */

      this.abortBroadcasting = false;

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

/**
* Aborts broadcasting UDP packets.
*/
TuyaLink.prototype.abortBroadcastingData = function () {
  debug('Aborting broadcast of data...');
  this.abortBroadcasting = true;
};

/**
* Encodes data as UDP packet
* lengths.
* @param {Object} options options
* @param {String} options.region
* two-letter region (AZ=Americas, AY=Asia, EU=Europe)
* @param {String} options.token token
* @param {String} options.secret secret
* @param {String} options.ssid SSID
* @param {String} options.wifiPassword
* password of WiFi
* @returns {Array} array of packet lengths
*/
TuyaLink.prototype.smartLinkEncode = function (options) {
  // Convert strings to Buffers
  const wifiPasswordBytes = Buffer.from(options.wifiPassword);
  const regionTokenSecretBytes = Buffer.from(options.region +
                                             options.token + options.secret);
  const ssidBytes = Buffer.from(options.ssid);

  // Calculate size of byte array
  const rawByteArray = Buffer.alloc(1 +
                                  wifiPasswordBytes.length +
                                  1 +
                                  regionTokenSecretBytes.length +
                                  ssidBytes.length);

  let rawByteArrayIndex = 0;

  // Write WiFi password length
  rawByteArray.writeInt8(this._getLength(options.wifiPassword), rawByteArrayIndex);
  rawByteArrayIndex++;

  // Write WiFi password
  wifiPasswordBytes.copy(rawByteArray, rawByteArrayIndex);
  rawByteArrayIndex += wifiPasswordBytes.length;

  // Write region token secret length
  rawByteArray.writeInt8(this._getLength(regionTokenSecretBytes), rawByteArrayIndex);
  rawByteArrayIndex++;

  // Write region token secret bytes
  regionTokenSecretBytes.copy(rawByteArray, rawByteArrayIndex);
  rawByteArrayIndex += regionTokenSecretBytes.length;

  // Write WiFi SSID bytes
  ssidBytes.copy(rawByteArray, rawByteArrayIndex);
  rawByteArrayIndex += ssidBytes.length;

  if (rawByteArray.length !== rawByteArrayIndex) {
    throw new Error('Byte buffer filled improperly');
  }

  // Now, encode above data into packet lengths
  const rawDataLengthRoundedUp = this._rounder(rawByteArray.length, 4);

  const encodedData = [];

  // First 4 bytes of header
  const stringLength = (wifiPasswordBytes.length +
                        regionTokenSecretBytes.length + ssidBytes.length + 2) % 256;
  const stringLengthCRC = this._tuyaCRC8([stringLength]);

  // Length encoded into the first two bytes based at 16 and then 32
  encodedData[0] = (stringLength / 16) | 16;
  encodedData[1] = (stringLength % 16) | 32;
  // Length CRC encoded into the next two bytes based at 46 and 64
  encodedData[2] = (stringLengthCRC / 16) | 48;
  encodedData[3] = (stringLengthCRC % 16) | 64;

  // Rest of data
  let encodedDataIndex = 4;
  let sequenceCounter = 0;

  for (let x = 0; x < rawDataLengthRoundedUp; x += 4) {
    // Build CRC buffer, using data from rawByteArray or 0 values if too long
    const crcData = [];
    crcData[0] = sequenceCounter++;
    crcData[1] = x + 0 < rawByteArray.length ? rawByteArray[x + 0] : 0;
    crcData[2] = x + 1 < rawByteArray.length ? rawByteArray[x + 1] : 0;
    crcData[3] = x + 2 < rawByteArray.length ? rawByteArray[x + 2] : 0;
    crcData[4] = x + 3 < rawByteArray.length ? rawByteArray[x + 3] : 0;

    // Calculate the CRC
    const crc = this._tuyaCRC8(crcData);

    // Move data to encodedData array
    // CRC
    encodedData[encodedDataIndex++] = (crc % 128) | 128;
    // Sequence number
    encodedData[encodedDataIndex++] = (crcData[0] % 128) | 128;
    // Data
    encodedData[encodedDataIndex++] = (crcData[1] % 256) | 256;
    encodedData[encodedDataIndex++] = (crcData[2] % 256) | 256;
    encodedData[encodedDataIndex++] = (crcData[3] % 256) | 256;
    encodedData[encodedDataIndex++] = (crcData[4] % 256) | 256;
  }

  return encodedData;
};

/**
* Un-references UDP instance
* so that a script can cleanly
* exit.
*/
TuyaLink.prototype.cleanup = function () {
  if (this.udpClient) {
    this.udpClient.unref();
  }
};

/**
* Returns the length in bytes
* of a string.
* @param {String} str input string
* @returns {Number} length in bytes
* @private
*/
TuyaLink.prototype._getLength = function (str) {
  return Buffer.byteLength(str, 'utf8');
};

/**
* Rounds input `x` to the next
* highest multiple of `g`.
* @param {Number} x input number
* @param {Number} g rounding factor
* @returns {Number} rounded result
* @private
*/
TuyaLink.prototype._rounder = function (x, g) {
  return Math.ceil(x / g) * g;
};

/**
* Calculates a modified CRC8
* of a given arary of data.
* @param {Array} p input data
* @returns {Number} CRC result
* @private
*/
TuyaLink.prototype._tuyaCRC8 = function (p) {
  let crc = 0;
  let i = 0;
  const len = p.length;

  while (i < len) {
    crc = this._calcrc1Byte(crc ^ p[i]);
    i++;
  }

  return crc;
};

/**
* Calculates a modified
* CRC8 of one byte.
* @param {Number} abyte one byte as an integer
* @returns {Number} resulting CRC8 byte
* @private
*/
TuyaLink.prototype._calcrc1Byte = function (abyte) {
  const crc1Byte = Buffer.alloc(1);
  crc1Byte[0] = 0;

  for (let i = 0; i < 8; i++) {
    if (((crc1Byte[0] ^ abyte) & 0x01) > 0) {
      crc1Byte[0] ^= 0x18;
      crc1Byte[0] >>= 1;
      crc1Byte[0] |= 0x80;
    } else {
      crc1Byte[0] >>= 1;
    }

    abyte >>= 1;
  }

  return crc1Byte[0];
};

/**
* Broadcasts input number as the
* length of a UDP packet.
* @param {Number} len length of packet to broadcast
* @returns {Promise<Undefined>}
* A Promise that resolves when input has been broadcasted
* @private
*/
TuyaLink.prototype._broadcastUDP = function (len) {
  // Create and bind UDP socket
  if (!this.udpClient) {
    this.udpClient = dgram.createSocket({ type: 'udp4', recvBufferSize: 0, sendBufferSize: 0 });
    this.udpClient.on('listening', function () {
      this.setBroadcast(true);
    });
    this.udpClient.bind("192.168.12.1");
  }

  // 0-filled buffer
  const message = Buffer.alloc(len);
  return new Promise((resolve, reject) => {
    this.udpClient.send(message, 0, message.length, 30011, '255.255.255.255', err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

/**
* A helper that provides an easy
* way to iterate over an array with
* an asynchronous function.
* @param {Array} array input array to iterate over
* @param {function(item, index, array)} callback
* function to call for iterations
* @private
*/
TuyaLink.prototype._asyncForEach = async function (array, callback) {
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
};

module.exports = TuyaLink;

