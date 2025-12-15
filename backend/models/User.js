// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Importăm bcrypt pentru criptarea parolei
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    // Am păstrat 'id' de tip Number pentru consistența cu 'userId' din modelul Task,
    // deși MongoDB folosește automat '_id' de tip ObjectId. 
    // Dacă vrei să folosești ID-ul MongoDB (ObjectId), poți șterge acest câmp.
    id: { 
        type: Number, 
        unique: true,
        required: true 
    },
    username: {
        type: String,
        required: [true, 'Numele de utilizator este obligatoriu.'],
        unique: true, // Asigură unicitatea username-ului
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Parola este obligatorie.'],
        select: false // NU returnează parola când cauți utilizatori!
    },
}, {
    timestamps: true 
});

// --- Middleware Pre-Salvare (Hashing Parolă) ---
// Rulează înainte de salvarea oricărui document User
UserSchema.pre('save', async function(next) {
    // Verifică dacă parola a fost modificată (sau e nouă)
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Criptează parola
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// --- Metodă de Instanță (Verificare Parolă) ---
// Adaugă o metodă pentru a compara parola introdusă cu hash-ul din baza de date
UserSchema.methods.comparePassword = async function(candidatePassword) {
    // Parola (this.password) a fost setată să nu fie selectată (select: false)
    // Va trebui să selectezi explicit parola în controller/service pentru a folosi asta.
    // Sau poți folosi bcrypt.compare direct în controller, dar metoda de instanță e mai curată.
    return bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);