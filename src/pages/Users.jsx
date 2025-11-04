import styles from '../styles/Users.module.css';
import ReusableModal from '../components/modals/ReusableModal';
import { userEditFields, userCreationFields } from '../components/config/Users-fieldConfigs';
import AlertModal from '../components/modals/AlertModal';
import React, { useState, useEffect, useContext } from 'react';
import { getUsersAllService, createUserService, updateUserService, deleteUserService } from '../services/usersService.js';
import { DbContext } from "../contexts/dbContext";
import {
  Page,
  Bar,
  Input,
  Toolbar,
  Title,
  AnalyticalTable,
  ToolbarSpacer,
  ToolbarButton,
  FlexBox,
  MessageBox,
  Text,
  Label,
  Icon
} from '@ui5/webcomponents-react';


// Columnas de la tabla
const userColumns = [
  { Header: "User ID", accessor: "USERID" },
  { Header: "Nombre de Usuario", accessor: "USERNAME" },
  { Header: "Alias", accessor: "ALIAS" },
  // { Header: "Compañía ID", accessor: "COMPANYID" },
  // { Header: "CEDI ID", accessor: "CEDIID" },
  // { Header: "Empleado ID", accessor: "EMPLOYEEID" },
  { Header: "Correo Electrónico", accessor: "EMAIL" },
  // {
  //   Header: "Eliminado", accessor: "DELETED",
  //   Cell: ({ value }) => (value ? "Sí" : "No")
  // },
  { Header: "Teléfono", accessor: "PHONENUMBER" },
  { Header: "Extensión", accessor: "EXTENSION" },
  {
    Header: "Activo", accessor: "DETAIL_ROW.ACTIVED",
    Cell: ({ value }) => {
      const isActive = value;
      const statusClass = isActive ? styles.statusActive : styles.statusInactive;

      return (
        <div className={`${styles.statusBadge} ${statusClass}`}>
          <Icon name={isActive ? "accept" : "decline"} />
          <Text>{isActive ? "Activo" : "Inactivo"}</Text>
        </div>
      );
    }
  },
];


