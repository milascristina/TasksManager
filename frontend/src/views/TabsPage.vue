<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom">
        
        <ion-tab-button tab="tasks" href="/tabs/tasks">
          <ion-icon :icon="listOutline" />
          <ion-label>Task-uri</ion-label>
        </ion-tab-button>

        </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonTabBar, 
  IonTabButton, 
  IonTabs, 
  IonLabel, 
  IonIcon, 
  IonPage, 
  IonRouterOutlet 
} from '@ionic/vue';
// Importă iconițele necesare de la Ionicons
import { listOutline, personCircleOutline } from 'ionicons/icons'; 
</script>