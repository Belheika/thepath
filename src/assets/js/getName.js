const { ipcRenderer } = require('electron');

document.getElementById('minimize-btn').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});
document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.send('close-window');
});

document.getElementById('prenom').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const prenom = this.value.trim();
        if (prenom !== '') {
            localStorage.setItem('prenom', prenom);
            window.location.href = 'pages/signe.html';
        }
    }
});
