import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SocioService } from '../../services/socio';
import { Suscripcion } from '../../services/suscripcion';
import { Visita } from '../../services/visita';

@Component({
  selector: 'app-checador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checador.html',
  styleUrl: './checador.css',
})
export class Checador implements AfterViewInit, OnInit, OnDestroy{
@ViewChild('escanerInput') escanerInput!: ElementRef;

  estado: 'esperando' | 'permitido' | 'denegado'| 'proximo' = 'esperando';
  socioActual: any = null;
  timer: any;
  private wsSocket!: WebSocket;

  constructor(
    private socioService: SocioService,
    private suscripcion: Suscripcion,
    private cdr: ChangeDetectorRef, 
    private visitaService: Visita
  ) {}

  ngOnInit(): void {
    this.conectarLectorHuellas();
  }

  conectarLectorHuellas(){
    this.wsSocket = new WebSocket('ws://localhost:9091/ws/acceso');

    this.wsSocket.onopen = () =>{
      console.log('✅ Checador conectado exitosamente al canal del Lector de Huellas Biométrico.');
    };

    this.wsSocket.onmessage = (event) =>{
      const data = JSON.parse(event.data);
      console.log('☝️ Huella recibida por WebSocket:', data);

      if(data && data.idSocio){
        console.log(`🚀 Disparando validación visual para el ID: ${data.idSocio}`);
        
        // El setTimeout despierta a Angular para que pinte la pantalla inmediatamente
        setTimeout(() => {
          this.verificarAcceso(data.idSocio.toString());
        }, 10);
      }
    };
    this.wsSocket.onclose = () => {
      console.warn('⚠️ Conexión con el servidor de huellas perdida. Reintentando en 3 segundos...');
      this.timer = setTimeout(() => this.conectarLectorHuellas(), 3000);
    };
  }


  ngAfterViewInit() {
    this.forzarFoco();
  }

  forzarFoco() {
    setTimeout(() => {
      if (this.escanerInput) this.escanerInput.nativeElement.focus();
    }, 100);
  }

  verificarAcceso(valor: string) {
    if (!valor || valor.trim() === '') return;
    
    // 🛡️ 1. Limpiamos espacios y convertimos a mayúsculas por seguridad del escáner
    const codigoIngresado = valor.trim().toUpperCase(); 
    
    if (this.escanerInput && this.escanerInput.nativeElement) {
      this.escanerInput.nativeElement.value = ''; // Limpiar caja física si escanean código de barras
    }
    clearTimeout(this.timer);

    // 🛡️ 2. NUEVA LÓGICA DE AISLAMIENTO: ¿Empieza con el prefijo "V-"?
    if (codigoIngresado.startsWith('V-')) {
      
      this.visitaService.validarPin(codigoIngresado).subscribe({
        next: (res) => {
          this.socioActual = { nombre: 'Visita', apellido: 'Express', fotoBase64: null };
          this.mostrarResultado('permitido', 'Pase de 1 Día Válido');
        },
        error: (err) => {
          this.socioActual = null;
          this.mostrarResultado('denegado', 'PIN Inválido o Usado');
        }
      });
      
    } else {
      
      // 🧍‍♂️ 3. Si NO empieza con "V-", asumimos 100% que es el ID numérico de un socio
      const idSocio = Number(codigoIngresado);

      // Mini-escudo: Si el escáner lee pura basura que no es número ni visita, cortamos de tajo.
      if (isNaN(idSocio)) {
        this.socioActual = null;
        this.mostrarResultado('denegado', 'Código no reconocido');
        return;
      }

      this.socioService.obtenerPorId(idSocio).subscribe({
        next: (socio) => {
          this.socioActual = socio;

          if (!socio.estado) {
            this.mostrarResultado('denegado', 'Socio dado de baja');
            return;
          }

          this.suscripcion.obtenerSuscripcionesPorSocio(idSocio).subscribe({
            next: (suscripciones) => {
              const subActiva = suscripciones.find((sub: any) => 
                sub.estado && sub.estado.toUpperCase() === 'ACTIVA'
              );

              if (subActiva) {
                const hoy = new Date();
                const soloFecha = subActiva.fechaFin.split('T')[0];
                const [year, month, day] = soloFecha.split('-');
                const fin = new Date(Number(year), Number(month) - 1, Number(day));

                hoy.setHours(0,0,0,0);
                fin.setHours(0,0,0,0);

                const diffTime = fin.getTime() - hoy.getTime();
                const diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

                this.socioActual.nombrePlan = subActiva.membresia.nombre;
                this.socioActual.diasRestantes = diasRestantes;
                
                console.log(`Días exactos calculados para ${this.socioActual.nombre}: ${diasRestantes}`);

                if(diasRestantes < 0){
                  this.mostrarResultado('denegado', 'Membresia Vencida');
                } else if(diasRestantes <= 5){
                  this.mostrarResultado('proximo');
                } else {
                  this.mostrarResultado('permitido');
                }
              } else {
                this.mostrarResultado('denegado', 'Sin membresía activa');
              }
            },
            error: () => this.mostrarResultado('denegado', 'Error en suscripción')
          });
        },
        error: () => {
          this.socioActual = null;
          this.mostrarResultado('denegado', 'ID no encontrado');
        }
      });
    }
  }

  // Esta función centraliza el cambio de color y el reinicio
  mostrarResultado(nuevoEstado: 'esperando' | 'permitido' | 'denegado' | 'proximo', mensajePlan?: string) {
    this.estado = nuevoEstado;
    if (mensajePlan && this.socioActual){
      this.socioActual.nombrePlan = mensajePlan;
    } 
    // Forzamos a Angular a que vea el cambio de color AHORA
    this.cdr.detectChanges(); 

    // Iniciamos el reloj para volver al negro
    this.timer = setTimeout(() => {
      this.estado = 'esperando';
      this.socioActual = null;
      this.cdr.detectChanges(); // Forzamos volver al negro
    }, 4000);
  }

  // 👇 Función para el botón de pruebas (Simula el lector físico)
  simularHuellaApp(idSocio: string) {
    if (!idSocio) return;
    
    console.log(`Enviando señal a Java simulando que el socio ${idSocio} puso el dedo...`);
    
    // Hacemos la petición POST al backend tal como la haría Postman
    fetch(`http://localhost:9091/api/accesos/simular/${idSocio}`, {
      method: 'POST'
    }).then(response => {
      if (response.ok) {
        console.log('Señal enviada con éxito. Esperando respuesta del WebSocket...');
      } else {
        console.error('Error al simular la huella en Java.');
      }
    }).catch(err => console.error('Error de red al simular:', err));
  }

  ngOnDestroy() {
    if(this.wsSocket){
      this.wsSocket.close();
    }
    clearTimeout(this.timer);
  }
}
