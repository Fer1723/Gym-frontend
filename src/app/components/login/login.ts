import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CajaService } from '../../services/caja';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

declare global {
    interface Window{
      electronAPI :any;
    }
  }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: Auth, private router: Router, private cajaService: CajaService, private http: HttpClient){
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  async verificarLicencia(): Promise<boolean>{
    if(window.electronAPI){
      const miHuella = await window.electronAPI.obtenerHardwareId();
      
      try {
        const res: any = await firstValueFrom(this.http.post('http://localhost:8080/api/licencia/validar', { hardwareId: miHuella }));
        if(res && res.autorizado){
          console.log("✅ Equipo verificado con éxito en el backend.");
          return true;
        }
        return false;
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Sistema Bloqueado',
          text: 'Este equipo no tiene una licencia valida para operar.',
          background: '#222',
          color: '#fff',
          showConfirmButton: false,
          allowOutsideClick: false
        });
        return false;
      }
    }
     return true;
  }

  ingresar() {
    if(this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          // 1. Guardamos credenciales
          localStorage.setItem('token', res.token);
          localStorage.setItem('rol', res.rol);
          localStorage.setItem('userId', res.id);

          // 2. Mostramos la alerta de éxito
          Swal.fire({
            icon: 'success',
            title: '¡Acceso Concedido!',
            text: 'Bienvenido al sistema',
            timer: 1500,
            showConfirmButton: false,
            background: '#222',
            color: '#fff'
          });

          // 👇 3. EL CADENERO: Redirección Inteligente 👇
          if (res.rol === 'ADMIN') {
            // Si es el Jefe, va al Dashboard
            this.router.navigate(['/dashboard']);
          } else {
            // Si es Recepción (USER, RECEPCION, etc.), va a Socios
            this.router.navigate(['/socios']);
          }

        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'Usuario o contraseña incorrectos',
            background: '#222',
            color: '#fff'
          });
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

}
