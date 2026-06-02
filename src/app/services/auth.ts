import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private baseUrl = 'http://localhost:9091/api/auth';

  constructor(private http: HttpClient, private router: Router){ }

  registrar(datos: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/registrar`, datos);
  }
  
  login(credenciales: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/login`, credenciales);
  }

  logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('rol');

    this.router.navigate(['/login']);
  }

  get isAdmin(): boolean{
    return localStorage.getItem('rol') === 'ROLE_ADMIN';
  }
}
