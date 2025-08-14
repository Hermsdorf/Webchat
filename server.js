// =========================================================================
// 1. IMPORTAÇÕES E CONFIGURAÇÃO INICIAL
// =========================================================================
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg'); // Importa o driver do PostgreSQL

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;

// =========================================================================
// 2. CONFIGURAÇÃO DA CONEXÃO COM O BANCO DE DADOS POSTGRESQL
// =========================================================================
// O Pool gerencia múltiplas conexões com o banco de forma eficiente.
const pool = new Pool({
    user: 'postgres', // Seu usuário do PostgreSQL
    host: 'localhost',
    database: 'meuchat', // O nome do banco de dados que criamos
    password: '123456789', // A senha que você definiu para o usuário postgres
    port: 5432,
});

// Testa a conexão com o banco de dados ao iniciar o servidor
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erro ao conectar ao PostgreSQL', err.stack);
    } else {
        console.log('Conectado ao PostgreSQL com sucesso!');
    }
});


// =========================================================================
// 3. SERVINDO OS ARQUIVOS ESTÁTICOS (HTML, CSS, JS do Cliente)
// =========================================================================
app.use(express.static('public'));


// =========================================================================
// 4. LÓGICA DO SERVIDOR DE CHAT (com integração ao Banco de Dados)
// =========================================================================

// Função para buscar as salas no DB e enviar para todos os clientes
async function broadcastRoomList() {
    try {
        const result = await pool.query('SELECT * FROM Salas ORDER BY nome');
        const rooms = result.rows; // As linhas retornadas pela query

        const message = JSON.stringify({
            type: 'listaDeSalasAtualizada',
            salas: rooms
        });

        wss.clients.forEach(client => {
            client.send(message);
        });
    } catch (err) {
        console.error('Erro ao buscar salas no banco de dados:', err);
    }
}

// Executado quando um novo cliente se conecta via WebSocket
wss.on('connection', (socket) => {
    console.log('Novo cliente conectado!');

    // Assim que o cliente se conecta, enviamos a ele a lista de salas atual do banco de dados
    broadcastRoomList();

    // Executado quando uma mensagem chega de um cliente
    socket.on('message', async (message) => {
        const data = JSON.parse(message.toString());

        switch (data.type) {
            case 'criarSala':
                console.log(`Pedido para criar a sala: ${data.nome}`);
                
                try {
                    // Insere a nova sala no banco de dados
                    // Usamos $1 para prevenir SQL Injection
                    const query = 'INSERT INTO Salas (nome) VALUES ($1)';
                    await pool.query(query, [data.nome]);

                    // Após inserir, avisa a TODOS os clientes sobre a nova lista de salas
                    await broadcastRoomList();

                } catch (err) {
                    console.error('Erro ao inserir nova sala:', err);
                    // Opcional: Enviar uma mensagem de erro de volta para o cliente
                    socket.send(JSON.stringify({ type: 'erro', mensagem: 'Nome da sala já existe ou é inválido.' }));
                }
                break;
            
            // Outros casos como 'entrarNaSala', 'enviarMensagem' virão aqui
        }
    });

    socket.on('close', () => {
        console.log('Cliente desconectado.');
    });
});


// =========================================================================
// 5. INICIANDO O SERVIDOR
// =========================================================================
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});