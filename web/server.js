const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { restartGateway, stopGateway, startGateway } = require('./handlers');

const app = express();
const port = 3000;

// Configuração do multer para upload de arquivos
const upload = multer({ dest: 'uploads/' });

// Configurar pasta pública para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para baixar o arquivo config.yaml
app.get('/download-config', (req, res) => {
  res.download(path.join(__dirname, '..', 'config.yaml'), 'config.yaml', (err) => {
    if (err) {
      res.status(500).send('Erro ao baixar o arquivo');
    }
  });
});

// Rota para fazer upload do novo arquivo config.yaml
app.post('/upload-config', upload.single('config'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, '..', 'config.yaml');

  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      res.status(500).send('Erro ao salvar o arquivo');
    } else {
      res.send('Arquivo carregado com sucesso. Reinicie o gateway para aplicar as mudanças.');
    }
  });
});

// Rota para parar o gateway
app.post('/stop', (req, res) => {
  stopGateway(() => {
    res.send('Gateway parado.');
  });
});

// Rota para iniciar o gateway
app.post('/start', (req, res) => {
  startGateway();
  res.send('Gateway iniciado.');
});

// Rota para reiniciar o gateway
app.post('/restart', (req, res) => {
  restartGateway(() => {
    res.send('Gateway reiniciado.');
  });
});

const server = app.listen(port, () => {
  console.log(`Servidor web rodando em http://localhost:${port}`);
});

function closeServer(callback) {
  server.close(callback);
}

module.exports = { closeServer };
