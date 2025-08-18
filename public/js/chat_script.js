// =========================================================================
// FUNÇÕES AUXILIARES DE CRIPTOGRAFIA
// =========================================================================
async function loadPrivateKey() {
    const jwkPrivateKey = JSON.parse(localStorage.getItem('privateKey'));
    if (!jwkPrivateKey) { throw new Error("Chave privada não encontrada!"); }
    return await window.crypto.subtle.importKey('jwk', jwkPrivateKey, { name: "RSA-OAEP", hash: "SHA-256" }, true, ['decrypt']);
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
}

// =========================================================================
// SCRIPT PRINCIPAL DO CHAT
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    
    let roomCryptoKey = null; // Variável para guardar a chave da sala

    const chatIn = document.getElementById("chat_in");
    const chatOut = document.getElementById("chat_out");
    const sendBtn = document.getElementById("sendbt");
    const quitBtn = document.getElementById("quit-chat");
    const nickname = sessionStorage.getItem('nickname');
    const roomName = sessionStorage.getItem('nomeSala');
    const authToken = sessionStorage.getItem('authToken');
    const logoutBtn = document.getElementById('logout');

    if (!nickname || !roomName || !authToken) {
        window.location.href = '/index.html';
        return;
    }

    document.getElementById("sidebar-title").textContent = `Bem-vindo, ${nickname}`;
    document.getElementById("boas-vindas").textContent = `Sala: ${roomName}`;

    const socket = new WebSocket(`ws://${window.location.host}?token=${authToken}`);

    socket.onopen = function () {
        console.log("Conectado! Entrando na sala...");
        socket.send(JSON.stringify({ type: 'entrarNaSala', nickname, roomName }));
    };

    socket.onmessage = async function (event) {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'chaveDaSala':
                try {
                    const privateKey = await loadPrivateKey();
                    const encryptedKeyBuffer = base64ToArrayBuffer(data.encryptedKey);
                    const decryptedRoomKeyBuffer = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedKeyBuffer);
                    
                    roomCryptoKey = await window.crypto.subtle.importKey(
                        'raw',
                        decryptedRoomKeyBuffer,
                        { name: 'AES-GCM', length: 256 },
                        true,
                        ['encrypt', 'decrypt']
                    );
                    
                    console.log("Chave da sala recebida e pronta para uso!");
                } catch (err) {
                    console.error("FALHA AO PROCESSAR A CHAVE DA SALA:", err);
                }
                break;
            
            case 'novaMensagem':
                if (!roomCryptoKey) return;
                try {
                    const { iv, encryptedContent } = JSON.parse(data.content);
                    const ivBuffer = base64ToArrayBuffer(iv);
                    const encryptedBuffer = base64ToArrayBuffer(encryptedContent);
                    const decryptedBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, roomCryptoKey, encryptedBuffer);
                    const decryptedMessage = new TextDecoder().decode(decryptedBuffer);
                    
                    chatOut.value += `${data.nickname}: ${decryptedMessage}\n`;
                    chatOut.scrollTop = chatOut.scrollHeight;
                } catch(err) {
                    console.error("Falha ao decifrar mensagem:", err);
                    chatOut.value += `[Não foi possível decifrar a mensagem de ${data.nickname}]\n`;
                }
                break;
        }
    };
    
    async function sendMessage() {
        const messageText = chatIn.value.trim();
        if (messageText && roomCryptoKey) {
            try {
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const encodedMessage = new TextEncoder().encode(messageText);
                const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, roomCryptoKey, encodedMessage);

                const payload = {
                    iv: arrayBufferToBase64(iv),
                    encryptedContent: arrayBufferToBase64(encryptedBuffer)
                };

                socket.send(JSON.stringify({
                    type: 'enviarMensagem',
                    nickname: nickname,
                    roomName: roomName,
                    content: JSON.stringify(payload)
                }));
                chatIn.value = "";
            } catch (err) {
                console.error("Erro ao criptografar a mensagem:", err);
            }
        } else {
            console.error("MENSAGEM NÃO ENVIADA! Chave da sala (roomCryptoKey) não existe?", !!roomCryptoKey);
            if (!roomCryptoKey) alert("Não é possível enviar a mensagem. A chave de criptografia da sala não está disponível.");
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    chatIn.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    if (quitBtn) quitBtn.addEventListener("click", () => window.location.href = 'lobby.html');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (socket.readyState === WebSocket.OPEN) socket.close();
            sessionStorage.clear();
            localStorage.removeItem('privateKey');
            console.log('Sessão encerrada.');
            window.location.href = '/index.html';
        });
    }
});