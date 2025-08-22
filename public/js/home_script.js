document.addEventListener('DOMContentLoaded', () =>
{
    const loginInput = document.getElementById('login');
    const senhaInput = document.getElementById('senha');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const messageP = document.getElementById('auth-message');
    
    async function generateUserKeys()
    {
        // Gera um par de chaves RSA-OAEP, o padrão para criptografia segura
        return await window.crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            },
            true, // A chave pode ser exportada para salvarmos
            ['encrypt', 'decrypt']
        );
    }

    registerBtn.addEventListener('click', async () =>
    {
        const login = loginInput.value;
        const senha = senhaInput.value;
        if (!login || !senha)
        {
            messageP.textContent = "Login e senha são obrigatórios.";
            messageP.style.color = 'red';
            return;
        }

        try
        {
            messageP.textContent = "Gerando chaves de segurança...";
            messageP.style.color = 'blue';

            const keyPair = await generateUserKeys();
            const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
            const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
            localStorage.setItem('privateKey', JSON.stringify(privateKeyJwk));
            messageP.textContent = "Enviando para o servidor...";
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    login,
                    senha,
                    publicKey: JSON.stringify(publicKeyJwk)
                })
            });

            const data = await response.json();
            messageP.textContent = data.message;
            if (response.ok)
            {
                messageP.style.color = 'green';
            } else
            {
                messageP.style.color = 'red';
                localStorage.removeItem('privateKey'); // Remove a chave se o cadastro falhar
            }
        } catch (err)
        {
            console.error("Erro no processo de cadastro:", err);
            messageP.textContent = "Ocorreu um erro inesperado.";
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
            messageP.textContent = data.message;
            messageP.style.color = 'green';
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