// ============================================================================
// CONFIGURACIÓN Y UTILIDADES DEL SERVICIO DE ROLES
// ============================================================================

// URL base para todas las llamadas al API de Roles
const API_BASE_ROLES = 'https://gadev-usuarios.onrender.com/api/roles/crud';

/**
 * Función genérica para interactuar con el API de Roles.
 * Esta función centraliza:
 *  - Construcción del URL completo
 *  - Manejo de parámetros obligatorios
 *  - Envío de la petición POST
 *  - Manejo de errores
 *  - Parseo de respuesta JSON
 *
 * Beneficios:
 *  - Evita duplicar lógica de fetch en cada operación (DRY)
 *  - Si cambia la URL o headers, solo se actualiza aquí
 *  - Estandariza el formato de errores en consola
 *
 * @param {string} processType - Tipo de operación a ejecutar (add, delete, getAll, etc.)
 * @param {object} body - Cuerpo de la petición enviado al backend
 * @param {string} dbServer - Nombre del servidor de base de datos
 * @returns {Promise<any>} - Respuesta JSON del servidor
 */
async function callRolesApi(processType, body, dbServer) {
  console.log("📦 Enviando body a API:", JSON.stringify(body, null, 2));

  try {
    // Construcción del endpoint con los parámetros necesarios
    const url = `${API_BASE_ROLES}?ProcessType=${processType}&LoggedUser=AGUIZARE&DBServer=${dbServer}`;

    // Petición HTTP POST
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body) // el backend CAP espera siempre JSON válido
    });

    // Manejo de errores HTTP
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en llamada API roles (${processType}):`, error);
    throw error;
  }
}

// ============================================================================
// OPERACIONES CRUD DEL MÓDULO ROLES
// ============================================================================

/**
 * Agrega un proceso/aplicación a un rol.
 * Envia el body tal como se recibe.
 *
 * @param {object} body - Datos del proceso a agregar
 * @param {string} processType - Tipo de operación (addProcess, etc.)
 * @param {string} dbServer
 */
export const addProcessToRole = async (body, processType, dbServer) => {
  return callRolesApi(processType, body, dbServer);
};

/**
 * Agrega un privilegio a un proceso dentro de un rol.
 *
 * @param {string} roleId
 * @param {string} processId
 * @param {string} privilegeId
 * @param {string} dbServer
 */
export async function addPrivilegeToProcess(roleId, processId, privilegeId, dbServer) {
  return callRolesApi(
    'addPrivilege',
    { ROLEID: roleId, PROCESSID: processId, PRIVILEGEID: privilegeId },
    dbServer
  );
}

/**
 * Elimina un proceso completamente de un rol.
 *
 * @param {object} body - Cuerpo de petición (ROLEID, PROCESSID)
 * @param {string} processType
 * @param {string} dbServer
 */
export const deleteHardProcessFromRole = async (body, processType, dbServer) => {
  return callRolesApi(processType, body, dbServer);
};

/**
 * Elimina un privilegio específico de un proceso en un rol.
 *
 * @param {string} roleId
 * @param {string} processId
 * @param {string} privilegeId
 * @param {string} dbServer
 */
export async function deletePrivilegeFromProcess(roleId, processId, privilegeId, dbServer) {
  return callRolesApi(
    'removePrivilege',
    {
      ROLEID: roleId,
      PROCESS: [
        { PROCESSID: processId, PRIVILEGE: [{ PRIVILEGEID: privilegeId }] }
      ],
    },
    dbServer
  );
}

// ============================================================================
// OBTENER INFORMACIÓN GENERAL (ROLES + PROCESOS + PRIVILEGIOS)
// ============================================================================

/**
 * Obtiene todos los roles, sus procesos y privilegios.
 *
 * La respuesta del backend CAP tiene estructura extremadamente anidada:
 *   data.value[0].data[0].dataRes
 *
 * Por eso se utiliza optional chaining "?."
 * ?. “Si la variable existe y no es null ni undefined, accede a la propiedad; si no, regresa undefined sin generar error”.
 * 
 * para evitar errores en caso de que alguna capa venga vacía.
 * @param {string} dbServer
 * @returns {Promise<{roles: Array, processes: Array, processesMap: Object, privilegesMap: Object}>}
 */
export async function fetchRolesData(dbServer) {
  try {
    const data = await callRolesApi('getAll', {}, dbServer);

    console.log("Respuesta completa API Roles:", data);

    // Usamos la estructura correcta: data.value...
    const dataRes = data.value?.[0]?.data?.[0]?.dataRes || [];

    // Procesamiento básico de roles
    const roles = dataRes.map(role => ({
      ROLEID: role.ROLEID,
      ROLENAME: role.ROLENAME,
      DESCRIPTION: role.DESCRIPTION || "Sin descripción",
    }));

    let loadedProcesses = [];
    let processesMap = {};
    let privilegesMap = {};

    // Procesar procesos y privilegios asociados a cada rol
    dataRes.forEach(role => {
      const processes = role.PROCESS || [];

      processes.forEach(proc => {
        // Procesos
        loadedProcesses.push({
          PROCESSID: proc.PROCESSID,
          NAMEAPP: proc.NAMEAPP,
          ROLEID: role.ROLEID,
        });

        processesMap[role.ROLEID] = processesMap[role.ROLEID] || [];
        processesMap[role.ROLEID].push({
          PROCESSID: proc.PROCESSID,
          NAMEAPP: proc.NAMEAPP,
        });

        // Privilegios
        if (Array.isArray(proc.PRIVILEGE)) {
          privilegesMap[proc.PROCESSID] = proc.PRIVILEGE.map(priv => ({
            PRIVILEGEID: priv.PRIVILEGEID,
            Descripcion: priv.PRIVILEGEID,
          }));
        }
      });
    });

    return {
      roles,
      processes: loadedProcesses,
      processesMap,
      privilegesMap,
    };
  } catch (error) {
    console.error('Error fetching roles data:', error);
  }
}

// ============================================================================
// OBTENER TODAS LAS APLICACIONES (API UNIFICADA DE LABELS)
// ============================================================================

/**
 * Obtiene todas las aplicaciones desde la API unificada de Labels.
 *
 *  * Este endpoint pertenece al área de "Labels" y devuelve
 * valores agrupados por etiquetas.
 *
 * Filtramos únicamente los items cuyo:
 *   IDETIQUETA = "IdAplicaciones"
 *
 * Este servicio es independiente del módulo de Roles.
 * @param {string} dbServer
 * @param {string} loggedUser
 * @returns {Promise<{applications: Array}>}
 */
export async function fetchApplicationsFromApi(dbServer = 'MongoDB', loggedUser = 'AGUIZARE') {
  try {
    const url = `https://api5papalotescatalogos-caf6azeddbehbbak.mexicocentral-01.azurewebsites.net/api/cat/crudLabelsValues?ProcessType=GetAll&LoggedUser=${loggedUser}&DBServer=${dbServer}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const json = await resp.json();
    const dataRes = json.data[0].dataRes || [];
    const applications = [];

    // Extraer únicamente las etiquetas de aplicaciones
    dataRes.forEach(item => {
      if (item.IDETIQUETA === 'IdAplicaciones') {
        const values = Array.isArray(item.valores) ? item.valores : [item.valores];
        values.forEach(v => {
          applications.push({ IdValor: v.IDVALOR, VALOR: v.VALOR });
        });
      }
    });

    return { applications };
  } catch (error) {
    console.error('Error fetching applications from API:', error);
    throw error;
  }
}


