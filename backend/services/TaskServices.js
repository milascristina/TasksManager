// services/TaskService.js

const TaskRepository = require('../repositories/TaskRepository');

class TaskService {
    
    // ----------------------------------------------------
    // READ (Citire și Paginare)
    // ----------------------------------------------------
    
    /**
     * Obține o pagină de task-uri pentru un utilizator, aplicând căutare și filtrare.
     * @param {number} userId - ID-ul utilizatorului autentificat.
     * @param {string} [search] - Termen de căutare.
     * @param {string} [completed] - Filtru după stare ('true', 'false', sau undefined).
     * @param {number} [page=1] - Numărul paginii de preluat (pentru paginare).
     * @param {number} [limit=10] - Numărul maxim de elemente pe pagină.
     * @returns {{tasks: Array<Task>, totalItems: number}} Task-urile filtrate și numărul total.
     */
    static getTasksPaginated(userId, search, completed, page = 1, limit = 10) {
        // Logica de filtrare, căutare și sortare este gestionată direct în Repository (mai eficient).
        const allFilteredTasks = TaskRepository.findByUserId(userId, search, completed);

        const totalItems = allFilteredTasks.length;
        
        // Calculul pentru paginare (Infinite Scrolling)
        const offset = (page - 1) * limit;
        const tasks = allFilteredTasks.slice(offset, offset + limit);

        return {
            tasks: tasks,
            totalItems: totalItems
        };
    }
    
    /**
     * Obține un singur task, verificând proprietarul.
     * @param {number} userId - ID-ul utilizatorului autentificat.
     * @param {number} taskId - ID-ul task-ului.
     * @returns {Task} Task-ul.
     * @throws {Error} Dacă task-ul nu este găsit sau utilizatorul nu este proprietar.
     */
    static getTaskById(userId, taskId) {
        const task = TaskRepository.findById(taskId);
        
        if (!task) {
            throw new Error("Task not found.");
        }
        
        if (task.userId !== userId) {
            throw new Error("Unauthorized access to task.");
        }
        
        return task;
    }
    
    // ----------------------------------------------------
    // CREATE/UPDATE (Salvare)
    // ----------------------------------------------------
    
    /**
     * Creează un task nou.
     * @param {number} userId - ID-ul utilizatorului.
     * @param {object} taskData - Datele task-ului.
     * @returns {Task} Task-ul nou creat.
     */
    static create(userId, taskData) {
        return TaskRepository.create(userId, taskData);
    }
    
    /**
     * Actualizează un task existent.
     * @param {number} userId - ID-ul utilizatorului autentificat.
     * @param {number} taskId - ID-ul task-ului de actualizat.
     * @param {object} updateData - Datele de actualizare.
     * @returns {Task} Task-ul actualizat.
     * @throws {Error} Dacă task-ul nu este găsit sau utilizatorul nu este proprietar.
     */
    static update(userId, taskId, updateData) {
        const task = this.getTaskById(userId, taskId); // Verifică existența și proprietarul
        
        // Nu permite actualizarea ID-ului utilizatorului sau a ID-ului task-ului
        delete updateData.userId;
        delete updateData.id;
        
        const updatedTask = TaskRepository.update(taskId, updateData);
        return updatedTask;
    }

    // ----------------------------------------------------
    // DELETE (Ștergere)
    // ----------------------------------------------------

    /**
     * Șterge un task existent.
     * @param {number} userId - ID-ul utilizatorului autentificat.
     * @param {number} taskId - ID-ul task-ului de șters.
     * @returns {boolean} True dacă ștergerea a avut succes.
     * @throws {Error} Dacă task-ul nu este găsit sau utilizatorul nu este proprietar.
     */
    static delete(userId, taskId) {
        // Verifică existența și proprietarul (aruncă eroare dacă nu e valid)
        this.getTaskById(userId, taskId); 
        
        const success = TaskRepository.delete(taskId);
        
        if (!success) {
             // Această eroare nu ar trebui să se întâmple după getTaskById, dar este un safety net
             throw new Error("Failed to delete task.");
        }
        
        return true;
    }
}

module.exports = TaskService;