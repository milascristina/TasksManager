// src/services/api.js

import axios from 'axios';

// --- 1. Configurație de Bază ---
// Asigură-te că aceasta este adresa corectă a backend-ului tău Express
const API_URL = 'http://localhost:3000/api'; 
const TOKEN_KEY = 'authToken'; 
const USER_ID_KEY = 'authUserId'; 

// --- 2. Instanța Axios (HTTP Client) ---
const api = axios.create({ 
    baseURL: API_URL,
    // Permite trimiterea de credențiale (necesar pentru cookie-uri, deși nu le folosim aici)
    withCredentials: true 
});


// --- Funcții Helper pentru Stocare (Folosind localStorage) ---

// Funcțiile sunt async pentru a menține consistența (chiar dacă localStorage e sincron)
async function safeStorageGet(key) {
    const value = localStorage.getItem(key);
    return value ? value : null;
}

async function safeStorageSet(key, value) {
    try {
        localStorage.setItem(key, value.toString());
    } catch (e) {
        console.error(`[STORAGE ERROR] Nu s-a putut scrie cheia ${key} în localStorage.`, e);
    }
}

async function safeStorageRemove(key) {
    localStorage.removeItem(key);
}

// -----------------------------------------------------------

// --- 3. Interceptor pentru Adăugarea Header-ului de Autorizare ---
api.interceptors.request.use(async (config) => {
    const token = await safeStorageGet(TOKEN_KEY); 
    
    if (token) {
        // Adaugă token-ul JWT sub forma "Bearer <token>"
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});


// 💡 4. Interceptor pentru Logarea Erorilor (CRITIC pentru depanare)
// Acest interceptor ne arată de ce pică cererea de task-uri/health check.
api.interceptors.response.use(response => response, (error) => {
    
    // Eroare cu răspuns HTTP (ex: 401 Unauthorized, 500 Internal Server Error)
    if (error.response) {
        console.error(`[AXIOS EROARE RĂSPUNS ${error.response.status}]:`, error.response.data);
    } 
    // Eroare fără răspuns HTTP (CORS, Network Error, Timeout, server oprit)
    else if (error.request) {
        console.error('[AXIOS EROARE REȚEA]: Nu s-a putut conecta la server. (CORS, Timeout, sau server oprit)', error.message);
    } else {
        console.error('[AXIOS EROARE Necunoscută]:', error.message);
    }
    
    // Dacă token-ul a expirat (401), poți adăuga logică de logout aici
    if (error.response && error.response.status === 401) {
        console.log('[API] 401 Primit. Token invalid/expirat. Se efectuează logout...');
        safeStorageRemove(TOKEN_KEY);
        safeStorageRemove(USER_ID_KEY);
        // Poți forța și o redirecționare la login aici, dar e mai bine în router.
    }
    
    return Promise.reject(error);
});

// -----------------------------------------------------------

// --- 5. Serviciul de Bază (Exportat) ---
export default {
    
    // --- Autentificare ---
    async login(credentials) {
        try {
            const response = await api.post('/login', credentials);
            
            const { token, userId } = response.data; // Așteptăm token și userId de la backend

            if (token && userId) {
                await safeStorageSet(TOKEN_KEY, token);
                await safeStorageSet(USER_ID_KEY, userId); 
                console.log(`[API] Login succes. Token stocat. userId: ${userId}`);
            } else {
                throw new Error("Răspunsul de login nu conține token sau userId.");
            }
            return response.data;
        } catch (error) {
            // Eroarea este deja logată de interceptor
            throw error; 
        }
    },

    async logout() {
        console.log('[API] Logout efectuat.');
        await safeStorageRemove(TOKEN_KEY);
        await safeStorageRemove(USER_ID_KEY);
    },

    // --- Funcții de Verificare Stare ---
    async getToken() {
        return await safeStorageGet(TOKEN_KEY);
    },

    async isAuthenticated() {
        // Verifică dacă există token
        const token = await safeStorageGet(TOKEN_KEY);
        return !!token;
    },

    // ------------------------------------------------------------------
    // --- Task-uri (CRUD) -----------------------------------
    // ------------------------------------------------------------------
    
    async fetchTasksPaginated(search = '', completed, page = 1, limit = 10) {
        let params = { page, limit };
        if (search) params.search = search;
        // Transformă completed (boolean/undefined) în string pentru URL
        if (completed !== undefined) params.completed = completed.toString(); 

        console.log('[API] Preluare task-uri cu parametrii:', params);
        
        // Cererea GET va include automat token-ul prin interceptor
        const response = await api.get('/tasks', { params });
        
        // Presupunem că backend-ul returnează: { tasks: [...], total: N, ... }
        console.log(`[API] Task-uri preluate: ${response.data.tasks.length} buc. (Total: ${response.data.total})`);
        return response.data;
    },

    async createTask(task) {
        const response = await api.post('/tasks', task);
        return response.data;
    },
    
    async updateTask(taskId, taskData) {
        const response = await api.put(`/tasks/${taskId}`, taskData); 
        return response.data;
    },

    async deleteTask(taskId) {
        await api.delete(`/tasks/${taskId}`); 
        return true;
    },
};