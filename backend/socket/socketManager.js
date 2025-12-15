// socket/socketManager.js

const { Server } = require('socket.io');

let io;

// Funcție pentru a inițializa serverul Socket.IO
// Trebuie apelată cu serverul HTTP (instanța creată de app.listen)
const initSocketServer = (httpServer) => {
    // 1. Inițializează Socket.IO pe serverul HTTP existent
    io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:8100', // Permite doar frontend-ului Ionic
            methods: ['GET', 'POST']
        },
        // 2. Setări de autentificare pentru conexiunea WebSocket
        // Clientul va trimite token-ul în 'socket.handshake.auth.token'
        // Aici ar trebui să ai logica de verificare JWT, dar pentru simplitate
        // și pentru a nu duplica logica de autentificare, putem face o 
        // verificare minimă sau putem presupune că autentificarea se face corect
        // într-un middleware separat, dar pentru simplitate o facem aici.
    });

    // Aici ar trebui să fie funcția reală de decodare și verificare JWT.
    // Deoarece nu am fișierul authController.js, voi folosi o simulare.
    // În producție, folosește aceeași funcție de verificare JWT ca în middleware-ul HTTP.
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            // TODO: AICI DECODEZI ȘI VERIFICI JWT-UL REAL
            // Exemplu simulat: extrage ID-ul user-ului din token
            // const decoded = jwt.verify(token, 'SECRET_KEY');
            // socket.userId = decoded.userId; 
            
            // SIMULARE: Presupunem că e autentificat
            socket.userId = 'simulated_user_id_from_token'; 
            next();
        } else {
            console.log('Socket connection rejected: No token provided.');
            next(new Error('Authentication error: Token required.'));
        }
    });

    // 3. Gestionarea Conexiunilor
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.id})`);
        
        // Asociază conexiunea cu ID-ul user-ului (Room)
        // ACESTA ESTE PASUL CHEIE PENTRU NOTIFICĂRI ȚINTITE
        socket.join(socket.userId); 
        console.log(`Socket joined room: ${socket.userId}`);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    console.log('Socket.IO Server initialized.');
};

// Funcție pentru a trimite o notificare unui anumit utilizator (Room)
const sendNotificationToUser = (userId, eventName, data) => {
    if (io) {
        // io.to(userId) trimite mesajul DOAR la socket-urile din camera 'userId'
        io.to(userId).emit(eventName, data);
        console.log(`[Socket] Event "${eventName}" sent to user room: ${userId}`);
    } else {
        console.error('Socket.IO not initialized.');
    }
};

module.exports = {
    initSocketServer,
    sendNotificationToUser
};