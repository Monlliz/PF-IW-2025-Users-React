const API_BASE_ROLES = 'http://localhost:3333/api/roles/crud';

/**
 * ======================================================================================
 * Función genérica para realizar llamadas a la API de roles.
 * Se utiliza para TODOS los procesos: agregar, eliminar, editar, obtener datos, etc.
 * 
 * @param {string} processType - Tipo de operación a ejecutar en el backend
 * @param {object} body - Cuerpo de la petición (payload) a enviar por POST
 * @param {string} dbServer - Servidor de base de datos seleccionado
 * @returns {Promise<any>} Respuesta procesada del servidor
 * ======================================================================================
 */
async function callRolesApi(processType, body, dbServer) {
  console.log("📦 Enviando body a API:", JSON.stringify(body, null, 2));

  try {
    const url = `${API_BASE_ROLES}?ProcessType=${processType}&LoggedUser=AGUIZARE&DBServer=${dbServer}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Si la API responde con error HTTP
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    // Parseo del JSON de respuesta
    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Error en llamada API roles (${processType}):`, error);
    throw error;
  }
}

/**
 * ======================================================================================
 * Añadir un proceso a un rol
 * 
 * @param {object} body - Información del proceso a agregar { ROLEID, PROCESSID, ... }
 * @param {string} processType - Acción a ejecutar, ej. "addProcess"
 * @param {string} dbServer - Servidor de base de datos
 * ======================================================================================
 */
export const addProcessToRole = async (body, processType, dbServer) => {
  return callRolesApi(processType, body, dbServer);
};

/**
 * ======================================================================================
 * Añade un privilegio a un proceso dentro de un rol específico.
 * 
 * @param {string} roleId - ID del rol 
 * @param {string} processId - ID del proceso 
 * @param {string} privilegeId - ID del privilegio a insertar
 * @param {string} dbServer - Servidor de base de datos
 * ======================================================================================
 */
export async function addPrivilegeToProcess(roleId, processId, privilegeId, dbServer) {
  return callRolesApi(
    'addPrivilege',
    { ROLEID: roleId, PROCESSID: processId, PRIVILEGEID: privilegeId },
    dbServer
  );
}

/**
 * ======================================================================================
 * Elimina completamente un proceso de un rol (borrado duro).
 * 
 * @param {object} body - Estructura enviada por la API
 * @param {string} processType - Acción, por ejemplo: "deleteHardProcess"
 * @param {string} dbServer - Servidor de base de datos
 * ======================================================================================
 */
export const deleteHardProcessFromRole = async (body, processType, dbServer) => {
  return callRolesApi(processType, body, dbServer);
};

/**
 * ======================================================================================
 * Elimina un privilegio específico de un proceso en un rol.
 * 
 * @param {string} roleId 
 * @param {string} processId 
 * @param {string} privilegeId 
 * @param {string} dbServer 
 * ======================================================================================
 */
export async function deletePrivilegeFromProcess(roleId, processId, privilegeId, dbServer) {
  return callRolesApi(
    'removePrivilege',
    {
      ROLEID: roleId,
      PROCESS: [
        {
          PROCESSID: processId,
          PRIVILEGE: [{ PRIVILEGEID: privilegeId }]
        }
      ],
    },
    dbServer
  );
}

/**
 * ======================================================================================
 * Obtiene la estructura completa de roles, procesos y privilegios desde la API.
 * Realiza el parseo para entregarlo en un formato fácil de manejar en la interfaz.
 * 
 * @param {string} dbServer - Servidor de base de datos
 * @returns {Promise<{roles: Array, processes: Array, processesMap: Object, privilegesMap: Object}>}
 * ======================================================================================
 */
export async function fetchRolesData(dbServer) {
  try {
    const data = await callRolesApi('getAll', {}, dbServer);
    const dataRes = data.data?.[0]?.dataRes || [];

    // -------------------------
    // Conversión de roles
    // -------------------------
    const roles = dataRes.map(role => ({
      ROLEID: role.ROLEID,
      ROLENAME: role.ROLENAME,
      DESCRIPTION: role.DESCRIPTION || "Sin descripción",
    }));

    // Estructuras de apoyo para procesos y privilegios
    let loadedProcesses = [];
    let processesMap = {};
    let privilegesMap = {};

    // -------------------------
    // Procesamiento de procesos y privilegios por rol
    // -------------------------
    dataRes.forEach(role => {
      const procs = role.PROCESS || [];

      procs.forEach(proc => {
        // Lista general de procesos
        loadedProcesses.push({
          PROCESSID: proc.PROCESSID,
          NAMEAPP: proc.NAMEAPP,
          ROLEID: role.ROLEID,
        });

        // Mapa agrupado por rol
        processesMap[role.ROLEID] = processesMap[role.ROLEID] || [];
        processesMap[role.ROLEID].push({
          PROCESSID: proc.PROCESSID,
          NAMEAPP: proc.NAMEAPP,
        });

        // Privilegios por proceso
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
    return;
  }
}
