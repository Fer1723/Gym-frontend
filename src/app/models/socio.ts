import { Membresia } from "./membresia";

export interface Socio {
    idSocio?: number;
    nombre: string;
    apellido: string;
    telefono: string;
    Membresia?: Membresia;
    fotoBase64?: string | null;
    huellaTemplate: string;
    estado: boolean;
    fechaRegistro?: string;
    labelEstado?: string;
    diasRestantes?: string| null;
    nombrePlan?: string | null;
    fechaFin?: string | null;
}
