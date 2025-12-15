<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          Task-uri ({{ currentStatus }})
          <ion-badge 
            :color="networkColor" 
            style="margin-left: 8px;">
            {{ networkStatusMessage }}
          </ion-badge>
          <ion-badge 
            v-if="pendingOperationsCount > 0"
            color="warning" 
            style="margin-left: 8px;">
            PENDING: {{ pendingOperationsCount }}
          </ion-badge>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openModal('create')" fill="clear" color="primary">
            <ion-icon slot="icon-only" :icon="addCircleOutline"></ion-icon>
          </ion-button>
          <ion-button @click="handleLogout" fill="clear" color="danger">
            <ion-icon slot="icon-only" :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <ion-toolbar>
        <ion-searchbar 
          v-model="searchTerm" 
          :debounce="500" 
          @ionChange="resetAndLoadTasks"
          placeholder="Caută în titlu sau descriere"
          :animated="true"
        ></ion-searchbar>
      </ion-toolbar>
      
      <ion-segment 
        v-model="filterCompleted" 
        @ionChange="resetAndLoadTasks" 
        value="undefined"
      >
        <ion-segment-button :value="undefined">
          <ion-label>Toate</ion-label>
        </ion-segment-button>
        <ion-segment-button value="false"> 
          <ion-label>De Făcut</ion-label>
        </ion-segment-button>
        <ion-segment-button value="true"> 
          <ion-label>Finalizate</ion-label>
        </ion-segment-button>
      </ion-segment>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      
      <ion-list>
        <ion-item-sliding v-for="task in tasks" :key="task._id"> 
          <ion-item :button="true" @click="openModal('edit', task)">
            <ion-label>
              <h2>{{ task.title }}</h2>
              <p>{{ task.description }}</p>
              <p class="due-date">Dată limită: {{ formatDate(task.dueDate) }}</p>
              <ion-note v-if="task._id && task._id.startsWith('temp-')" color="warning">
                NESINCRONIZAT
              </ion-note>
            </ion-label>
            <ion-note slot="end" :color="task.completed ? 'success' : 'warning'">
              {{ task.completed ? 'FINALIZAT' : 'PENDING' }}
            </ion-note>
          </ion-item>
          
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="confirmDelete(task)">
              <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
        
        <ion-item v-if="tasks.length === 0 && !loading">
          <ion-label class="ion-text-center">
            Nu s-au găsit task-uri. Adaugă unul nou!
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-infinite-scroll 
        @ionInfinite="loadMoreTasks($event)" 
        :disabled="!canLoadMore"
      >
        <ion-infinite-scroll-content loading-text="Se încarcă mai multe task-uri...">
        </ion-infinite-scroll-content>
      </ion-infinite-scroll>
      
      <ion-spinner v-if="loading && tasks.length === 0" name="dots" class="ion-padding-top"></ion-spinner>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonList, IonItem, IonLabel, IonNote, IonSegment, 
    IonSegmentButton, IonSearchbar, IonRefresher, IonRefresherContent,
    IonButtons, IonButton, IonIcon, IonSpinner, IonItemSliding, 
    IonItemOptions, IonItemOption, IonInfiniteScroll, IonInfiniteScrollContent,
    alertController, modalController, IonBadge
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { logOutOutline, trashOutline, addCircleOutline } from 'ionicons/icons';
import api from '@/services/api'; 
import { initializeSocket, disconnectSocket, getSocket } from '@/services/socket'; 
import TaskFormModal from '@/components/TaskFormModal.vue'; 
// AVERTISMENT: Importurile pentru logica offline sunt eliminate:
// import { getLocalTasks, saveLocalTask, deleteLocalTask, getOperationQueue, addOperationToQueue, removeOperationFromQueue } from '../services/offlineDBPlaceholder'; 

// --- Stări Globale ---
const router = useRouter();
const tasks = ref<any[]>([]);
const loading = ref(false);
const searchTerm = ref('');
const filterCompleted = ref<string | undefined>(undefined); 
const totalItems = ref(0);
const currentPage = ref(1);
const ITEMS_PER_PAGE = 10; 
// Coada de operatiuni ELIMINATĂ:
// const operationQueue = ref<any[]>([]); 

// --- Stări Calculate și Starea Rețelei ---
const currentStatus = computed(() => {
    if (filterCompleted.value === 'true') return 'Finalizate';
    if (filterCompleted.value === 'false') return 'De Făcut';
    return 'Toate';
});

const isConnectedToAPI = ref(navigator.onLine); 
let healthCheckInterval: any = null; 
// Pending operations ELIMINAT, setat la 0:
const pendingOperationsCount = computed(() => 0); 

