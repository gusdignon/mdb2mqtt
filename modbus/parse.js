function parseData(data, type, length) {
    switch (type) {
      case 'BOOL':
        return data.slice(0, length).map(value => value); // Corrigir a interpretação de BOOL
      case 'INT16':
        return data.map(value => (value & 0x8000) ? value | 0xFFFF0000 : value);
      case 'UINT16':
        return data.map(value => value & 0xFFFF);
      case 'INT32':
        return parseInt32(data);
      case 'UINT32':
        return parseUint32(data);
      case 'Float32':
        return parseFloat32(data);
      case 'ASCII':
        return parseAscii(data);
      default:
        throw new Error(`Tipo de dado não suportado: ${type}`);
    }
  }
  
  function parseInt32(data) {
    let result = [];
    for (let i = 0; i < data.length; i += 2) {
      const high = data[i];
      const low = data[i + 1];
      const value = (high << 16) | low;
      result.push(value >= 0x80000000 ? value - 0x100000000 : value);
    }
    return result;
  }
  
  function parseUint32(data) {
    let result = [];
    for (let i = 0; i < data.length; i += 2) {
      const high = data[i];
      const low = data[i + 1];
      result.push((high << 16) | low);
    }
    return result;
  }
  
  function parseFloat32(data) {
    let result = [];
    for (let i = 0; i < data.length; i += 2) {
      const buffer = Buffer.from([data[i] >> 8, data[i] & 0xFF, data[i + 1] >> 8, data[i + 1] & 0xFF]);
      result.push(buffer.readFloatBE(0));
    }
    return result;
  }
  
  function parseAscii(data) {
    return String.fromCharCode(...data.flatMap(value => [value >> 8, value & 0xFF]));
  }
  
  module.exports = { parseData, parseInt32, parseUint32, parseFloat32, parseAscii };
  