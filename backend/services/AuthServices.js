// services/AuthService.js

const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs'); 

class AuthService {
    
    /**
     * Procesează login-ul unui utilizator.
     * @param {string} username - Numele de utilizator.
     * @param {string} password - Parola în text simplu.
     * @returns {Promise<{userId: number}|null>} Un obiect cu ID-ul user-ului la succes sau null la eșec.
     */
    static async login(username, password) {
        // 1. Preluare user din Repository (inclusiv hash-ul parolei)
        const user = await UserRepository.findByUsernameWithPassword(username);

        if (!user) {
            return null; // Userul nu există
        }
        
        // 2. Comparație securizată a parolei (bcrypt)
        // Comparăm parola trimisă (text simplu) cu hash-ul stocat (user.password)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return null; // Parolă incorectă
        }
        
        // Autentificare reușită
        return { userId: user.id }; 
    }
    
    /**
     * Procesează înregistrarea unui nou utilizator.
     * @param {object} userData - { username, password }
     * @returns {Promise<User>} Documentul User nou creat.
     */
    static async register(userData) {
        // Verifică unicitatea înainte de a încerca să creezi
        const existingUser = await UserRepository.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('Numele de utilizator este deja folosit.');
        }
        
        // TODO: Aici ar trebui să generezi și un ID unic de tip Number, 
        // deoarece modelul Task depinde de un 'userId' de tip Number.
        // De exemplu: userData.id = generateUniqueNumberId();

        return UserRepository.create(userData);
    }
    
    /**
     * Găsește un utilizator după ID-ul său (folosit de multe ori pentru profil).
     * @param {number} userId - ID-ul utilizatorului.
     * @returns {Promise<User|null>}
     */
    static async getUserProfile(userId) {
        return UserRepository.findById(userId);
    }
}

module.exports = AuthService;