export default function Users() {
  //base de datos
  const { dbServer } = useContext(DbContext);
  //cargar datos de usuarios desde el servicio
  const [isLoading, setIsLoading] = useState(true); // Inicia en true para la carga inicial
  const [error, setError] = useState(null);
  //Controlar el "hover" de los botones del crud------------------------------------
  const [isHoveredDelete, setisHoveredDelete] = useState(false);
  const [isHoveredAdd, setisHoveredAdd] = useState(false);
  const [isHoveredInfo, setisHoveredInfo] = useState(false);
  const [isHoveredEdit, setisHoveredEdit] = useState(false);
  //------------------------------------------------------------------------------
  //Funcionamiento de la barra de busqueda------------------------------------
  // Estado para guardar la lista original de usuarios (inmutable)
  const [allUsers, setAllUsers] = useState([]);

  // Estado para guardar la lista que se mostrará en la tabla (puede cambiar)
  const [filteredUsers, setFilteredUsers] = useState([]);
  // Cargar los datos de usuarios al montar el componente
  /**
    * Carga la lista inicial de usuarios desde el backend.
    * @param {string} dbServer - El servidor de base de datos (ej. 'MongoDB')
    */
  const loadUsers = async (dbServer) => {
    // Pone la UI en estado de "cargando"
    setIsLoading(true);
    setError(null);

    try {
      // Llama a tu servicio 'get'
      const usersFromDB = await getUsersAllService(dbServer);
      // Guarda la lista de usuarios en tus estados
      setAllUsers(usersFromDB);
      setFilteredUsers(usersFromDB);

    } catch (err) {
      // Si algo falla, guarda el error para mostrarlo
      console.error("Error al cargar usuarios:", err);
      setError(`Error al cargar la lista: ${err.message}`);
    } finally {
      // Se ejecuta siempre (al éxito o al fallo) para quitar el "cargando"
      setIsLoading(false);
    }
  };

  //****************Filtro de la barra************/
  const handleSearch = (event) => {
    // Obtiene el texto de búsqueda del input y lo convierte a minúsculas.
    const query = event.target.value.toLowerCase();

    // Si el input está vacío, muestra todos los datos originales.
    if (query === '') {
      setFilteredUsers(allUsers); // 'allUsers' es tu lista original sin filtros
      return;
    }

    //  Filtra la lista original
    const filtered = allUsers.filter((user) => {
      // Object.values(user) convierte el objeto {name: 'Ana', role: 'Admin'} en ['Ana', 'Admin']
      // .some() devuelve true si al menos UNA de las columnas cumple la condición.
      return Object.values(user).some((value) =>
        // Convierte el valor de la columna a string y minúsculas, y comprueba si incluye el texto de búsqueda.
        String(value).toLowerCase().includes(query)
      );
    });

    // Actualiza el estado con los resultados encontrados.
    setFilteredUsers(filtered);
  };

  //------------------------------------------------------------------------------
  //MODALES DE LOS BOTONES, FUNCIONAMIENTO

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  //***************Logica de fila*****************
  //fila seleccionada
  const [selectedRow, setSelectedRow] = useState(null);

  const handleRowSelect = (event) => {
    // 1. Obtenemos el ARRAY de todas las filas seleccionadas
    const selectedRows = event.detail.row;
    // 2. Comprobamos si esta fila está AHORA seleccionada
    if (selectedRows.isSelected) {
      // Si es 'true', la guardamos en el estado
      setSelectedRow(selectedRows.original);
    } else {
      // Si es 'false', significa que el usuario acaba de deseleccionarla.
      // Limpiamos el estado.
      setSelectedRow(null);
    }

  };

  // Estados para controlar la visibilidad de los modales de crear y editar
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  //************Crear******************************** */
  const handleCreateUser = async (userData) => {

    // Activa el estado de "cargando" y limpia errores
    setIsLoading(true);
    setError(null);

    try {
      // Preparamos el objeto completo
      // 1Desestructuramos 'userData'
      // - Sacamos 'ACTIVED' y 'DELETED' para usarlos en DETAIL_ROW.
      // - El resto de los campos (USERID, USERNAME, EMAIL, etc.) 
      //   se guardan en la variable 'rest'.
      const { ACTIVED, DELETED, ...rest } = userData;

      //  Preparamos el objeto 'UsuarioInput' SIN los campos sobrantes
      const newUserInput = {
        // 'rest' contiene todos los campos EXCEPTO ACTIVED y DELETED
        ...rest,
        //  Construimos el 'DETAIL_ROW' con los valores que sacamos
        DETAIL_ROW: {
          ACTIVED: ACTIVED || false,
          DELETED: DELETED || false,
          DETAIL_ROW_REG: []
        }
      };

      console.log('Objeto final enviado a la API:', newUserInput);

      // 3. Llama al servicio de la API (asumo 'MongoDB' como en loadUsers)
      const updatedUserList = await createUserService(newUserInput, dbServer);

      if (!updatedUserList || typeof updatedUserList !== 'object') {
        // Si 'dataRes' no vino o no es un objeto, lanza un error
        throw new Error("La API no devolvió el objeto de usuario creado.");
      }

      // 5. Añade el nuevo usuario al INICIO de ambas listas
      //    (Esta es tu lógica de simulación, ¡pero con datos reales!)
      setAllUsers(prevUsers => [...prevUsers, updatedUserList]);
      setFilteredUsers(prevUsers => [...prevUsers, updatedUserList]);
      // 5. Cierra el modal SÓLO si todo salió bien
      setShowCreateModal(false);

    } catch (err) {
      // 6. Si la API falla, muestra el error
      console.error("Error al crear usuario:", err);
      setError(`Error al crear: ${err.message}`);
      // (No cerramos el modal, para que el usuario pueda reintentar)
    } finally {
      // 7. Se ejecuta siempre (éxito o error) para detener el "cargando"
      setIsLoading(false);
    }
  };
  //************Edit******************************** */

  // FUNCIÓN 2: Para el botón "Guardar" de DENTRO del modal
  const handleEditUser = async (updatedFormData) => {
    console.log('Guardando cambios:', updatedFormData);

    setIsLoading(true);
    setError(null);

    try {
      // Lee el usuario ORIGINAL del estado (el que se abrió al editar)
      //  'editingUser' tiene el USERID y los datos que no están en el form.

      // Prepara el objeto final para la API
      // Combina el usuario original con los nuevos datos del form
      const mergedUserData = { ...editingUser, ...updatedFormData };

      let payload; // 1. Declara la variable 'payload' AFUERA del 'if'

      // 2. Limpia el objeto según la base de datos
      if (dbServer === 'MongoDB') {
        const {
          // Campos del formulario que no van en el nivel superior
          ACTIVED, DELETED,
          // Campos específicos de Mongo
          _id, REGUSER, REGDATE, REGTIME, MODUSER, MODDATE, MODTIME, __v,
          ...rest
        } = mergedUserData;

        payload = rest; // 3. Asigna el objeto limpio a 'payload'

      } else if (dbServer === 'AZURECOSMOS') {
        const {
          // Campos del formulario que no van en el nivel superior
          ACTIVED, DELETED,
          // Campos específicos de Cosmos
          id, _ts, _attachments, _etag, _self, _rid,
          ...rest
        } = mergedUserData;

        payload = rest; // 3. Asigna el objeto limpio a 'payload'

      } else {
        // Es buena idea tener un caso por defecto
        console.error("Base de datos no soportada:", dbServer);
        // Si no se reconoce, al menos quita los campos del form
        const { ACTIVED, DELETED, ...rest } = mergedUserData;
        payload = rest;
      }

      // 4. Ahora SÍ puedes USAR 'payload'
      //    Contiene el objeto limpio (sin campos de BD ni ACTIVED/DELETED)
      const finalUserData = {
        ...payload
      };

      console.log('Objeto final enviado a la API (Update):', finalUserData);

      // Llama al servicio de la API
      const updatedUserFromDB = await updateUserService(finalUserData, dbServer);

      if (!updatedUserFromDB || typeof updatedUserFromDB !== 'object') {
        throw new Error("La API no devolvió el objeto de usuario actualizado.");
      }
      console.log("Respuesta API",updatedUserFromDB);
      
      // Actualiza ambas listas 
      setAllUsers(prevUsers =>
        prevUsers.map(user =>
          user.USERID === updatedUserFromDB.USERID ? updatedUserFromDB : user
        )
      );
      setFilteredUsers(prevUsers =>
        prevUsers.map(user =>
          user.USERID === updatedUserFromDB.USERID ? updatedUserFromDB : user
        )
      );

      // 6. Cierra el modal y limpia todo
      setShowEditModal(false);
      setEditingUser(null);
      setSelectedRow(null);

    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      setError(`Error al actualizar: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // FUNCIÓN 1: Para el botón "Editar" de la barra de herramientas
  const handleEditClick = (userToEdit) => {
    // 'userToEdit' es el 'selectedRow' que le pasas

    if (!userToEdit) {
      console.error("handleEditClick fue llamado sin un usuario. Esto no debería pasar.");
      return;
    }

    console.log("Abriendo modal para editar:", userToEdit);

    // 1. Guarda el usuario original en el estado
    setEditingUser(userToEdit);

    // 2. Abre el modal
    setShowEditModal(true);

    // ¡Eso es todo! Esta función no hace nada más.
  };
  //**************Info******************************** */
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);

  const handleShowDetails = (userData) => {
    setSelectedUserData(userData);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailModalOpen(false);
    setSelectedUserData(null);
  };
  //************Delete******************************** */
  const handleModalClose = async (event) => {
    // Cierra el modal en cualquier caso
    setShowConfirmModal(false);

    // Comprueba si el botón presionado fue "Sí"
    if (event === "Sí") {
      // Si fue "Sí", inicia el proceso de borrado
      setIsLoading(true);
      setError(null);

      try {
        if (!itemToDelete) {
          throw new Error("No se ha seleccionado ningún usuario.");
        }

        // Obtenemos el ID del item guardado
        const userIdToDelete = itemToDelete.USERID;

        // Llama al servicio de la API con SÓLO EL ID
        await deleteUserService(userIdToDelete, dbServer);

        // Si la API tuvo éxito, actualiza el estado LOCALMENTE
        setAllUsers(prevUsers =>
          prevUsers.filter(user => user.USERID !== userIdToDelete)
        );
        setFilteredUsers(prevUsers =>
          prevUsers.filter(user => user.USERID !== userIdToDelete)
        );

        // 6. Limpia la selección
        setSelectedRow(null);

      } catch (err) {
        console.error("Error al eliminar usuario:", err);
        setError(`Error al eliminar: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    // 7. Limpia el item guardado (se ejecuta si fue "Sí" o "No")
    setItemToDelete(null);
  };
  // Función para *abrir* el modal de confirmación
  const handleOpenConfirmModal = (item) => {
    setItemToDelete(item);    // Guarda el item que queremos borrar
    setShowConfirmModal(true); // Abre el modal
  };


  //use effect para cargar los datos al iniciar la pagina
  // Este Hook se ejecuta automáticamente cuando el componente se "monta" (carga)
  useEffect(() => {

    // Llama a la función para cargar los datos
    loadUsers(dbServer);

  }, []); // El array vacío [] es MUY importante. 
  // Le dice a React que ejecute esto solo UNA VEZ.
  //-----------------------------------------------------------------------------
  return (
    <Page className={styles.pageContainer}>
      <Bar><Title className={styles.titlePageName}>Usuarios</Title></Bar>

      <AnalyticalTable
        data={filteredUsers}
        columns={userColumns}
        selectionMode="SingleSelect"
        onRowSelect={handleRowSelect}
        filterable
        sortable
        loading={isLoading}
        visibleRows={12}
        noDataText="No se encontraron registros"
        header={
          <Toolbar className={styles.barTable}>

            {/* Contenedor para los botones y el input*/}
            <FlexBox className={styles.buttonGroupContainer}>
              <Input
                type="search"
                placeholder="Buscar..."
                className={styles.searchInput}
                icon='search'
                onInput={handleSearch}
              />
              <ToolbarButton
                icon='add'
                design={isHoveredAdd ? "Positive" : "Transparent"}
                onMouseEnter={() => setisHoveredAdd(true)}
                onMouseLeave={() => setisHoveredAdd(false)}
                onClick={() => setShowCreateModal(true)}
              />
              <ToolbarButton
                icon='hint'
                design={isHoveredInfo ? "Emphasized" : "Transparent"}
                onMouseEnter={() => setisHoveredInfo(true)}
                onMouseLeave={() => setisHoveredInfo(false)}
                onClick={() => handleShowDetails(selectedRow)}
                disabled={!selectedRow} // Se deshabilita si selectedRow es null
              />
              <ToolbarButton
                icon='edit'
                design={isHoveredEdit ? "Attention" : "Transparent"}
                onMouseEnter={() => setisHoveredEdit(true)}
                onMouseLeave={() => setisHoveredEdit(false)}
                onClick={() => handleEditClick(selectedRow)}
                disabled={!selectedRow} // Se deshabilita si selectedRow es null
              />
              <ToolbarButton
                icon='delete'
                design={isHoveredDelete ? "Negative" : "Transparent"}
                onMouseEnter={() => setisHoveredDelete(true)}
                onMouseLeave={() => setisHoveredDelete(false)}
                onClick={() => handleOpenConfirmModal(selectedRow)}
                disabled={!selectedRow} // Se deshabilita si selectedRow es null}
              />
            </FlexBox>
            {/* Este componente empuja todo lo que sigue a la derecha */}
            <ToolbarSpacer />

            <Title>Usuarios ({filteredUsers.length})</Title>

          </Toolbar>
        }
      />{/* Fin Barra de busqueda y crud */}

      {/* Modales  */}
      {/* Modal para creación */}
      <ReusableModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        fields={userCreationFields}
        onSubmit={handleCreateUser}
        submitButtonText="Crear Usuario"
      />

      {/* Modal para edición */}
      <ReusableModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        title="Editar Usuario"
        fields={userEditFields}
        onSubmit={handleEditUser}
        submitButtonText="Guardar Cambios"
        initialData={editingUser} // Puedes agregar esta prop para valores iniciales
      />
      {/* Modal para detalles */}
      {selectedUserData && (
        <AlertModal
          open={isDetailModalOpen}
          onClose={handleCloseDetails}
          title="Detalles del Usuario"
          buttonText="Cerrar"
          message={
            <FlexBox
              direction="Column"
              className={styles.AlertContent}
            >
              <FlexBox className={styles.AlertRow}>
                <Label wrappingType="Normal" showColon={true}>ID de Empleado</Label>
                <Text>{selectedUserData.EMPLOYEEID}</Text>
              </FlexBox>
              <FlexBox className={styles.AlertRow}>
                <Label wrappingType="Normal" showColon={true}>ID de CEDI</Label>
                <Text>{selectedUserData.CEDIID}</Text>
              </FlexBox>
              <FlexBox className={styles.AlertRow}>
                <Label wrappingType="Normal" showColon={true}>ID de Compañia</Label>
                <Text>{selectedUserData.COMPANYID}</Text>
              </FlexBox>
              <FlexBox className={styles.AlertRow}>
                <Label wrappingType="Normal" showColon={true}>Borrado</Label>
                <Text>{selectedUserData.DETAIL_ROW.DELETED ? "Sí" : "No"}</Text>
              </FlexBox>
            </FlexBox>
          }
        />
      )};
      <MessageBox
        open={showConfirmModal}
        titleText="Confirmar eliminación"
        actions={["Sí", "No"]}
        type="Warning"  // <-- Esto le da el ícono y estilo de "Atención"
        onClose={handleModalClose}
      >
        ¿Está seguro de que desea eliminarlo?
      </MessageBox>
      {error && (
        <MessageBox
          open={!!error}
          type="Error"
          titleText="Error de Carga"
          onClose={() => setError(null)}
        >
          {error}
        </MessageBox>
      )}
    </Page>

  );
}