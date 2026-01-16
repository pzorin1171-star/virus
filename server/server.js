const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Хранилище игровых сессий
const gameSessions = new Map();

// Маршруты API
app.get('/api/stats', (req, res) => {
    res.json({
        activeSessions: gameSessions.size,
        totalGames: 0,
        version: '1.0.0'
    });
});

app.post('/api/save', (req, res) => {
    const { userId, gameData } = req.body;
    
    // Здесь можно сохранять в базу данных
    console.log(`Game saved for user: ${userId}`);
    
    res.json({ success: true, message: 'Game saved' });
});

app.get('/api/leaderboard', (req, res) => {
    res.json([
        { username: 'BioTerror', score: 15000, days: 42 },
        { username: 'Pandemic', score: 12000, days: 38 },
        { username: 'VirusLord', score: 10000, days: 35 }
    ]);
});

// WebSocket соединения
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('join-game', (data) => {
        const { sessionId, role } = data;
        
        if (!gameSessions.has(sessionId)) {
            gameSessions.set(sessionId, {
                players: [],
                gameState: null,
                created: Date.now()
            });
        }
        
        const session = gameSessions.get(sessionId);
        session.players.push({
            id: socket.id,
            role: role || 'virus',
            ready: false
        });
        
        socket.join(sessionId);
        socket.emit('joined', { sessionId, role });
        
        // Уведомление других игроков
        socket.to(sessionId).emit('player-joined', { 
            playerId: socket.id, 
            role: role || 'virus' 
        });
        
        console.log(`Player ${socket.id} joined session ${sessionId} as ${role}`);
    });
    
    socket.on('game-action', (data) => {
        const { sessionId, action, payload } = data;
        
        // Пересылка действия другим игрокам
        socket.to(sessionId).emit('game-update', {
            playerId: socket.id,
            action,
            payload
        });
        
        console.log(`Action from ${socket.id} in ${sessionId}: ${action}`);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Удаление игрока из всех сессий
        gameSessions.forEach((session, sessionId) => {
            session.players = session.players.filter(p => p.id !== socket.id);
            
            if (session.players.length === 0) {
                gameSessions.delete(sessionId);
                console.log(`Session ${sessionId} deleted`);
            } else {
                // Уведомление о выходе игрока
                io.to(sessionId).emit('player-left', { playerId: socket.id });
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