const networkStatusMessage = computed(() => {
    return isConnectedToAPI.value ? 'ONLINE' : 'OFFLINE';
});
const networkColor = computed(() => {
    // Fără pending operations, culoarea depinde doar de conexiunea la API.
    return isConnectedToAPI.value ? 'success' : 'danger';
});
const canLoadMore = computed(() => {
    // Dacă suntem offline, nu putem încărca mai multe de pe server.
    if (!isConnectedToAPI.value) return false; 
    return tasks.value.length < totalItems.value;
});


// --- Gestiunea Stării Rețelei (Simplificată) ---

/**
 * Verifică starea API-ului.
 */
const checkApiHealth = async () => {
    let isCurrentlyOnline = navigator.onLine;
    const wasOnline = isConnectedToAPI.value;
    
    if (isCurrentlyOnline) {
        try {
            // Tentativa de a prelua date de la server cu autentificare
            await api.fetchTasksPaginated('', undefined, 1, 1);
            isCurrentlyOnline = true; // Succes
        } catch (error: any) {
            // Eșec (403 Token Invalid, 500, etc.) => Considerăm OFFLINE față de API
            console.error('[HEALTH CHECK] Verificare API eșuată.', error);
            isCurrentlyOnline = false;
        }
    }

    const networkStatusChanged = isConnectedToAPI.value !== isCurrentlyOnline;
    isConnectedToAPI.value = isCurrentlyOnline;

    console.log(`[NETWORK STATUS] Trecere la ${networkStatusMessage.value}.`);

    // Dacă starea s-a schimbat, reîncărcăm task-urile (trecem la Server sau la lista goală/offline)
    if (networkStatusChanged) {
         resetAndLoadTasks();
    }
};

const updateOnlineStatus = (event: Event) => {
    // Delay pentru stabilitate
    setTimeout(checkApiHealth, 500); 
};


// --- Funcții de Paginare și Încărcare (Strict Online) ---

const resetAndLoadTasks = () => {
    console.log('[LOAD] Inițiere resetare și încărcare task-uri.');
    tasks.value = [];
    currentPage.value = 1;
    loadTasks();
};

const loadTasks = async () => {
    loading.value = true;
    
    try {
        let itemsFromBackend: any[] = [];
        let totalItemsBackend = 0;
        
        const completedFilter = filterCompleted.value === 'true' ? true : filterCompleted.value === 'false' ? false : undefined;

        if (isConnectedToAPI.value) {
            console.log(`[LOAD ONLINE] Încărcare pag. ${currentPage.value} de pe server...`);
            
            // --- MOD ONLINE: Se încarcă de pe Server (REST) ---
            const result = await api.fetchTasksPaginated(
                searchTerm.value, 
                completedFilter,
                currentPage.value, 
                ITEMS_PER_PAGE
            );
            
            itemsFromBackend = result.tasks; 
            totalItemsBackend = result.total;
            totalItems.value = totalItemsBackend; 
            
            // Logica de combinare cu task-uri locale temporare ELIMINATĂ.
            
        } else {
            console.log('[LOAD OFFLINE] Nu se poate încărca lista. Aplicația este OFFLINE.');
            // În modul strict online, nu încărcăm nimic local. totalItems rămâne 0.
            totalItems.value = 0;
        }
        
        // Adaugăm task-urile noi la lista existentă
        tasks.value.push(...itemsFromBackend); 
        
        console.log(`[LOAD FINISHED] Task-uri încărcate (Server: ${totalItemsBackend}). Total afișat: ${tasks.value.length}`);

    } catch (error) {
        console.error('Eroare la încărcarea task-urilor (REST):', error);
        // Alertăm doar dacă suntem teoretic online, dar API-ul eșuează.
        if (isConnectedToAPI.value) {
             await alertController.create({
                 header: 'Eroare Încărcare',
                 message: 'Nu s-au putut încărca task-urile de pe server. Verificați backend-ul.',
                 buttons: ['OK']
             }).then(a => a.present());
        }
    } finally {
        loading.value = false;
    }
};

const loadMoreTasks = async (event: CustomEvent) => {
    if (canLoadMore.value) {
        currentPage.value++; 
        await loadTasks();
    }
    (event.target as HTMLIonInfiniteScrollElement).complete(); 
};

const doRefresh = (event: CustomEvent) => {
    checkApiHealth(); 
    resetAndLoadTasks(); 
    setTimeout(() => {
        (event.target as HTMLIonRefresherElement).complete();
    }, 500);
};


// --- Funcții CRUD (Strict Online) ---

