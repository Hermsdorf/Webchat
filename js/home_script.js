// =========================================================================
// SELEÇÃO DE ELEMENTOS (Unificando os dois scripts)
// =========================================================================

// Seus seletores originais
const s_button = document.getElementById("start-chat");
const nome_input = document.getElementById("nome");

// Novos seletores para a funcionalidade de emoji
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.querySelector('emoji-picker');


// =========================================================================
// NOVA LÓGICA: Seletor de Emojis
// =========================================================================

// 1. Mostra/Esconde o balão de emojis quando o ícone é clicado
emojiBtn.addEventListener('click', () => {
    const isHidden = emojiPicker.style.display === 'none' || emojiPicker.style.display === '';
    emojiPicker.style.display = isHidden ? 'block' : 'none';
});

// 2. Adiciona o emoji selecionado ao campo de texto
emojiPicker.addEventListener('emoji-click', event => {
    // Adiciona o caractere do emoji ao valor existente do input
    nome_input.value += event.detail.unicode;
});

// 3. (Bônus) Fecha o seletor se o usuário clicar fora dele
document.addEventListener('click', (event) => {
    const isClickInsidePicker = emojiPicker.contains(event.target);
    const isClickOnButton = emojiBtn.contains(event.target);

    // Se o clique não foi dentro do balão E não foi no botão de emoji, esconde o balão.
    if (!isClickInsidePicker && !isClickOnButton) {
        emojiPicker.style.display = 'none';
    }
});


// =========================================================================
// LÓGICA EXISTENTE: Iniciar o Chat (Mantida exatamente como você escreveu)
// =========================================================================

nome_input.addEventListener("keydown", function(event) 
{
    if (event.key === "Enter") 
    {
        event.preventDefault();
        s_button.click();
    }
});

s_button.addEventListener("click", function(event) {
    // A sua lógica original é mantida 100% intacta.
    // O preventDefault() é uma boa prática caso o botão esteja dentro de um form ou <a>.
    event.preventDefault(); 
    
    const nome = nome_input.value;

    if (nome.trim() === "") {
        alert("Por favor, digite seu nome para iniciar o chat.");
        return;
    }

    // Salva o nome (agora possivelmente com emojis) no sessionStorage
    sessionStorage.setItem('nomeUsuarioChat', nome);

    // Redireciona para a página do chat
    // Certifique-se de que o nome do seu arquivo é 'chat.html' e não 'pagina.html'
    window.location.href = 'lobby.html';
});