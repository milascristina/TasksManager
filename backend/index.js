// index.js (Versiunea Finală, Corectată și Completă)

const express = require('express');
const cors = require('cors'); 
const http = require('http'); 
// 💡 IMPORTANT: Asigură-te că ai instalat 'dotenv' (npm install dotenv)
require('dotenv').config(); 

// Importuri de Logică
const connectDB = require('./config/db'); 
const { initSocketServer } = require('./socket/socketManager'); 

// Importuri de Controllere (care includ și funcția de autentificare)
const authController = require('./controllers/AuthControllers'); 
const taskController = require('./controllers/TaskControllers'); 

const app = express();
// Folosește PORT din .env sau 3000 ca default
const PORT = process.env.PORT || 3000; 

// Creează serverul HTTP din aplicația Express
const server = http.createServer(app); 

// --- Configurație Middleware ---

// Configurare CORS pentru a permite comunicarea locală (8100 -> 3000)
// Am relaxat regula 'origin' pentru dezvoltare
app.use(cors({
    origin: ['http://localhost:8100', 'http://127.0.0.1:8100', '*'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(express.json());

// --- Rute ---
app.post('/api/login', authController.login); 

// 💡 CORECȚIE: Folosim funcția direct din Controller (authController.authenticateUser)
// Toate rutele de task-uri folosesc acum middleware-ul din AuthControllers.js
app.get('/api/tasks', authController.authenticateUser, taskController.getTasks);
app.get('/api/tasks/:id', authController.authenticateUser, taskController.getTaskById);
app.post('/api/tasks', authController.authenticateUser, taskController.createTask);
app.put('/api/tasks/:id', authController.authenticateUser, taskController.updateTask);
app.delete('/api/tasks/:id', authController.authenticateUser, taskController.deleteTask);


// --- Inițializarea Socket.IO ---
initSocketServer(server);


// --- Funcția Principală de Start ---
const startServer = async () => {
    try {
        // 1. AȘTEAPTĂ: Conectarea la baza de date Mongoose
        await connectDB(); 

        // 2. PORNEȘTE: Serverul Express și Socket.IO (DOAR după ce baza de date este gata)
        server.listen(PORT, () => {
            console.log(`🎉 Serverul Express rulează pe http://localhost:${PORT}`);
            console.log(`🌐 Serverul WebSocket rulează pe portul: ${PORT}`);
            console.log('--- Aplicația este gata de utilizare ---');
        });

    } catch (error) {
        console.error('❌ Eroare critică la pornirea aplicației: Nu s-a putut conecta la DB sau serverul nu a pornit.', error.message);
        process.exit(1); 
    }
};

// Apelăm funcția de start
startServer();