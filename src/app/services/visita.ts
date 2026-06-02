import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Visita {
  private baseUrl = 'http://localhost:9091/api/visitas';

  constructor(private http: HttpClient){}

  generarVisita(monto: number, metodoPago: String): Observable<any>{
    return this.http.post(`${this.baseUrl}/generar?monto=${monto}&metodoPago=${metodoPago}`, {});
  }

  validarPin(pin: string): Observable<any>{
    return this.http.get(`${this.baseUrl}/validar/${pin}`);
  }
  
  obtenerStatsMesActual(): Observable<any>{
    return this.http.get(`${this.baseUrl}/stats/mes-actual`);
  }
}
