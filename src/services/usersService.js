import { data } from "@remix-run/router";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
/**
 * Función genérica PRIVADA para hacer llamadas.
 * No se exporta, solo la usamos dentro de este archivo.
 */
const API_Users = `${API_BASE}users/crud`;
async function callApi(processType, body, dbServer) {
    try {
        const url = `${API_Users}?ProcessType=${processType}&LoggedUser=Usuario1&DBServer=${dbServer}`;
        const payload = { usuario: body };
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        };

        console.log(`📡 usersService.callApi -> ${url}`);
        console.log('📦 payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(url, config);

        if (!response.ok) {
            // Si el servidor responde con un error (4xx, 5xx), intentamos leer el cuerpo y mostrarlo
            const text = await response.text().catch(() => null);
            let errorData = null;
            try { errorData = text ? JSON.parse(text) : null; } catch(e) { /* not json */ }
            console.error('🔴 usersService.callApi - error response body:', text || errorData);
            const serverMessage = errorData?.message || errorData?.value || text || `HTTP ${response.status}`;
            throw new Error(serverMessage);
        }

        // Si la respuesta no tiene contenido (POST que no devuelve nada)
        if (response.status === 204) {
            return null;
        }

        const data = await response.json();
        const filterData = data?.value?.[0]?.data?.[0]?.dataRes || [];
        return filterData;

    } catch (error) {
        console.error(`Error en llamada API (${processType}):`, error);
        // Re-lanzamos el error para que el componente que llama (en el .jsx) pueda atraparlo
        throw error;
    }
}

/**
 * Llama al backend para obtener la lista de usuarios.
 * @param {string} dbServer - El servidor de BD
 * @returns {Array} La lista de usuarios
 */
export async function getUsersAllService (dbServer) {
    const responseData = await callApi('getAll', {}, dbServer);

    // Extrae la lista de usuarios de la ruta que encontramos
    // Si responseData.value no existe o está vacío, usa '|| []' para evitar errores
   // const userList = responseData?.value?.[0]?.data?.[0]?.dataRes || [];
    
    // Devuelve SOLAMENTE la lista de usuarios
    return responseData;

};


/**
 * Llama al backend para crear un nuevo usuario.
 * @param {object} userData - Los datos del formulario (username, companyid, etc.)
 * @param {string} dbServer - El servidor de BD (mongo, azure)
 * @returns {object} El nuevo usuario creado (devuelto por el backend)
 */
export async function createUserService (userData, dbServer) {
    return await callApi('postUsuario', userData, dbServer);
};

/**
 * ACTUALIZA un usuario existente.
 */
export const updateUserService = async (updatedUserData, dbServer) => {
    // Evitar enviar propiedades que el modelo 'usuario' no acepta (ej. ROLES)
    const payload = { ...updatedUserData };
    if (payload.hasOwnProperty('ROLES')) {
        delete payload.ROLES;
    }

    console.log('📦 updateUserService payload (sin ROLES):', payload);

    // Llama a callApi con el 'updateOne' para actualizar.
    const response = await callApi('updateOne', payload, dbServer);

    // Devuelve la respuesta
    return response;
};

/**
 * ELIMINA (Real) un usuario existente.
 */
export const deleteUserService = async (userId, dbServer) => {
  const userPayload = {
    USERID: userId
  };
  // Llama a la API 
  const response = await callApi(
    'deleteUsuario', 
    userPayload,
    dbServer,

  );

  return response;
};

export const getSociedades = async () =>{
    try {
        const url = 'https://api4papalotescatalogos-bmgjbvgjdhf6eafj.mexicocentral-01.azurewebsites.net/api/cat/crudLabelsValues?ProcessType=getJerarquia&LoggedUser=MIGUELLOPEZ&DBServer=MongoDB&IDETIQUETA=SOCIEDAD';

        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            // Si el servidor responde con un error (4xx, 5xx), lanza una excepción
            const errorData = await response.json().catch(() => ({})); // Intenta leer el JSON de error
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }

        // Si la respuesta no tiene contenido (Ej. un DELETE o un POST que no devuelve nada)
        if (response.status === 204) {
            return null;
        }

        const data = await response.json();
        const filterData = data.data[0]?.dataRes|| [];
        
        return filterData;
        
        

    } catch (error) {
        console.error(`Error en llamada API:`, error);
        // Re-lanzamos el error para que el componente que llama (en el .jsx) pueda atraparlo
        throw error;
    }
}
export const getCedi = async (IDVALORSOCIEDAD,dataRes) =>{
    
    // Validar que dataRes existe y es un array
    if (!dataRes || !Array.isArray(dataRes)) {
        console.error('dataRes no es un array válido:', dataRes);
        return [];
    }
    
    const sociedad = dataRes.find(item => item.IDVALOR === IDVALORSOCIEDAD);
    const soFilter = sociedad && sociedad.hijos ? sociedad.hijos : [];
    console.log(soFilter);
    
    return soFilter;
}

export async function getUserByIdService(userId, dbServer) {
    const body = { USERID: userId };
    
    // 1. IMPORTANTE: Usamos 'getById' para evitar el error 500 "Proceso no reconocido"
    const responseData = await callApi('getById', body, dbServer);

    // 2. Verificación defensiva:
    // Si el backend (por SAP) devuelve un objeto directo, lo usamos.
    // Si por alguna razón devolviera un array, tomamos el primero.
    
    if (Array.isArray(responseData)) {
        return responseData.length > 0 ? responseData[0] : null;
    }
    
    // Si no es array, asumimos que es el objeto usuario directo
    return responseData;
};

/**
 * Asigna un rol a un usuario usando el ProcessType 'assignRol'
 * @param {string} userId
 * @param {string} roleId
 * @param {string} dbServer
 */
export async function assignRoleService(userId, roleId, dbServer) {
    const body = { USERID: userId, ROLEID: roleId };
    return await callApi('assignRol', body, dbServer);
}

/**
 * Desasigna un rol a un usuario usando el ProcessType 'unassignRol'
 * @param {string} userId
 * @param {string} roleId
 * @param {string} dbServer
 */
export async function unassignRoleService(userId, roleId, dbServer) {
    const body = { USERID: userId, ROLEID: roleId };
    return await callApi('unassignRol', body, dbServer);
}

