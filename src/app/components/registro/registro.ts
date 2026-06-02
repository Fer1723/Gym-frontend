import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  registroForm : FormGroup;

  constructor(private fb: FormBuilder, private authService: Auth, private router: Router){
    this.registroForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['RECEPCION', Validators.required],
      llaveMaestra: ['']
    });
  }

  enviar(){
    if(this.registroForm.valid){
      this.authService.registrar(this.registroForm.value).subscribe({
        next: () => {
          Swal.fire('¡Exito!', 'Usuario creado correctamente', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          Swal.fire('Error', err.error.error || 'No se puede crear el usuario', 'error');
        }
      });
    }
  }

}
