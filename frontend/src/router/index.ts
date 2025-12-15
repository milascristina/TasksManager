// src/router/index.js

import { createRouter, createWebHistory } from '@ionic/vue-router';
// 💡 IMPORTANT: Vom continua să folosim aliasul '@' pentru serviciul API, 
// deoarece el este configurat să funcționeze corect cu Vite (verificat anterior).
import api from '@/services/api'; 

const routes = [
    // --- RUTA PRINCIPALĂ (Tabs Layout) ---
    {
        path: '/tabs/',
        // 🚀 Utilizăm sintaxa de import cu aliasul '@' pentru a mapa direct la src/views/
        component: () => import('@/views/TabsPage.vue'), 
        children: [
            // Calea corectă:
            { path: 'tasks', component: () => import('@/views/TaskPage.vue') }, 
        ],
        meta: { requiresAuth: true }
    },
    
    // --- RUTA DE LOGIN ---
    {
        path: '/login',
        component: () => import('@/views/LoginPage.vue')
    },
    
    // --- REDIRECȚIONARE ---
    {
        path: '/',
        redirect: '/tabs/tasks' 
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

// --- GUARD DE NAVIGARE (Protecția Rutelor) ---
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const isAuthenticated = await api.isAuthenticated();

    if (requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.path === '/login' && isAuthenticated) {
        next('/tabs/tasks');
    } else {
        next();
    }
});

export default router;