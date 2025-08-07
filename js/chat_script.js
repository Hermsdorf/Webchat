// 1. Seleciona os elementos do HTML
const chat_in = document.getElementById("chat_in");
const chat_out = document.getElementById("chat_out");
const botao = document.getElementById("sendbt");
const nomeUsuario = sessionStorage.getItem('nomeUsuarioChat');
const button_quit = document.getElementById("quit-chat");
document.getElementById("sidebar-title").textContent = "Bem-vindo, " + nomeUsuario;


// 2. Adiciona um "ouvinte de evento" ao botão
botao.addEventListener("click", function() 
{
  // 3. Quando o botão for clicado, esta função é executada

  // CORREÇÃO: Usar .value para ler o que foi digitado
  const mensagemEntrada = nomeUsuario + ": " + chat_in.value;

  // Não faz sentido enviar uma mensagem vazia
  if (mensagemEntrada.trim() === "") 
  {
    return; // Interrompe a função se não houver texto
  }

  // MELHORIA: Acumular as mensagens no chat de saída, em vez de substituir
  // O "\n" cria uma nova linha a cada mensagem
  chat_out.value += mensagemEntrada + "\n";

  // CORREÇÃO: Usar .value para limpar o campo de entrada
  chat_in.value = ""; // Limpa o campo de entrada

  // BÔNUS: Foca novamente no campo de entrada para o usuário digitar a próxima mensagem
  chat_in.focus();
});

button_quit.addEventListener("click", function() {
     
    // Redireciona para a página inicial
    window.location.href = 'lobby.html';
});

chat_in.addEventListener('keydown', function(event) 
{
    // A propriedade 'event.key' nos diz qual tecla foi pressionada.
    // A propriedade 'event.shiftKey' é um booleano (true/false) que indica
    // se a tecla Shift estava pressionada no momento do evento.

    // A CONDIÇÃO: Se a tecla for "Enter" E a tecla Shift NÃO estiver pressionada...
    if (event.key === 'Enter' && !event.shiftKey) 
      {
        
        // 1. Previne o comportamento padrão do "Enter" na textarea,
        // que seria criar uma nova linha. Nós não queremos isso.
        event.preventDefault();

        // 2. Programaticamente "clica" no botão de enviar.
        // Isso executa toda a lógica que já está no 'addEventListener("click", ...)' do botão.
        // É uma forma limpa e eficiente de reutilizar código!
        botao.click();
    }

    // Se a condição acima for falsa (por exemplo, o usuário pressionou "Shift + Enter"),
    // o código dentro do 'if' não é executado.
    // Com isso, o navegador realiza a ação padrão, que para "Shift + Enter"
    // é exatamente o que queremos: criar uma nova linha na caixa de texto.
});