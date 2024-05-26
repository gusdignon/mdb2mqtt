const mqttClient = require("./client");
const config = require("../config/config");

function publishStatus(topic, message) {
  mqttClient.publish(topic, message, { qos: config.mqtt.qos, retain: config.mqtt.retain });
  console.log(`Status publicado em ${topic}:`, message);
}

module.exports = { publishStatus };
