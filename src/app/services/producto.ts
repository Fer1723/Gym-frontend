import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private baseUrl = 'http://localhost:9091/api/productos';

  constructor(private http:HttpClient){}

  obtenerTodos(): Observable<any[]>{
    return this.http.get<any[]>(this.baseUrl);
  }

  obtenerAlertas(): Observable<any[]>{
    return this.http.get<any[]>(`${this.baseUrl}/alertas`);
  }

  agregarProducto(producto: any): Observable<any>{
    return this.http.post(this.baseUrl, producto);
  }

  venderProducto(idProducto: number, cantidad: number): Observable<any>{
    return this.http.post(`${this.baseUrl}/${idProducto}/vender?cantidad=${cantidad}`, {});
  }

  restockProducto(idProducto: number, cantidad: number): Observable<any>{
    return this.http.post(`${this.baseUrl}/${idProducto}/restock?cantidad=${cantidad}`, {});
  }

  obtenerVenta(): Observable<any[]>{
    return this.http.get<any[]>(`${this.baseUrl}/ventas`);
  }

  cobrarCarrito(ticket: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/carrito`, ticket);
  }

  eliminarProducto(idProducto: number): Observable<any>{
    return this.http.delete(`${this.baseUrl}/${idProducto}`);
  }

}
