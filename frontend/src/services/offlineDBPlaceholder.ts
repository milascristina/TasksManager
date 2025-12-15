// Numele cheilor folosite în Local Storage
const TASK_STORAGE_KEY = 'localTasks';
const QUEUE_STORAGE_KEY = 'operationQueue';

// --- Tipuri de Date ---

interface Task {
    _id: string; // Poate fi ID-ul real sau un ID temporar (temp-...) în modul offline
    title: string;
    description: string;
    completed: boolean;
    dueDate: string;
}

interface Operation {
    tempId: string; // ID unic local pentru a identifica operațiunea în coadă
    type: 'create' | 'update' | 'delete';
    data?: Omit<Task, '_id'> & { _id?: string }; // Datele task-ului (pentru create/update)
    taskId?: string; // ID-ul task-ului (pentru delete)
    timestamp: number;
}

// --- Funcții Helper pentru Local Storage ---

const loadFromStorage = (key: string): any[] => {
    try {
        const json = localStorage.getItem(key);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error(`Eroare la citirea din Local Storage pentru cheia ${key}:`, e);
        return [];
    }
};

const saveToStorage = (key: string, data: any[]): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Eroare la scrierea în Local Storage pentru cheia ${key}:`, e);
    }
};

// ======================================================
// 🚀 GESTIUNEA TASK-URILOR LOCALE (CA BAZA DE DATE LOCALĂ)
// ======================================================

export const getLocalTasks = async (
    searchTerm: string, 
    filterCompleted: boolean | undefined, 
    page: number, 
    limit: number
): Promise<{ tasks: Task[], total: number }> => {
    await new Promise(resolve => setTimeout(resolve, 100)); 

    let allTasks: Task[] = loadFromStorage(TASK_STORAGE_KEY);
    
    // Aplică Filtrare
    if (filterCompleted !== undefined) {
        allTasks = allTasks.filter(t => t.completed === filterCompleted);
    }

    // Aplică Căutare
    const searchLower = searchTerm.toLowerCase();
    if (searchLower) {
        allTasks = allTasks.filter(t => 
            t.title.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower)
        );
    }
    
    // Aplică Paginare
    const total = allTasks.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = allTasks.slice(startIndex, endIndex);

    return { 
        tasks: paginatedTasks, 
        total: total 
    };
};

export const saveLocalTask = async (task: Task): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 50)); 
    let allTasks: Task[] = loadFromStorage(TASK_STORAGE_KEY);

    const index = allTasks.findIndex(t => t._id === task._id);

    if (index !== -1) {
        // Actualizare
        allTasks[index] = task;
    } else {
        // Creare (în modul offline, _id-ul este temporar)
        allTasks.unshift(task); 
    }

    saveToStorage(TASK_STORAGE_KEY, allTasks);
};

export const deleteLocalTask = async (taskId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 50)); 
    let allTasks: Task[] = loadFromStorage(TASK_STORAGE_KEY);

    const updatedTasks = allTasks.filter(t => t._id !== taskId);

    saveToStorage(TASK_STORAGE_KEY, updatedTasks);
};

// ==================================================
// 📥 GESTIUNEA COLECTĂRII DE OPERAȚIUNI (OFFLINE QUEUE)
// ==================================================

export const getOperationQueue = async (): Promise<Operation[]> => {
    await new Promise(resolve => setTimeout(resolve, 10)); 
    return loadFromStorage(QUEUE_STORAGE_KEY) as Operation[];
};

export const addOperationToQueue = async (operation: Operation): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 10)); 
    let queue: Operation[] = loadFromStorage(QUEUE_STORAGE_KEY);
    queue.push(operation);
    saveToStorage(QUEUE_STORAGE_KEY, queue);
};

export const removeOperationFromQueue = async (tempIds: string[]): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 10)); 
    let queue: Operation[] = loadFromStorage(QUEUE_STORAGE_KEY);
    
    const updatedQueue = queue.filter(op => !tempIds.includes(op.tempId));
    
    saveToStorage(QUEUE_STORAGE_KEY, updatedQueue);
};

export const clearOperationQueue = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 10)); 
    saveToStorage(QUEUE_STORAGE_KEY, []);
};