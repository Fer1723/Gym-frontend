const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const { spawn, exec } = require('child_process');
const { error } = require('console');
const fs = require('fs');
let mainWindow;
let motorJava;

function arrancarMotor() {
    try {
        // 🛡️ MULTIPLATAFORMA 1: Logs automáticos
        // app.getPath('userData') elige una carpeta con permisos de escritura automática 
        // (AppData en Windows, Application Support en Mac)
        const logPath = path.join(app.getPath('userData'), 'registro_java.txt');
        const logStream = fs.createWriteStream(logPath, { flags: 'a' });
        
        logStream.write('\n--- NUEVO INTENTO DE ARRANQUE: ' + new Date().toLocaleTimeString() + ' ---\n');

        // 🛡️ MULTIPLATAFORMA 2: Rutas relativas
        // Buscamos el .jar adentro de tu misma carpeta de Electron (ej. en una subcarpeta 'backend')
        const jarPath = path.join(__dirname, 'backend', 'backend.jar');

        // 2. Encendemos el motor usando la variable global (quitamos el shell: true)
        motorJava = spawn('java', ['-jar', jarPath]);

        // 3. Escribimos logs
        motorJava.stdout.pipe(logStream);
        motorJava.stderr.pipe(logStream);

        // 4. Avisos de cierre
        motorJava.on('close', (code) => {
            logStream.write(`\n--- EL PROCESO DE JAVA MURIÓ CON CÓDIGO: ${code} ---\n`);
        });

    } catch (e) {
        dialog.showErrorBox('Error en Node al arrancar Java', e.message);
    }
}

function createWindow() {
  // 1. CREAR LA VENTANA DE LA APLICACIÓN
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),// Conectamos el puente
      contextIsolation: true, // Esto activa el puente seguro
      nodeIntegration: false // Por seguridad esto debe ir en false
    }
  });

  const iconoRuta = path.join(__dirname, 'Factory_GYM.png');

  if (require('fs').existsSync(iconoRuta)) {
      mainWindow.setIcon(iconoRuta); // ¡Esto fuerza a Windows a usarlo!
  } else {
      console.error('❌ ERROR: El archivo Factory_GYM.ico no se encontró en', __dirname);
  }

  // 2. CARGAR TU CÓDIGO DE ANGULAR
  mainWindow.loadFile(path.join(__dirname, 'dist/gym-frontend/browser/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 3. EL PUENTE DE COMUNICACIÓN (Aquí Electron le pasa el dato a Angular)
ipcMain.handle('obtener-id', async () => {
  try {
      const hardwareId = machineIdSync(true);
      return hardwareId; // Se lo devolvemos a Angular
  } catch (error) {
      return 'ERROR_LECTURA';
  }
});

ipcMain.on('imprimir-ticket', (event, datos) => {
    let printWindow = new BrowserWindow({
        show: false,
        webPreferences: {nodeIntegration: true}
    });

    const ticketHTML = `
    <html>
      <head>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Arial', sans-serif; 
            width: 80mm; /* El ancho exacto de tu Epson TM-T88V */
            margin: 0; 
            padding: 10px; 
            font-size: 12px; 
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px;}
          .logo { max-width: 60px; margin-bottom: 10px; }
          .footer-text { font-size: 10px; text-align: center; margin-top: 15px; }
          .logo-container {
            margin: 5px auto 10px auto;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="logo-container">
            <svg viewBox="0 0 100 35" style="width: 90px; height: auto;">
              <rect x="20" y="15" width="60" height="4" fill="#000" />
              
              <rect x="16" y="7" width="3" height="20" rx="1" fill="#000" />
              <rect x="10" y="4" width="5" height="26" rx="1" fill="#000" />
              <rect x="5" y="9" width="4" height="16" rx="1" fill="#000" />
              <rect x="2" y="14" width="3" height="6" rx="0.5" fill="#000" />
              
              <rect x="81" y="7" width="3" height="20" rx="1" fill="#000" />
              <rect x="85" y="4" width="5" height="26" rx="1" fill="#000" />
              <rect x="91" y="9" width="4" height="16" rx="1" fill="#000" />
              <rect x="95" y="14" width="3" height="6" rx="0.5" fill="#000" />
            </svg>
          </div>

          <h2 style="margin:0 0 5px 0; font-size: 16px; letter-spacing: 1px;">THE FACTORY GYM</h2>
          <div style="font-size: 10px; line-height: 1.3;">
            CADAQUES #77 COL. CERRO DE LA ESTRELLA IZT<br>
            Tel: 5549939512
          </div>
        </div>
        <div class="line"></div>
        
        <div class="bold">DATOS DEL SOCIO</div>
        <div>Identificador: ${datos.identificador}</div>
        <div>Clave: ${datos.clave}</div>
        <div>Nombre: ${datos.nombre}</div>
        
        <br>
        <div class="bold">DATOS DE MEMBRESÍA</div>
        <div>Membresía: ${datos.tipoMembresia}</div>
        <div>Valor: $ ${datos.valor.toFixed(2)}</div>
        <div>Estado: ${datos.estado}</div>
        <div>Fecha inicio/fin: ${datos.fechaInicio} - ${datos.fechaFin}</div>
        <div>Folio: ${datos.folio}</div>
        
        <div class="line"></div>
        
        <div class="row">
          <span>Pago de membresía</span>
          <span>$ ${datos.valor}</span>
        </div>
        
        <br>
        <div class="row bold">
          <span>Total</span>
          <span>$ ${datos.valor}</span>
        </div>

        <div class="footer-text">
          CONSERVA TU TICKET PARA CUALQUIER ACLARACION.<br>
          SI NO RECIBES TU TICKET, MES GRATIS.<br>
          LOS PAGOS SON INTRASFERIBLES.<br>
          ESTE TICKET NO ES UN COMPROBANTE FISCAL.
        </div>
      </body>
    </html>
    `;

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ticketHTML)}`);

    printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({
      silent: false, // 👈 Ponemos FALSE temporalmente para que te deje elegir "Guardar como PDF"
      printBackground: true,
      margins: { marginType: 'none' }
    }, (success, errorType) => {
      if (!success) console.log("Impresión cancelada o fallida:", errorType);
      printWindow.close(); // Cerramos la ventana oculta al terminar
    });
  });
});

// EVENTOS DE INICIO Y CIERRE
app.on('ready', () => {
  createWindow();
  arrancarMotor();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});


app.on('window-all-closed', () => {
  // 🛡️ MULTIPLATAFORMA 3: Matar procesos de forma nativa
  // En lugar de usar comandos de consola como taskkill, usamos la función nativa de Node.js
  // Esto le manda la señal de muerte al proceso exacto de Java en Windows o Mac.
  if (motorJava) {
      motorJava.kill('SIGINT');
  }

  if (process.platform !== 'darwin') {
      app.quit();
  }
});