let gatewayProcess = null;

function startGateway() {
  if (!gatewayProcess) {
    gatewayProcess = require('child_process').fork('index.js');
    console.log('Gateway iniciado.');
  }
}

function stopGateway() {
  if (gatewayProcess) {
    gatewayProcess.kill();
    gatewayProcess = null;
    console.log('Gateway parado.');
  }
}

function restartGateway() {
  stopGateway();
  startGateway();
  console.log('Gateway reiniciado.');
}

module.exports = {
  startGateway,
  stopGateway,
  restartGateway
};
