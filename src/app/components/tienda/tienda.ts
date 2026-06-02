import { CommonModule, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import Swal from 'sweetalert2';
import { ProductoService } from '../../services/producto';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [NgClass, RouterLink,CommonModule, FormsModule],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css',
})
export class Tienda implements OnInit{

  productos: any[] = [];
  productosCriticos: number = 0;
  
  venta: any[]= [];
  totalCaja: number = 0;

  productosFiltrados: any[] = [];

  carrito: any[] = [];
  totalCarrito: number = 0;
  metodoPagoSeleccionado: string = 'Efectivo';


  constructor(
    private productosService : ProductoService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.cargarInventario();
    this.CargarVentas();
  }

  cargarInventario(){
     this.productosService.obtenerTodos().subscribe({
      next: (data) =>{
        console.log("¡Datos recibidos de java!", data);
        this.productos = data;
        this.productosFiltrados = data;
        this.productosCriticos = this.productos.filter(p => p.stockActual <= p.stockMinimo).length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar la tienda', err)
    });
  }

  buscarProducto(event: any){
    const texto = event.target.value.toLowerCase();
    if(!texto){
      this.productosFiltrados = this.productos;
      return;
    }
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(texto) ||
      (p.categoria && p.categoria.toLowerCase().includes(texto))
    );
  }

  agregarAlCarrito(producto: any){
    const itemExistente = this.carrito.find(item => item.idProducto === producto.idProducto);
    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;

    if(cantidadActual + 1 > producto.stockActual){
      Swal.fire({
        icon: 'warning',
        title: 'Stock Insuficiente',
        text: `Solo tienes ${producto.stockActual} unidades de ${producto.nombre}.`,
        background: '#222',
        color: '#fff'
      });
      return;
    }
    if(itemExistente){
      itemExistente.cantidad++;
      itemExistente.subtotal = itemExistente.cantidad * producto.precioVenta;
    }else {
      this.carrito.push({
        idProducto: producto.idProducto,
        nombreProducto: producto.nombre,
        cantidad: 1,
        subtotal: producto.precioVenta,
        precioUnitario: producto.precioVenta
      });
    }
    this.calcularTotalCarrito();
  }

  quitarDelCarrito(index: number){
    this.carrito.splice(index, 1);
    this.calcularTotalCarrito();
  }

  calcularTotalCarrito(){
    this.totalCarrito = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    this.cdr.detectChanges();
  }

  procesarVentaCarrito(){
    if(this.carrito.length === 0) return ;

    const ticket = {
      metodoPago: this.metodoPagoSeleccionado,
      total: this.totalCarrito,
      detalle: this.carrito
    };

    this.productosService.cobrarCarrito(ticket).subscribe({
      next: () =>{
        Swal.fire({
          icon: 'success',
          title: '¡Venta Registrada!',
          text: `Se cobró un total de $${this.totalCarrito}`,
          background: '#222',
          color: '#fff',
          timer: 2000,
          showConfirmButton: false
        });
        this.carrito = [];
        this.calcularTotalCarrito();
        this.cargarInventario();
        this.CargarVentas();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Hubo un problema al procesar el ticket', 'error');
      }
    });
  }

  eliminarProducto(producto: any){
    Swal.fire({
      title: '¿Retirar del inventario?',
      text: `Estás a punto de eliminar "${producto.nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545', // Rojo peligro
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-trash"></i> Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#222',
      color: '#fff'
    }).then((result) => {
      if(result.isConfirmed){
        this.productosService.eliminarProducto(producto.idProducto).subscribe({
          next: () =>{
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El producto fue borrado del catálogo.',
              background: '#222',
              color: '#fff',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarInventario();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el producto', 'error')
        });
      }
    });
  }

  CargarVentas(){
    this.productosService.obtenerVenta().subscribe({
      next: (data) => {
        console.log("🔥 CHISME DE JAVA (Historial):", data);
        this.venta = data;

        if(this.venta && this.venta.length > 0){
          this.totalCaja = this.venta.reduce((sum, ticket) => sum + (ticket.total || 0), 0);
        } else{
          this.totalCaja = 0;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar historial', err)
    });
  }

  venderRapido(producto: any){
    Swal.fire({
      title: `Vender ${producto.nombre}`,
      text: `Stock disponible: ${producto.stockActual}`,
      input: 'number',
      inputAttributes: {
        min: '1',
        max: producto.stockActual.toString(),
        step: '1'
      },
      inputValue: 1, // Por defecto se vende 1
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-cart-check"></i> Cobrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754',
      background: '#222',
      color: '#fff'
    }).then((result) => {
      if(result.isConfirmed && result.value){
        const cantidadVendida = Number(result.value);

        if(cantidadVendida > producto.stockActual){
          Swal.fire('Error', 'No hay suficiente stock para esta venta', 'error');
          return;
        }

        this.productosService.venderProducto(producto.idProducto, cantidadVendida).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Venta Exitosa!',
              text: `Se cobraron $${producto.precioVenta * cantidadVendida}.`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              background: '#222',
              color: '#fff'
            });
            this.cargarInventario();
            this.CargarVentas();
          },
          error: (err) => {
            Swal.fire('Error', 'Hubo un problema al registrar la venta.', 'error');
          }
        });
      }
    });
  }

  rellenarInventario(producto: any){
    Swal.fire({
      title: `Surtir ${producto.nombre}`,
      text: `Stock actual: ${producto.stockActual}. ¿Cuántas unidades llegaron?`,
      input: 'number',
      inputAttributes: { min: '1', step: '1' },
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-box-seam"></i> Cargar Stock',
      confirmButtonColor: '#ffc107', // Color amarillo para que combine
      background: '#222',
      color: '#fff'
    }).then((result) =>{
      if(result.isConfirmed && result.value){
        const cantidadNueva = Number(result.value);
        this.productosService.restockProducto(producto.idProducto, cantidadNueva).subscribe({
          next: () => {
            producto.stockActual += cantidadNueva;
            this.productosCriticos = this.productos.filter(p => p.stockActual >= p.stockMinimo).length;
            this.cdr.detectChanges();
            Swal.fire({
              icon: 'success',
            title: 'Inventario Surtido',
            text: `Se agregaron ${cantidadNueva} unidades.`,
            background: '#222',
            color: '#fff',
            timer: 2000,
            showConfirmButton: false
            });
            this.cargarInventario();
          },
          error: () => Swal.fire('Error', 'No se pudo actualizar el stock', 'error')
        });
      }
    });
  }

}
