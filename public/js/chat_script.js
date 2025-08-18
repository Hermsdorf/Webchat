document.addEventListener('DOMContentLoaded', () =>
{
    const chatIn = document.getElementById("chat_in");
    const chatOut = document.getElementById("chat_out");
    const sendBtn = document.getElementById("sendbt");
    const quitBtn = document.getElementById("quit-chat");

    const nickname = sessionStorage.getItem('nickname');
    const roomName = sessionStorage.getItem('nomeSala');
    const logoutBtn = document.getElementById('logout');


    if (!nickname || !roomName)
    {
        window.location.href = '/home.html';
        return;
    }

    document.getElementById("sidebar-title").textContent = `Bem-vindo, ${nickname}`;
    document.getElementById("boas-vindas").textContent = `Sala: ${roomName}`;

    // === CONEXÃO WEBSOCKET ===
    const authToken = sessionStorage.getItem('authToken');

    if (!authToken)
    {
        console.error("Token de autenticação não encontrado. Redirecionando para home.");
        window.location.href = '/index.html';
        return;
    }

    const socket = new WebSocket(`ws://${window.location.host}?token=${authToken}`);

    // === ENVIO DE MENSAGENS PARA O SERVIDOR ===
    function sendMessage()
    {
        const messageText = chatIn.value.trim();
        if (messageText)
        {
            const messagePayload = {
                type: 'enviarMensagem',
                nickname: nickname,
                roomName: roomName,
                content: messageText
            };

            console.log("CLIENTE: Enviando para o servidor:", messagePayload);
            socket.send(JSON.stringify(messagePayload));
            chatIn.value = "";
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    chatIn.addEventListener('keydown', function (event)
    {
        if (event.key === 'Enter' && !event.shiftKey)
        {
            event.preventDefault();
            sendMessage();
        }
    });

    // === RECEBIMENTO DE MENSAGENS DO SERVIDOR ===
    socket.onmessage = function (event)
    {
        const data = JSON.parse(event.data);

        switch (data.type)
        {
            case 'novaMensagem':
                chatOut.value += `${data.nickname}: ${data.content}\n`;
                chatOut.scrollTop = chatOut.scrollHeight;
                break;
            
        }
    };

    // Debug servidor: Avisa o servidor que você está entrando nesta sala
    socket.onopen = function ()
    {
        socket.send(JSON.stringify({
            type: 'entrarNaSala',
            nickname: nickname,
            roomName: roomName
        }));
    };

    quitBtn.addEventListener("click", function ()
    {
        window.location.href = 'lobby.html';
    });

    if (logoutBtn)
    {
        logoutBtn.addEventListener('click', (event) =>
        {            
            event.preventDefault();
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('nickname');
            sessionStorage.removeItem('nomeSala'); 
            console.log('Sessão encerrada. Redirecionando para a home.');
            window.location.href = '/index.html';
        });
    }


});