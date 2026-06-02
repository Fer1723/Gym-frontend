import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocioService } from '../../services/socio';

import { Suscripcion as SuscripcionService } from '../../services/suscripcion'; 
import { Visita as VisitaService } from '../../services/visita'; 

import { DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import { Suscripcion } from '../../models/suscripcion';
import { TurnoCaja } from '../../services/turno-caja';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // Métricas de Socios
  totalSociosActivos: number = 0;
  vencimientosHoy: number = 0;
  
  // 💰 EL DINERO
  ingresosSuscripciones: number = 0; 
  ingresosVisitas: number = 0;      
  ingresosTotales: number = 0;      
  
  cantidadVisitasMes: number = 0;   

  mostrarDetallesIngresos: boolean = false;
  mostrarDetallesActivos: boolean = false;
  mostrarDetallesVencimientos: boolean = false;

  listaIngresos: Suscripcion[] = [];
  listaActivos: Suscripcion[] = [];
  listaVencimientos: Suscripcion[] = [];

  alertasCaja: any[] = [];

  toggleIngresos() { this.mostrarDetallesIngresos = !this.mostrarDetallesIngresos; }
  toggleActivos() { this.mostrarDetallesActivos = !this.mostrarDetallesActivos; }
  toggleVencimientos() { this.mostrarDetallesVencimientos = !this.mostrarDetallesVencimientos; }

  constructor(
    private socioService: SocioService,
    private suscripcionService: SuscripcionService,
    private visitaService: VisitaService,
    private turnoCajaService: TurnoCaja,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.calcularMetricas();
    this.obtenerIngresosVisitas();
    this.verificarCaja();
    this.cargarAlertas();
  }

  cargarAlertas(){
    this.turnoCajaService.obtenerAlertasAuditoria().subscribe({
      next: (alertas) => {
        // 👇 ESTA LÍNEA NOS VA A DECIR LA VERDAD EN LA CONSOLA 👇
        console.log('🚨 Alertas devueltas por el servidor Java:', alertas);
        this.alertasCaja = alertas;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar alertas', err)
    });
  }

  verificarCaja(){
    const userId = localStorage.getItem('userId');
    if(!userId) return;

    this.turnoCajaService.obtenerTurnoActivo(Number(userId)).subscribe({
      next: (turno) => {
        localStorage.setItem('turnoId', turno.id.toString());
        console.log('✅ Turno activo encontrado:', turno.id);
      },
      error: (err) => {
        this.mostrarModalApertura(Number(userId));
      }
    });
  }

  mostrarModalApertura(userId: number) {
    this.turnoCajaService.obtenerUltimoEfectivo().subscribe({
      next: (data: any) => {
        
        // 👇 BLINDAJE: Extraemos el JSON correctamente 👇
        let ultimoEfectivo = 0;
        let usuarioAnterior = 'Turno Anterior';

        if (typeof data === 'object' && data !== null) {
          ultimoEfectivo = Number(data.efectivo) || 0; 
          usuarioAnterior = data.usuarioAnterior || 'Turno Anterior';
        } else if (typeof data === 'number' || !isNaN(Number(data))) {
          ultimoEfectivo = Number(data);
        }

        const usuarioActual = localStorage.getItem('username') || `ID ${userId}`;

        Swal.fire({
          title: '¡Bienvenido! Abre tu caja',
          text: 'Ingresa el fondo o morralla física para empezar tu turno:',
          input: 'number',
          inputAttributes: { min: '0', step: '0.50' },
          icon: 'info',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: false,
          confirmButtonText: 'Abrir Turno',
          confirmButtonColor: '#28a745',
          preConfirm: (valorIngresado) => {
            if (valorIngresado === '' || valorIngresado < 0) {
              Swal.showValidationMessage('Debes ingresar una cantidad válida (puede ser 0)');
              return false;
            }
            return valorIngresado;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const efectivoIngresado = Number(result.value) || 0;
            let observaciones = 'Apertura normal sin discrepancias';

            if (ultimoEfectivo > 0 && efectivoIngresado !== ultimoEfectivo) {
              
              const diferencia = Math.abs(ultimoEfectivo - efectivoIngresado);
              const tipoDiferencia = efectivoIngresado < ultimoEfectivo ? 'FALTAN' : 'SOBRAN';

              Swal.fire({
                title: '¡Discrepancia Detectada!',
                html: `El turno anterior declaró dejar <b>$${ultimoEfectivo}</b> en caja.<br>
                       Tú estás ingresando <b>$${efectivoIngresado}</b>.<br><br>
                       <span class="text-danger"><b>¡${tipoDiferencia} $${diferencia} pesos!</b></span><br><br>
                       ¿Confirmas que esta cantidad es la real? Se generará una alerta de auditoría.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, abrir con alerta',
                cancelButtonText: 'Corregir cantidad'
              }).then((confirmacion) => {
                if (confirmacion.isConfirmed) {
                  // 👇 TEXTO DINÁMICO CON NOMBRES 👇
                  observaciones = `ALERTA DE AUDITORÍA: El turno de ${usuarioActual} arrancó con $${efectivoIngresado}, pero el turno de ${usuarioAnterior} había dejado $${ultimoEfectivo}.`;
                  this.ejecutarAperturaFinal(userId, efectivoIngresado, observaciones);
                } else {
                  this.mostrarModalApertura(userId); 
                }
              });

            } else {
              this.ejecutarAperturaFinal(userId, efectivoIngresado, observaciones);
            }
          }
        });

      },
      error: () => {
        console.warn('Fallo al obtener último efectivo, forzando Plan B...');
        this.abrirTurnoPlanB(userId);
      }
    });
  }
  // 👇 FUNCIÓN DE APOYO 1: El guardado final con los 3 datos 👇
  ejecutarAperturaFinal(userId: number, efectivo: number, observacionesAlerta: string) {
    const datosApertura = {
      usuarioId: userId,
      efectivoInicial: efectivo,
      observaciones: observacionesAlerta
    };

    this.turnoCajaService.abrirTurno(datosApertura).subscribe({
      next: (nuevoTurno: any) => {
        localStorage.setItem('turnoId', nuevoTurno.id.toString());
        Swal.fire({
          title: '¡Caja Abierta!',
          text: `Arrancaste con $${efectivo}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err: any) => {
        Swal.fire('Error', 'Hubo un problema al guardar el turno. Intenta de nuevo.', 'error');
        this.mostrarModalApertura(userId);
      }
    });
  }

  // 👇 FUNCIÓN DE APOYO 2: El Plan B por si la BD falla o está vacía 👇
  abrirTurnoPlanB(userId: number) {
    Swal.fire({
      title: '¡Bienvenido! Abre tu caja',
      text: 'Ingresa el fondo inicial:',
      input: 'number',
      inputAttributes: { min: '0', step: '0.50' },
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      confirmButtonText: 'Abrir Turno',
      confirmButtonColor: '#28a745',
      preConfirm: (valorIngresado) => {
        if (valorIngresado === '' || valorIngresado < 0) {
          Swal.showValidationMessage('Debes ingresar una cantidad válida');
          return false;
        }
        return valorIngresado;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const efectivoIngresado = Number(result.value) || 0;
        this.ejecutarAperturaFinal(userId, efectivoIngresado, 'Apertura sin historial previo (Plan B)');
      }
    });
  }

  resolverAlerta(alerta: any) {
    Swal.fire({
      title: 'Cuadrar Caja Financiera',
      html: `
        <div class="text-start">
          <p class="mb-3 text-warning small border-bottom border-warning pb-2">
            <i class="bi bi-shield-exclamation"></i> ${alerta.observaciones}
          </p>
          <label class="form-label fw-bold text-white">1. Dinero físico a reponer en caja:</label>
          <input type="number" id="montoRepuesto" class="form-control bg-dark text-white mb-3 border-success shadow-none" placeholder="Ej: 50" min="0" step="0.50">
          
          <label class="form-label fw-bold text-white">2. Nota de resolución:</label>
          <textarea id="notaResolucion" class="form-control bg-dark text-white shadow-none border-secondary" rows="2" placeholder="Ej: El empleado trajo el dinero faltante."></textarea>
        </div>
      `,
      icon: 'info',
      background: '#222',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-check-circle"></i> Guardar y Cuadrar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const monto = Number((document.getElementById('montoRepuesto') as HTMLInputElement).value) || 0;
        const nota = (document.getElementById('notaResolucion') as HTMLTextAreaElement).value;
        if (!nota.trim()) {
          Swal.showValidationMessage('Debes ingresar una nota explicando cómo se solucionó.');
          return false;
        }
        return { monto, nota };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // 👇 Mandamos a Java la orden de sumar el dinero y poner el sello [RESUELTO]
        this.turnoCajaService.resolverAlerta(alerta.id, result.value.monto, result.value.nota).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Caja Cuadrada!', 
              text: 'El dinero se sumó al turno y la alerta fue archivada.', 
              icon: 'success',
              background: '#222',
              color: '#fff'
            });
            // Recargamos las alertas para que desaparezca de la tabla inmediatamente
            this.cargarAlertas(); 
          },
          error: (err) => Swal.fire('Error', 'No se pudo resolver la alerta.', 'error')
        });
      }
    });
  }

  obtenerIngresosVisitas() {
    this.visitaService.obtenerStatsMesActual().subscribe({
      next: (stats: any) => {
        this.ingresosVisitas = stats.ingresosVisitas;
        this.cantidadVisitasMes = stats.totalVisitas;
        this.actualizarGranTotal();
      },
      error: (err: any) => console.error('Error al cargar ingresos de visitas', err) 
    });
  }

  actualizarGranTotal() {
    this.ingresosTotales = this.ingresosSuscripciones + this.ingresosVisitas;
    this.cdr.detectChanges();
  }

  calcularMetricas() {
    this.suscripcionService.obtenerTodas().subscribe({
      next: (suscripciones: Suscripcion[]) => {
        const activas = suscripciones || [];
        const hoy = new Date();
        hoy.setHours(0,0,0,0);

        let countActivos = 0;
        let countVencenHoy = 0;
        let sumaIngresosSuscripciones = 0;

        this.listaIngresos = [];
        this.listaActivos = [];
        this.listaVencimientos = [];

        activas.forEach(sub => {
          // 1. Tomamos tu fechaInicio
          const inicio = new Date(sub.fechaInicio as string); 
          
          // 🛡️ EL BLINDAJE DE ZONA HORARIA (UTC a CST)
          // Esto evita que las ventas del día 1 del mes se regresen al día 31 del mes anterior
          inicio.setMinutes(inicio.getMinutes() + inicio.getTimezoneOffset());

          // 2. Preguntamos si es de este mes y año con la fecha correcta
          if (inicio.getMonth() === hoy.getMonth() && inicio.getFullYear() === hoy.getFullYear()) {
            
            // 🛡️ Blindaje matemático: si montoCobrado es nulo, usa el precio.
            const dineroReal = sub.montoCobrado != null ? sub.montoCobrado : (sub.membresia ? sub.membresia.precio : 0);
            
            sumaIngresosSuscripciones += dineroReal;
            this.listaIngresos.push(sub);
          }
        });

        const ultimaSuscripcionPorSocio = new Map<number, any>();

        activas.forEach(sub => {
          const socio = sub.socio;
          if (socio) {
            const idSocio = socio.idSocio; 
            const estadoSocio = socio.estado;

            if (idSocio && estadoSocio === true ) {
              
              const vencimiento = new Date(sub.fechaFin as string);
              vencimiento.setMinutes(vencimiento.getMinutes() + vencimiento.getTimezoneOffset());
              vencimiento.setHours(0,0,0,0);

              const subGuardada = ultimaSuscripcionPorSocio.get(idSocio);
              const fechaGuardada = subGuardada ? new Date(subGuardada.fechaFin as string) : new Date(0);

              if (!subGuardada || vencimiento > fechaGuardada) {
                ultimaSuscripcionPorSocio.set(idSocio, sub);
              }
            }
          }
        });

        ultimaSuscripcionPorSocio.forEach((subFinal, idSocio) => {
          const fechaVencimientoReal = new Date(subFinal.fechaFin as string);
          fechaVencimientoReal.setMinutes(fechaVencimientoReal.getMinutes() + fechaVencimientoReal.getTimezoneOffset());
          fechaVencimientoReal.setHours(0, 0, 0, 0);

          if (fechaVencimientoReal >= hoy) {
            countActivos++;
            this.listaActivos.push(subFinal);
          }
          
          if (fechaVencimientoReal.getTime() === hoy.getTime()) {
            countVencenHoy++;
            this.listaVencimientos.push(subFinal);
          }
        });

        this.totalSociosActivos = countActivos;
        this.vencimientosHoy = countVencenHoy;
        this.ingresosSuscripciones = sumaIngresosSuscripciones;

        this.actualizarGranTotal();
      },
      error: (err: any) => console.error('Error al cargar métricas', err) 
    });
  }
}