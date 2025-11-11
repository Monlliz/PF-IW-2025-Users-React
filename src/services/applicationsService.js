
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
 * @param {object} data - Datos de la vista a agregar
 * @param {string} dbServer - Servidor de base de datos
 */
export async function addView(appId, data, dbServer) {
  return callApi('addView', { appId, data }, dbServer);
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

    return
  }
}

/**
 * Fetch all views from the new Views API endpoint
 * @param {string} dbServer
 * @returns {Promise<Array>} array of views
 */
export async function fetchViews(dbServer) {
  try {
    const url = `http://localhost:3333/api/views/crud?ProcessType=getAll&LoggedUser=EMorenoD&dbserver=${dbServer}`;
    const resp = await fetch(url, { method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({}) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    // The API may wrap the payload; try common locations
    const payload = json.data[0] || json || [];

    if (payload.dataRes && Array.isArray(payload.dataRes)) return payload.dataRes;

    return [];
  } catch (error) {
    console.error('Error fetching views:', error);
    throw error;
  }
}