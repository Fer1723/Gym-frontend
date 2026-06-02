import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TurnoCaja {
  private baseUrl = 'http://localhost:9091/api/turnos';

  constructor(private http: HttpClient) {}

  obtenerTurnoActivo(usuarioId: number): Observable<any>{
    return this.http.get(`${this.baseUrl}/activo/${usuarioId}`);
  }

  obtenerUltimoEfectivo(): Observable<number>{
    return this.http.get<number>(`${this.baseUrl}/ultimo-efectivo`);
  }

  obtenerAlertasAuditoria():Observable<any[]>{
    return this.http.get<any[]>(`${this.baseUrl}/alertas`);
  }

  resolverAlerta(turnoId: number, montoRepuesto: number, nota: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/resolver/${turnoId}`, { montoRepuesto, nota });
  }

  abrirTurno(datos: {usuarioId: number, efectivoInicial: number}): Observable<any>{
    return this.http.post(`${this.baseUrl}/abrir`, datos);
  }

  cerrarTurno(datos: { turnoId: number, efectivoFinal: number}): Observable<any>{
    return this.http.put(`${this.baseUrl}/cerrar`, datos);
  }
  
}
