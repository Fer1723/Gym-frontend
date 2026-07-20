import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Socio } from '../../models/socio';
import { RouterLink } from '@angular/router';
import { SocioService } from '../../services/socio';
import Swal from 'sweetalert2';
import { Suscripcion } from '../../services/suscripcion';
import { Membresia } from '../../models/membresia';
import { MembresiaService } from '../../services/membresia';
import { CommonModule, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { Visita } from '../../services/visita';
import { TurnoCaja } from '../../services/turno-caja';

@Component({
  selector: 'app-socios-lista',
  standalone: true,
  imports: [RouterLink, NgIf, NgClass, CommonModule],
  templateUrl: './socios-lista.html',
  styleUrl: './socios-lista.css',
})
export class SociosLista implements OnInit {
  socios: any[] = [];
  sociosFiltrados: any[] = [];
  suscripcionesActivas: any[] = [];
  planesDisponibles: any[] = [];
  verInactivos: boolean = false;
  terminoBusqueda: string = '';

  socioSeleccionado: any = null;

  bufferEscaner: string = '';
  tiempoUltmatecla: number = 0;

  alertaTurnoActual: String | null = null;

  paginaActual: number = 0;
  tamanoPagina: number = 15;
  totalPaginas: number = 0;
  totalElementos: number = 0;

  @HostListener('window:keydown', ['$event'])
  manejarTeclado(event: KeyboardEvent) {
    // Ignoramos si están escribiendo en el buscador o en un formulario
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const tiempoActual = new Date().getTime();

    // Si pasaron más de 5000ms desde la última tecla, limpiamos el buffer
    if (tiempoActual - this.tiempoUltmatecla > 5000) {
      this.bufferEscaner = '';
    }
    this.tiempoUltmatecla = tiempoActual;

    if (event.key === 'Enter') { // Ojo: A veces los teclados/pistolas mandan 'Enter' en vez de 'Entrar'
      if (this.bufferEscaner.length > 0) {
        this.validarAcceso(this.bufferEscaner);
        this.bufferEscaner = '';
      }
      return;
    }

    // 🛡️ EL BLINDAJE: Permitimos números, letras y el guion medio
    const regexAlfanumerico = /^[a-zA-Z0-9\-]$/;
    if (regexAlfanumerico.test(event.key)) {
      this.bufferEscaner += event.key.toUpperCase(); // Forzamos a mayúscula desde la entrada
    }
  }

  validarAcceso(codigoCapturado: string) {
    const codigo = codigoCapturado.trim().toUpperCase();

    // 🛡️ 1. NUEVA LÓGICA DE AISLAMIENTO: ¿Empieza con el prefijo "V-"?
    if (codigo.startsWith('V-')) {

      // 🚀 Es una VISITA EXPRESS
      this.visitaService.validarPin(codigo).subscribe({
        next: (respuesta: any) => {
          Swal.fire({
            title: '¡Acceso Autorizado!',
            text: 'Pase de Visita Válido',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: '#222',
            color: '#fff'
          });
          // *Aquí iría tu código para mandar la orden de abrir el torniquete*
        },
        error: (err) => {
          Swal.fire({
            title: 'Acceso Denegado',
            text: 'El Código no existe o ya fue utilizado',
            icon: 'error',
            timer: 2500,
            showConfirmButton: false,
            background: '#222',
            color: '#fff'
          });
        }
      });

    } else {

      // 🧍‍♂️ 2. Es un SOCIO NORMAL
      const idSocio = Number(codigo);

      // Mini-escudo: Si no es visita y tampoco es número, bloqueamos
      if (isNaN(idSocio)) {
        Swal.fire({
          title: 'Error de Lectura',
          text: 'Código no reconocido por el sistema',
          icon: 'warning',
          timer: 2000,
          showConfirmButton: false,
          background: '#222',
          color: '#fff'
        });
        return;
      }

      console.log('Validando Socio Normal con ID:', idSocio);
      // *Aquí iría la lógica si quieres que la recepcionista le dé entrada manual desde esta pantalla*
    }
  }

  alternarVistas(mostrarInactivos: boolean) {
    this.verInactivos = mostrarInactivos;
    this.cargarDatosCruzados();
  }

  constructor(
    private socioService: SocioService,
    private cdr: ChangeDetectorRef,
    private suscripcionService: Suscripcion,
    private membresiaService: MembresiaService,
    private visitaService: Visita,
    private turnoCajaService: TurnoCaja
  ) { }

  ngOnInit(): void {
    this.cargarDatosCruzados();
    this.cargarPlanes();
    this.verificarCaja();
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
      this.cargarDatosCruzados();
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 0) {
      this.paginaActual--;
      this.cargarDatosCruzados();
    }
  }

  verificarCaja() {

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.turnoCajaService.obtenerTurnoActivo(Number(userId)).subscribe({
      next: (turno) => {
        localStorage.setItem('turnoId', turno.id.toString());
        console.log('✅ Turno activo de recepción encontrado:', turno.id);

        if (turno.observaciones && turno.observaciones.includes('ALERTA')) {
          this.alertaTurnoActual = turno.observaciones;
        }
      },
      error: (err) => {
        this.mostrarModalApertura(Number(userId));
      }
    });
  }

  mostrarModalApertura(userId: number) {
    this.turnoCajaService.obtenerUltimoEfectivo().subscribe({
      next: (data: any) => {

        console.log("Respuesta de Java para el último efectivo:", data);

        let ultimoEfectivo = 0;
        let usuarioAnterior = 'Turno Anterior';

        if (typeof data === 'object' && data !== null) {
          ultimoEfectivo = Number(data.efectivo) || 0;
          usuarioAnterior = data.usuarioAnterior || 'Turno Anterior';
        } else if (typeof data === 'number' || !isNaN(Number(data))) {
          ultimoEfectivo = Number(data);
        }

        const usuarioActual = localStorage.getItem('username') || `ID ${userId}`;

        // 1. PRIMER MODAL: Ingreso de efectivo (Ciego)
        Swal.fire({
          title: '¡Bienvenido! Abre tu caja',
          text: 'Ingresa el fondo o morralla física que estás recibiendo:',
          input: 'number',
          inputAttributes: { min: '0', step: '0.50' },
          icon: 'info',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: false,
          confirmButtonText: 'Registrar Apertura',
          confirmButtonColor: '#6f42c1', // Morado The Factory Gym
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

            // 2. COMPARACIÓN (Sin botón de escape)
            if (ultimoEfectivo > 0 && Math.abs(ultimoEfectivo - efectivoIngresado) > 0.01) {

              const diferencia = Math.abs(ultimoEfectivo - efectivoIngresado);
              const tipoDiferencia = efectivoIngresado < ultimoEfectivo ? 'FALTANTE DE' : 'SOBRANTE DE';

              // 3. SEGUNDO MODAL: Notificación de Discrepancia Obligatoria
              Swal.fire({
                title: '⚠️ ALERTA DE CAJA ⚠️',
                html: `Se ha detectado una discrepancia en el fondo.<br><br>
                       El corte anterior declaró: <b>$${ultimoEfectivo}</b>.<br>
                       Tú declaraste recibir: <b>$${efectivoIngresado}</b>.<br><br>
                       <span style="color: #dc3545; font-size: 1.2rem; font-weight: bold;">
                       ¡SE REGISTRÓ UN ${tipoDiferencia} $${diferencia.toFixed(2)} PESOS!
                       </span><br><br>
                       <small>Esta diferencia quedará registrada en el sistema bajo tu turno.</small>`,
                icon: 'error',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showCancelButton: false, // 👈 ¡BLINDAJE! Ya no pueden cancelar
                confirmButtonColor: '#d33',
                confirmButtonText: 'Aceptar y Generar Alerta'
              }).then(() => {

                observaciones = `ALERTA DE AUDITORÍA: El turno actual arrancó con $${efectivoIngresado}, pero el turno anterior había dejado $${ultimoEfectivo}. Diferencia de $${diferencia.toFixed(2)}.`;

                this.ejecutarAperturaFinal(userId, efectivoIngresado, observaciones);
              });

            } else {
              // Todo cuadró perfecto
              this.ejecutarAperturaFinal(userId, efectivoIngresado, observaciones);
            }
          }
        });

      },
      error: () => {
        console.warn('No se pudo obtener el último efectivo, forzando Plan B de apertura...');
        this.abrirTurnoPlanB(userId);
      }
    });
  }

  // 👇 FUNCIÓN DE APOYO 1: Mandar el paquete completo de 3 datos a Java 👇
  ejecutarAperturaFinal(userId: number, efectivo: number, observacionesAlerta: string) {
    const datosApertura = {
      usuarioId: userId,
      efectivoInicial: efectivo,
      observaciones: observacionesAlerta
    };

    this.turnoCajaService.abrirTurno(datosApertura).subscribe({
      next: (nuevoTurno: any) => {
        localStorage.setItem('turnoId', nuevoTurno.id.toString());
        if (nuevoTurno.observaciones && nuevoTurno.observaciones.includes('ALERTA')) {
          this.alertaTurnoActual = nuevoTurno.observaciones;
        }

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

  // 👇 FUNCIÓN DE APOYO 2: El Plan B por si el backend no responde con historial previo 👇
  abrirTurnoPlanB(userId: number) {
    Swal.fire({
      title: '¡Bienvenido! Abre tu caja',
      text: 'Ingresa el fondo inicial para empezar tu turno:',
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

  cobrarVisitaRapida() {
    const hoy = new Date().getDay();

    let precioSugerido = 80;
    let nombreDia = "Domigo a Viernes";

    if (hoy === 6) {
      precioSugerido = 100;
      nombreDia = 'Sabado';
    }

    Swal.fire({
      title: 'Venta de Visita Express',
      html: `
        <div class="text-start mt-3">
          <p class="text-secondary mb-2">El sistema detectó tarifa de <strong>${nombreDia}</strong>.</p>
          <label class="form-label fw-bold">Selecciona la tarifa a cobrar:</label>
          <select id="tarifaVisita" class="form-select form-select-lg border-warning">
            <option value="${precioSugerido}" selected>Tarifa Auto (${nombreDia}) - $${precioSugerido}</option>
            <option value="150">Día Festivo (Manual) - $150</option>
          </select>

          <label class="form-label fw-bold text-secondary small">Método de Pago</label>
          <select id="metodoPagoVisita" class="form-select bg-dark text-white border-secondary shadow-none">
            <option value="Efectivo">💵 Efectivo</option>
            <option value="Tarjeta">💳 Tarjeta (TDC/TDD)</option>
            <option value="Transferencia">📱 Transferencia</option>
          </select>
        </div>
      `,
      icon: 'info',
      background: '#222',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      confirmButtonText: '<i class="bi bi-ticket-perforated"></i> Generar Pase',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const costo = Number((document.getElementById('tarifaVisita') as HTMLSelectElement).value);
        const metodo = (document.getElementById('metodoPagoVisita') as HTMLSelectElement).value;
        return { costo, metodo };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const costoFinal = result.value.costo;
        const metodoFinal = result.value.metodo;

        this.visitaService.generarVisita(costoFinal, metodoFinal).subscribe({
          next: (res: any) => {
            Swal.fire({
              title: '¡Venta Exitosa!',
              html: `
              <div class="p-3 bg-dark text-white rounded mt-3">
                <p class="mb-1 text-secondary">Código de Acceso:</p>
                <h1 class="display-3 fw-bold text-warning">${res.pin}</h1>
                <p class="small text-success mb-0"><i class="bi bi-check-circle-fill"></i> Cobro registrado: $${costoFinal}.00</p>
                <p class="small text-info mb-0"><i class="bi bi-wallet2"></i> Vía: ${metodoFinal}</p>
              </div>
              `,
              icon: 'success',
              background: '#222',
              color: '#fff'
            });
          },
          error: (err) => Swal.fire('Error', 'No se pudo generar el PIN.', 'error')
        });
      }
    });
  }

  cargarPlanes() {
    this.membresiaService.obtenerTodas().subscribe({
      next: (planes) => this.planesDisponibles = planes,
      error: (err) => console.error('Error cargando planes', err)
    });
  }

  // EL MÉTODO MAESTRO UNIFICADO (Paginación + Suscripciones)
  cargarDatosCruzados() {
    // 1. ¡La clave está aquí! Cambiamos obtenerTodos() por tu petición de paginación
    this.socioService.obtenerSociosPaginados(this.paginaActual, this.tamanoPagina, this.terminoBusqueda).subscribe({
      next: (respuesta) => {
        const sociosDb = respuesta.content;

        // 2. Guardamos la info de las páginas para el HTML
        this.totalPaginas = respuesta.totalPages;
        this.totalElementos = respuesta.totalElements;

        // 3. Cruzamos los datos exactamente como ya lo tenías
        this.suscripcionService.obtenerTodas().subscribe({
          next: (suscripciones) => {
            this.suscripcionesActivas = suscripciones || [];

            this.socios = (sociosDb || [])
              .filter((s: any) => s.estado === !this.verInactivos)
              .map((socio: any) => {
                const susSuscripciones = this.suscripcionesActivas.filter(
                  (s: any) => s.socio && Number(s.socio.idSocio) === Number(socio.idSocio)
                );

                let laMasReciente = null;
                let planRealmenteActivo = null;
                let diasRestantes = null;
                let labelEstado = 'Sin Plan';

                if (susSuscripciones && susSuscripciones.length > 0) {
                  susSuscripciones.sort((a: any, b: any) =>
                    new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime()
                  );
                  laMasReciente = susSuscripciones[0];

                  const hoy = new Date();
                  hoy.setHours(0, 0, 0, 0);

                  const soloFecha = laMasReciente.fechaFin.split('T')[0];
                  const partes = soloFecha.split('-');
                  const vencimiento = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
                  vencimiento.setHours(0, 0, 0, 0);

                  const diffTime = vencimiento.getTime() - hoy.getTime();
                  diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

                  if (vencimiento >= hoy) {
                    planRealmenteActivo = laMasReciente.membresia ? laMasReciente.membresia.nombre : 'Plan Activo';
                  }

                  if (diasRestantes < 0) {
                    labelEstado = 'Vencido';
                  } else if (diasRestantes <= 5) {
                    labelEstado = '¡Por Vencer!';
                  } else {
                    labelEstado = 'Activo';
                  }
                }
                if (socio.estado === false) {
                  labelEstado = 'Inactivo';
                  planRealmenteActivo = 'Usuario dado de baja';
                }

                return {
                  ...socio,
                  nombrePlan: planRealmenteActivo,
                  fechaFin: laMasReciente ? laMasReciente.fechaFin : null,
                  diasRestantes: diasRestantes,
                  labelEstado: labelEstado
                };
              });

            this.sociosFiltrados = [...this.socios];

            if (this.socioSeleccionado) {
              const actualizado = this.socios.find((s: any) => s.idSocio === this.socioSeleccionado.idSocio);
              if (actualizado) this.socioSeleccionado = actualizado;
            }

            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error cargando suscripciones', err)
        });
      },
      error: (err) => console.error('Error al obtener los socios', err)
    });
  }

  reincorporarSocio(socio: any) {
    const costoInscripcion = 100;
    let opcionesPlanes = '';

    // 1. Armamos las opciones
    this.planesDisponibles.forEach(plan => {
      const total = plan.precio + costoInscripcion;
      opcionesPlanes += `<option value="${plan.idMembresia}">${plan.nombre} - $${total} (Incluye Inscripción)</option>`;
    });

    const modalHtml = `
      <div class="text-start">
        <div class="alert alert-warning py-2 mb-3 border-warning small">
          <i class="bi bi-exclamation-triangle-fill"></i> El socio perdió sus días anteriores. Iniciará desde cero hoy.
        </div>
        <label class="text-secondary small fw-bold mb-1">Selecciona el Nuevo Plan</label>
        <select id="reinc-plan" class="form-select bg-dark text-white border-secondary mb-3 shadow-none">
          ${opcionesPlanes}
        </select>

        <label class="text-secondary small fw-bold mb-1">Método de Pago</label>
        <select id="reinc-metodo" class="form-select bg-dark text-white border-secondary shadow-none">
          <option value="Efectivo">💵 Efectivo</option>
          <option value="Tarjeta">💳 Tarjeta (TDC/TDD)</option>
          <option value="Transferencia">📱 Transferencia</option>
        </select>
      </div>
    `;

    Swal.fire({
      title: 'Reincorporar Socio',
      html: modalHtml,
      background: '#222',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-person-check-fill"></i> Confirmar y Cobrar',
      cancelButtonText: 'Cancelar',

      // 🛡️ EL BLINDAJE AQUÍ: Usamos Swal.getPopup() para ir a la segura
      preConfirm: () => {
        const popup = Swal.getPopup();
        if (popup) {
          const selectPlan = popup.querySelector('#reinc-plan') as HTMLSelectElement;
          const selectMetodo = popup.querySelector('#reinc-metodo') as HTMLSelectElement;

          if (!selectPlan || !selectMetodo) {
            Swal.showValidationMessage('Error interno leyendo el formulario');
            return false;
          }

          return {
            idPlan: Number(selectPlan.value),
            metodo: selectMetodo.value
          };
        }
        return false;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // Extraemos los valores de manera segura
        const idPlanElegido = result.value.idPlan;
        const metodoElegido = result.value.metodo;

        // 🛡️ SEGUNDO BLINDAJE: Verificamos que sí tengamos datos reales antes de molestar a Java
        if (!idPlanElegido || !metodoElegido) {
          Swal.fire('Error', 'No se detectó el plan o el método de pago', 'error');
          return;
        }

        // 1. Reactivamos su expediente (Estado = true)
        this.socioService.actualizarEstado(socio.idSocio, true).subscribe({
          next: () => {
            // 2. Le vendemos la nueva membresía (Enviamos 'true' en aplicaInscripcion)
            this.suscripcionService.inscribirSocio(socio.idSocio, idPlanElegido, metodoElegido, true).subscribe({
              next: (respuesta: any) => {

                // Imprimir ticket si existe el motor de Electron
                if (window.electronAPI) {
                  const planSeleccionado = this.planesDisponibles.find(p => p.idMembresia === idPlanElegido);
                  const valorCobrado = (planSeleccionado ? planSeleccionado.precio : 0) + costoInscripcion;

                  const datosTicket = {
                    identificador: socio.idSocio,
                    clave: respuesta.claveTransaccion || respuesta.idSuscripcion || idPlanElegido,
                    nombre: `${socio.nombre.toUpperCase()} ${socio.apellido.toUpperCase()}`,
                    tipoMembresia: 'REINCORPORACION: ' + (planSeleccionado ? planSeleccionado.nombre.toUpperCase() : 'PLAN'),
                    valor: valorCobrado,
                    estado: 'Pagada',
                    fechaInicio: respuesta.fechaInicio || new Date().toLocaleDateString('es-MX'),
                    fechaFin: respuesta.fechaFin || '',
                    folio: respuesta.folio || respuesta.idSuscripcion || '0001'
                  };
                  window.electronAPI.imprimirTicket(datosTicket);
                }

                Swal.fire({
                  title: '¡Reactivación Exitosa!',
                  text: 'Se cobró la inscripción y el nuevo plan correctamente.',
                  icon: 'success',
                  background: '#222',
                  color: '#fff',
                  confirmButtonColor: '#198754'
                });
                this.cargarDatosCruzados();
              },
              error: (err) => {
                console.error('Error al registrar pago de reincorporación', err);
                Swal.fire('Error', 'Socio reactivo, pero hubo un problema con el cobro.', 'warning');
              }
            });
          },
          error: (err: any) => {
            console.error('Error al cambiar el estado', err);
            Swal.fire('Error', 'No se pudo reactivar al socio en el servidor.', 'error');
          }
        });
      }
    });
  }

  verDetalle(socio: any) {
    this.socioSeleccionado = socio;
  }

  buscar(evento: any) {
    this.terminoBusqueda = evento.target.value;
    this.paginaActual = 0;
    this.cargarDatosCruzados(); // Disparamos la petición a Java
  }

  darDeBaja(id: number | undefined) {
    if (!id) return;

    Swal.fire({
      title: '¿Dar de baja?',
      text: "El socio ya no tendrá acceso al gimnasio.",
      icon: 'warning',
      background: '#222',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6f42c1',
      confirmButtonText: '<i class="bi bi-trash"></i> Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.socioService.actualizarEstado(id, false).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El socio ha sido dado de baja correctamente.',
              icon: 'success',
              background: '#222',
              color: '#fff',
              confirmButtonColor: '#6f42c1'
            });
            this.cargarDatosCruzados();
          },
          error: (err) => {
            console.error('Error al dar de baja', err);
            Swal.fire('Error', 'Hubo un problema de conexión', 'error');
          }
        });
      }
    });
  }

  renovarRapido(socio: any) {
    const susSuscripciones = this.suscripcionesActivas.filter(
      s => s.socio && Number(s.socio.idSocio) === Number(socio.idSocio)
    );

    let laMasReciente = null;
    if (susSuscripciones && susSuscripciones.length > 0) {
      susSuscripciones.sort((a: any, b: any) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());
      laMasReciente = susSuscripciones[0];
    }

    if (!laMasReciente) {
      Swal.fire('Atención', 'Este socio no tiene un plan previo.', 'info');
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVencimiento = new Date(laMasReciente.fechaFin);
    fechaVencimiento.setMinutes(fechaVencimiento.getMinutes() + fechaVencimiento.getTimezoneOffset());
    fechaVencimiento.setHours(0, 0, 0, 0);

    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const opcionesPlanes: { [key: string]: string } = {};

    this.planesDisponibles.forEach(plan => {
      let precioMostrar = plan.precio;
      let etiquetaExtra = '';

      if (diasRestantes >= 0 && plan.duracionDias >= 28 && plan.duracionDias <= 31) {
        const nombrePlan = plan.nombre.toUpperCase();
        let descuento = 0;

        if (nombrePlan.includes('MUJER')) {
          descuento = 30;
        } else if (nombrePlan.includes('ESTUDIANTE')) {
          descuento = 40;
        } else if (nombrePlan.includes('MENSUALIDAD')) {
          descuento = 20;
        }

        if (descuento > 0) {
          precioMostrar = plan.precio - descuento;
          etiquetaExtra = ` (¡Promoción -$${descuento}!)`;
        }
      }

      opcionesPlanes[plan.idMembresia] = `${plan.nombre} - $${precioMostrar}${etiquetaExtra}`;
    });

    // 1. Metemos el aviso directamente en el HTML con diseño Bootstrap
    const mensajeAviso = diasRestantes >= 0
      ? `<div class="alert alert-success border-success py-2 mb-3">⭐ Quedan ${diasRestantes} días. Se aplican promociones.</div>`
      : `<div class="alert alert-secondary border-secondary text-white py-2 mb-3" style="background-color: #333;">El plan ya venció. Cobro regular.</div>`;

    let opcionesHTML = mensajeAviso;
    opcionesHTML += '<div class="text-start">';
    opcionesHTML += '<label class="text-secondary small fw-bold mb-1">Selecciona el Plan</label>';
    opcionesHTML += '<select id="swal-plan" class="form-select bg-dark text-white border-secondary mb-3 shadow-none">';
    for (const [id, texto] of Object.entries(opcionesPlanes)) {
      opcionesHTML += `<option value="${id}">${texto}</option>`;
    }
    opcionesHTML += '</select>';

    opcionesHTML += '<label class="text-secondary small fw-bold mb-1">Método de Pago</label>';
    opcionesHTML += '<select id="swal-metodo" class="form-select bg-dark text-white border-secondary shadow-none">';
    opcionesHTML += '<option value="Efectivo">💵 Efectivo</option>';
    opcionesHTML += '<option value="Tarjeta">💳 Tarjeta (TDC/TDD)</option>';
    opcionesHTML += '<option value="Transferencia">📱 Transferencia</option>';
    opcionesHTML += '</select>';
    opcionesHTML += '</div>';

    Swal.fire({
      title: 'Renovar o Mejorar Plan',
      html: opcionesHTML, // Usamos solo el HTML
      background: '#222',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-cash-coin"></i> Sí, cobrar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        // 2. FORZAMOS el ID a ser un Número para que Angular no rechace la solicitud
        const idPlan = Number((document.getElementById('swal-plan') as HTMLSelectElement).value);
        const metodo = (document.getElementById('swal-metodo') as HTMLSelectElement).value;
        return { idPlan, metodo };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const idMembresiaElegida = result.value.idPlan;
        const metodoPagoElegido = result.value.metodo;

        this.suscripcionService.inscribirSocio(socio.idSocio, idMembresiaElegida, metodoPagoElegido, false).subscribe({
          next: (respuesta: any) => {
            if (window.electronAPI) {
              const planSeleccionado = this.planesDisponibles.find(p => p.idMembresia === idMembresiaElegida);
              let valorCobrado = planSeleccionado ? planSeleccionado.precio : 0;
              if (diasRestantes >= 0 && planSeleccionado && planSeleccionado.duracionDias >= 28 && planSeleccionado.duracionDias <= 31) {
                const nombrePlan = planSeleccionado.nombre.toUpperCase();
                if (nombrePlan.includes('MUJER')) valorCobrado -= 30;
                else if (nombrePlan.includes('ESTUDIANTE')) valorCobrado -= 40;
                else if (nombrePlan.includes('MENSUALIDAD')) valorCobrado -= 20;
              }
              const datosTicket = {
                identificador: socio.idSocio,
                clave: respuesta.claveTransaccion || respuesta.idSuscripcion || idMembresiaElegida,
                nombre: `${socio.nombre.toUpperCase()} ${socio.apellido.toUpperCase()}`,
                tipoMembresia: planSeleccionado ? planSeleccionado.nombre.toUpperCase() : 'RENOVACION PLAN',
                valor: valorCobrado,
                estado: 'Pagada',
                fechaInicio: respuesta.fechaInicio || new Date().toLocaleDateString('es-MX'),
                fechaFin: respuesta.fechaFin || '',
                folio: respuesta.folio || respuesta.idSuscripcion || '0001'
              };
              window.electronAPI.imprimirTicket(datosTicket);
            }
            Swal.fire({
              title: '¡Cobro Exitoso!',
              text: `Se cobró con ${metodoPagoElegido}.`,
              icon: 'success',
              background: '#222',
              color: '#fff',
              confirmButtonColor: '#6f42c1'
            });
            this.cargarDatosCruzados();
          },
          error: (err) => {
            console.error('❌ Error al renovar', err);
            Swal.fire('Error', 'Hubo un problema al procesar el pago.', 'error');
          }
        });
      }
    });
  }
}