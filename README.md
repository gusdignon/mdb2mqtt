# Modbus-MQTT Gateway

Este projeto é um Gateway Modbus-MQTT que permite a comunicação entre dispositivos Modbus e um broker MQTT. Ele suporta a leitura de vários tipos de dados de dispositivos Modbus e a publicação dos dados em tópicos MQTT especificados. Além disso, inclui um servidor web para controlar o gateway e gerenciar o arquivo de configuração.

## Funcionalidades

- Suporte a conexões Modbus TCP e RTU
- Leitura de múltiplos tipos de dados (BOOL, INT16, UINT16, INT32, UINT32, Float32, ASCII)
- Publicação de dados em tópicos MQTT
- Interface web para controle do gateway (iniciar, parar, reiniciar)
- Upload e download do arquivo de configuração via interface web

## Instalação

1. Clone o repositório:
   ```sh
   git clone https://github.com/gusdignon/mdb2mqtt.git
   cd mdb2mqtt

2. Instale as dependências:
    ```sh
    npm install express multer modbus-serial mqtt js-yaml

## Uso
1. Inicie a aplicação:
    node index.js

2. Acesse a interface web em http://localhost:3000 para controlar o gateway e gerenciar o arquivo de configuração.

## Interface Web

A interface web fornece as seguintes funcionalidades:

    Start Gateway: Inicia o gateway Modbus-MQTT.
    Stop Gateway: Para o gateway Modbus-MQTT.
    Restart Gateway: Reinicia o gateway Modbus-MQTT.
    Download Config: Baixa o arquivo config.yaml atual.
    Upload Config: Faz o upload de um novo arquivo config.yaml.

## Configuração

A configuração é feita através de um arquivo config.yaml. Aqui está um exemplo de configuração:

```yaml
mqtt:
host: "mqtt://localhost"
status_topic: "modbus/status"

modbus:
connections:
    - driver: "tcp"
    host: "localhost"
    port: 502
    id: 1
    status_topic: "modbus/status/1"
    reconnect_interval: 10000
    registers:
        - address: 101
        length: 1
        interval: 1000
        datatype: "BOOL"
        function: "readCoils"
        topic: "modbusTCP/ID1/BOOL/101"
        - address: 102
        length: 1
        interval: 1000
        datatype: "BOOL"
        function: "readDiscreteInputs"
        topic: "modbusTCP/ID1/BOOL/102"
        - address: 201
        length: 1
        interval: 2000
        datatype: "UINT16"
        function: "readHoldingRegisters"
        topic: "modbusTCP/ID1/UINT16/201"
        - address: 202
        length: 1
        interval: 2000
        datatype: "UINT16"
        function: "readInputRegisters"
        topic: "modbusTCP/ID1/UINT16/202"
        # Adicione mais registros conforme necessário
```

## Licença

Este projeto está licenciado sob a Licença MIT.

## Agradecimentos

    modbus-serial - Uma biblioteca para Modbus-RTU e Modbus-TCP em Node.js
    mqtt - A biblioteca cliente MQTT para Node.js
    Express - Framework web rápido, não opinativo e minimalista para Node.js
