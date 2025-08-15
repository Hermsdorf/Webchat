const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg'); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;


const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'meuchat', 
    password: '123456789', 
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



//SERVINDO OS ARQUIVOS ESTÁTICOS (HTML, CSS, JS do Cliente)

app.use(express.static('public'));



// LÓGICA DO SERVIDOR DE CHAT (com integração ao Banco de Dados)


// Função para buscar as salas no DB e enviar para todos os clientes
async function broadcastRoomList() {
    try {
        const result = await pool.query('SELECT * FROM Salas ORDER BY nome');
        const rooms = result.rows; 

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

wss.on('connection', (socket) => {
    console.log('🔌 Novo cliente conectado!');

    broadcastRoomList();

    socket.on('message', async (message) => {
        try {
            console.log('SERVIDOR: Mensagem crua recebida:', message.toString());
            
            const data = JSON.parse(message.toString());
            console.log(`SERVIDOR: Mensagem parseada. Tipo: "${data.type}"`); // <-- Log de verificação

            switch (data.type) {
                case 'criarSala':
                    console.log(`SERVIDOR: Entrou no case 'criarSala'`);
                
                    const query = 'INSERT INTO Salas (nome) VALUES ($1) RETURNING *';
                    const result = await pool.query(query, [data.nome]);
                    await broadcastRoomList();
                    socket.send(JSON.stringify({ type: 'salaCriadaComSucesso', sala: result.rows[0] }));
                    break;

                case 'entrarNaSala':
                    console.log(`SERVIDOR: Entrou no case 'entrarNaSala'`); // <-- Log de verificação
                    socket.room = data.roomName;
                    socket.nickname = data.nickname;
                    
                    console.log(`[${socket.nickname}] entrou na sala [${socket.room}]`);

                    const roomResult = await pool.query('SELECT id FROM Salas WHERE nome = $1', [socket.room]);
                    if (roomResult.rows.length > 0) {
                        const roomId = roomResult.rows[0].id;
                        const historyQuery = 'SELECT * FROM Mensagens WHERE id_sala = $1 ORDER BY timestamp ASC LIMIT 50';
                        const historyResult = await pool.query(historyQuery, [roomId]);
                        
                        socket.send(JSON.stringify({ type: 'historicoChat', messages: historyResult.rows }));
                    }
                    break;

                case 'enviarMensagem':
                    console.log(` SERVIDOR: Entrou no case 'enviarMensagem'`); // <-- Log de verificação
                    console.log(`[${data.nickname}] na sala [${data.roomName}] enviou: ${data.content}`);
                    
                    const roomResultMsg = await pool.query('SELECT id FROM Salas WHERE nome = $1', [data.roomName]);
                    if (roomResultMsg.rows.length > 0) {
                        const roomId = roomResultMsg.rows[0].id;
                        const insertQuery = 'INSERT INTO Mensagens (id_sala, nickname_usuario, conteudo) VALUES ($1, $2, $3)';
                        await pool.query(insertQuery, [roomId, data.nickname, data.content]);
                    }

                    wss.clients.forEach(client => {
                        if (client.readyState === socket.OPEN && client.room === data.roomName) {
                            client.send(JSON.stringify({
                                type: 'novaMensagem',
                                nickname: data.nickname,
                                content: data.content
                            }));
                        }
                    });
                    break;

                default:
                    console.log(`SERVIDOR: Tipo de mensagem desconhecido ou não tratado: "${data.type}"`);
            }
        } catch (err) {
            console.error('ERRO FATAL no processamento da mensagem:', err);
        }
    });

    socket.on('close', () => {
        console.log('Cliente desconectado.');
    });
});



server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});