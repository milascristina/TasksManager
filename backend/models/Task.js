// models/Task.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definim structura datelor Task-ului
const TaskSchema = new Schema({
    // Proprietatea esențială pentru securitatea bazată pe user.
    // Presupunem că ID-ul de utilizator este de tip Number (dacă folosești o bază de date relațională) 
    // sau String (dacă folosești un format UUID/ObjectId).
    // Dacă ID-ul de user din AuthControllers.js este un număr, păstrează Number.
    userId: {
        type: Number, 
        required: [true, 'Task-ul trebuie să fie asociat unui utilizator.'],
        index: true // Indexarea ajută la căutarea rapidă a task-urilor unui utilizator
    },
    title: {
        type: String,
        required: [true, 'Titlul task-ului este obligatoriu.'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        default: null
    },
    dueDate: {
        type: Date,
        // Poate fi opțional, în funcție de cerințe
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    // Adaugă automat câmpurile 'createdAt' și 'updatedAt'
    timestamps: true 
});

// Creează și exportă Modelul Mongoose bazat pe schemă
module.exports = mongoose.model('Task', TaskSchema);