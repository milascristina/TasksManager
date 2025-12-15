<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="ion-text-center ion-padding-top">
        <h1>Task Manager</h1>
        <p>Autentificare</p>
      </div>
      
      <ion-list lines="full" class="ion-margin-top">
        <ion-item>
          <ion-input label="Username" v-model="username" placeholder="user1" label-placement="floating"></ion-input>
        </ion-item>
        <ion-item>
          <ion-input label="Parolă" v-model="password" type="password" placeholder="pass1" label-placement="floating"></ion-input>
        </ion-item>
      </ion-list>
      
      <ion-button 
        expand="block" 
        class="ion-margin-top" 
        @click="handleLogin" 
        :disabled="loading || !username || !password"
      >
        <ion-spinner v-if="loading" slot="start" name="lines"></ion-spinner>
        {{ loading ? 'Se autentifică...' : 'Login' }}
      </ion-button>
      
      <ion-text color="danger" class="ion-padding-top ion-text-center" v-if="error">
        <p>**Eroare:** {{ error }}</p>
      </ion-text>
      
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonContent, IonInput, IonItem, IonList, 
  IonButton, IonSpinner, IonText 
} from '@ionic/vue';
import { alertController } from '@ionic/vue'; 
import { useRouter } from 'vue-router';
import api from '@/services/api'; 

// --- Starea Locală ---
const router = useRouter();
const username = ref('user1'); 
const password = ref('pass1'); 
const loading = ref(false);
const error = ref('');

// --- Verificare la Încărcare (Neasociată cu JWT, rămâne neschimbată) ---
onMounted(async () => {
  try {
    if (await api.isAuthenticated()) {
      console.log('[LOGIN PAGE] Utilizator deja autentificat (Token valid). Redirecționat la Tasks.');
      router.replace('/tabs/tasks');
    }
  } catch (e) {
      console.error('[LOGIN PAGE] Eroare la verificarea autentificării în onMounted:', e);
  }
});

// --- Logica de Autentificare (Actualizată) ---
const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    // api.login stochează acum JWT-ul intern, dacă reușește
    const response = await api.login({ username: username.value, password: password.value });
    
    // Verificăm fie token-ul, fie userId (ambele sunt incluse în răspunsul de succes)
    if (response && (response.token || response.userId)) { 
        console.log('[LOGIN] Login reușit. Navigare la tasks.');
        router.replace('/tabs/tasks');
    } else {
        // Dacă login a răspuns, dar nu are datele corecte (improbabil), ridicăm eroare
        throw new Error('Răspunsul nu conține date de autentificare valide.');
    }

  } catch (err: any) {
    // Tratează eroarea returnată de axios/backend (ex: 401)
    const msg = err.response?.data?.message || 'Credențiale invalide sau eroare de rețea/server.';
    console.error('Login failed:', msg, err);
    error.value = msg;
    
    await alertController.create({
      header: 'Eroare de Autentificare',
      message: msg,
      buttons: ['OK']
    }).then(a => a.present());

  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Puteți adăuga stiluri specifice aici */
</style>