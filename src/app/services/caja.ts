import { HttpClient, HttpParams } from '@angular/common/http';
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

  registrarMovimiento(tipo: string, monto: number, concepto: string): Observable<any>{
    const params = new HttpParams()
    .set('tipo', tipo)
    .set('monto', monto.toString())
    .set('concepto', concepto);
    return this.http.post(`${this.baseUrl}/movimiento`, null, { params });
  }

  // 3. Cierre de turno
  cerrarTurnoCaja(turnoId: number, efectivoFisico: number): Observable<any>{
    return this.http.put(`${this.baseUrl}/cerrar-turno/${turnoId}`, null,{
      params: { efectivoFisico: efectivoFisico.toString()}
    });
  }

  obtenerMovimientosDelDia(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/movimientos-dia`);
  }

  obtenerMovimientosDelTurno(turnoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/movimientos-turno/${turnoId}`);
  }
}