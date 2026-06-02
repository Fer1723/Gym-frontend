import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProductoService } from '../../services/producto';
import { Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './producto.html',
  styleUrl: './producto.css',
})
export class Producto implements OnInit {
  productoForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private router: Router
  ){}

  ngOnInit(): void {
    // 1. Formulario limpio, solo con lo que debe ver recepción
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      precioVenta: [0, [Validators.required, Validators.min(0.01)]],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [5, [Validators.required, Validators.min(1)]],
      categoria: ['General']
    });
  }

  guardar() {
    if(this.productoForm.invalid) return;

    // 2. Truco: Armamos el paquete e inyectamos precioCompra en 0 "por debajo de la mesa"
    const datosAEnviar = {
      ...this.productoForm.value,
      precioCompra: 0
    };

    console.log("Datos a enviar: ", datosAEnviar);

    this.productoService.agregarProducto(datosAEnviar).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Producto añadido al inventario.', 'success').then(() => {
          this.router.navigate(['/tienda']);
        });
        this.productoForm.reset({stockMinimo: 5, categoria: 'General'});
      },
      error: () => Swal.fire('Error', 'No se puede guardar el producto', 'error')
    });
  }
}