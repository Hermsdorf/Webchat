document.addEventListener('DOMContentLoaded', () =>
{
    // === SELEÇÃO DE ELEMENTOS ===
    const createRoomBtn = document.getElementById("create-room");
    const roomNameInput = document.getElementById("room-name");
    const roomList = document.getElementById("rooms-list");
    const roomCountSpan = document.getElementById("rooms-count");
    const nickname = sessionStorage.getItem('nickname');
    const login = sessionStorage.getItem('login');
    const logoutBtn = document.getElementById('logout');
    const updateNicknameBtn = document.getElementById('update-nickname');
    const newNicknameInput = document.getElementById('new-nickname');

    document.getElementById("sidebar-title").textContent = `Bem-vindo, ${login}`;
    document.getElementById("nickname-display").textContent = nickname || 'Visitante';

    // === CONEXÃO WEBSOCKET ===
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken)
    {
        window.location.href = '/index.html';
        return;
    }

    const socket = new WebSocket(`ws://${window.location.host}?token=${authToken}`);

    // === ENVIO DE MENSAGENS PARA O SERVIDOR ===
    createRoomBtn.addEventListener("click", function (event)
    {
        event.preventDefault();
        const roomName = roomNameInput.value.trim();
        if (roomName)
        {
            socket.send(JSON.stringify({ type: 'criarSala', nome: roomName }));
        }
    });

    updateNicknameBtn.addEventListener('click', function (event) 
    {
        event.preventDefault();
        const newNickname = newNicknameInput.value.trim();
        if (newNickname)
        {
            socket.send(JSON.stringify({ type: 'atualizarNickname', novoNickname: newNickname }));
        }
    });

    // === RECEBIMENTO DE MENSAGENS DO SERVIDOR ===
    socket.onmessage = function (event)
    {
        const data = JSON.parse(event.data);

        switch (data.type)
        {
            case 'listaDeSalasAtualizada':
                renderRoomList(data.salas);
                break;

            case 'salaCriadaComSucesso':
                sessionStorage.setItem('nomeSala', data.sala.nome);
                window.location.href = '/chat.html';
                break;
            case 'nicknameAtualizado':
                sessionStorage.setItem('nickname', data.novoNickname);
                document.getElementById("nickname-display").textContent = data.novoNickname;
                break;
        }
    };

    // === FUNÇÃO PARA RENDERIZAR A LISTA DE SALAS NA TELA ===
    function renderRoomList(salas)
    {
        roomList.innerHTML = ''; // Limpa a lista antiga
        roomCountSpan.textContent = salas.length; // Atualiza o contador

        if (salas.length === 0)
        {
            roomList.innerHTML = '<li>Nenhuma sala disponível. Crie a primeira!</li>';
            return;
        }

        salas.forEach(sala =>
        {
            const newRoomItem = document.createElement("li");
            newRoomItem.classList.add("room-item");

            const roomInfoDiv = document.createElement("div");
            roomInfoDiv.classList.add("room-info");

            const nameSpan = document.createElement('span');
            nameSpan.textContent = sala.nome;
            nameSpan.classList.add('room-name-display');

            const countSpan = document.createElement('span');
            countSpan.textContent = `Pessoas: ${sala.usuarios || 0}/10`;
            countSpan.classList.add('room-people-count');

            roomInfoDiv.appendChild(nameSpan);
            roomInfoDiv.appendChild(countSpan);

            const joinButton = document.createElement("button");
            joinButton.textContent = "ENTRAR";
            joinButton.classList.add("join-room-btn");

            joinButton.addEventListener("click", function ()
            {
                sessionStorage.setItem('nomeSala', sala.nome);
                window.location.href = '/chat.html';
            });

            newRoomItem.appendChild(roomInfoDiv);
            newRoomItem.appendChild(joinButton);
            roomList.appendChild(newRoomItem);
        });
    }


    if (logoutBtn)
    {
        logoutBtn.addEventListener('click', (event) =>
        {
            //impede que o link navegue para a página imediatamente
            event.preventDefault();

            //apaga os dados de autenticação e identidade do navegador
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('nickname');
            sessionStorage.removeItem('nomeSala');

            console.log('Sessão encerrada. Redirecionando para a home.');

            //redireciona para a página inicial
            window.location.href = '/index.html';
        });
    }
});