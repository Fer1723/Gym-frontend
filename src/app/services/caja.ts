import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private baseUrl = 'http://localhost:9091/api/caja';

  constructor(private http: HttpClient) { }

  obtenerCorteInteligente(): Observable<any> {
    return this.http.get(`${this.baseUrl}/corte-inteligente`);
  }

  // 3. Cierre de turno
  cerrarTurnoCaja(turnoId: number, efectivoFisico: number): Observable<any>{
    return this.http.put(`${this.baseUrl}/cerrar-turno/${turnoId}`, null,{
      params: { efectivoFisico: efectivoFisico.toString()}
    });
  }
}