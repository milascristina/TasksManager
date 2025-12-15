// controllers/AuthControllers.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Necesită npm install bcryptjs
const User = require('../models/User'); // Importă Modelul Mongoose User

// !!! ATENȚIE: Înlocuiește 'TAREA_SECRETA_MEU' cu o cheie secretă complexă și stocată în mediu (ex. process.env.JWT_SECRET)
const JWT_SECRET = 'TAREA_SECRETA_MEU'; 

/**
 * Functie auxiliara pentru a decoda si verifica JWT.
 * Poate fi folosita atat pentru middleware-ul HTTP, cat si pentru Socket.IO.
 * @param {string} token - JWT-ul de verificat.
 * @returns {object|null} Payload-ul token-ului sau null in caz de eroare.
 */
const decodeJwt = (token) => {
    try {
        if (!token) return null;
        // Verifica si decodifica token-ul
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        // Loghează eroarea, dar nu arăta detalii clientului
        // console.error("JWT decoding failed:", err.message); 
        return null;
    }
};

// ----------------------------------------------------------------------
// --- 1. Funcția de Login (Generează JWT) ---
// ----------------------------------------------------------------------
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Caută user-ul, selectând și câmpul 'password' care este selectat: false implicit
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            console.warn(`[BACKEND] Login FAILED: User ${username} not found.`);
            return res.status(401).send({ message: 'Nume de utilizator sau parolă invalidă.' });
        }

        // 2. Verifică parola folosind bcrypt
        // Folosește metoda de instanță definită în models/User.js
        const isMatch = await user.comparePassword(password); 

        if (isMatch) {
            // 🚀 SUCCES: Parola se potrivește.
            console.log(`[BACKEND] Login SUCCESS. ID: ${user.id}`);

            // 3. Generează JWT
            // Folosim user.id (tip Number, definit în modelul Mongoose)
            const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
            
            // Trimitem 200 OK și token-ul necesar pentru toate cererile viitoare.
            res.status(200).send({ 
                message: 'Login successful', 
                token: token,
                userId: user.id // Utilitate pentru frontend
            });
            
        } else {
            // 🛑 EȘEC: Parola nu se potrivește.
            console.warn(`[BACKEND] Login FAILED: Invalid password for ${username}.`);
            res.status(401).send({ message: 'Nume de utilizator sau parolă invalidă.' });
        }
        
    } catch (error) {
        console.error('[BACKEND] Eroare SERVER (500) în controlerul de login:', error);
        res.status(500).send({ message: 'Eroare de server. Vă rugăm încercați mai târziu.' });
    }
};

// ----------------------------------------------------------------------
// --- 2. Middleware de Autentificare (Verifică JWT) ---
// ----------------------------------------------------------------------
const authenticateUser = (req, res, next) => {
    // 1. Token-ul vine din header 'Authorization: Bearer <token>'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrage token-ul din 'Bearer ...'

    if (!token) {
        return res.status(401).send({ message: 'Acces interzis. Token JWT lipsă.' });
    }

    // 2. Decodifică și verifică token-ul
    const decoded = decodeJwt(token);

    if (!decoded) {
        return res.status(403).send({ message: 'Token invalid sau expirat.' });
    }

    // 3. Autentificare reușită: Atașează ID-ul utilizatorului la cerere
    // userId va fi folosit de controllerele Task pentru a verifica ownership-ul.
    req.userId = decoded.userId; 
    
    // 4. Continuă cu următoarea funcție (controller-ul Task)
    next();
};


module.exports = { 
    login, 
    authenticateUser,
    decodeJwt // Exportăm pentru a fi folosit de SocketManager
};