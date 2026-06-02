import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { CajaService } from '../../services/caja';
import { Auth } from '../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-corte-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corte-caja.html',
  styleUrl: './corte-caja.css',
})

export class CorteCaja implements OnInit{
  corte : any = null;
  efectivoFisico: number | null = null;
  datosCaja: any = null;
  retiroDueno: number | null = null;

  constructor(
    private cajaService: CajaService,
    private cdr: ChangeDetectorRef,
    private authService : Auth,
    private router: Router 
  ){}

  ngOnInit(): void {
    this.cargarCorte();
  }

  // 🧠 NUEVA LÓGICA: Súper limpia. Angular le pide al backend, y Java decide qué números devolver.
  cargarCorte() {
    this.cajaService.obtenerCorteInteligente().subscribe({
      next: (datos: any) => {
        this.corte = datos;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar los datos del corte', err);
        Swal.fire('Error', 'No se pudo generar el corte con el servidor.', 'error');
      }
    });
  }

  cerrarMiTurno() {
    if (this.efectivoFisico == null || this.efectivoFisico < 0) {
      Swal.fire('Atención', 'Debes ingresar el efectivo físico que contaste.', 'warning');
      return;
    }

    const efectivoAEnviar = this.efectivoFisico;
    const turnoId = localStorage.getItem('turnoId');
    if (!turnoId) return;

    Swal.fire({
      title: '¿Estás segura?',
      text: `Vas a cerrar la caja con $${this.efectivoFisico} pesos. Ya no podrás hacer más cobros en este turno.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar turno',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cajaService.cerrarTurnoCaja(Number(turnoId), efectivoAEnviar).subscribe({
          next: () => {
            Swal.fire('¡Cerrado!', 'Tu turno ha finalizado correctamente.', 'success');
            
            // Limpiamos la variable para bloquear el sistema
            localStorage.removeItem('turnoId');
            
            // Mandamos a la recepcionista de regreso al login
            this.router.navigate(['/login']);
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'Hubo un problema al cerrar la caja.', 'error');
          }
        });
      }
    });
  }

  get fondoSiguienteDia(): number{
    const fisico = this.efectivoFisico == null ? 0 : this.efectivoFisico;
    const retiro = this.retiroDueno == null ? 0 : this.retiroDueno;

    return fisico - retiro;
  }

  cerrarDiaAdmin(){
    if(this.efectivoFisico == null || this.retiroDueno == null){
      Swal.fire('Atención', 'Debes ingresar el efectivo físico y cuánto vas a retirar.', 'warning');
      return;
    }

    if(this.fondoSiguienteDia < 0){
      Swal.fire('Error', 'No puedes retirar más dinero del que hay físicamente.', 'error');
      return;
    }

    const efectivoAEnviar = this.efectivoFisico;
    const retiroAEnviar = this.retiroDueno;
    const fondoAEnviar = this.fondoSiguienteDia;

    Swal.fire({
      title: 'Confirmar Cierre Global',
      html: `¿Confirmas que retirarás <b>$${retiroAEnviar}</b> y dejarás <b>$${fondoAEnviar}</b> para el turno de mañana?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, registrar cierre global',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if(result.isConfirmed){
        
        const turnoId = localStorage.getItem('turnoId');
        
        if (!turnoId) {
          Swal.fire('Error', 'No tienes un turno activo para cerrar.', 'error');
          return;
        }

        this.cajaService.cerrarTurnoCaja(Number(turnoId), fondoAEnviar).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Cierre general registrado. La caja está lista para mañana.', 'success');
            
            localStorage.removeItem('turnoId');

            this.router.navigate(['/login']);

          },
          error: (err) => {
            console.error('Error al conectar con el backend:', err);
            Swal.fire('Error', 'El servidor no pudo procesar el cierre global.', 'error');
          }
        });
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

  get diferenciaEfectivo(): number{
    if(!this.corte || this.efectivoFisico == null) return 0;
    return this.efectivoFisico - this.corte.totalEfectivo;
  }
}