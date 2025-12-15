<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="cancel">Anulează</ion-button>
        </ion-buttons>
        <ion-title>{{ isCreateMode ? 'Adaugă Task Nou' : 'Editează Task' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="!isValid || loading" @click="saveTask">
             <ion-spinner v-if="loading" slot="start" name="lines-small"></ion-spinner>
             Salvează
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list lines="full">
        <ion-item>
          <ion-input label="Titlu" v-model="form.title" label-placement="floating" required></ion-input>
        </ion-item>

        <ion-item>
          <ion-textarea label="Descriere" v-model="form.description" label-placement="floating"></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-input 
            label="Dată limită" 
            :value="formattedDueDate" 
            type="date" 
            @ionChange="updateDate"
          ></ion-input>
        </ion-item>

        <ion-item v-if="!isCreateMode">
          <ion-toggle v-model="form.completed">Finalizat</ion-toggle>
        </ion-item>
      </ion-list>
      
      <ion-text color="danger" class="ion-text-center ion-padding-top" v-if="error">
        <p>{{ error }}</p>
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
    IonPage, IonHeader, IonToolbar, IonButtons, IonButton, 
    IonTitle, IonContent, IonList, IonItem, IonInput, 
    IonTextarea, modalController, IonToggle, IonText, IonSpinner 
} from '@ionic/vue';
import api from '@/services/api';

// --- Proprietăți (Props) ---
// Primite de la TasksPage.vue
const props = defineProps<{
  mode: 'create' | 'edit';
  task: any | null;
}>();

// --- Stare Locală ---
const loading = ref(false);
const error = ref('');

// Inițializarea formularului
const initialFormState = {
    title: props.task?.title || '',
    description: props.task?.description || '',
    dueDate: props.task?.dueDate ? formatToISO(props.task.dueDate) : formatToISO(new Date()),
    completed: props.task?.completed || false,
};
const form = ref<any>({ ...initialFormState });

// --- Stări Calculate ---
const isCreateMode = computed(() => props.mode === 'create');

const isValid = computed(() => {
    return form.value.title.trim() !== '';
});

const formattedDueDate = computed(() => {
    // Returnează data în format YYYY-MM-DD pentru <input type="date">
    return form.value.dueDate;
});

// --- Funcții Utilitare ---
function formatToISO(date: string | Date): string {
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 10);
    return localISOTime;
}

const updateDate = (event: CustomEvent) => {
    // Salvează data în format ISO 8601 (YYYY-MM-DD)
    form.value.dueDate = event.detail.value;
};

// --- Acțiuni Modal ---
const cancel = () => {
  modalController.dismiss(null, 'cancel');
};

// TaskFormModal.vue

const saveTask = async () => {
    if (!isValid.value) return;

    error.value = '';
    loading.value = true;
    
    try {
        let result;
        const taskData = { ...form.value, dueDate: form.value.dueDate }; // Trimitem data ca string

        if (isCreateMode.value) {
            // CREATE
            result = await api.createTask(taskData);
        } else {
            // UPDATE
            // 💡 CORECȚIE CRITICĂ AICI: Folosim props.task._id
            const taskId = props.task?._id;
            
            // Verificare de siguranță (deși ar trebui să fie imposibil dacă openModal este corect)
            if (!taskId) {
                throw new Error("ID-ul task-ului de actualizat lipsește.");
            }
            
            result = await api.updateTask(taskId, taskData);
        }

        // Închide modalul și trimite rezultatul (semnalând TasksPage să reîncarce)
        modalController.dismiss(result, 'confirm');

    } catch (err: any) {
        // În caz de eroare (inclusiv 400 Bad Request de la backend), afișăm mesajul
        error.value = err.response?.data?.message || 'Eroare la salvarea task-ului.';
        console.error('Eroare la salvare:', err);
    } finally {
        loading.value = false;
    }
};
</script>