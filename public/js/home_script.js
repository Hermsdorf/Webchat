document.addEventListener('DOMContentLoaded', () =>
{
    const loginInput = document.getElementById('login');
    const senhaInput = document.getElementById('senha');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const messageP = document.getElementById('auth-message');

    registerBtn.addEventListener('click', async () =>
    {
        const login = loginInput.value;
        const senha = senhaInput.value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, senha })
        });

        const data = await response.json();
        messageP.textContent = data.message; // Exibe a mensagem do servidor
        if (response.ok)
        {
            messageP.style.color = 'green';
        } else
        {
            messageP.style.color = 'red';
        }
    });

    loginBtn.addEventListener('click', async () =>
    {
        const login = loginInput.value;
        const senha = senhaInput.value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, senha })
        });

        const data = await response.json();

        if (response.ok)
        {
            // Login bem-sucedido!
            messageP.textContent = data.message;
            messageP.style.color = 'green';

            sessionStorage.setItem('login', login);
            sessionStorage.setItem('nickname', data.nickname);
            sessionStorage.setItem('authToken', data.token); 

            
            setTimeout(() =>
            {
                window.location.href = '/lobby.html';
            }, 1000);

        } else
        {
            messageP.textContent = data.message;
            messageP.style.color = 'red';
        }
    });
});