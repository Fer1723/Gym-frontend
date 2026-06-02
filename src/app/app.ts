import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, Navigation, NavigationEnd } from '@angular/router';
import { Auth } from './services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('gym-frontend');

  mostrarMenu: boolean = true;

  constructor(private authService : Auth, private router: Router){
    this.router.events.subscribe((event) => {
      if(event instanceof NavigationEnd){
        this.mostrarMenu = !(event.urlAfterRedirects === '/login');
      }
    });
  }

  get esAdmin(): boolean{
    return this.authService.isAdmin;
  }

  get esRecepcion(): boolean{
    const rol = localStorage.getItem('rol');
    return rol === 'ROLE_RECEPCION';
  }

  cerrarSesion(){
    this.authService.logout();
  }
}
