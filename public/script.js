// script.js - Cliente Principal com Interface Completa
const socket = io();

// Elementos da DOM
const screens = {
    mainMenu: document.getElementById('main-menu'),
    waitingRoom: document.getElementById('waiting-room'),
    gameScreen: document.getElementById('game-screen'),
    victoryScreen: document.getElementById('victory-screen')
};

// Inputs do menu
const playerNameInput = document.getElementById('playerName');
const roomCodeInput = document.getElementById('roomCode');
const generateCodeBtn = document.getElementById('generateCode');
const joinRoomBtn = document.getElementById('joinRoom');
const cancelWaitBtn = document.getElementById('cancelWait');
const leaveGameBtn = document.getElementById('leaveGame');
const playAgainBtn = document.getElementById('playAgain');
const backToMenuBtn = document.getElementById('backToMenu');

// Elementos de UI do jogo
const currentRoomCode = document.getElementById('currentRoomCode');
const playerCount = document.getElementById('playerCount');
const waitingPlayersList = document.getElementById('waitingPlayersList');

// Placar
const p1Name = document.getElementById('p1-name');
const p2Name = document.getElementById('p2-name');
const p1Health = document.getElementById('p1-health');
const p2Health = document.getElementById('p2-health');
const p1HealthText = document.getElementById('p1-health-text');
const p2HealthText = document.getElementById('p2-health-text');
const gameTimer = document.getElementById('game-timer');

// Tela de vitória
const victoryTitle = document.getElementById('victory-title');
const winnerName = document.getElementById('winner-name');
const matchTime = document.getElementById('match-time');
const winnerHealth = document.getElementById('winner-health');

// Estado do jogo
let gameState = {
    playerId: null,
    roomId: null,
    players: {},
    gameStarted: false,
    matchStartTime: null,
    timerInterval: null
};

// Importar sistema de renderização
import { updateState, startRenderLoop, setLocalPlayerId } from './render.js';

// Sistema de Input
const currentInput = {
    left: false,
    right: false, 
    up: false,
    attack: false
};

// ==================== FUNÇÕES PRINCIPAIS ====================

// Gerar código de sala aleatório
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Trocar de tela
function showScreen(screenName) {
    console.log(`🔄 Mudando para tela: ${screenName}`);
    
    // Esconder todas as telas
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar tela selecionada
    screens[screenName].classList.add('active');
    
    // Configurações específicas por tela
    if (screenName === 'gameScreen') {
        startRenderLoop();
        setupGameControls();
        showControlInstructions();
    }
}

// Atualizar placar
function updateScoreboard() {
    const playerIds = Object.keys(gameState.players);
    
    // Player 1 (esquerda)
    if (playerIds.length >= 1) {
        const player1 = gameState.players[playerIds[0]];
        p1Name.textContent = player1.name;
        p1Health.style.width = `${player1.health}%`;
        p1HealthText.textContent = `${Math.round(player1.health)}%`;
        updateHealthBarColor(p1Health, player1.health);
    } else {
        // Reset se não houver jogador
        p1Name.textContent = 'Aguardando...';
        p1Health.style.width = '100%';
        p1HealthText.textContent = '100%';
        updateHealthBarColor(p1Health, 100);
    }
    
    // Player 2 (direita)
    if (playerIds.length >= 2) {
        const player2 = gameState.players[playerIds[1]];
        p2Name.textContent = player2.name;
        p2Health.style.width = `${player2.health}%`;
        p2HealthText.textContent = `${Math.round(player2.health)}%`;
        updateHealthBarColor(p2Health, player2.health);
    } else {
        // Reset se não houver segundo jogador
        p2Name.textContent = 'Aguardando...';
        p2Health.style.width = '100%';
        p2HealthText.textContent = '100%';
        updateHealthBarColor(p2Health, 100);
    }
}

// Atualizar cor da barra de vida
function updateHealthBarColor(healthBar, health) {
    if (health > 50) {
        healthBar.style.background = 'linear-gradient(90deg, #2ecc71, #f1c40f)';
    } else if (health > 25) {
        healthBar.style.background = 'linear-gradient(90deg, #f1c40f, #e74c3c)';
    } else {
        healthBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    }
}

