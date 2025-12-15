// seed.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const User = require('./models/User'); // Asigură-te că calea e corectă
const Task = require('./models/Task'); // Asigură-te că calea e corectă
const connectDB = require('./config/db'); 

// --- DATE INIȚIALE ---
const initialUsers = [
    // ATENȚIE: ID-urile de tip Number sunt necesare pentru a se potrivi cu câmpul 'userId' din modelul Task.
    { id: 1, username: 'user1', password: 'password1' }, 
    { id: 2, username: 'user2', password: 'password2' },
];

const initialTasks = [
    // --- Task-uri pentru user 1 (ID: 1) ---
    { userId: 1, title: 'Plata Facturilor', description: 'Achită factura de electricitate și internet.', dueDate: '2025-12-10', completed: false },
    { userId: 1, title: 'Proiect final', description: 'Finalizează raportul pentru proiectul Vue/Ionic.', dueDate: '2025-11-30', completed: false },
    { userId: 1, title: 'Cumpărături', description: 'Ia lapte, ouă și pâine.', dueDate: '2025-11-28', completed: true },
    { userId: 1, title: 'Planificare Săptămânală', description: 'Organizează agenda și obiectivele săptămânale.', dueDate: '2025-12-05', completed: false },
    { userId: 1, title: 'Revizuire Documentație', description: 'Parcurge documentația pentru Axios 1.x.', dueDate: '2025-12-08', completed: false },

    // --- Task-uri pentru user 2 (ID: 2) ---
    { userId: 2, title: 'Revizuire Cod', description: 'Verifică PR-ul colegului Ionut.', dueDate: '2025-12-05', completed: false },
    { userId: 2, title: 'Pregătire Prezentare', description: 'Slide-uri pentru întâlnirea de Luni.', dueDate: '2025-12-01', completed: false },
    { userId: 2, title: 'Creează API Mock', description: 'Structurează datele false pentru API.', dueDate: '2025-12-08', completed: false },
    { userId: 2, title: 'Testare E2E', description: 'Rulează suita completă de teste end-to-end.', dueDate: '2025-12-10', completed: true },
];

// --- FUNCTIA PRINCIPALA DE SEEDING ---
const seedDB = async () => {
    try {
        // Conectare la baza de date
        await connectDB(); 

        console.log('--- Începe popularea bazei de date (Seeding) ---');

        // 1. Șterge datele existente (pentru a avea un start curat de fiecare dată)
        await User.deleteMany({});
        await Task.deleteMany({});
        console.log('Datele existente (User și Task) au fost șterse.');

        // 2. Hash-uirea și Inserarea Utilizatorilor
        // Hash-uim parolele înainte de a insera, deoarece insertMany nu declanșează pre-hook-ul 'save'
        const userPromises = initialUsers.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            return {
                ...user,
                password: hashedPassword 
            };
        });

        // Așteptăm ca toate parolele să fie hash-uite
        const hashedUsers = await Promise.all(userPromises);
        
        // Inserăm utilizatorii în baza de date
        await User.insertMany(hashedUsers); 
        console.log(`Utilizatori inserați: ${hashedUsers.length}`);


        // 3. Inserarea Task-urilor
        await Task.insertMany(initialTasks);
        console.log(`Task-uri inserate: ${initialTasks.length}`);

        console.log('--- Populare finalizată cu succes! ---');
        
    } catch (error) {
        console.error('Eroare la popularea bazei de date:', error.message);
        process.exit(1);
    } finally {
        // Închide conexiunea Mongoose după finalizare
        mongoose.connection.close();
        console.log('Conexiunea la baza de date a fost închisă.');
    }
};

seedDB();