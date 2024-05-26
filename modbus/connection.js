const ModbusRTU = require("modbus-serial");
const { publishStatus } = require("../mqtt/publish");
const { getReadFunction } = require("./readFunctions");
const { parseData } = require("./parse");
const { createMQTTMessage } = require("./utils");

function setupModbusConnection(conn) {
  const client = new ModbusRTU();
  let isConnected = false;
  let reconnectAttempts = 0;
  const lastGoodValues = {};

  function updateStatus() {
    const status = isConnected ? "online" : "offline";
    const statusMessage = `Driver ${conn.driver} ID ${conn.id} is ${status}`;
    publishStatus(conn.status_topic, statusMessage);
  }

  function connectModbus() {
    if (conn.driver === "tcp") {
      console.log(`Tentando conectar ao Modbus TCP em ${conn.host}:${conn.port}`);
      client.connectTCP(conn.host, { port: conn.port }, (err) => {
        if (err) {
          scheduleReconnect(err);
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
          scheduleReconnect(err);
          return;
        }
        isConnected = true;
        reconnectAttempts = 0;
        updateStatus();
        startReadingRegisters();
      });
    }
  }

  function scheduleReconnect(err) {
    console.error(`Erro ao conectar: ${err ? err.message : "Erro desconhecido"}`);
    const delay = conn.reconnect_interval || Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
    console.log(`Tentando reconectar em ${delay / 1000} segundos...`);
    setTimeout(connectModbus, delay);
    reconnectAttempts += 1;
  }

  function startReadingRegisters() {
    conn.registers.forEach(reg => {
      setInterval(() => {
        const readFunction = getReadFunction(reg.function);
        const timestamp = Math.floor(Date.now() / 1000);

        readFunction(client, reg.address, reg.length)
          .then(data => {
            console.log(`Dados lidos de ${reg.function} no endereço ${reg.address}:`, data);
            const parsedData = parseData(data.data, reg.datatype, reg.length);
            lastGoodValues[reg.topic] = parsedData;  // Armazenar o último valor bom
            const message = createMQTTMessage(parsedData, "Good", timestamp);
            publishStatus(reg.topic, JSON.stringify(message));
            console.log(`Dados publicados em ${reg.topic}:`, message);
          })
          .catch(err => {
            console.error(`Erro ao ler registradores Modbus (ID ${conn.id}):`, err.message);
            const message = createMQTTMessage(lastGoodValues[reg.topic] || null, "Bad", timestamp);
            publishStatus(reg.topic, JSON.stringify(message));
            console.log(`Erro ao ler ${reg.topic}:`, message);
          });
      }, reg.interval);
    });
  }

  client.setID(conn.id);

  client.on('close', () => {
    isConnected = false;
    updateStatus();
    scheduleReconnect(new Error("Conexão Modbus fechada"));
  });

  client.on('error', (err) => {
    console.error("Erro na conexão Modbus:", err.message);
    isConnected = false;
    updateStatus();
    scheduleReconnect(err);
  });

  connectModbus();
}

module.exports = { setupModbusConnection };
