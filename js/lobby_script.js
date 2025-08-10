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

    // Cria o item <li> principal
    const newRoomItem = document.createElement("li");
    newRoomItem.classList.add("room-item");

    // Cria e anexa o <span> para o nome
    const nameSpan = document.createElement('span');
    nameSpan.textContent = roomName;
    nameSpan.classList.add('room-name-display');
    newRoomItem.appendChild(nameSpan);

    // Cria e anexa o <span> para o contador
    const countSpan = document.createElement('span');
    countSpan.textContent = '1/10'; // Valor inicial
    countSpan.classList.add('room-count-display');
    newRoomItem.appendChild(countSpan);

    // Cria o botão "Entrar"
    const joinButton = document.createElement("button");
    joinButton.textContent = "Entrar";
    joinButton.classList.add("join-room-btn");

    joinButton.addEventListener("click", function() {
        // 1. Salva o nome da sala específica deste botão no sessionStorage
        // A função "lembra" qual era o valor de 'roomName' quando ela foi criada!
        sessionStorage.setItem('nomeSala', roomName);

        // 2. Redireciona o usuário para a página de chat
        window.location.href = 'chat.html';
    });

    newRoomItem.appendChild(joinButton);

    // Finalmente, anexa o <li> completo (com nome, contador E botão) à lista <ul>
    roomList.appendChild(newRoomItem);

    // Atualiza o contador de salas e limpa o input
    roomCountInput.textContent = roomList.children.length;
    roomNameInput.value = "";
    roomNameInput.focus();
});