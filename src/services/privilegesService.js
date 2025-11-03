
const defaultViewsData = [
  { VIEWID: "V001", Descripcion: "Vista principal" },
  { VIEWID: "V002", Descripcion: "Panel de control" },
  { VIEWID: "V003", Descripcion: "Vista de reportes" }
];

const defaultProcessesByView = {
  V001: [
    { PROCESSID: "P001", Descripcion: "Gestión de usuarios" },
    { PROCESSID: "P002", Descripcion: "Carga de datos" }
  ],
  V002: [
    { PROCESSID: "P003", Descripcion: "Monitoreo del sistema" },
    { PROCESSID: "P004", Descripcion: "Configuración avanzada" }
  ],
  V003: [{ PROCESSID: "P005", Descripcion: "Generar informes" }]
};

const defaultPrivilegesByProcess = {
  P001: [
    { PRIVILEGIEID: "PR001", Descripcion: "Lectura de usuarios" },
    { PRIVILEGIEID: "PR002", Descripcion: "Creación de usuarios" }
  ],
  P002: [{ PRIVILEGIEID: "PR003", Descripcion: "Importar datos" }],
  P003: [
    { PRIVILEGIEID: "PR004", Descripcion: "Monitoreo" },
    { PRIVILEGIEID: "PR005", Descripcion: "Reinicio del sistema" }
  ]
};

/**
 * Fetches all applications and their privilege-related data from the API
 * @param {string} dbServer - The database server to use
 * @returns {Promise<{applications: Array, views: Array, processesMap: Object, privilegesMap: Object}>}
 */
const API_BASE = 'http://localhost:3333/api/application/crud';

/**
 * Función base para hacer llamadas a la API
 * @param {string} processType - Tipo de proceso a ejecutar
 * @param {object} body - Datos a enviar en el body
 * @param {string} dbServer - Servidor de base de datos
 * @returns {Promise<any>}
 */
async function callApi(processType, body, dbServer) {
  try {
    const url = `${API_BASE}?ProcessType=${processType}&LoggedUser=EMorenoD&dbserver=${dbServer}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error en llamada API (${processType}):`, error);
    throw error;
  }
}

/**
 * Agrega una nueva vista a una aplicación
 * @param {string} appId - ID de la aplicación
 * @param {object} viewData - Datos de la vista a agregar
 * @param {string} dbServer - Servidor de base de datos
 */
export async function addView(appId, viewData, dbServer) {
  return callApi('addView', { appId, viewData }, dbServer);
}

/**
 * Agrega un nuevo proceso a una vista
 * @param {string} appId - ID de la aplicación
 * @param {string} viewId - ID de la vista
 * @param {object} processData - Datos del proceso a agregar
 * @param {string} dbServer - Servidor de base de datos
 */
export async function addProcess(appId, viewId, processData, dbServer) {
  return callApi('addProcess', { 
    appId, 
    viewId, 
    processId: processData.PROCESSID 
  }, dbServer);
}

/**
 * Actualiza una vista existente
 * @param {string} appId - ID de la aplicación
 * @param {string} viewId - ID de la vista
 * @param {object} data - Datos actualizados de la vista
 * @param {string} dbServer - Servidor de base de datos
 */
export async function updateView(appId, viewId, data, dbServer) {
  return callApi('updateView', { appId, viewId, data }, dbServer);
}

/**
 * Actualiza un proceso existente
 * @param {string} appId - ID de la aplicación
 * @param {string} viewId - ID de la vista
 * @param {string} processId - ID del proceso
 * @param {object} data - Datos actualizados del proceso
 * @param {string} dbServer - Servidor de base de datos
 */
export async function updateProcess(appId, viewId, processId, data, dbServer) {
  return callApi('updateProcess', { 
    appId, 
    viewId, 
    processId, 
    data 
  }, dbServer);
}

/**
 * Elimina una vista permanentemente
 * @param {string} appId - ID de la aplicación
 * @param {string} viewId - ID de la vista
 * @param {string} dbServer - Servidor de base de datos
 */
export async function deleteHardView(appId, viewId, dbServer) {
  return callApi('deleteHardView', { appId, viewId }, dbServer);
}

/**
 * Elimina un proceso permanentemente
 * @param {string} appId - ID de la aplicación
 * @param {string} viewId - ID de la vista
 * @param {string} processId - ID del proceso
 * @param {string} dbServer - Servidor de base de datos
 */
export async function deleteHardProcess(appId, viewId, processId, dbServer) {
  return callApi('deleteHardProcess', { 
    appId, 
    viewId, 
    processId 
  }, dbServer);
}

export async function fetchPrivilegesData(dbServer) {
  try {
    const data = await callApi('getAplications', {}, dbServer);

    // Extraer la respuesta principal
    const dataRes = data.data?.[0]?.dataRes || [];
    console.log('dataRes:', dataRes);

    // Cada elemento en dataRes es una aplicación
    const applications = dataRes.map(app => ({
      APPID: app.APPID,
        NAME: app.NAME,
    }));


    // Usar el primer elemento de dataRes para las vistas (temporalmente)
    const payload = dataRes[0] || {};
    const rawViews = payload.VIEWS;
    const rawProcessesList = payload.PROCESS;

    // Transform views data for each application
    let loadedViews = [];
    dataRes.forEach(app => {
      const appViews = app.VIEWS || [];
      const appViewsTransformed = appViews.map(v => ({
        VIEWSID: v.VIEWSID,
        Descripcion: v.description || "Sin descripcion",
        APPID: app.APPID
      }));
      loadedViews = [...loadedViews, ...appViewsTransformed];
    });

    // Build processes and privileges maps
    let builtProcessesMap = {};
    let builtPrivilegesMap = {};
    
    (Array.isArray(rawViews) ? rawViews : []).forEach((v) => {
      const viewId = v.VIEWSID;
      const procArray = v.PROCESS || [];
      
      if (Array.isArray(procArray) && procArray.length > 0) {
        const mapped = procArray.map((p) => {
          const pid = p.PROCESSID;
          
          // Extract privileges for this process
          if (Array.isArray(p.PRIVILEGE)) {
            builtPrivilegesMap[pid] = p.PRIVILEGE.map(priv => ({
              PRIVILEGEID: priv.PRIVILEGEID,
              Descripcion: priv.PRIVILEGEID // Using ID as description until API provides it
            }));
          }
          
          return {
            PROCESSID: pid,
            Descripcion: p.description || "Sin descripcion",
            VIEWID: viewId // Add reference to parent view
          };
        });
        builtProcessesMap[viewId] = mapped;
      } else {
        builtProcessesMap[viewId] = defaultProcessesByView[viewId] || [];
      }
    });

    return {
        applications: applications,
      views: loadedViews,
      processesMap: builtProcessesMap,
      privilegesMap: builtPrivilegesMap 
    };
  } catch (error) {
    console.error('Error fetching privileges data:', error);

    return {
      views: defaultViewsData,
      processesMap: defaultProcessesByView,
      privilegesMap: defaultPrivilegesByProcess
    };
  }
}