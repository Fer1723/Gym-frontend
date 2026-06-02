import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Membresia } from '../models/membresia';

@Injectable({
  providedIn: 'root',
})
export class MembresiaService {

  private baseUrl = 'http://localhost:9091/api/membresias';

  constructor(private http: HttpClient){}

  obtenerTodas(): Observable<Membresia[]>{
    return this.http.get<Membresia[]>(this.baseUrl);
  }

  obtenerPorid(id: number): Observable<Membresia>{
    return this.http.get<Membresia>(this.baseUrl + '/' + id);
  }
  
  crearMembresia(membresias: Membresia): Observable<Membresia>{
    return this.http.post<Membresia>(this.baseUrl, membresias);
  }

  actualizarMembresia(id: number, membresias: Membresia): Observable<Membresia>{
    return this.http.put<Membresia>(this.baseUrl + '/' + id, membresias);
  }

  eliminarMembresia(id: number): Observable<any>{
    return this.http.delete(this.baseUrl + '/' + id);
  }
}
