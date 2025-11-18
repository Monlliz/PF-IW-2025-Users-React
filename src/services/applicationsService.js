/**
 * Fetches all applications and their privilege-related data from the API
 * @param {string} dbServer - The database server to use
 * @returns {Promise<{applications: Array, views: Array, processesMap: Object, privilegesMap: Object}>}
 */
const API_BASE = 'https://gadev-usuarios.onrender.com/api/application/crud';

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

/**
 * Agrega un nuevo privilegio a un proceso
 * @param {string} appId - ID de la aplicación
 * @param {string} viewId - ID de la vista
 * @param {string} processId - ID del proceso
 * @param {object} privilegeData - Datos del privilegio a agregar
 * @param {string} dbServer - Servidor de base de datos
 */
export async function addPrivilege(appId, viewId, processId, privilegeData, dbServer) {
  return callApi('addPrivilege', { 
    appId, 
    viewId, 
    processId, 
    data: {privilegeId: privilegeData.PRIVILEGEID} 
  }, dbServer);
}

/**
 * Elimina un privilegio permanentemente
 * @param {string} appId - ID de la aplicación
 * @param {string} viewId - ID de la vista
 * @param {string} processId - ID del proceso
 * @param {string} privilegeId - ID del privilegio
 * @param {string} dbServer - Servidor de base de datos
 */
export async function deleteHardPrivilege(appId, viewId, processId, privilegeId, dbServer) {
  return callApi('deleteHardPrivilege', { 
    appId, 
    viewId, 
    processId, 
    data: {privilegeId} 
  }, dbServer);
}

