// repositories/UserRepository.js

const User = require('../models/User'); 

/**
 * UserRepository gestionează operațiile CRUD pentru entitatea User.
 */
class UserRepository {
    
    /**
     * Caută un utilizator după ID-ul său numeric.
     * @param {number} id - ID-ul numeric al utilizatorului.
     * @returns {Promise<User|null>} Documentul User (fără hash-ul parolei) sau null.
     */
    static async findById(id) {
        return User.findOne({ id: id }).lean();
    }
    
    /**
     * Caută un utilizator după numele de utilizator (pentru operațiuni standard).
     * @param {string} username - Numele de utilizator.
     * @returns {Promise<User|null>} Documentul User (fără hash-ul parolei) sau null.
     */
    static async findByUsername(username) {
        return User.findOne({ username: username }).lean();
    }
    
    /**
     * Caută un utilizator după numele de utilizator, selectând și parola (necesar pentru login).
     * @param {string} username - Numele de utilizator.
     * @returns {Promise<User|null>} Documentul User (INCLUSIV hash-ul parolei) sau null.
     */
    static async findByUsernameWithPassword(username) {
        // .select('+password') este necesar pentru că în modelul User.js am pus select: false
        return User.findOne({ username: username }).select('+password').lean(); 
    }
    
    /**
     * Creează un nou utilizator în baza de date.
     * Parola va fi hashuita automat de middleware-ul Mongoose din model.
     * @param {object} userData - Datele noului utilizator (username, password).
     * @returns {Promise<User>} Documentul User nou creat.
     */
    static async create(userData) {
        // Aici ar trebui să generezi ID-ul unic (de exemplu, un ID secvențial sau UUID) dacă nu folosești ObjectId-ul MongoDB.
        // Pentru a menține compatibilitatea cu modelul tău Task (unde userId e Number),
        // trebuie să te asiguri că userData conține deja un 'id' unic de tip Number.
        const newUser = new User(userData);
        return newUser.save();
    }
}

module.exports = UserRepository;