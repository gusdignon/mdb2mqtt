const config = require("./config/config");
const { setupModbusConnection } = require("./modbus/connection");
const mqttClient = require("./mqtt/client");
const { publishStatus } = require("./mqtt/publish");

// Configurar cada conexão Modbus
config.modbus.connections.forEach(setupModbusConnection);

mqttClient.on("connect", () => {
  console.log("Conectado ao broker MQTT");
  publishStatus(config.mqtt.status_topic, "MQTT broker connected");
});

mqttClient.on("error", (err) => {
  console.error("Erro na conexão MQTT:", err.message);
});

// Iniciar o servidor web
require('./web/server');