const handleCreateOrUpdateTask = async (mode: 'create' | 'edit', taskData: any) => {
    
    if (!isConnectedToAPI.value) {
        await alertController.create({
            header: 'Eroare',
            message: 'Nu se pot salva task-uri: Aplicația este OFFLINE.',
            buttons: ['OK']
        }).then(a => a.present());
        return;
    }

    try {
        if (mode === 'create') {
            await api.createTask(taskData); 
        } else {
             // Verificare de siguranță pentru a evita eroarea "Cast to ObjectId failed for value 'undefined'"
             if (!taskData._id) throw new Error("ID-ul task-ului lipsește pentru actualizare.");
             await api.updateTask(taskData._id, taskData);
        }
        
        // Dacă reușește, reîncărcăm de pe server
        resetAndLoadTasks();

    } catch (error) {
        console.error(`Eroare REST la ${mode} task:`, error);
        await alertController.create({
            header: `Eroare ${mode === 'create' ? 'Creare' : 'Actualizare'}`,
            message: 'Serverul a returnat o eroare la salvarea task-ului.',
            buttons: ['OK']
        }).then(a => a.present());
    }
};

const openModal = async (mode: 'create' | 'edit', taskToEdit: any = null) => {
    const modal = await modalController.create({
        component: TaskFormModal,
        componentProps: {
            mode: mode,
            task: taskToEdit ? { ...taskToEdit } : null, 
        },
    });

    modal.onDidDismiss().then((detail) => {
        if (detail.data) {
            handleCreateOrUpdateTask(mode, detail.data); 
        }
    });

    return modal.present();
};

const handleDelete = async (task: any) => { 
    
    if (!isConnectedToAPI.value) {
        await alertController.create({
            header: 'Eroare',
            message: 'Nu se poate șterge task-ul: Aplicația este OFFLINE.',
            buttons: ['OK']
        }).then(a => a.present());
        return;
    }

    try {
        // Verificare de siguranță
        if (!task || !task._id) throw new Error("ID-ul task-ului lipsește pentru ștergere.");
        
        await api.deleteTask(task._id);
        resetAndLoadTasks();

    } catch (error) {
        console.error('Eroare la ștergerea task-ului (REST):', error);
        await alertController.create({
            header: 'Eroare Ștergere',
            message: 'Serverul a returnat o eroare la ștergerea task-ului.',
            buttons: ['OK']
        }).then(a => a.present());
    }
};

const confirmDelete = async (task: any) => {
    const alert = await alertController.create({
        header: 'Confirmare Ștergere',
        message: `Ești sigur că vrei să ștergi task-ul: "${task.title}"?`,
        buttons: [
            { text: 'Anulează', role: 'cancel' },
            { 
                text: 'Șterge', 
                handler: () => {
                    handleDelete(task); 
                },
                cssClass: 'alert-button-danger'
            },
        ],
    });
    await alert.present();
};

const setupSocketListeners = () => { 
    const socket = getSocket();
    if (!socket) {
        console.warn('[SOCKET] Nu s-a putut obține socket-ul. Listenerii nu sunt configurați.');
        return;
    }
    
    // Listenerii se bazează doar pe isConnectedToAPI, fără logica de sincronizare.
    socket.on('taskCreated', (data: any) => {
        if (isConnectedToAPI.value) resetAndLoadTasks(); 
    });

    socket.on('taskUpdated', (data: any) => {
        if (isConnectedToAPI.value) {
            const index = tasks.value.findIndex(t => t._id === data._id); 
            if (index !== -1) {
                // Actualizare locală a task-ului
                Object.assign(tasks.value[index], data);
            } else {
                resetAndLoadTasks();
            }
        }
    });

    socket.on('taskDeleted', (taskId: string) => {
        if (isConnectedToAPI.value) {
              tasks.value = tasks.value.filter(t => t._id !== taskId);
              totalItems.value--;
              if(tasks.value.length < ITEMS_PER_PAGE && canLoadMore.value) {
                loadTasks(); 
              }
        }
    });
    
    console.log('[SOCKET] Listeneri configurați.');
};
// --- Gestiunea Lifecycle și a Altor Funcții ---

onMounted(async () => { 
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    // Nu mai este nevoie să încărcăm coada de operațiuni
    // operationQueue.value = await getOperationQueue(); 

    healthCheckInterval = setInterval(checkApiHealth, 10000); 
    
    await initializeSocket();
    setupSocketListeners();

    // Verifică starea și declanșează încărcarea
    await checkApiHealth();
    resetAndLoadTasks(); 
});

onUnmounted(() => { 
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
    if (healthCheckInterval !== null) {
        clearInterval(healthCheckInterval);
    }
    disconnectSocket();
});

const handleLogout = async () => {
    disconnectSocket();
    await api.logout();
    router.replace('/login');
};

const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ro-RO');
};
</script>

<style scoped>
.ion-spinner {
    display: block;
    margin: 20px auto;
}
.due-date {
    font-size: 0.8em;
    color: var(--ion-color-medium);
}
</style>