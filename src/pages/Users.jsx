import styles from '../styles/Users.module.css';
import ReusableModal from '../components/modals/ReusableModal';
import { userEditFields, userCreationFields, userOrderFields } from '../components/config/Users-fieldConfigs';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Icon,
  ComboBox,      
  ComboBoxItem,  
  Label          
} from '@ui5/webcomponents-react';


// Columnas de la tabla
const userColumns = [
  { Header: "User ID", accessor: "USERID" },
  { Header: "Nombre de Usuario", accessor: "USERNAME" },
  { Header: "Alias", accessor: "ALIAS" },
  { Header: "Correo Electrónico", accessor: "EMAIL" },
  { Header: "Número Telefónico", accessor: "PHONENUMBER" },
  { Header: "Extensión", accessor: "EXTENSION" },
  {
    Header: "Activo", accessor: "DETAIL_ROW.ACTIVED",
    Cell: ({ value }) => {
      const isActive = value;
      const statusClass = isActive ? styles.statusActive : styles.statusInactive;
      return (
        <div className={`${styles.statusBadge} ${statusClass}`}>
          <Icon name={isActive ? "accept" : "delete"} />
          <Text>{isActive ? "Activo" : "Borrado"}</Text>
        </div>
      );
    }
  },
];


export default function Users() {
  // Base de datos
  const { dbServer } = useContext(DbContext);
  const navigate = useNavigate();

  // Cargar datos de usuarios desde el servicio
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controlar el "hover" de los botones
  const [isHoveredDelete, setisHoveredDelete] = useState(false);
  const [isHoveredAdd, setisHoveredAdd] = useState(false);
  const [isHoveredInfo, setisHoveredInfo] = useState(false);
  const [isHoveredEdit, setisHoveredEdit] = useState(false);

  // --- ESTADOS DE DATOS Y FILTROS ---
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Nuevos estados para controlar los filtros por separado
  const [searchText, setSearchText] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("All"); // Default: Todos

  /**
   * Carga la lista inicial de usuarios desde el backend.
   */
  const loadUsers = async (dbServer) => {
    setIsLoading(true);
    setError(null);
    try {
      const usersFromDB = await getUsersAllService(dbServer);
      setAllUsers(usersFromDB);
      // No seteamos filteredUsers aquí directamente, el useEffect de abajo lo hará
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError(`Error al cargar la lista: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO CENTRALIZADA ---
  // Este efecto se ejecuta cuando cambia la data, el texto o el combo
  useEffect(() => {
    let result = [...allUsers];

    // Filtrar por Estatus (Combo)
    if (statusFilter === "Active") {
      // Filtra los que tienen ACTIVED = true
      result = result.filter(u => u.DETAIL_ROW?.ACTIVED === true);
    } else if (statusFilter === "Delete") {
      // Filtra los que tienen ACTIVED = false (según tu lógica de columna)
      result = result.filter(u => !u.DETAIL_ROW?.ACTIVED);
    }

    // Filtrar por Texto (Search Input)
    if (searchText) {
      const lowerQuery = searchText.toLowerCase();
      result = result.filter((user) => {
        return Object.values(user).some((value) =>
          String(value).toLowerCase().includes(lowerQuery)
        );
      });
    }

    setFilteredUsers(result);
  }, [allUsers, searchText, statusFilter]);


  // Manejador del Input de Búsqueda
  const handleSearchInput = (event) => {
    setSearchText(event.target.value);
  };

  // Manejador del ComboBox de Estatus
  const handleStatusChange = (event) => {
    const selectedText = event.target.value;
    // Buscamos el ID correspondiente al texto seleccionado
    const selectedOption = userOrderFields.find(opt => opt.label === selectedText);
    // Si encuentra opción usa su ID, si no (ej. usuario borra el texto), vuelve a 'All'
    setStatusFilter(selectedOption ? selectedOption.id : "All");
  };


  // MODALES DE LOS BOTONES, FUNCIONAMIENTO
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Logica de fila seleccionada
  const [selectedRow, setSelectedRow] = useState(null);

  const handleRowSelect = (event) => {
    const selectedRows = event.detail.row;
    if (selectedRows.isSelected) {
      setSelectedRow(selectedRows.original);
    } else {
      setSelectedRow(null);
    }
  };

  // Estados para crear y editar
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // ************ Crear ************
  const handleCreateUser = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { ACTIVED, DELETED, DETAIL_ROW, ...rest } = userData;
      const newUserInput = {
        ...rest,
        DETAIL_ROW: {
          ACTIVED: DETAIL_ROW.ACTIVED,
          DELETED: !DETAIL_ROW.ACTIVED
        }
      };

      console.log('Objeto final enviado a la API:', newUserInput);

      const updatedUserList = await createUserService(newUserInput, dbServer);

      if (!updatedUserList || typeof updatedUserList !== 'object') {
        throw new Error("La API no devolvió el objeto de usuario creado.");
      }

      setAllUsers(prevUsers => [...prevUsers, updatedUserList]);
      // No hace falta setFilteredUsers, el useEffect lo hará solo
      setShowCreateModal(false);

    } catch (err) {
      console.error("Error al crear usuario:", err);
      setError(`Error al crear: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ************ Edit ************
  const handleEditUser = async (updatedFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const mergedUserData = { ...editingUser, ...updatedFormData };
      let payload;

      if (dbServer === 'MongoDB') {
        const { ACTIVED, DELETED, _id, REGUSER, REGDATE, REGTIME, MODUSER, MODDATE, MODTIME, __v, ...rest } = mergedUserData;
        payload = rest;
      } else if (dbServer === 'AZURECOSMOS') {
        const { ACTIVED, DELETED, id, _ts, _attachments, _etag, _self, _rid, ...rest } = mergedUserData;
        payload = rest;
      } else {
        const { ACTIVED, DELETED, ...rest } = mergedUserData;
        payload = rest;
      }
      const { DETAIL_ROW } = mergedUserData;
      const { BIRTHDATE, ...otherDetails } = payload;
      payload = (BIRTHDATE === "") ? otherDetails : payload;
      
      const finalUserData = {
        ...payload,
        DETAIL_ROW: {
          ACTIVED: DETAIL_ROW.ACTIVED,
          DELETED: !DETAIL_ROW.ACTIVED
        }
      };
      const updatedUserFromDB = await updateUserService(finalUserData, dbServer);

      if (!updatedUserFromDB || typeof updatedUserFromDB !== 'object') {
        throw new Error("La API no devolvió el objeto de usuario actualizado.");
      }

      setAllUsers(prevUsers =>
        prevUsers.map(user =>
          user.USERID === updatedUserFromDB.USERID ? updatedUserFromDB : user
        )
      );
      
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

  const handleEditClick = (userToEdit) => {
    if (!userToEdit) return;
    setEditingUser(userToEdit);
    setShowEditModal(true);
  };

  // ************ Info (Detalles) ************
  const handleShowDetails = (userData) => {
    if (userData && userData.USERID) {
      navigate(`/users/detail/${userData.USERID}`, { state: { user: userData } });
    }
  };

  // ************ Delete ************
  const handleModalClose = async (event) => {
    setShowConfirmModal(false);
    if (event === "Sí") {
      setIsLoading(true);
      setError(null);
      try {
        if (!itemToDelete) throw new Error("No se ha seleccionado ningún usuario.");
        const userIdToDelete = itemToDelete.USERID;

        await deleteUserService(userIdToDelete, dbServer);

        setAllUsers(prevUsers => prevUsers.filter(user => user.USERID !== userIdToDelete));
        setSelectedRow(null);

      } catch (err) {
        console.error("Error al eliminar usuario:", err);
        setError(`Error al eliminar: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    setItemToDelete(null);
  };

  const handleOpenConfirmModal = (item) => {
    setItemToDelete(item);
    setShowConfirmModal(true);
  };

  // Use effect para cargar los datos al iniciar la pagina
  useEffect(() => {
    loadUsers(dbServer);
  }, []);
  //funcion para colorear 
  const getCellContainer = (isHighlighted, content) => (
    <div
      style={{
        backgroundColor: isHighlighted ? "#d1e7ff" : "transparent",
        height: "100%",
        // Estos valores negativos rompen el padding default de la tabla para llenar la celda
        width: "calc(100% + 16px)", 
        marginLeft: "-8px",
        marginRight: "-8px",
        paddingLeft: "8px", // Recuperamos el padding visual para el texto
        display: "flex",
        alignItems: "center"
      }}
    >
      {content}
    </div>
  );
  //colomnas de la tabla con celda coloreada
  // Definición de columnas CON lógica de resaltado
  const columnsWithHighlight = React.useMemo(() => [
    { 
      Header: "User ID", 
      accessor: "USERID",
      Cell: ({ value, row }) => {
        const isSelected = selectedRow && row.original.USERID === selectedRow.USERID;
        return getCellContainer(isSelected, value);
      }
    },
    { 
      Header: "Nombre de Usuario", 
      accessor: "USERNAME",
      Cell: ({ value, row }) => {
        const isSelected = selectedRow && row.original.USERID === selectedRow.USERID;
        return getCellContainer(isSelected, value);
      }
    },
    { 
      Header: "Alias", 
      accessor: "ALIAS",
      Cell: ({ value, row }) => {
        const isSelected = selectedRow && row.original.USERID === selectedRow.USERID;
        return getCellContainer(isSelected, value);
      }
    },
    { 
      Header: "Correo Electrónico", 
      accessor: "EMAIL",
      Cell: ({ value, row }) => {
        const isSelected = selectedRow && row.original.USERID === selectedRow.USERID;
        return getCellContainer(isSelected, value);
      }
    },
    { 
      Header: "Número Telefónico", 
      accessor: "PHONENUMBER",
      Cell: ({ value, row }) => {
        const isSelected = selectedRow && row.original.USERID === selectedRow.USERID;
        return getCellContainer(isSelected, value);
      }
    },
    { 
      Header: "Extensión", 
      accessor: "EXTENSION",
      Cell: ({ value, row }) => {
        const isSelected = selectedRow && row.original.USERID === selectedRow.USERID;
        return getCellContainer(isSelected, value);
      }
    },
    {
      Header: "Activo", 
      accessor: "DETAIL_ROW.ACTIVED",
      Cell: ({ value, row }) => {
        const isSelected = selectedRow && row.original.USERID === selectedRow.USERID;
        const isActive = value;
        const statusClass = isActive ? styles.statusActive : styles.statusInactive;
        
        // Envolvemos tu badge original con el contenedor azul
        const badgeContent = (
          <div className={`${styles.statusBadge} ${statusClass}`}>
            <Icon name={isActive ? "accept" : "delete"} />
            <Text>{isActive ? "Activo" : "Borrado"}</Text>
          </div>
        );

        return getCellContainer(isSelected, badgeContent);
      }
    },
  ], [selectedRow]); // Se recalcula cuando cambia la fila seleccionada
  // -----------------------------------------------------------------------------
  return (
    <Page className={styles.pageContainer}>
      <Bar><Title className={styles.titlePageName}>Usuarios</Title></Bar>

      <AnalyticalTable
        data={filteredUsers}
        columns={columnsWithHighlight}
        selectionMode="SingleSelect"
        onRowSelect={handleRowSelect}
        filterable
        sortable
        loading={isLoading}
        visibleRows={12}
        noDataText="No se encontraron registros"
        header={
          <Toolbar className={styles.barTable}>
            <FlexBox className={styles.buttonGroupContainer}>
              <Input
                type="search"
                placeholder="Buscar..."
                className={styles.searchInput}
                icon='search'
                onInput={handleSearchInput} // <-- Actualizado para usar el nuevo handler
                value={searchText}
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
                disabled={!selectedRow}
              />
              <ToolbarButton
                icon='edit'
                design={isHoveredEdit ? "Attention" : "Transparent"}
                onMouseEnter={() => setisHoveredEdit(true)}
                onMouseLeave={() => setisHoveredEdit(false)}
                onClick={() => handleEditClick(selectedRow)}
                disabled={!selectedRow}
              />
              <ToolbarButton
                icon='delete'
                design={isHoveredDelete ? "Negative" : "Transparent"}
                onMouseEnter={() => setisHoveredDelete(true)}
                onMouseLeave={() => setisHoveredDelete(false)}
                onClick={() => handleOpenConfirmModal(selectedRow)}
                disabled={!selectedRow}
              />
            </FlexBox>

            <FlexBox alignItems="Center" style={{ marginLeft: '2.5rem' }}>
              <Label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Ver:</Label>
              <ComboBox
                onChange={handleStatusChange}
                // Mostramos el label que corresponde al ID guardado en el estado (o "Todos" por defecto)
                value={userOrderFields.find(f => f.id === statusFilter)?.label || "Todos"}
                style={{ width: '45%' }}
              >
                {userOrderFields.map((field) => (
                  <ComboBoxItem key={field.id} text={field.label} />
                ))}
              </ComboBox>
            </FlexBox>

            <ToolbarSpacer />
            <Title>Usuarios ({filteredUsers.length})</Title>
          </Toolbar>
        }
      />

      {/* Modales */}
      <ReusableModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        fields={userCreationFields}
        onSubmit={handleCreateUser}
        submitButtonText="Crear Usuario"
        existingUsers={allUsers}
      />

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
        initialData={editingUser}
      />

      <MessageBox
        open={showConfirmModal}
        titleText="Confirmar eliminación"
        actions={["Sí", "No"]}
        type="Warning"
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