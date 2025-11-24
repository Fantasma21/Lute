// game.js - Lógica Específica do Jogo (para game.html)
const socket = io();

// Elementos do DOM específicos do game.html
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

// Estado do jogo local
let gameState = {
    playerId: null,
    roomId: null,
    players: {},
    gameStarted: false
};

// Sistema de input
const currentInput = {
    left: false,
    right: false, 
    up: false,
    attack: false
};

// ==================== INICIALIZAÇÃO ====================

// Carregar dados salvos ou usar padrão
const playerName = localStorage.getItem("playerName") || "Jogador";
const roomId = localStorage.getItem("roomId") || "sala-default";

// Entrar na sala automaticamente ao carregar
console.log(`🎮 Entrando como ${playerName} na sala ${roomId}`);
socket.emit("join-room", { playerName, roomId });

// ==================== SOCKET EVENTOS ====================

// Sala cheia
socket.on("room-full", () => {
    console.log("❌ Sala cheia!");
    alert("A sala já está cheia! Tente outra sala.");
    window.location.href = "/";
});

// Login confirmado
socket.on("login-success", (data) => {
    gameState.playerId = data.playerId;
    console.log("✅ Logado como:", data.playerId);
    
    // Iniciar controles após login
    setupGameControls();
});

// Estado do jogo atualizado
socket.on("state", (state) => {
    console.log("📦 Estado recebido:", Object.keys(state).length, "jogadores");
    gameState.players = state;
    
    // Debug dos jogadores
    for (const id in state) {
        const player = state[id];
        console.log(`👤 ${player.name}: ${player.state} em (${Math.round(player.x)}, ${Math.round(player.y)})`);
    }
    
    // Renderizar estado
    renderGameState();
});

// Jogador entrou
socket.on("player-joined", (data) => {
    console.log("👥 Jogador entrou:", data.playerName);
    updatePlayerCount(data.roomPlayers);
});

// Jogador saiu
socket.on("player-left", (data) => {
    console.log("👋 Jogador saiu:", data.playerName);
    updatePlayerCount(data.roomPlayers);
    
    // Se o jogo estava rodando e alguém saiu
    if (gameState.gameStarted) {
        alert(`${data.playerName} desconectou!`);
        gameState.gameStarted = false;
    }
});

// Fim de jogo
socket.on("game-over", (data) => {
    console.log("🎊 Fim de jogo! Vencedor:", data.winnerName);
    alert(`🏆 ${data.winnerName} venceu o duelo!`);
    
    // Recarregar para jogar novamente
    setTimeout(() => {
        window.location.reload();
    }, 3000);
});

// ==================== CONTROLES ====================

// Configurar controles de teclado
function setupGameControls() {
    console.log("🎮 Configurando controles...");
    
    document.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        let inputChanged = false;

        switch(key) {
            case "arrowleft":
            case "a":
                currentInput.left = true;
                inputChanged = true;
                break;
            case "arrowright":
            case "d":
                currentInput.right = true;
                inputChanged = true;
                break;
            case "arrowup":
            case "w":
                currentInput.up = true;
                inputChanged = true;
                break;
            case " ":
            case "x":
                currentInput.attack = true;
                inputChanged = true;
                break;
        }

        if (inputChanged) {
            sendInputToServer();
        }
    });

    document.addEventListener("keyup", (e) => {
        const key = e.key.toLowerCase();
        let inputChanged = false;

        switch(key) {
            case "arrowleft":
            case "a":
                currentInput.left = false;
                inputChanged = true;
                break;
            case "arrowright":
            case "d":
                currentInput.right = false;
                inputChanged = true;
                break;
            case "arrowup":
            case "w":
                currentInput.up = false;
                inputChanged = true;
                break;
            case " ":
            case "x":
                currentInput.attack = false;
                inputChanged = true;
                break;
        }

        if (inputChanged) {
            sendInputToServer();
        }
    });
    
    console.log("✅ Controles configurados: A/D (movimento), W (pular), ESPAÇO (atacar)");
}

