const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const url = require('url');

const app = express();
app.use(express.json());
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
pool.query('SELECT NOW()', (err, res) =>
{
    if (err)
    {
        console.error('Erro ao conectar ao PostgreSQL', err.stack);
    } else
    {
        console.log('Conectado ao PostgreSQL com sucesso!');
    }
});



//SERVINDO OS ARQUIVOS ESTÁTICOS (HTML, CSS, JS do Cliente)

app.use(express.static('public'));

app.post('/register', async (req, res) =>
{
    const { login, senha } = req.body;

    if (!login || !senha)
    {
        return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
    }

    try
    {
        // Gera o "sal" e o hash da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Insere o novo usuário no banco de dados com a senha criptografada
        const newUser = await pool.query(
            'INSERT INTO Usuarios (username, pswrd, nick) VALUES ($1, $2, $1) RETURNING id, username, nick',
            [login, senhaHash]
        );

        res.status(201).json({ message: 'Usuário criado com sucesso!', user: newUser.rows[0] });

    } catch (err)
    {
        // Código '23505' no PostgreSQL é erro de violação de chave única (usuário já existe)
        if (err.code === '23505')
        {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }
        console.error(err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


// =========================================================================
// ROTA DE LOGIN
// =========================================================================
app.post('/login', async (req, res) =>
{
    const { login, senha } = req.body;

    if (!login || !senha)
    {
        return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
    }

    try
    {
        // 1. Encontra o usuário no banco de dados
        const userResult = await pool.query('SELECT * FROM Usuarios WHERE username = $1', [login]);
        if (userResult.rows.length === 0)
        {
            return res.status(401).json({ message: 'Login ou senha inválidos.' });
        }
        const user = userResult.rows[0];

        // 2. Compara a senha enviada com o hash salvo no banco
        const isMatch = await bcrypt.compare(senha, user.pswrd);
        if (!isMatch)
        {
            return res.status(401).json({ message: 'Login ou senha inválidos.' });
        }

        // 3. Login bem-sucedido! Cria um Token de Sessão (JWT)
        const tokenPayload = { id: user.id, nickname: user.nick };
        const token = jwt.sign(tokenPayload, 'SEU_SEGREDO_SUPER_SECRETO', { expiresIn: '8h' });

        res.status(200).json({ message: 'Login bem-sucedido!', token: token, nickname: user.nick });

    } catch (err)
    {
        console.error(err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


// LÓGICA DO SERVIDOR DE CHAT (com integração ao Banco de Dados)


// Função para buscar as salas no DB e enviar para todos os clientes
async function broadcastRoomList()
{
    try
    {
        const result = await pool.query('SELECT * FROM Salas ORDER BY nome');
        const rooms = result.rows;

        const message = JSON.stringify({
            type: 'listaDeSalasAtualizada',
            salas: rooms
        });

        wss.clients.forEach(client =>
        {
            client.send(message);
        });
    } catch (err)
    {
        console.error('Erro ao buscar salas no banco de dados:', err);
    }
}

wss.on('connection', (socket, req) =>
{
    console.log('Novo cliente conectado!');

    try
    {
        const token = url.parse(req.url, true).query.token;
        if (!token)
        {
            console.log('Conexão WebSocket rejeitada: token ausente.');
            socket.close();
            return;
        }

        // Verifica se o token é válido usando o mesmo segredo do login
        const decoded = jwt.verify(token, 'SEU_SEGREDO_SUPER_SECRETO');

        // Armazena as informações do usuário verificado na conexão
        socket.userId = decoded.id;
        socket.nickname = decoded.nickname;

        console.log(`Cliente autenticado e conectado: ${socket.nickname} (ID: ${socket.userId})`);

    } catch (err)
    {
        console.log('Conexão WebSocket rejeitada: token inválido.');
        socket.close();
        return;
    }

    broadcastRoomList();

    socket.on('message', async (message) =>
    {
        try
        {
            console.log('SERVIDOR: Mensagem crua recebida:', message.toString());

            const data = JSON.parse(message.toString());
            console.log(`SERVIDOR: Mensagem parseada. Tipo: "${data.type}"`); // <-- Log de verificação

            switch (data.type)
            {
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
                    break;

                case 'enviarMensagem':
                    console.log(` SERVIDOR: Entrou no case 'enviarMensagem'`); // <-- Log de verificação
                    console.log(`[${data.nickname}] na sala [${data.roomName}] enviou: ${data.content}`);

                    wss.clients.forEach(client =>
                    {
                        if (client.readyState === socket.OPEN && client.room === data.roomName)
                        {
                            client.send(JSON.stringify({
                                type: 'novaMensagem',
                                nickname: data.nickname,
                                content: data.content
                            }));
                        }
                    });
                    break;

                case 'atualizarNickname':
                    console.log(`SERVIDOR: Entrou no case 'atualizarNickname'`);
                    const antigoNick = socket.nickname;
                    await pool.query('UPDATE usuarios SET nick = $1 WHERE id = $2', [novoNick, socket.userId]);
                    socket.nickname = novoNick;

                    const updateMessage = JSON.stringify({
                        type: 'nicknameAtualizado',
                        userId: socket.userId,
                        antigoNickname: antigoNick,
                        novoNickname: novoNick
                    });

                    wss.clients.forEach(client => client.send(updateMessage));
                    break;

                default:
                    console.log(`SERVIDOR: Tipo de mensagem desconhecido ou não tratado: "${data.type}"`);
            }
        } catch (err)
        {
            console.error('ERRO FATAL no processamento da mensagem:', err);
        }
    });

    socket.on('close', () =>
    {
        console.log(`Cliente desconectado: ${socket.nickname}`);
    });
});



server.listen(PORT, () =>
{
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});