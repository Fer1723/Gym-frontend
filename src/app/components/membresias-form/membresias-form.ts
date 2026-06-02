import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { MembresiaService } from '../../services/membresia';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-membresias-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './membresias-form.html',
  styleUrl: './membresias-form.css',
})
export class MembresiasForm implements OnInit{

  membresiaForm!: FormGroup;
  idMembresiaEdicion: number | null = null;

  constructor(
    private fb:FormBuilder,
    private membresiaService: MembresiaService,
    private router: Router,
    private route: ActivatedRoute
  ){}

  ngOnInit(): void {
    this.membresiaForm = this.fb.group({
      nombre: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(1)]],
      duracionDias: ['', [Validators.required, Validators.min(1)]]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if(idParam){
      this.idMembresiaEdicion = Number(idParam);
      this.cargarMembresia(this.idMembresiaEdicion);
    }
  }

  cargarMembresia(id: number){
    this.membresiaService.obtenerPorid(id).subscribe({
      next: (m) => {
        this.membresiaForm.patchValue({
          nombre: m.nombre,
          precio: m.precio,
          duracionDias: m.duracionDias
        });
      },
      error: (err) => console.error('Error al cargar', err)
    });
  }

  guardar(){
    if(this.membresiaForm.valid){
      const datos = this.membresiaForm.value;

      if(this.idMembresiaEdicion){
        const planEditado = {idMembresia: this.idMembresiaEdicion, ...datos, estado: true};
        this.membresiaService.actualizarMembresia(this.idMembresiaEdicion, planEditado).subscribe({
          next: () => this.exito('Plan actualizado'),
          error: err => console.error(err)
        });
      }else{
        const nuevoPlan = {... datos, estado: true};
        this.membresiaService.crearMembresia(nuevoPlan).subscribe({
          next: () => this.exito('Plan creado'),
          error: (err) => console.error(err)
        });
      }
    }
  }

  exito(mensaje: string){
    Swal.fire({
      title: '¡Listo!',
      text: mensaje,
      icon: 'success',
      background: '#222',
      color: '#fff',
      confirmButtonColor: '#6f45c1'
    }).then(() =>{
      this.router.navigate(['/membresias']);
    });
  }

}
