import { Component, OnInit, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SocioService } from '../../services/socio';
import { Membresia } from '../../models/membresia';
import { MembresiaService } from '../../services/membresia';
import { Suscripcion } from '../../services/suscripcion';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-socios-form',
  standalone: true, // Asumiendo que usas componentes standalone en Angular 17+
  imports: [ReactiveFormsModule, RouterLink, NgIf, CommonModule, FormsModule],
  templateUrl: './socios-form.html',
  styleUrl: './socios-form.css',
})
export class SociosForm implements OnInit, OnDestroy {

  socioForm!: FormGroup;
  idSocioEdicion: number | null = null;
  planesDisponibles: Membresia[] = [];

  // 👇 1. VARIABLES PARA EL COBRO DE INSCRIPCIÓN
  aplicarInscripcion: boolean = false;
  precioPlanSeleccionado: number = 0;
  totalACobrar: number = 0;

  // 2. VARIABLE SPARA LA PROMOCIÓN

  aplicarPromocion: boolean = false;
  descuentoAplicado: number = 0;
  permitirPromo: boolean = false;

  // 3. VARIABLES PARA LA MIGRACION

  modoMigracion: boolean = false;
  fechaVencimientoMigracion: string = '';

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  camaraEncendida = false;
  fotoCapturada: string | null = null;
  streamCamara: MediaStream | null = null;

  constructor(
    private fb: FormBuilder,
    private socioService: SocioService,
    private router: Router,
    private route: ActivatedRoute,
    private membresiaService: MembresiaService,
    private suscripcionService: Suscripcion
  ) { }

