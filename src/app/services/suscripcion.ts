import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Suscripcion {
  private baseUrl = 'http://localhost:9091/api/suscripciones';

  constructor(private http: HttpClient){}

  obtenerTodas(): Observable<any[]>{
    return this.http.get<any[]>(this.baseUrl);
  }

  inscribirSocio(idSocio: number, idMembresia: number, metodoPago: string, aplicaInscripcion: boolean, fechaFinManual?: string): Observable<any>{
    // Armamos la URL base
    let url = `${this.baseUrl}/inscribir/${idSocio}/${idMembresia}?metodoPago=${metodoPago}&aplicaInscripcion=${aplicaInscripcion}`;
    
    // Si viene una fecha de migración, se la pegamos a la URL
    if (fechaFinManual) {
      url += `&fechaFinManual=${fechaFinManual}`;
    }
    
    return this.http.post(url, {});
  }

  obtenerSuscripcionesPorSocio(idSocio: number): Observable<any>{
    return this.http.get<any[]>(`${this.baseUrl}/socio/${idSocio}`);
  }

}
