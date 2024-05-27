const { fork } = require('child_process');
const { closeModbusConnections } = require('../modbus/connection');
const fs = require('fs');
const path = require('path');

let gatewayProcess = null;

function startGateway() {
  if (!gatewayProcess) {
    gatewayProcess = fork(path.join(__dirname, '..', 'index.js'));
    console.log('Gateway iniciado.');
  }
}

function stopGateway(callback) {
  if (gatewayProcess) {
    gatewayProcess.kill();
    gatewayProcess = null;
    closeModbusConnections();
    console.log('Gateway parado.');
    if (callback) callback();
  } else if (callback) {
    callback();
  }
}

function restartGateway(callback) {
  stopGateway(() => {
    startGateway();
    console.log('Gateway reiniciado.');
    if (callback) callback();
  });
}

function uploadConfig(tempPath, targetPath, callback) {
  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      callback(err);
    } else {
      console.log('Arquivo de configuração atualizado. Reinicie o gateway para aplicar as mudanças.');
      callback(null);
    }
  });
}

module.exports = {
  startGateway,
  stopGateway,
  restartGateway,
  uploadConfig
};