// Iniciar timer do jogo
function startGameTimer() {
    console.log('⏰ Iniciando timer do jogo...');
    
    gameState.matchStartTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - gameState.matchStartTime;
        const remaining = Math.max(0, 120000 - elapsed); // 2 minutos
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        gameTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Tempo esgotado
        if (remaining <= 0) {
            console.log('⏰ Tempo esgotado!');
            clearInterval(gameState.timerInterval);
            checkTimeOutVictory();
        }
    }, 1000);
}

// Verificar vitória por tempo
function checkTimeOutVictory() {
    const players = Object.values(gameState.players);
    if (players.length === 2) {
        const [p1, p2] = players;
        let winner;
        
        if (p1.health > p2.health) {
            winner = p1;
        } else if (p2.health > p1.health) {
            winner = p2;
        } else {
            // Empate - decidir aleatoriamente
            winner = Math.random() > 0.5 ? p1 : p2;
        }
        
        console.log(`⏰ Vitória por tempo: ${winner.name}`);
        showVictoryScreen(winner, true);
    }
}

// Mostrar tela de vitória
function showVictoryScreen(winner, isTimeOut = false) {
    const elapsed = Date.now() - gameState.matchStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    
    victoryTitle.textContent = isTimeOut ? '⏰ Tempo Esgotado!' : '🎉 Vitória!';
    winnerName.textContent = winner.name;
    matchTime.textContent = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    winnerHealth.textContent = `${Math.round(winner.health)}%`;
    
    showScreen('victoryScreen');
}

// Configurar controles de teclado
function setupGameControls() {
    console.log("🎮 Configurando controles do jogo...");
    
    document.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        let inputChanged = false;

        if (['arrowleft', 'a'].includes(key)) {
            currentInput.left = true;
            inputChanged = true;
        }
        if (['arrowright', 'd'].includes(key)) {
            currentInput.right = true;
            inputChanged = true;
        }
        if (['arrowup', 'w'].includes(key)) {
            currentInput.up = true;
            inputChanged = true;
        }
        if ([' ', 'x'].includes(key)) {
            currentInput.attack = true;
            inputChanged = true;
        }

        if (inputChanged) {
            sendInputToServer();
        }
    });

    document.addEventListener("keyup", (e) => {
        const key = e.key.toLowerCase();
        let inputChanged = false;

        if (['arrowleft', 'a'].includes(key)) {
            currentInput.left = false;
            inputChanged = true;
        }
        if (['arrowright', 'd'].includes(key)) {
            currentInput.right = false;
            inputChanged = true;
        }
        if (['arrowup', 'w'].includes(key)) {
            currentInput.up = false;
            inputChanged = true;
        }
        if ([' ', 'x'].includes(key)) {
            currentInput.attack = false;
            inputChanged = true;
        }

        if (inputChanged) {
            sendInputToServer();
        }
    });
}

// Enviar inputs para o servidor
function sendInputToServer() {
    if (gameState.playerId && gameState.roomId) {
        socket.emit("input", { ...currentInput });
    }
}

// Mostrar instruções de controle na tela do jogo
function showControlInstructions() {
    // Remover instruções anteriores se existirem
    const existingInstructions = document.querySelector('.control-instructions');
    if (existingInstructions) {
        existingInstructions.remove();
    }

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'control-instructions';
    controlsDiv.innerHTML = `
        <div style="
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            padding: 15px;
            border-radius: 10px;
            font-size: 14px;
            border: 1px solid rgba(255,255,255,0.2);
            z-index: 1000;
        ">
            <strong>🎮 Controles:</strong><br>
            <span style="color: #feca57">A/←</span> Esquerda | 
            <span style="color: #feca57">D/→</span> Direita<br>
            <span style="color: #feca57">W/↑</span> Pular | 
            <span style="color: #feca57">ESPAÇO</span> Atacar
        </div>
    `;
    document.getElementById('game-screen').appendChild(controlsDiv);
}

// Atualizar sala de espera
function updateWaitingRoom(players) {
    playerCount.textContent = `${players.length}/2`;
    waitingPlayersList.innerHTML = '';
    
    players.forEach(playerId => {
        const li = document.createElement('li');
        const isYou = playerId === gameState.playerId;
        li.textContent = isYou ? 'Você' : `Jogador ${playerId.substring(0, 6)}`;
        if (isYou) {
            li.style.fontWeight = 'bold';
            li.style.color = '#feca57';
        }
        waitingPlayersList.appendChild(li);
    });
}

// ==================== EVENT LISTENERS ====================

