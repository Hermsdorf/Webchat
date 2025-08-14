-- Apaga as tabelas se elas já existirem, para podermos rodar o script várias vezes
DROP TABLE IF EXISTS Mensagens;
DROP TABLE IF EXISTS Salas;

-- Tabela para armazenar as salas de chat
CREATE TABLE Salas (
    -- SERIAL PRIMARY KEY: Um número de ID único para cada sala, que aumenta automaticamente
    id SERIAL PRIMARY KEY,
    
    -- VARCHAR(100): Um texto de até 100 caracteres
    -- UNIQUE: Garante que não haverá duas salas com o mesmo nome
    -- NOT NULL: Garante que o nome nunca pode ser vazio
    nome VARCHAR(100) UNIQUE NOT NULL,
    
    -- TIMESTAMP...: Guarda a data e hora exatas da criação da sala
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar as mensagens
CREATE TABLE Mensagens (
    id SERIAL PRIMARY KEY,
    
    -- TEXT: Um campo de texto de tamanho ilimitado
    conteudo TEXT NOT NULL,
    
    -- VARCHAR(50): O apelido de quem enviou
    nickname_usuario VARCHAR(50) NOT NULL,
    
    -- TIMESTAMP...: Guarda o momento exato em que a mensagem foi enviada
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- INTEGER REFERENCES Salas(id): A chave da mágica relacional.
    -- Esta coluna guarda o ID da sala à qual esta mensagem pertence.
    -- Garante que uma mensagem não pode existir sem uma sala válida.
    id_sala INTEGER NOT NULL REFERENCES Salas(id)
);

-- Bônus: Vamos criar algumas salas iniciais para teste
INSERT INTO Salas (nome) VALUES ('🚀 Lançamentos'), ('🎮 Jogos'), ('🎵 Música');