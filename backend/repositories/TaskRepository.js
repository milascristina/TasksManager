// repositories/TaskRepository.js

const Task = require('../models/Task'); // Importă Modelul Mongoose Task

/**
 * TaskRepository gestionează interacțiunile directe cu baza de date (MongoDB).
 * TOATE operațiile de căutare, modificare sau ștergere includ userId pentru securitate.
 */
class TaskRepository {
    
    // ----------------------------------------------------
    // READ (Citire) - Cautare, Filtrare și Sortare
    // ----------------------------------------------------
    
    /**
     * Obține task-urile pentru un utilizator specific, cu opțiuni de filtrare și căutare.
     * @param {number} userId - ID-ul utilizatorului autentificat (CRUCIAL PENTRU SECURITATE).
     * @param {string} [searchTerm=''] - Termen de căutare (titlu/descriere).
     * @param {boolean} [completed=undefined] - Filtrează după status (true/false/undefined).
     * @returns {Promise<Task[]>} O promisiune care returnează o matrice de task-uri.
     */
    static async findByUserId(userId, searchTerm = '', completed = undefined) {
        
        // Obiectul de interogare de bază: Task-urile trebuie să aparțină user-ului!
        const query = { userId: userId }; 
        
        // 1. Filtrare după status (completed)
        if (completed !== undefined) {
            // Conversia din string la boolean (dacă vine din query params)
            const isCompleted = completed === 'true' || completed === true; 
            query.completed = isCompleted;
        }

        // 2. Filtrare după termenul de căutare (folosind expresii regulate)
        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i'); // 'i' pentru case-insensitive
            query.$or = [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ];
        }

        // 3. Execută interogarea Mongoose
        // Sortare: task-urile nefinalizate (completed: false) apar primele (1 = ascendent, -1 = descendent)
        const tasks = await Task.find(query)
            .sort({ completed: 1, dueDate: 1 }) // Sortăm după completed (false e mai mic, deci primul) și apoi după data
            .lean(); // .lean() returnează obiecte JS simple, mai rapide

        return tasks;
    }
    
    /**
     * Obține un singur task după ID, dar DOAR dacă aparține utilizatorului.
     * @param {string} taskId - ID-ul Task-ului (ObjectId din MongoDB).
     * @param {number} userId - ID-ul utilizatorului autentificat.
     * @returns {Promise<Task|null>} Task-ul sau null.
     */
    static async findByIdAndUserId(taskId, userId) {
        return Task.findOne({
            _id: taskId,
            userId: userId // Condiția de securitate
        }).lean();
    }
    
    // ----------------------------------------------------
    // CREATE (Creare)
    // ----------------------------------------------------
    
    /**
     * Adaugă un task nou.
     * @param {number} userId - ID-ul utilizatorului care creează task-ul.
     * @param {object} taskData - Obiectul care conține title, description, dueDate.
     * @returns {Promise<Task>} Task-ul nou creat.
     */
    static async create(userId, taskData) {
        // Asigurăm că userId este inclus în datele de salvare
        const newTask = new Task({
            ...taskData,
            userId: userId,
            completed: false // Default
        });
        
        // Salvăm în baza de date
        return newTask.save();
    }
    
    // ----------------------------------------------------
    // UPDATE (Actualizare)
    // ----------------------------------------------------
    
    /**
     * Actualizează un task existent, dar DOAR dacă aparține utilizatorului.
     * @param {string} taskId - ID-ul task-ului de actualizat.
     * @param {number} userId - ID-ul utilizatorului autentificat.
     * @param {object} updateData - Datele de actualizare (ex: { title: 'nou', completed: true }).
     * @returns {Promise<Task|null>} Task-ul actualizat sau null dacă nu a fost găsit/nu aparține user-ului.
     */
    static async update(taskId, userId, updateData) {
        // Mongoose findOneAndUpdate:
        // 1. Criterii de căutare: _id ȘI userId (securitate)
        // 2. Date de actualizat: $set: updateData
        // 3. Opțiuni: new: true (returnează documentul modificat)
        return Task.findOneAndUpdate(
            { _id: taskId, userId: userId },
            { $set: updateData },
            { new: true } 
        ).lean();
    }
    
    // ----------------------------------------------------
    // DELETE (Ștergere)
    // ----------------------------------------------------
    
    /**
     * Șterge un task după ID, dar DOAR dacă aparține utilizatorului.
     * @param {string} taskId - ID-ul task-ului de șters.
     * @param {number} userId - ID-ul utilizatorului autentificat.
     * @returns {Promise<boolean>} True dacă task-ul a fost șters, false dacă nu a fost găsit sau nu aparține.
     */
    static async delete(taskId, userId) {
        const result = await Task.deleteOne({
            _id: taskId,
            userId: userId // Condiția de securitate
        });
        
        // result.deletedCount va fi 1 dacă un document a fost șters, 0 altfel
        return result.deletedCount === 1; 
    }
}

module.exports = TaskRepository;