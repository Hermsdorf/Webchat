document.addEventListener('DOMContentLoaded', () => {

    const s_button = document.getElementById("start-chat");
    const nome_input = document.getElementById("nome");
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.querySelector('emoji-picker');
    
    // A lógica do seletor de emojis permanece 100% no cliente, está perfeita.
    emojiBtn.addEventListener('click', () => {
        const isHidden = emojiPicker.style.display === 'none' || emojiPicker.style.display === '';
        emojiPicker.style.display = isHidden ? 'block' : 'none';
    });

    emojiPicker.addEventListener('emoji-click', event => {
        nome_input.value += event.detail.unicode;
    });

    document.addEventListener('click', (event) => {
        const isClickInsidePicker = emojiPicker.contains(event.target);
        const isClickOnButton = emojiBtn.contains(event.target);
        if (!isClickInsidePicker && !isClickOnButton) {
            emojiPicker.style.display = 'none';
        }
    });

    // Função para iniciar o chat, chamada pelo botão ou pela tecla Enter
    function iniciarChat() {
        const nome = nome_input.value;
        if (nome.trim() === "") {
            alert("Por favor, digite seu nome para iniciar o chat.");
            return;
        }
        // Salva no sessionStorage para a próxima página usar
        sessionStorage.setItem('nickname', nome);
        // Redireciona para o lobby
        window.location.href = '/lobby.html';
    }

    // Listener para o botão de iniciar
    s_button.addEventListener("click", iniciarChat);

    // Listener para a tecla Enter no input
    nome_input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Impede o comportamento padrão do Enter
            iniciarChat();
        }
    });
});