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
        const readFunction = getReadFunction(reg.function);
        readFunction(client, reg.address, reg.length)
          .then(data => {
            const parsedData = parseData(data.data, reg.datatype);
            mqttClient.publish(reg.topic, JSON.stringify(parsedData));
            console.log(`Dados publicados em ${reg.topic}:`, parsedData);
          })
          .catch(err => {
            console.error(`Erro ao ler registradores Modbus (ID ${conn.id}):`, err.message);
          });
      }, reg.interval); // Usar intervalo personalizado para leitura
    });
  }

  function getReadFunction(func) {
    switch (func) {
      case 'readCoils':
        return client.readCoils.bind(client);
      case 'readDiscreteInputs':
        return client.readDiscreteInputs.bind(client);
      case 'readHoldingRegisters':
        return client.readHoldingRegisters.bind(client);
      case 'readInputRegisters':
        return client.readInputRegisters.bind(client);
      default:
        throw new Error(`Função de leitura não suportada: ${func}`);
    }
  }

  function parseData(data, type) {
    switch (type) {
      case 'BOOL':
        return data.map(value => value !== 0);
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