// ✅ CORRIGIDO: Botão Gerar Código
generateCodeBtn.addEventListener('click', () => {
    const newCode = generateRoomCode();
    roomCodeInput.value = newCode;
    console.log('🔑 Código gerado:', newCode);
});

// Entrar na sala
joinRoomBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim() || 'Jogador';
    let roomCode = roomCodeInput.value.trim().toUpperCase();
    
    if (!roomCode) {
        roomCode = generateRoomCode();
        roomCodeInput.value = roomCode;
    }
    
    if (playerName && roomCode) {
        console.log('🎪 Tentando entrar na sala:', { playerName, roomCode });
        
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('roomCode', roomCode);
        
        gameState.roomId = roomCode;
        currentRoomCode.textContent = roomCode;
        
        // Limpar estado anterior
        gameState.players = {};
        gameState.gameStarted = false;
        
        // Emitir evento para entrar na sala
        socket.emit('join-room', { 
            playerName: playerName, 
            roomId: roomCode 
        });
        
        showScreen('waitingRoom');
    } else {
        alert('Por favor, preencha seu nome e código da sala.');
    }
});

// Cancelar espera
cancelWaitBtn.addEventListener('click', () => {
    console.log('❌ Cancelando espera...');
    socket.emit('leave-room');
    showScreen('mainMenu');
});

// Sair do jogo
leaveGameBtn.addEventListener('click', () => {
    console.log('🏃 Saindo do jogo...');
    socket.emit('leave-room');
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    showScreen('mainMenu');
});

// Jogar novamente
playAgainBtn.addEventListener('click', () => {
    const playerName = localStorage.getItem('playerName') || 'Jogador';
    const roomCode = localStorage.getItem('roomCode') || generateRoomCode();
    
    console.log('🔄 Jogando novamente...');
    socket.emit('join-room', { 
        playerName: playerName, 
        roomId: roomCode 
    });
    
    showScreen('waitingRoom');
});

// Voltar ao menu
backToMenuBtn.addEventListener('click', () => {
    console.log('🏠 Voltando ao menu...');
    showScreen('mainMenu');
});

// ==================== SOCKET.IO EVENTOS ====================

socket.on('login-success', (data) => {
    gameState.playerId = data.playerId;
    setLocalPlayerId(data.playerId);
    console.log('✅ Conectado como:', data.playerId);
});

socket.on('room-full', () => {
    console.log('❌ Sala cheia!');
    alert('Sala cheia! Escolha outra sala.');
    showScreen('mainMenu');
});

socket.on('player-joined', (data) => {
    console.log('👥 Jogador entrou:', data.playerId);
    updateWaitingRoom(data.roomPlayers);
});

socket.on('player-left', (data) => {
    console.log('👋 Jogador saiu:', data.playerId);
    updateWaitingRoom(data.roomPlayers);
    
    // Se o jogo estava rodando e alguém saiu, voltar ao menu
    if (gameState.gameStarted) {
        gameState.gameStarted = false;
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
        alert('Oponente desconectou! Voltando ao menu.');
        showScreen('mainMenu');
    }
});

socket.on('state', (state) => {
    console.log('🎮 Estado recebido:', Object.keys(state).length, 'jogadores');
    
    gameState.players = state;
    updateState(state);
    
    // Iniciar jogo quando 2 jogadores estiverem conectados
    if (!gameState.gameStarted && Object.keys(state).length === 2) {
        console.log('🚀 INICIANDO JOGO - 2 jogadores conectados!');
        gameState.gameStarted = true;
        showScreen('gameScreen');
        startGameTimer();
        updateScoreboard();
    } else if (gameState.gameStarted) {
        updateScoreboard();
    }
});

socket.on('game-over', (data) => {
    console.log('🎊 Jogo finalizado. Vencedor:', data.winner);
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    const winner = gameState.players[data.winner];
    if (winner) {
        showVictoryScreen(winner);
    }
});

socket.on('disconnect', () => {
    console.log('🔌 Desconectado do servidor');
    alert('Conexão perdida com o servidor.');
    showScreen('mainMenu');
});

// ==================== INICIALIZAÇÃO ====================

window.addEventListener('DOMContentLoaded', () => {
    // Carregar dados salvos
    const savedName = localStorage.getItem('playerName');
    const savedCode = localStorage.getItem('roomCode');
    
    if (savedName) playerNameInput.value = savedName;
    if (savedCode) roomCodeInput.value = savedCode;
    
    console.log('🎮 Sistema inicializado!');
    showScreen('mainMenu');
});