// controllers/TaskControllers.js

const TaskRepository = require('../repositories/TaskRepository');
const { sendNotificationToUser } = require('../socket/socketManager'); // Pentru notificări WebSocket

/**
 * Funcție helper pentru a gestiona erorile și a trimite răspunsuri JSON.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ----------------------------------------------------
// --- 1. GET /api/tasks (Citire & Filtrare) ---
// ----------------------------------------------------
const getTasks = asyncHandler(async (req, res) => {
    const userId = req.userId; 
    const { search, completed, page, limit } = req.query; // Preluăm și parametrii de paginare!

    // 💡 CORECȚIE CRITICĂ: Presupunem că Repository returnează un obiect cu paginare
    // În TaskRepository.findByUserId, trebuie să implementezi logica de paginare/filtrare 
    // care returnează { tasks: [...], total: N, page: X, limit: Y }

    const result = await TaskRepository.findByUserId(userId, search, completed, page, limit);

    // 💡 LOGARE AJUTĂTOARE: Vezi ce primești de la Repository
    console.log(`[BACKEND] TaskControllers: Preluare Task-uri (Total: ${result.total || 'necunoscut'})`);

    // 💡 RĂSPUNS CORECT: Trimitem tot obiectul de răspuns pe care îl așteaptă Frontend-ul
    if (Array.isArray(result)) {
        // Dacă Repository returnează un array simplu, îl împachetăm
        return res.status(200).json({ 
            tasks: result, 
            total: result.length, 
            page: 1, 
            limit: result.length 
        });
    }

    // Cazul ideal: Repository returnează un obiect complet cu paginare (tasks și total)
    res.status(200).json(result); 
});

// ----------------------------------------------------
// --- 2. GET /api/tasks/:id (Citire Task Individual) ---
// ... (Restul controller-ului rămâne neschimbat) ...
// ----------------------------------------------------

const getTaskById = asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId;
    
    const task = await TaskRepository.findByIdAndUserId(taskId, userId);

    if (!task) {
        return res.status(404).send({ message: 'Task-ul nu a fost găsit sau nu aparține utilizatorului.' });
    }

    res.status(200).json(task);
});

const createTask = asyncHandler(async (req, res) => {
    const userId = req.userId;
    let taskData = req.body; // Folosim let pentru a permite modificarea

    // 💡 CORECȚIE CRITICĂ: Eliminăm orice ID trimis de client pentru a forța MongoDB să genereze unul nou
    if (taskData._id) {
        delete taskData._id; 
    }

    const newTask = await TaskRepository.create(userId, taskData);

    sendNotificationToUser(userId, 'taskCreated', newTask);
    
    res.status(201).json(newTask);
});

const updateTask = asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId;
    const updateData = req.body;

    // 💡 CORECȚIE CRITICĂ: Verificăm dacă ID-ul din rută este valid (nu 'undefined')
    if (!taskId || taskId === 'undefined') {
        return res.status(400).send({ message: 'ID-ul task-ului lipsește sau este invalid.' });
    }

    const updatedTask = await TaskRepository.update(taskId, userId, updateData);

    if (!updatedTask) {
        return res.status(404).send({ message: 'Task-ul nu a fost găsit sau nu aparține utilizatorului.' });
    }

    sendNotificationToUser(userId, 'taskUpdated', updatedTask);

    res.status(200).json(updatedTask);
});

const deleteTask = asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId;

    // 💡 CORECȚIE CRITICĂ: Verificăm dacă ID-ul din rută este valid
    if (!taskId || taskId === 'undefined') {
        return res.status(400).send({ message: 'ID-ul task-ului lipsește sau este invalid.' });
    }

    const wasDeleted = await TaskRepository.delete(taskId, userId);

    if (!wasDeleted) {
        return res.status(404).send({ message: 'Task-ul nu a fost găsit sau nu aparține utilizatorului.' });
    }
    
    sendNotificationToUser(userId, 'taskDeleted', { id: taskId });

    res.status(204).send(); 
});

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
};