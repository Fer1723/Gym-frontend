import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Socio } from '../models/socio';

@Injectable({
  providedIn: 'root',
})
export class SocioService {
  private baseUrl = 'http://localhost:9091/api/socios';

  constructor(private http: HttpClient){}

  obtenerTodos(): Observable<Socio[]> {
    return this.http.get<Socio[]>(this.baseUrl);
  }

  obtenerSoloActivos(): Observable<Socio[]> {
    return this.http.get<Socio[]>(`${this.baseUrl}/activos`);
  }
  
  crearSocio(socio: Socio): Observable<Socio>{
    return this.http.post<Socio>(this.baseUrl, socio);

  }

  actualizarSocio(id: number, socio: Socio): Observable<Socio>{
    return this.http.put<Socio>(this.baseUrl + '/' + id, socio);
  }

  actualizarEstado(idSocio: number, estado: boolean): Observable<any>{
    return this.http.patch(`${this.baseUrl}/${idSocio}/estado?estado=${estado}`,{});
  }

  eliminarSocio(id: number): Observable<any>{
    return this.http.delete(this.baseUrl + '/' + id);
  }

  obtenerPorId(id: number): Observable<Socio>{
    return this.http.get<Socio>(this.baseUrl + '/' + id);
  }
}