export async function fetchPrivilegesData(dbServer) {
  try {
    const data = await callApi('getAplications', {}, dbServer);

    // Extraer la respuesta principal
    const dataRes = data.data?.[0]?.dataRes || [];
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

    // Build processes and privileges maps from ALL applications
    let builtProcessesMap = {};
    let builtPrivilegesMap = {};
    
    // Iterar sobre TODAS las aplicaciones para construir processesMap con APPID
    dataRes.forEach((app) => {
      const appId = app.APPID;
      const appViews = app.VIEWS || [];
      appViews.forEach((v) => {
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
            console.log('Mapped process:', pid, 'for view:', viewId, 'in app:', appId);
            return {
              PROCESSID: pid,
              Descripcion: p.description || "Sin descripcion",
              VIEWID: viewId,
              APPID: appId // Incluir APPID en cada proceso
            };
          });
          // NO sobrescribir, ACUMULAR procesos por viewId
          // Si ya existe, concatenar; si no existe, crear nuevo array
          if (builtProcessesMap[viewId]) {
            builtProcessesMap[viewId] = [...builtProcessesMap[viewId], ...mapped];
          } else {
            builtProcessesMap[viewId] = mapped;
          }
        }
      });
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
 * Fetch all labels (views, processes, privileges) from the unified Labels API endpoint
 * @param {string} dbServer
 * @param {string} loggedUser
 * @returns {Promise<{views: Array, processes: Array, privileges: Array}>}
 */
async function fetchLabelsFromApi(dbServer, loggedUser = 'MIGUELLOPEZ') {
  try {
    const url = `https://api4papalotescatalogos-bmgjbvgjdhf6eafj.mexicocentral-01.azurewebsites.net/api/cat/crudLabelsValues?ProcessType=GetAll&LoggedUser=${loggedUser}&DBServer=${dbServer}`;
    const resp = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({}) 
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    // Extract dataRes from the response
    const dataRes = json.data[0].dataRes || [];
    
    // Initialize collections
    const views = [];
    const processes = [];
    const privileges = [];

    // Process each label category
    dataRes.forEach(item => {
      if (item.IDETIQUETA === 'IdVistas') {
        const viewValues = Array.isArray(item.valores) ? item.valores : [item.valores];
        viewValues.forEach(v => {
          views.push({
            IdValor: v.IDVALOR,
            VALOR: v.VALOR
          });
        });
      } else if (item.IDETIQUETA === 'IdProcesos' && item.valores) {
        const processValues = Array.isArray(item.valores) ? item.valores : [item.valores];
        processValues.forEach(p => {
          processes.push({
            IdValor: p.IDVALOR,
            VALOR: p.VALOR
          });
        });
      } else if (item.IDETIQUETA === 'IdPrivilegios' && item.valores) {
        const privilegeValues = Array.isArray(item.valores) ? item.valores : [item.valores];
        privilegeValues.forEach(pr => {
          privileges.push({
            IdValor: pr.IDVALOR,
            VALOR: pr.VALOR
          });
        });
      }
    });

    return { views, processes, privileges };
  } catch (error) {
    console.error('Error fetching labels from API:', error);
    throw error;
  }
}

/**
 * Fetch all views from the unified Labels API endpoint
 * @param {string} dbServer
 * @returns {Promise<Array>} array of views
 */
export async function fetchViews(dbServer) {
  try {
    const { views } = await fetchLabelsFromApi(dbServer);
    return views;
  } catch (error) {
    console.error('Error fetching views:', error);
    throw error;
  }
}

/**
 * Fetch all processes from the unified Labels API endpoint
 * @param {string} dbServer
 * @returns {Promise<Array>} array of processes
 */
export async function fetchProcesses(dbServer) {
  try {
    const { processes } = await fetchLabelsFromApi(dbServer);
    return processes;
  } catch (error) {
    console.error('Error fetching processes:', error);
    throw error;
  }
}

/**
 * Fetch all privileges from the unified Labels API endpoint
 * @param {string} dbServer
 * @returns {Promise<Array>} array of privileges
 */
export async function fetchPrivileges(dbServer) {
  try {
    const { privileges } = await fetchLabelsFromApi(dbServer);
    return privileges;
  } catch (error) {
    console.error('Error fetching privileges:', error);
    throw error;
  }
}

/**
 * Create a label (view/process/privilege) using the unified Labels API.
 * Reusable: pass the `IDETIQUETA` you need (e.g. 'IdVistas', 'IdProcesos', 'IdPrivilegios').
 * @param {{idetiqueta: string, idvalor: string, valor: string, alias?: string}} label
 * @param {string} dbServer
 * @param {string} loggedUser
 * @returns {Promise<any>} API response
 */
export async function createLabel(label, dbServer, loggedUser = 'MIGUELLOPEZ') {

  const url = `https://api4papalotescatalogos-bmgjbvgjdhf6eafj.mexicocentral-01.azurewebsites.net/api/cat/crudLabelsValues?ProcessType=CRUD&LoggedUser=${loggedUser}&DBServer=${dbServer}`;

  const body = {
    operations: [
      {
        collection: 'values',
        action: 'CREATE',
        payload: {
          IDETIQUETA: label.idetiqueta,
          IDVALOR: label.idvalor,
          VALOR: label.valor,
          ALIAS: label.alias || ''
        }
      }
    ]
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Labels API error ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    return json;
  } catch (error) {
    console.error('createLabel error:', error);
    throw error;
  }
}

/**
 * Update a label (view/process/privilege) using the unified Labels API.
 * Reusable: pass the `IDETIQUETA` you need (e.g. 'IdVistas', 'IdProcesos', 'IdPrivilegios').
 * @param {{idetiqueta: string, idvalor: string, valor: string, alias?: string}} label
 * @param {string} dbServer
 * @param {string} loggedUser
 * @returns {Promise<any>} API response
 */
export async function updateLabel(label, dbServer, loggedUser = 'MIGUELLOPEZ') {

  const url = `https://api4papalotescatalogos-bmgjbvgjdhf6eafj.mexicocentral-01.azurewebsites.net/api/cat/crudLabelsValues?ProcessType=CRUD&LoggedUser=${loggedUser}&DBServer=${dbServer}`;

  const body = {
    operations: [
      {
        collection: 'values',
        action: 'UPDATE',
        payload: {
          id: label.idvalor,
          updates: {
            VALOR: label.valor,
            ALIAS: label.alias || label.idvalor,
            id: label.idvalor
          }
        }
      }
    ]
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Labels API error ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    return json;
  } catch (error) {
    console.error('updateLabel error:', error);
    throw error;
  }
}

/**
 * Delete a label (view/process/privilege) using the unified Labels API.
 * Reusable: pass the `IDETIQUETA` and `IDVALOR` you need.
 * @param {{idetiqueta: string, idvalor: string}} label
 * @param {string} dbServer
 * @param {string} loggedUser
 * @returns {Promise<any>} API response
 */
export async function deleteLabel(label, dbServer, loggedUser = 'MIGUELLOPEZ') {

  const url = `https://api4papalotescatalogos-bmgjbvgjdhf6eafj.mexicocentral-01.azurewebsites.net/api/cat/crudLabelsValues?ProcessType=CRUD&LoggedUser=${loggedUser}&DBServer=${dbServer}`;

  const body = {
    operations: [
      {
        collection: 'values',
        action: 'DELETE',
        payload: {
          id: label.idvalor,
          IDVALOR: label.idvalor
        }
      }
    ]
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Labels API error ${resp.status}: ${text}`);
    }

    const json = await resp.json();
    return json;
  } catch (error) {
    console.error('deleteLabel error:', error);
    throw error;
  }
}
