import { Membresia } from "./membresia";
import { Socio } from "./socio";

export interface Suscripcion {
    idSuscripcion?: number;
    fechaInicio: string|Date;
    fechaFin: string | Date;
    estado: string;
    socio?: Socio;
    membresia?: Membresia;
    montoCobrado?: number;
}