  ngOnInit(): void {
    this.cargarPlanes();

    this.socioForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}')]],
      idMembresia: ['', Validators.required],
      metodoPago: ['Efectivo', Validators.required] // 👈 1. AGREGAMOS ESTA LÍNEA
    });

    // 👇 2. ESCUCHAR CUANDO SELECCIONAN UN PLAN
    // Esto detecta cada vez que la recepcionista cambia el "select" del plan
    this.socioForm.get('idMembresia')?.valueChanges.subscribe(idPlanSeleccionado => {
      if (idPlanSeleccionado) {
        // Buscamos el precio del plan seleccionado en nuestra lista
        const plan = this.planesDisponibles.find(p => p.idMembresia === Number(idPlanSeleccionado));
        if (plan) {
          this.precioPlanSeleccionado = plan.precio;

          const nombrePlan = plan.nombre.toLowerCase();
          this.permitirPromo = !(nombrePlan.includes('semana') || nombrePlan.includes('bimestre'));
          if (this.permitirPromo) {
            this.aplicarPromocion = false;
          }
          this.recalcularTotal();
        }
      }
    });

    this.idSocioEdicion = Number(this.route.snapshot.paramMap.get('id'));

    if (this.idSocioEdicion) {
      this.cargarSocio(this.idSocioEdicion);
    }
  }

  alCargarMigracion() {
    if (this.modoMigracion) {
      this.aplicarInscripcion = false;
    }
  }

  // 👇 3. MÉTODO PARA SUMAR O QUITAR LOS $100
  recalcularTotal() {
    const costoInscripcion = this.aplicarInscripcion ? 100 : 0;
    this.descuentoAplicado = 0;

    if (this.aplicarPromocion && this.permitirPromo) {
      if (this.precioPlanSeleccionado === 550) {
        this.descuentoAplicado = 20;
      } else if (this.precioPlanSeleccionado === 530) {
        this.descuentoAplicado = 30;
      } else if (this.precioPlanSeleccionado === 500) {
        this.descuentoAplicado = 40;
      }
    }
    this.totalACobrar = this.precioPlanSeleccionado - this.descuentoAplicado + costoInscripcion;
  }

  // ... (Tus métodos de la cámara: iniciarCamara, tomarFoto, etc. se quedan IGUAL) ...
  iniciarCamara() {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      this.streamCamara = stream;
      this.videoElement.nativeElement.srcObject = stream;
      this.camaraEncendida = true;
    }).catch(err => {
      console.error("Error al acceder a la camara: ", err);
      alert("No se detectó camara o denegaste el permiso en el navegador.");
    });
  }

  tomarFoto() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    canvas.width = 250;
    canvas.height = 250;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const x = (video.videoWidth - size) / 2;
    const y = (video.videoHeight - size) / 2;

    const context = canvas.getContext('2d');
    context?.drawImage(video, x, y, size, size, 0, 0, canvas.width, canvas.height);

    this.fotoCapturada = canvas.toDataURL('image/jpeg', 0.8);
    this.apagarCamara();
  }

  borrarFoto() {
    this.fotoCapturada = null;
    this.iniciarCamara(); // Corregido: Faltaban los paréntesis ()
  }

  apagarCamara() {
    if (this.streamCamara) {
      this.streamCamara.getTracks().forEach(track => track.stop());
      this.camaraEncendida = false; // Debería ser false, lo dejo como lo tenías por si acaso, ¡pero revísalo!
    }
  }

  ngOnDestroy() {
    this.apagarCamara();
  }

  cargarSocio(id: number) {
    this.socioService.obtenerPorId(id).subscribe({
      next: (socio) => {
        this.socioForm.patchValue({
          nombre: socio.nombre,
          apellido: socio.apellido,
          telefono: socio.telefono
        });
      },
      error: (err) => console.error('Error al cargar el socio', err)
    });
  }

  cargarPlanes() {
    this.membresiaService.obtenerTodas().subscribe({
      next: (datos) => this.planesDisponibles = datos,
      error: (err) => console.error('Error cargando planes', err)
    });
  }

  // ... (Tu método guardar() se queda IGUAL) ...
  guardar(): void {
    if (this.socioForm.valid) {
      const datosFormulario = this.socioForm.value;

      const socioParaJava = {
        nombre: datosFormulario.nombre,
        apellido: datosFormulario.apellido,
        telefono: datosFormulario.telefono,
        estado: true,
        fotoBase64: this.fotoCapturada || '',
        huellaTemplate: 'huella_demo_' + Math.random()
      };

      if (this.idSocioEdicion) {
        const socioActualizado = { idSocio: this.idSocioEdicion, ...socioParaJava };
        this.socioService.actualizarSocio(this.idSocioEdicion, socioActualizado).subscribe({
          next: () => this.router.navigate(['/socios']),
          error: (err) => console.error('Error al actualizar', err)
        });

      } else {
        this.socioService.crearSocio(socioParaJava).subscribe({
          next: (socioCreado: any) => {
            console.log('✅ GOLPE 1: Socio y FOTO guardados.', socioCreado);
            const idDelSocioNuevo = socioCreado.idSocio || socioCreado.id;

            if (datosFormulario.idMembresia && idDelSocioNuevo) {
              console.log(`🚀 Lanzando GOLPE 2: Inscribiendo al plan...`);

              this.suscripcionService.inscribirSocio(
                Number(idDelSocioNuevo),
                Number(datosFormulario.idMembresia),
                datosFormulario.metodoPago, // 👈 ¡AQUÍ ESTÁ EL CAMBIO MAESTRO!
                this.aplicarInscripcion,
                this.modoMigracion ? this.fechaVencimientoMigracion : undefined
              ).subscribe({
                next: (respuesta: any) => {
                  // Limpiamos un 'if' que estaba repetido aquí adentro
                  console.log('✅ GOLPE 2 EXITOSO. Recibo de inscripción:', respuesta);

                  if (window.electronAPI) {
                    const planSeleccionado = this.planesDisponibles.find(
                      p => p.idMembresia === Number(datosFormulario.idMembresia)
                    );
                    const datosTicket = {
                      identificador: idDelSocioNuevo,
                      clave: respuesta.claveTransaccion || respuesta.idSuscripcion || datosFormulario.idMembresia,
                      nombre: `${datosFormulario.nombre.toUpperCase()} ${datosFormulario.apellido.toUpperCase()}`,
                      tipoMembresia: planSeleccionado ? planSeleccionado.nombre.toUpperCase() : 'PLAN GYM',
                      valor: this.totalACobrar,
                      estado: 'Pagado',
                      fechaInicio: respuesta.fechaInicio || new Date().toLocaleDateString('es-MX'),
                      fechaFin: respuesta.fechaFin || '',
                      folio: respuesta.folio || respuesta.idSuscripcion || '0001'
                    };
                    window.electronAPI.imprimirTicket(datosTicket);
                  }
                  this.router.navigate(['/socios']);
                },
                error: (err) => {
                  console.error('❌ ERROR EN GOLPE 2:', err);
                  this.router.navigate(['/socios']);
                }
              });
            } else {
              this.router.navigate(['/socios']);
            }
          },
          error: (err) => console.error('❌ ERROR EN GOLPE 1 (No se creó el socio):', err)
        });
      }
    } else {
      this.socioForm.markAllAsTouched();
    }
  }
}