// Enviar inputs para servidor
function sendInputToServer() {
    if (gameState.playerId && gameState.roomId) {
        socket.emit("input", { ...currentInput });
    }
}

// ==================== RENDERIZAÇÃO ====================

// Renderizar estado do jogo
function renderGameState() {
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar fundo
    drawBackground();
    
    // Desenhar jogadores
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        drawPlayer(player);
    }
    
    // Desenhar UI
    drawGameUI();
}

// Desenhar fundo
function drawBackground() {
    // Gradiente de fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#2c3e50");
    gradient.addColorStop(1, "#34495e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Chão
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(0, 320, canvas.width, 80);
    
    // Linha do chão
    ctx.fillStyle = "#95a5a6";
    ctx.fillRect(0, 320, canvas.width, 2);
}

// Desenhar jogador
function drawPlayer(player) {
    const isCurrentPlayer = player.id === gameState.playerId;
    
    // Cor baseada no time (azul para player atual, vermelho para oponente)
    const color = isCurrentPlayer ? "#3498db" : "#e74c3c";
    
    // Corpo do jogador
    ctx.fillStyle = color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    
    // Contorno
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.w, player.h);
    
    // Indicador de estado
    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(player.state, player.x + player.w/2, player.y - 5);
    
    // Nome do jogador
    ctx.fillText(player.name, player.x + player.w/2, player.y - 20);
    
    // Barra de vida
    drawHealthBar(player);
    
    ctx.textAlign = "left";
}

// Desenhar barra de vida
function drawHealthBar(player) {
    const barWidth = 50;
    const barHeight = 6;
    const barX = player.x + (player.w - barWidth) / 2;
    const barY = player.y - 35;
    
    // Fundo da barra
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Vida (cores dinâmicas)
    const healthPercent = player.health / 100;
    let healthColor = "#2ecc71"; // Verde
    if (healthPercent < 0.5) healthColor = "#f39c12"; // Amarelo
    if (healthPercent < 0.25) healthColor = "#e74c3c"; // Vermelho
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Texto da vida
    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.fillText(`${Math.round(player.health)}%`, barX + barWidth + 5, barY + barHeight);
}

// Desenhar UI do jogo
function drawGameUI() {
    const playerCount = Object.keys(gameState.players).length;
    
    // Contador de jogadores
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`Jogadores: ${playerCount}/2`, canvas.width - 10, 20);
    
    // Instruções
    ctx.textAlign = "left";
    ctx.fillText("Controles: A/D ←→ Mover, W ↑ Pular, ESPAÇO Atacar", 10, 20);
    
    // Estado do jogo
    if (playerCount === 2 && !gameState.gameStarted) {
        gameState.gameStarted = true;
        ctx.fillStyle = "#feca57";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🎮 JOGO INICIADO! 🎮", canvas.width/2, 40);
    }
}

// ==================== UTILITÁRIOS ====================

// Atualizar contador de jogadores na UI
function updatePlayerCount(players) {
    const playerCount = players.length;
    console.log(`📊 Jogadores na sala: ${playerCount}/2`);
    
    // Atualizar título da página com contador
    document.title = `LUTE - ${playerCount}/2 Jogadores`;
    
    // Se temos 2 jogadores, iniciar jogo
    if (playerCount === 2 && !gameState.gameStarted) {
        gameState.gameStarted = true;
        console.log("🚀 Jogo iniciando...");
    }
}

// Debug do estado atual
function debugState() {
    console.log("🐞 Estado atual:", {
        playerId: gameState.playerId,
        roomId: gameState.roomId,
        players: Object.keys(gameState.players),
        gameStarted: gameState.gameStarted,
        currentInput: currentInput
    });
}

// Inicialização final
console.log("🎮 game.js carregado!");
console.log("📍 Aguardando conexão...");

// Tornar funções disponíveis globalmente para debug
window.gameDebug = {
    state: () => debugState(),
    players: () => gameState.players,
    input: () => currentInput
};