// ============================================================================
// OBTENER ROLES + TODAS LAS APPS + APPS ASIGNADAS POR ROL
// ============================================================================

/**
 * Obtiene roles + todas las apps + apps asignadas por rol.
 *
 *  Endpoint que combina:
 *  - Roles
 *  - Procesos asignados a cada rol
 * @param {string} dbServer
 */
export async function fetchAllRolesAndApps(dbServer) {
  try {
    const apiRoute = `https://gadev-usuarios.onrender.com/api/roles/crud?ProcessType=getAll&DBServer=${dbServer}&LoggedUser=AGUIZARE`;

    const res = await fetch(apiRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const dataRes = data?.value?.[0]?.data?.[0]?.dataRes || [];

    // Convertir estructura de roles
    const loadedRoles = dataRes.map(r => ({
      ROLEID: r.ROLEID,
      ROLENAME: r.ROLENAME || "Sin NOMBRE",
      DESCRIPTION: r.DESCRIPTION || "",
      ACTIVED: r.ACTIVED,
    }));

    // Mapa de aplicaciones asignadas por rol
    const appsByRol = {};
    dataRes.forEach(r => {
      appsByRol[r.ROLEID] = (r.PROCESS || []).map(p => ({
        APPID: p.PROCESSID,
        NAMEAPP: p.NAMEAPP || "Sin nombre",
        DESCRIPTION: p.DESCRIPTION || "",
      }));
    });

    // Obtener todas las aplicaciones
    const allAppsData = await fetchApplicationsFromApi();
    const loadedAllApps = (allAppsData.applications || []).map(app => ({
      APPID: app.IdValor,
      NAMEAPP: app.VALOR,
      DESCRIPTION: "",
    }));

    return {
      roles: loadedRoles,
      allApps: loadedAllApps,
      appsByRol,
    };
  } catch (error) {
    console.error('Error fetching all roles and apps:', error);
    throw error;
  }
}

/**
 * Actualiza los datos de un rol existente.
 *
 * @param {string} roleId
 * @param {object} data - Campos a actualizar
 * @param {string} dbServer
 */
export async function updateRole(roleData, dbServer) {
  
  // 1. LIMPIEZA DE DATOS (Allowlist / Lista Blanca)
  // Creamos un objeto nuevo SOLO con los campos que el backend CAP permite.
  // Esto elimina automáticamente _id, __v, y cualquier otra basura.
  const cleanPayload = {
    ROLEID: roleData.ROLEID,
    ROLENAME: roleData.ROLENAME,
    DESCRIPTION: roleData.DESCRIPTION || "",
    ACTIVED: roleData.ACTIVED,
    DELETED: roleData.DELETED,
    // Si NO vas a editar procesos en esta llamada, mejor no los envíes 
    // para evitar errores de validación en estructuras anidadas.
    // PROCESS: [] 
  };

  // 2. Enviamos el objeto limpio
  return callRolesApi(
    'updateOne',
    {
      rol: cleanPayload
    },
    dbServer
  );
}

/**
 * Crea un nuevo rol.
 *
 * @param {object} data - Información del rol
 * @param {string} dbServer
 */
export async function createRole(data, dbServer) {
  return callRolesApi(
    'postRol',
    { rol: { ...data } },
    dbServer
  );
}

/**
 * Elimina un rol permanentemente.
 *
 * @param {string} roleId
 * @param {string} dbServer
 */
export async function deleteRole(roleData, dbServer) {
  // Extraemos el ID del objeto para asegurarnos de enviar una cadena de texto, no un objeto
  const idToDelete = roleData.ROLEID;

  return callRolesApi(
    'deleteRol',
    { 
      rol: { 
        ROLEID: idToDelete 
      } 
    },
    dbServer
  );
}
