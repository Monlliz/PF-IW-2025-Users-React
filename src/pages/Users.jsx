import styles from '../styles/Users.module.css';
import ReusableModal from '../components/modals/ReusableModal';
import { userEditFields, userCreationFields } from '../components/config/Users-fieldConfigs';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersAllService, createUserService, updateUserService, deleteUserService } from '../services/usersService.js';
import { DbContext } from "../contexts/dbContext";
import { formatearFecha } from '../utils/formatos.js'
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
  Icon
} from '@ui5/webcomponents-react';


// Columnas de la tabla
const userColumns = [
  { Header: "User ID", accessor: "USERID" },
  { Header: "Nombre de Usuario", accessor: "USERNAME" },
  { Header: "Alias", accessor: "ALIAS" },
  { Header: "Correo Electrónico", accessor: "EMAIL" },
  { Header: "Número Telefónico", accessor: "PHONENUMBER" },
  { Header: "Extensión", accessor: "EXTENSION" },
  { Header: "ID de Compañía", accessor: "COMPANYID" },
  { Header: "ID de CEDI", accessor: "CEDIID" },
  { Header: "ID de Empleado", accessor: "EMPLOYEEID" },
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
  // Base de datos
  const { dbServer } = useContext(DbContext);
  const navigate = useNavigate(); // <--- Inicializamos la navegación

  // Cargar datos de usuarios desde el servicio
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controlar el "hover" de los botones
  const [isHoveredDelete, setisHoveredDelete] = useState(false);
  const [isHoveredAdd, setisHoveredAdd] = useState(false);
  const [isHoveredInfo, setisHoveredInfo] = useState(false);
  const [isHoveredEdit, setisHoveredEdit] = useState(false);

  // Funcionamiento de la barra de busqueda
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  /**
   * Carga la lista inicial de usuarios desde el backend.
   */
  const loadUsers = async (dbServer) => {
    setIsLoading(true);
    setError(null);
    try {
      const usersFromDB = await getUsersAllService(dbServer);
      setAllUsers(usersFromDB);
      setFilteredUsers(usersFromDB);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError(`Error al cargar la lista: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtro de la barra
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    if (query === '') {
      setFilteredUsers(allUsers);
      return;
    }
    const filtered = allUsers.filter((user) => {
      return Object.values(user).some((value) =>
        String(value).toLowerCase().includes(query)
      );
    });
    setFilteredUsers(filtered);
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
      const { ACTIVED, DELETED, ...rest } = userData;
      // Aquí puedes reconstruir DETAIL_ROW si tu backend lo requiere específicamente
      // o enviar 'rest' si tu backend lo arma solo.
      const newUserInput = {
        ...rest,
        // DETAIL_ROW: { ACTIVED: !!ACTIVED, DELETED: !!DELETED, DETAIL_ROW_REG: [] } // Descomenta si es necesario
      };

      console.log('Objeto final enviado a la API:', newUserInput);

      const updatedUserList = await createUserService(newUserInput, dbServer);

      if (!updatedUserList || typeof updatedUserList !== 'object') {
        throw new Error("La API no devolvió el objeto de usuario creado.");
      }

      setAllUsers(prevUsers => [...prevUsers, updatedUserList]);
      setFilteredUsers(prevUsers => [...prevUsers, updatedUserList]);
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

      const finalUserData = { ...payload };
      const updatedUserFromDB = await updateUserService(finalUserData, dbServer);

      if (!updatedUserFromDB || typeof updatedUserFromDB !== 'object') {
        throw new Error("La API no devolvió el objeto de usuario actualizado.");
      }

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
  // CAMBIO PRINCIPAL: Usamos navegación en lugar de Modal
  const handleShowDetails = (userData) => {
    if (userData && userData.USERID) {
      // Pasamos el objeto 'user' en el state para que la carga sea instantánea
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
        setFilteredUsers(prevUsers => prevUsers.filter(user => user.USERID !== userIdToDelete));
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

  // -----------------------------------------------------------------------------
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
        visibleRows={14}
        noDataText="No se encontraron registros"
        header={
          <Toolbar className={styles.barTable}>
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
              {/* Botón de Detalles -> Ahora Navega */}
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