// src/services/socket.js

import { io } from 'socket.io-client';
// Presupunem că api.js exportă funcția getToken()
import api from '@/services/api'; 

let socket = null;

// Adresa URL a serverului Socket.IO
const SOCKET_URL = 'http://localhost:3000'; 

/**
 * @function initializeSocket
 * Inițializează și returnează instanța Socket.IO.
 * Include logica de preluare a JWT pentru autentificare.
 * @returns {Promise<Socket|null>} Instanța Socket.IO sau null dacă token-ul lipsește.
 */
export const initializeSocket = async () => {
    // 1. Verificare conexiune existentă
    if (socket && socket.connected) {
        console.log('[SOCKET] Conexiunea este deja activă.');
        return socket;
    }
    
    // 2. Preluare token JWT
    const token = await api.getToken(); 
    
    if (!token) {
        console.warn('[SOCKET] Nu s-a găsit Token-ul JWT. Conexiunea Socket.IO este anulată.');
        return null; 
    }

    console.log('[SOCKET] Se inițializează conexiunea cu Token-ul JWT...');

    // 3. Inițializarea conexiunii cu trimiterea Token-ului
    socket = io(SOCKET_URL, {
        auth: {
            token: token // Trimitem JWT-ul către middleware-ul Socket.IO din backend
        },
        // Opțional: Configurează un timeout mai mare dacă ai probleme de conectare
        // timeout: 10000 
    });

    // 4. Configurare evenimente de bază
    
    socket.on('connect', () => {
        console.log('[SOCKET] Conectat cu succes la server.');
    });

    // Adăugat: Gestiunea erorilor specifice de autentificare (de obicei trimise de backend)
    socket.on('connect_error', (error) => {
        if (error.message === 'Authentication error') {
            console.error('[SOCKET] Eroare de autentificare (JWT invalid/expirat).', error);
            // Opțional: Aici poți adăuga logica de deconectare și redirecționare la login
        } else {
            console.error('[SOCKET] Eroare de conectare (Generică):', error);
        }
    });

    socket.on('disconnect', (reason) => {
        console.warn('[SOCKET] Deconectat. Motiv:', reason);
    });

    socket.on('error', (error) => {
        console.error('[SOCKET] Eroare generală Socket:', error);
    });

    return socket;
};

/**
 * @function getSocket
 * Returnează instanța Socket.IO existentă.
 * @returns {Socket|null} Instanța Socket.IO.
 */
export const getSocket = () => socket;

/**
 * @function disconnectSocket
 * Deconectează socket-ul și resetează instanța.
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('[SOCKET] Deconectat și instanța a fost șters.');
    }
};

/**
 * @function reconnectSocket
 * Deconectează și re-inițializează conexiunea (utilă după login sau re-autentificare).
 * @returns {Promise<Socket|null>}
 */
export const reconnectSocket = async () => {
    disconnectSocket();
    return await initializeSocket();
}