document.addEventListener('DOMContentLoaded', () => {
    // === SELEÇÃO DE ELEMENTOS ===
    const chatIn = document.getElementById("chat_in");
    const chatOut = document.getElementById("chat_out");
    const sendBtn = document.getElementById("sendbt");
    const quitBtn = document.getElementById("quit-chat"); // Assumindo que o ID seja este
    
    const nickname = sessionStorage.getItem('nickname');
    const roomName = sessionStorage.getItem('nomeSala');

    // Validação: Se não tiver os dados necessários, volta para o início
    if (!nickname || !roomName) {
        window.location.href = '/home.html';
        return;
    }

    // Atualiza a interface com os dados da sessão
    document.getElementById("sidebar-title").textContent = `Bem-vindo, ${nickname}`;
    document.getElementById("boas-vindas").textContent = `Sala: ${roomName}`;

    // === CONEXÃO WEBSOCKET ===
    const socket = new WebSocket(`ws://${window.location.host}`);

    // === LÓGICA DE ENVIO DE MENSAGENS PARA O SERVIDOR ===

    // Função para enviar mensagem, usada pelo botão e pela tecla Enter
    function sendMessage() {
        const messageText = chatIn.value.trim();
        if (messageText) {
            socket.send(JSON.stringify({
                type: 'enviarMensagem',
                nickname: nickname,
                roomName: roomName,
                content: messageText
            }));
            chatIn.value = ""; // Limpa o campo de input imediatamente
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    chatIn.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // === LÓGICA DE RECEBIMENTO DE MENSAGENS DO SERVIDOR ===
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);

        switch (data.type) {
            // Caso receba uma mensagem nova para exibir
            case 'novaMensagem':
                chatOut.value += `${data.nickname}: ${data.content}\n`;
                // Faz o scroll para a mensagem mais recente
                chatOut.scrollTop = chatOut.scrollHeight; 
                break;
            
            // Caso o servidor envie o histórico da sala ao entrar
            case 'historicoChat':
                chatOut.value = ''; // Limpa a área de chat
                data.messages.forEach(msg => {
                    chatOut.value += `${msg.nickname_usuario}: ${msg.conteudo}\n`;
                });
                chatOut.scrollTop = chatOut.scrollHeight;
                break;
        }
    };
    
    // Opcional: Avisar ao servidor que você está entrando nesta sala
    socket.onopen = function() {
        socket.send(JSON.stringify({
            type: 'entrarNaSala',
            nickname: nickname,
            roomName: roomName
        }));
    };

    // A lógica de sair da sala permanece a mesma
    quitBtn.addEventListener("click", function() {
        window.location.href = 'lobby.html';
    });
});