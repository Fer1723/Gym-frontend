import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MembresiaService } from '../../services/membresia';
import { Membresia } from '../../models/membresia';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-membresias-lista',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './membresias-lista.html',
  styleUrl: './membresias-lista.css',
})
export class MembresiasLista implements OnInit{

  membresias : Membresia[] = [];

  constructor(
    private membresiaService: MembresiaService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.obtenerMembresias();
  }

  obtenerMembresias(){
    this.membresiaService.obtenerTodas().subscribe({
      next: (datos) =>{
        this.membresias = datos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar membresias', err)
    });
  }

  darDeBaja(id: number | undefined){
    if(!id) return;

    Swal.fire({
      title: '¿Desea desactivar la membresia?',
      text: 'Ya no se podra vender esta membresia a los socios.',
      icon: 'warning',
      background: '#222',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6f45c1',
      confirmButtonText: '<i class="bi bi-trash"></i> Si, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if(result.isConfirmed){
        this.membresiaService.eliminarMembresia(id).subscribe({
          next: () =>{
            Swal.fire({
              title: '¡Desactivado!',
              text: 'La membresia fue retirada del catalogo.',
              icon: 'success',
              background: '#222',
              color: '#fff',
              confirmButtonColor: '#6f42c1'
            });
            this.obtenerMembresias();
          },
          error: (err) => 
            Swal.fire({
              title: 'Error', 
              text: 'Hubo un problema de conexion', 
              icon: 'error', 
              background: '#222', 
              color: '#fff' 
            })
        });
      }
    });
  }
}
