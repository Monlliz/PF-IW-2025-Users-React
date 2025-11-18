const API_BASE_ROLES = 'https://gadev-usuarios.onrender.com/api/roles/crud';

/**
 * Función base para llamadas a API de roles
 * @param {string} processType - Tipo de proceso a ejecutar
 * @param {object} body - Datos a enviar en el body
 * @param {string} dbServer - Servidor de base de datos
 * @returns {Promise<any>}
 */
async function callRolesApi(processType, body, dbServer) {
  console.log("📦 Enviando body a API:", JSON.stringify(body, null, 2));

  try {
    const url = `${API_BASE_ROLES}?ProcessType=${processType}&LoggedUser=AGUIZARE&DBServer=${dbServer}`;
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
    console.error(`Error en llamada API roles (${processType}):`, error);
    throw error;
  }
}

/**
 * Agrega un nuevo proceso a un rol
 * @param {string} roleId - ID del rol
 * @param {object} processData - Datos del proceso a agregar
 * @param {string} dbServer - Servidor de base de datos
 */

export const addProcessToRole = async (body, processType, dbServer) => {
  return callRolesApi(processType, body, dbServer);
};

/**
 * Añade un privilegio a un proceso en un rol
 * @param {string} roleId - ID del rol
 * @param {string} processId - ID del proceso
 * @param {string} privilegeId - ID del privilegio
 * @param {string} dbServer - Servidor de base de datos
 */
export async function addPrivilegeToProcess(roleId, processId, privilegeId, dbServer) {
  return callRolesApi(
    'addPrivilege',
    { ROLEID: roleId, PROCESSID: processId, PRIVILEGEID: privilegeId },
    dbServer
  );
}

/**
 * Elimina un proceso completamente de un rol
 * @param {string} roleId - ID del rol
 * @param {string} processId - ID del proceso
 * @param {string} dbServer - Servidor de base de datos
 */
export const deleteHardProcessFromRole = async (body, processType, dbServer) => {
  return callRolesApi(processType, body, dbServer);
};

/**
 * Elimina un privilegio de un proceso en un rol
 * @param {string} roleId - ID del rol
 * @param {string} processId - ID del proceso
 * @param {string} privilegeId - ID del privilegio a eliminar
 * @param {string} dbServer - Servidor de base de datos
 */
export async function deletePrivilegeFromProcess(roleId, processId, privilegeId, dbServer) {
  return callRolesApi(
    'removePrivilege',
    {
      ROLEID: roleId,
      PROCESS: [{ PROCESSID: processId, PRIVILEGE: [{ PRIVILEGEID: privilegeId }] }],
    },
    dbServer
  );
}

/**
 * Obtiene todos los roles con sus procesos y privilegios
 * @param {string} dbServer - Servidor de base de datos
 * @returns {Promise<{roles: Array, processesMap: Object, privilegesMap: Object}>}
 */
export async function fetchRolesData(dbServer) {
  try {
    const data = await callRolesApi('getAll', {}, dbServer);
    const dataRes = data.data?.[0]?.dataRes || [];

    // Roles básicos
    const roles = dataRes.map(role => ({
      ROLEID: role.ROLEID,
      ROLENAME: role.ROLENAME,
      DESCRIPTION: role.DESCRIPTION || "Sin descripción",
    }));

    // Cargar procesos y privilegios
    let loadedProcesses = [];
    let processesMap = {};
    let privilegesMap = {};

    dataRes.forEach(role => {
      const procs = role.PROCESS || [];
      procs.forEach(proc => {
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
