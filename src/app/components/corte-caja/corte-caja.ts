import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { CajaService } from '../../services/caja';import { Auth } from '../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-corte-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corte-caja.html',
  styleUrl: './corte-caja.css',
})
export class CorteCaja implements OnInit {
  corte: any = null;
  efectivoFisico: number | null = null;
  datosCaja: any = null;
  retiroDueno: number | null = null;
  listaMovimientos: any[] = [];
  totalGastos: number = 0;

  constructor(
    private cajaService: CajaService,
    private cdr: ChangeDetectorRef,
    private authService: Auth,
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.cargarCorte();
  }

  cargarCorte() {
    this.cajaService.obtenerCorteInteligente().subscribe({
      next: (datos: any) => {
        this.corte = datos;
        this.cargarMovimientosDelTurno(); // 👈 Llama a los movimientos
        this.cdr.detectChanges();
      },
      error: (err: any) => Swal.fire('Error', 'No se pudo generar el corte.', 'error')
    });
  }

  cargarMovimientosDelTurno() {
    const turnoId = localStorage.getItem('turnoId');
    if (!turnoId) return;

    this.cajaService.obtenerMovimientosDelTurno(Number(turnoId)).subscribe({
      next: (movimientos: any[]) => {
        this.listaMovimientos = movimientos;
        // Sumamos solo las SALIDAS
        this.totalGastos = movimientos
          .filter(m => m.tipo === 'SALIDA')
          .reduce((suma, mov) => suma + mov.monto, 0);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar movimientos', err)
    });
  }

  // 💸 NUEVA FUNCIÓN: Registrar Movimientos Manuales (Gastos o Entradas de Cambio)
  async registrarMovimiento() {
    const { value: formValues } = await Swal.fire({
      title: 'Registrar Movimiento en Caja',
      html:
        `<select id="swal-input1" class="swal2-input">
          <option value="" disabled selected>Selecciona el tipo...</option>
          <option value="ENTRADA">Entrada (Ej. Cambio, Fondo)</option>
          <option value="SALIDA">Gasto (Ej. Garrafón, Insumos)</option>
        </select>
        <input id="swal-input2" type="number" class="swal2-input" placeholder="Monto en pesos">
        <input id="swal-input3" class="swal2-input" placeholder="Concepto (Ej. Pago garrafón)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const tipo = (document.getElementById('swal-input1') as HTMLSelectElement).value;
        const monto = (document.getElementById('swal-input2') as HTMLInputElement).value;
        const concepto = (document.getElementById('swal-input3') as HTMLInputElement).value;
        
        if (!tipo || !monto || !concepto) {
          Swal.showValidationMessage('Por favor llena todos los campos');
          return false;
        }
        if (Number(monto) <= 0) {
          Swal.showValidationMessage('El monto debe ser mayor a cero');
          return false;
        }
        return { tipo, monto: Number(monto), concepto };
      }
    });

    if (formValues) {
      this.cajaService.registrarMovimiento(formValues.tipo, formValues.monto, formValues.concepto).subscribe({
        next: () => {
          Swal.fire('Registrado', 'El movimiento ha sido guardado.', 'success');
          // 🔄 Recargamos el corte para que la matemática se actualice al instante
          this.cargarCorte();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo registrar el movimiento.', 'error');
        }
      });
    }
  }

  cerrarMiTurno() {
    if (this.efectivoFisico == null || this.efectivoFisico < 0) {
      Swal.fire('Atención', 'Debes ingresar el efectivo físico que contaste.', 'warning');
      return;
    }

    const turnoId = localStorage.getItem('turnoId');
    if (!turnoId) return;

    // Aquí calculamos si le sobró o faltó dinero en secreto
    const sobranteFaltante = this.efectivoFisico - this.corte.totalEfectivo;
    let mensajeDescuadre = '';

    if(sobranteFaltante < 0) {
      mensajeDescuadre = `<br><br><span style="color:red; font-weight:bold;">⚠️ ATENCIÓN: Te faltan $${Math.abs(sobranteFaltante)} pesos en caja. Esto quedará registrado.</span>`;
    } else if(sobranteFaltante > 0) {
      mensajeDescuadre = `<br><br><span style="color:blue; font-weight:bold;">⚠️ ATENCIÓN: Te sobran $${sobranteFaltante} pesos en caja.</span>`;
    }

    Swal.fire({
      title: '¿Estás segura?',
      html: `Vas a cerrar tu caja declarando que tienes <b>$${this.efectivoFisico}</b> en efectivo. Ya no podrás hacer más cobros en este turno.${mensajeDescuadre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar turno',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cajaService.cerrarTurnoCaja(Number(turnoId), this.efectivoFisico!).subscribe({
          next: () => {
            Swal.fire('¡Cerrado!', 'Tu turno ha finalizado correctamente.', 'success');
            localStorage.removeItem('turnoId');
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

  // --- MÉTODOS DEL ADMIN (MODO DIOS) ---
  get fondoSiguienteDia(): number {
    const fisico = this.efectivoFisico == null ? 0 : this.efectivoFisico;
    const retiro = this.retiroDueno == null ? 0 : this.retiroDueno;
    return fisico - retiro;
  }

  cerrarDiaAdmin() {
    if (this.efectivoFisico == null || this.retiroDueno == null) {
      Swal.fire('Atención', 'Debes ingresar el efectivo físico y cuánto vas a retirar de ganancia.', 'warning');
      return;
    }

    if (this.fondoSiguienteDia < 0) {
      Swal.fire('Error', 'No puedes retirar más ganancias de las que hay físicamente.', 'error');
      return;
    }

    Swal.fire({
      title: 'Confirmar Cierre Global',
      html: `¿Confirmas que retirarás <b>$${this.retiroDueno}</b> de ganancias y dejarás <b>$${this.fondoSiguienteDia}</b> para arrancar mañana?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, registrar cierre',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if(result.isConfirmed) {
        const turnoId = localStorage.getItem('turnoId');
        if (!turnoId) return;

        // Primero registramos el retiro de ganancia del dueño como una SALIDA para que la caja cuadre en la base de datos
        this.cajaService.registrarMovimiento('SALIDA', this.retiroDueno!, 'Retiro de Ganancias (Dueño)').subscribe({
          next: () => {
            // Luego cerramos el turno globalmente con el fondo que quedó
            this.cajaService.cerrarTurnoCaja(Number(turnoId), this.fondoSiguienteDia).subscribe({
              next: () => {
                Swal.fire('¡Éxito!', 'Cierre general registrado. La caja está lista para mañana.', 'success');
                localStorage.removeItem('turnoId');
                this.router.navigate(['/login']);
              },
              error: (err) => Swal.fire('Error', 'El servidor no pudo procesar el cierre global.', 'error')
            });
          },
          error: (err) => Swal.fire('Error', 'No se pudo registrar el retiro de ganancias.', 'error')
        });
      }
    });
  }

  get esAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get esRecepcion(): boolean {
    const rol = localStorage.getItem('rol');
    return rol === 'ROLE_RECEPCION';
  }

  get diferenciaEfectivo(): number {
    if(!this.corte || this.efectivoFisico == null) return 0;
    return this.efectivoFisico - this.corte.totalEfectivo;
  }
}