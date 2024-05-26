function getReadFunction(func) {
    switch (func) {
      case 'readCoils':
        return (client, address, length) => client.readCoils(address, length);
      case 'readDiscreteInputs':
        return (client, address, length) => client.readDiscreteInputs(address, length);
      case 'readHoldingRegisters':
        return (client, address, length) => client.readHoldingRegisters(address, length);
      case 'readInputRegisters':
        return (client, address, length) => client.readInputRegisters(address, length);
      default:
        throw new Error(`Função de leitura não suportada: ${func}`);
    }
  }
  
  module.exports = { getReadFunction };
  