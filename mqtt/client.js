const mqtt = require("mqtt");
const config = require("../config/config");

const mqttClient = mqtt.connect({
  host: config.mqtt.host,
  port: config.mqtt.port,
  username: config.mqtt.username,
  password: config.mqtt.password,
  clientId: config.mqtt.clientId,
});

module.exports = mqttClient;
