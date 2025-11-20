import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DbContext } from '../contexts/dbContext';
import { fetchRolesData, createRole, updateRole, deleteRole } from '../services/rolesServices';
import { getUserByIdService, assignRoleService, unassignRoleService } from '../services/usersService.js';
import ReusableModal from '../components/modals/ReusableModal';
import { roleCreationFields, roleEditFields } from '../components/config/Roles-fieldConfigs';
import styles from '../styles/Users.module.css';
import {
  Page,
  Bar,
  Title,
  AnalyticalTable,
  Toolbar,
  Input,
  ToolbarSpacer,
  FlexBox,
  ToolbarButton,
  Button,
  MessageBox,
  Text
} from '@ui5/webcomponents-react';

export default function RolesAssign() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { dbServer } = useContext(DbContext);

  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]); // array of role objects
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modales para CRUD locales (sólo UI); para integración real, usar los endpoints adecuados
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rolesToDelete, setRolesToDelete] = useState([]);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const r = await fetchRolesData(dbServer);
        const list = r?.roles || [];
        setRoles(list);
        setFilteredRoles(list);

        if (userId) {
          const u = await getUserByIdService(userId, dbServer);
          setUser(u);
          // preselect roles that the user already has
          const userRoles = (u?.ROLES || []).map(rr => rr.ROLEID);
          setSelectedRoles(list.filter(l => userRoles.includes(l.ROLEID)));
        }
      } catch (err) {
        console.error('Error al cargar roles:', err);
        setError(err.message || 'Error cargando roles');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [dbServer, userId]);

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) return setFilteredRoles(roles);
    setFilteredRoles(roles.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q))));
  };

  // Normaliza un rol para asegurar que tenga ROLEID y ROLENAME
  const normalizeRole = (role) => ({
    ROLEID: role.ROLEID ?? role.id ?? '',
    ROLENAME: role.ROLENAME ?? role.name ?? '',
    DESCRIPTION: role.DESCRIPTION ?? role.description ?? '',
    ...role
  });

  const handleRowSelect = (event) => {
    const row = normalizeRole(event.detail.row.original);
    if (!row.ROLEID) {
      console.warn('Fila seleccionada sin ROLEID válido:', row);
      return;
    }
    const isSelected = event.detail.row.isSelected;
    setSelectedRoles(prev => {
      let updated;
      if (isSelected) {
        if (prev.find(p => p.ROLEID === row.ROLEID)) return prev;
        updated = [...prev, row];
      } else {
        updated = prev.filter(p => p.ROLEID !== row.ROLEID);
      }
      console.log('selectedRoles actualizado:', updated);
      return updated;
    });
  };

  const handleAssignRoles = async () => {
    if (!user) {
      setError('Usuario no cargado');
      return;
    }

    if (selectedRoles.length === 0) {
      setError('Selecciona al menos un rol para asignar');
      return;
    }

    setIsLoading(true);
    try {
      // Hacemos llamadas por cada rol (como en la versión Fiori)
      const promises = selectedRoles.map(r => assignRoleService(userId, r.ROLEID, dbServer));
      const results = await Promise.allSettled(promises);

      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        setError(`${failed.length} asignación(es) fallidas`);
      } else {
        // Si todo bien, volvemos al detalle del usuario
        navigate(`/users/detail/${userId}`);
      }
    } catch (err) {
      console.error('Error asignando roles:', err);
      setError(err.message || 'Error al asignar roles');
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD locales (actualizan el estado; si quieres integrarlo con la API, pásame los endpoints)
  const handleCreateRole = async (data) => {
    setIsLoading(true);
    try {
      const res = await createRole(data, dbServer);
      console.log('📦 createRole response:', res);
      // Normalizar el rol usando los campos enviados en el formulario (evita estructuras inesperadas de la API)
      const newRole = {
        ROLEID: data.ROLEID || data.ROLE || data.id || '',
        ROLENAME: data.ROLENAME || data.name || '',
        DESCRIPTION: data.DESCRIPTION || data.description || ''
      };
      setRoles(prev => [newRole, ...prev]);
      setFilteredRoles(prev => [newRole, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creando rol:', err);
      setError(err.message || 'Error creando rol');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = async (data) => {
    if (!editingRole) return;
    setIsLoading(true);
    try {
      const payload = { ...editingRole, ...data };
      console.log('📦 updateRole payload:', payload);
      const res = await updateRole(payload, dbServer);
      console.log('📦 updateRole response:', res);
      // Normalizamos el objeto actualizado con los datos del formulario
      const updated = {
        ROLEID: payload.ROLEID || editingRole.ROLEID,
        ROLENAME: payload.ROLENAME || payload.ROLENAME || editingRole.ROLENAME,
        DESCRIPTION: payload.DESCRIPTION || editingRole.DESCRIPTION || ''
      };
      setRoles(prev => prev.map(r => (r.ROLEID === updated.ROLEID ? { ...r, ...updated } : r)));
      setFilteredRoles(prev => prev.map(r => (r.ROLEID === updated.ROLEID ? { ...r, ...updated } : r)));
      setEditingRole(null);
      setShowEditModal(false);
    } catch (err) {
      console.error('Error editando rol:', err);
      setError(err.message || 'Error editando rol');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page className={styles.pageContainer}>
      <Bar>
        <Title>Asignar Roles</Title>
      </Bar>

      <AnalyticalTable
        data={filteredRoles}
        columns={[{ Header: 'ROLEID', accessor: 'ROLEID' }, { Header: 'ROLENAME', accessor: 'ROLENAME' }, { Header: 'DESCRIPTION', accessor: 'DESCRIPTION' }]}
        selectionMode="MultiSelect"
        onRowSelect={handleRowSelect}
        loading={isLoading}
        visibleRows={12}
        selectedRowIds={selectedRoles.reduce((acc, r) => {
          const idx = filteredRoles.findIndex(fr => fr.ROLEID === r.ROLEID);
          if (idx !== -1) acc[idx] = true;
          return acc;
        }, {})}
        header={
          <Toolbar className={styles.barTable}>
            <FlexBox className={styles.buttonGroupContainer}>
              <Input placeholder="Buscar..." icon="search" onInput={handleSearch} />
              <ToolbarButton icon="add" onClick={() => setShowCreateModal(true)} />
              <ToolbarButton icon="edit"
                onClick={() => {
                  if (selectedRoles.length === 1) {
                    console.log('Editando rol:', selectedRoles[0]);
                    setEditingRole(selectedRoles[0]);
                    setShowEditModal(true);
                  }
                }}
                disabled={selectedRoles.length !== 1}
              />
              <ToolbarButton icon="delete" onClick={() => {
                if (selectedRoles.length === 0) return;
                setRolesToDelete(selectedRoles);
                setShowDeleteConfirm(true);
              }} disabled={selectedRoles.length === 0} />
            </FlexBox>
            <ToolbarSpacer />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Text>Seleccionados: {selectedRoles.length}</Text>
              <Button design="Emphasized" onClick={handleAssignRoles}>Asignar roles</Button>
            </div>
          </Toolbar>
        }
      />

      <ReusableModal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Rol" fields={roleCreationFields} onSubmit={handleCreateRole} submitButtonText="Crear" />

      <ReusableModal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Rol" fields={roleEditFields} initialData={editingRole} onSubmit={handleEditRole} submitButtonText="Guardar" />

      <MessageBox
        open={showDeleteConfirm}
        titleText="Confirmar eliminación"
        type="Warning"
        actions={["Eliminar", "Cancelar"]}
        onClose={async (action) => {
          setShowDeleteConfirm(false);
          if (action !== 'Eliminar') {
            setRolesToDelete([]);
            return;
          }

          setIsLoading(true);
          try {
            const promises = rolesToDelete.map(r => deleteRole({ ROLEID: r.ROLEID }, dbServer));
            const results = await Promise.allSettled(promises);
            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
              setError(`${failed.length} eliminación(es) han fallado`);
            }
            const toDelete = new Set(rolesToDelete.map(r => r.ROLEID));
            setRoles(prev => prev.filter(r => !toDelete.has(r.ROLEID)));
            setFilteredRoles(prev => prev.filter(r => !toDelete.has(r.ROLEID)));
            setSelectedRoles([]);
          } catch (err) {
            console.error('Error eliminando roles:', err);
            setError(err.message || 'Error eliminando roles');
          } finally {
            setIsLoading(false);
            setRolesToDelete([]);
          }
        }}
      >
        ¿Desea eliminar los roles seleccionados?
      </MessageBox>

      {error && (
        <MessageBox open type="Error" onClose={() => setError(null)}>
          {error}
        </MessageBox>
      )}
    </Page>
  );
}
