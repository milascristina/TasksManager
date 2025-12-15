// config/db.js

const mongoose = require('mongoose');

// Schimbă acest URL cu URL-ul tău real de MongoDB.
// Dacă MongoDB rulează local, acest URL este corect.
const DB_URL = 'mongodb://localhost:27017/taskManagerDB'; 

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URL);
        console.log('✅ Conexiune la MongoDB reușită!');
    } catch (error) {
        console.error('❌ Eroare la conectarea la MongoDB:', error.message);
        // Ieșire din proces în caz de eroare critică
        process.exit(1); 
    }
};

module.exports = connectDB;