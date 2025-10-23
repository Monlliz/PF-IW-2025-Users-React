import styles from '../styles/Users.module.css';
import ReusableModal from '../components/modals/ReusableModal';
import { userEditFields, userCreationFields } from '../components/config/Users-fieldConfigs';
import AlertModal from '../components/modals/AlertModal';
import React, { useState, useEffect } from 'react';
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

// Datos de ejemplo 
const initialUsers = [
  {
    USERID: "001",
    USERNAME: "Johnathan Doe",
    COMPANYID: 101,
    CEDIID: 5,
    EMPLOYEEID: 45012,
    EMAIL: "john.doe@examplecorp.com",
    ACTIVED: true,
    DELETED: false,
    ALIAS: "JohnnyD",
    PHONENUMBER: "+525512345678",
    EXTENSION: "301",
  },
  {
    USERID: "002",
    USERNAME: "Ana García",
    COMPANYID: 102,
    CEDIID: 6,
    EMPLOYEEID: 45013,
    EMAIL: "ana.garcia@examplecorp.com",
    ACTIVED: false,
    DELETED: false,
    ALIAS: "Anita",
    PHONENUMBER: "+525598765432",
    EXTENSION: "302",
  },
];

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
    Header: "Activo", accessor: "ACTIVED",
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

  //Controlar el "hover" de los botones del crud------------------------------------
  const [isHoveredDelete, setisHoveredDelete] = useState(false);
  const [isHoveredAdd, setisHoveredAdd] = useState(false);
  const [isHoveredInfo, setisHoveredInfo] = useState(false);
  const [isHoveredEdit, setisHoveredEdit] = useState(false);
  //------------------------------------------------------------------------------
  //Funcionamiento de la barra de busqueda------------------------------------
  // Estado para guardar la lista original de usuarios (inmutable)
  const [allUsers, setAllUsers] = useState(initialUsers);

  // Estado para guardar la lista que se mostrará en la tabla (puede cambiar)
  const [filteredUsers, setFilteredUsers] = useState(initialUsers);

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
  const handleCreateUser = (userData) => {
    // 'userData' son los datos que vienen del formulario del modal
    console.log('Crear usuario:', userData);

    // 1. Simulamos un ID único (en un caso real, esto lo daría la BD)
    // Usar la fecha actual en milisegundos es una forma simple de simular un ID.
    // Lo convertimos a string para que coincida con tus otros USERID.
    const newId = Date.now().toString();

    // 2. Creamos el objeto de usuario completo
    const newUser = {
      ...userData,
      USERID: newId // Asignamos el nuevo ID simulado
      // Asegúrate de que 'userData' (del modal) ya traiga los demás campos:
      // USERNAME, COMPANYID, CEDIID, etc.
    };

    // 3. Añadimos el nuevo usuario al INICIO de ambas listas
    // Esto crea un nuevo array con el 'newUser' primero,
    // seguido de todos los usuarios anteriores.
    setAllUsers(prevUsers => [newUser, ...prevUsers]);
    setFilteredUsers(prevUsers => [newUser, ...prevUsers]);

    // 4. Cerramos el modal
    setShowCreateModal(false);
  };
  //************Edit******************************** */

  // FUNCIÓN 2: Para el botón "Guardar" de DENTRO del modal
  const handleEditUser = (updatedUserData) => {
    // 'updatedUserData' son los datos que vienen del formulario del modal
    console.log('Guardando cambios:', updatedUserData);

    // 1. AHORA SÍ: Lee 'editingUser' del estado.
    // En este punto, 'editingUser' SÍ tiene el valor que guardamos en handleEditClick.
    const userIdToUpdate = editingUser.USERID;

    // 2. Crea el objeto actualizado
    const updatedUser = { ...editingUser, ...updatedUserData };

    // 3. Actualiza ambas listas
    setAllUsers(prevUsers =>
      prevUsers.map(user =>
        user.USERID === userIdToUpdate ? updatedUser : user
      )
    );
    setFilteredUsers(prevUsers =>
      prevUsers.map(user =>
        user.USERID === userIdToUpdate ? updatedUser : user
      )
    );

    // 4. Cierra el modal y limpia todo
    setShowEditModal(false);
    setEditingUser(null);
    setSelectedRow(null);
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
  const handleDeleteClick = ({ USERID }) => {
    console.log(`BORRANDO el item con id: ${USERID}`);
    //Simula el borrado en la lista de datos "maestra"
    setAllUsers(prevUsers =>
      prevUsers.filter(user => user.USERID !== USERID)
    );

    // Simula el borrado en la lista filtrada (la que ve el usuario)
    setFilteredUsers(prevUsers =>
      prevUsers.filter(user => user.USERID !== USERID)
    );

    //  Limpia la selección para deshabilitar los botones
    setSelectedRow(null);
  };

  // Esta es la función que llama el botón
  // Esta es la función que maneja el cierre del modal
  const handleModalClose = (event) => {
    //  Cierra el modal sin importar lo que se presionó
    setShowConfirmModal(false);

    // Comprueba qué botón se presionó
    if (event === "Sí") {
      // Si fue "Sí", ejecuta el borrado real con el item guardado
      handleDeleteClick(itemToDelete);
    }

    // Limpia el item guardado
    setItemToDelete(null);
  };
  // Función para *abrir* el modal de confirmación
  const handleOpenConfirmModal = (item) => {
    setItemToDelete(item);    // Guarda el item que queremos borrar
    setShowConfirmModal(true); // Abre el modal
  };

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
                <Text>{selectedUserData.DELETED ? "Sí" : "No"}</Text>
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
    </Page>

  );
}