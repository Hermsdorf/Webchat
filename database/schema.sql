-- Tabela para armazenar os usuários e suas credenciais
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    pswrd VARCHAR(255) NOT NULL,
    nick VARCHAR(50) NOT NULL,
    public_key TEXT
);


CREATE TABLE salas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    room_key VARCHAR(64),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);