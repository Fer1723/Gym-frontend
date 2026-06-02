const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 1. La función para el candado de seguridad
    obtenerHardwareId: () => ipcRenderer.invoke('get-hardware-id'),
    
    // 2. La función para la impresora térmica
    imprimirTicket: (datosTicket) => ipcRenderer.send('imprimir-ticket', datosTicket)
});