const ModbusRTU = require("modbus-serial");
const mqtt = require("mqtt");
const yaml = require("js-yaml");
const fs = require("fs");

// Carregar configurações do arquivo YAML
const config = yaml.load(fs.readFileSync("./config.yaml", "utf8"));
const mqttConfig = config.mqtt;
const modbusConfig = config.modbus;

// Inicializar cliente MQTT
const mqttClient = mqtt.connect(mqttConfig.host);

function publishStatus(message) {
  mqttClient.publish(mqttConfig.status_topic, message);
  console.log("Status publicado:", message);
}

// Função para configurar e iniciar conexões Modbus
function setupModbusConnection(conn) {
  const client = new ModbusRTU();
  let isConnected = false;
  let reconnectAttempts = 0;

  function updateStatus() {
    const status = isConnected ? "online" : "offline";
    const statusMessage = `Driver ${conn.driver} ID ${conn.id} is ${status}`;
    publishStatus(statusMessage);
  }

  function connectModbus() {
    if (conn.driver === "tcp") {
      console.log(`Tentando conectar ao Modbus TCP em ${conn.host}:${conn.port}`);
      client.connectTCP(conn.host, { port: conn.port }, (err) => {
        if (err) {
          console.error(`Erro ao conectar TCP: ${err.message}`);
          scheduleReconnect();
          return;
        }
        isConnected = true;
        reconnectAttempts = 0;
        updateStatus();
        startReadingRegisters();
      });
    } else if (conn.driver === "rtu") {
      console.log(`Tentando conectar ao Modbus RTU em ${conn.path} com baudRate ${conn.baudRate}`);
      client.connectRTUBuffered(conn.path, { baudRate: conn.baudRate }, (err) => {
        if (err) {
          console.error(`Erro ao conectar RTU: ${err.message}`);
          scheduleReconnect();
          return;
        }
        isConnected = true;
        reconnectAttempts = 0;
        updateStatus();
        startReadingRegisters();
      });
    }
  }

  function scheduleReconnect() {
    const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
    console.log(`Tentando reconectar em ${delay / 1000} segundos...`);
    setTimeout(connectModbus, delay);
    reconnectAttempts += 1;
  }

  function startReadingRegisters() {
    conn.registers.forEach(reg => {
      setInterval(() => {
        client.readHoldingRegisters(reg.address, reg.length)
          .then(data => {
            mqttClient.publish(reg.topic, JSON.stringify(data.data));
            console.log(`Dados publicados em ${reg.topic}:`, data.data);
          })
          .catch(err => {
            console.error(`Erro ao ler registradores Modbus (ID ${conn.id}):`, err.message);
          });
      }, reg.interval); // Usar intervalo personalizado para leitura
    });
  }

  client.setID(conn.id);

  client.on('close', () => {
    isConnected = false;
    updateStatus();
    console.log("Conexão Modbus fechada. Tentando reconectar...");
    scheduleReconnect();
  });

  client.on('error', (err) => {
    console.error("Erro na conexão Modbus:", err.message);
    isConnected = false;
    updateStatus();
  });

  connectModbus();
}

// Configurar cada conexão Modbus
modbusConfig.connections.forEach(setupModbusConnection);

mqttClient.on("connect", () => {
  console.log("Conectado ao broker MQTT");
  publishStatus("MQTT broker connected");
});

mqttClient.on("error", (err) => {
  console.error("Erro na conexão MQTT:", err.message);
});
