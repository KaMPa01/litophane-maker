const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Servidor de ejemplo activo en puerto ' + port + "\n");
});

server.listen(port, () => {
  console.log(`Servidor de ejemplo escuchando en http://localhost:${port}`);
});

module.exports = server;
