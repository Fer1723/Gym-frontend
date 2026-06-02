import { RouterModule, Routes } from '@angular/router';

// 1. SOLO importamos los que NO usan loadComponent (Los estáticos)
import { SociosLista } from './components/socios-lista/socios-lista';
import { Dashboard } from './components/dashboard/dashboard';
import { Tienda } from './components/tienda/tienda';
import { Producto } from './components/producto/producto';
import { NgModel } from '@angular/forms';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    // 👇 NUEVA RUTA DE LOGIN 👇
    {
        path: 'login',
        // Ojo: Verifica si la clase en login.ts se llama LoginComponent o solo Login
        loadComponent: () => import('./components/login/login').then(m => m.Login),
        title: 'FactoryGym - Iniciar Sesión'
    },
    // ==========================================

    {
        path: 'dashboard',
        component: Dashboard,
        title: 'FactoryGym - Panel de Control'
    },
    {
        path: 'socios',
        children: [
            {
                path: '',
                component: SociosLista,
                title: 'FactoryGym - Directorio de Socios'
            },
            {
                path: 'nuevo', 
                loadComponent: () => import('./components/socios-form/socios-form').then(m => m.SociosForm),
                title: 'FactoryGym - Nuevo Socio'
            },
            {
                path: 'editar/:id',
                loadComponent: () => import('./components/socios-form/socios-form').then(m => m.SociosForm),
                title: 'FactoryGym - Editar Socio'
            }
        ]
    },
    {
        path: 'membresias',
        children: [
            {
                path: '',
                loadComponent: () => import('./components/membresias-lista/membresias-lista').then(m => m.MembresiasLista)
            },
            {
                path: 'nueva', 
                loadComponent: () => import('./components/membresias-form/membresias-form').then(m => m.MembresiasForm),
            },
            {
                path: 'editar/:id',
                loadComponent: () => import('./components/membresias-form/membresias-form').then(m => m.MembresiasForm),
            }
        ]
    },
    {
        path: 'checador',
        children: [
            {
                path:'',
                loadComponent: () => import('./components/checador/checador').then(m => m.Checador)
            }
        ]
    },
    {
        path: 'corte-caja',
        loadComponent: () => import('./components/corte-caja/corte-caja').then(m => m.CorteCaja), 
        title: 'FactoryGym - Corte de Caja',
        // canActivate: [adminGuard]  <-- 🚧 Aquí conectaremos el candado para que recepción no entre
    },
    {
        path: 'registro-personal',
        loadComponent: () => import('./components/registro/registro').then(m => m.Registro),
        title: 'FactoryGym - Nuevo Empleado',
    },
    
    { path: 'tienda', component: Tienda},
    { path: 'tienda/nuevo', component: Producto},

    // 👇 CAMBIO CRÍTICO: Ahora el comodín y la ruta vacía redirigen al Login 👇
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
    
];