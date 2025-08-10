const createRoom = document.getElementById("create-room");
const roomNameInput = document.getElementById("room-name");
const roomList = document.getElementById("rooms-list");
const roomCountInput = document.getElementById("rooms-count");
const nomeUsuario = sessionStorage.getItem('nomeUsuarioChat');
document.getElementById("sidebar-title").textContent = "Bem-vindo, " + nomeUsuario;

createRoom.addEventListener("click", function(event) {
    event.preventDefault();
    const roomName = roomNameInput.value.trim();

    if (roomName === "") {
        alert("Por favor, digite um nome para a sala.");
        return;
    }

    // Cria o <li>, que será nosso "card" retangular
    const newRoomItem = document.createElement("li");
    newRoomItem.classList.add("room-item");

    // ================================================================
    // <<< MUDANÇA PRINCIPAL AQUI >>>
    // Criamos uma <div> para agrupar as informações da sala (nome e pessoas)
    // ================================================================
    const roomInfoDiv = document.createElement("div");
    roomInfoDiv.classList.add("room-info");

    const nameSpan = document.createElement('span');
    nameSpan.textContent = roomName;
    nameSpan.classList.add('room-name-display');

    const countSpan = document.createElement('span');
    // Ajustamos o texto para corresponder ao seu desenho
    countSpan.textContent = 'Pessoas: 1/10'; 
    countSpan.classList.add('room-people-count');

    // Adicionamos o nome e o contador DENTRO da nova div
    roomInfoDiv.appendChild(nameSpan);
    roomInfoDiv.appendChild(countSpan);

    // Cria o botão "Entrar"
    const joinButton = document.createElement("button");
    joinButton.textContent = "ENTRAR";
    joinButton.classList.add("join-room-btn");

    joinButton.addEventListener("click", function() {
        sessionStorage.setItem('nomeSala', roomName);
        window.location.href = 'chat.html';
    });

    // ================================================================
    // Anexamos as duas partes principais ao card <li>:
    // 1. A div com as informações
    // 2. O botão de entrar
    // ================================================================
    newRoomItem.appendChild(roomInfoDiv);
    newRoomItem.appendChild(joinButton);

    // Anexa o card completo à lista <ul>
    roomList.appendChild(newRoomItem);

    // Atualiza o contador e limpa o input
    roomCountInput.textContent = roomList.children.length;
    roomNameInput.value = "";
    roomNameInput.focus();
});