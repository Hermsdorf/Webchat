document.addEventListener('DOMContentLoaded', () => {
    // === SELEÇÃO DE ELEMENTOS ===
    const createRoomBtn = document.getElementById("create-room");
    const roomNameInput = document.getElementById("room-name");
    const roomList = document.getElementById("rooms-list");
    const roomCountSpan = document.getElementById("rooms-count");
    const nickname = sessionStorage.getItem('nickname');

    // Validação: se não houver nickname, volta para a home
    if (!nickname) {
        window.location.href = '/home.html';
        return;
    }
    document.getElementById("sidebar-title").textContent = `Bem-vindo, ${nickname}`;

    // === CONEXÃO WEBSOCKET ===
    const socket = new WebSocket(`ws://${window.location.host}`);

    // === LÓGICA DE ENVIO DE MENSAGENS PARA O SERVIDOR ===
    createRoomBtn.addEventListener("click", function(event) {
        event.preventDefault();
        const roomName = roomNameInput.value.trim();
        if (roomName) {
            // Envia um pedido para o servidor criar a sala
            socket.send(JSON.stringify({ type: 'criarSala', nome: roomName }));
            // O fluxo de entrar na sala será tratado após a confirmação do servidor
        }
    });

    // === LÓGICA DE RECEBIMENTO DE MENSAGENS DO SERVIDOR ===
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);

        switch(data.type) {
            case 'listaDeSalasAtualizada':
                renderRoomList(data.salas);
                break;
            // Podemos adicionar um caso de sucesso de criação para redirecionar
            case 'salaCriadaComSucesso':
                sessionStorage.setItem('nomeSala', data.sala.nome);
                window.location.href = '/chat.html';
                break;
        }
    };
    
    // === FUNÇÃO PARA RENDERIZAR A LISTA DE SALAS NA TELA ===
    function renderRoomList(salas) {
        roomList.innerHTML = ''; // Limpa a lista antiga
        roomCountSpan.textContent = salas.length; // Atualiza o contador

        if (salas.length === 0) {
            roomList.innerHTML = '<li>Nenhuma sala disponível. Crie a primeira!</li>';
            return;
        }
        
        salas.forEach(sala => {
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
            
            joinButton.addEventListener("click", function() {
                sessionStorage.setItem('nomeSala', sala.nome);
                window.location.href = '/chat.html';
            });

            newRoomItem.appendChild(roomInfoDiv);
            newRoomItem.appendChild(joinButton);
            roomList.appendChild(newRoomItem);
        });
    }
});