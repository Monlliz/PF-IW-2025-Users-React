import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DbContext } from "../contexts/dbContext";
import { getUserByIdService, unassignRoleService } from '../services/usersService.js';
import {
  Page,
  Bar,
  Title,
  Label,
  Text,
  FlexBox,
  Card,
  CardHeader,
  Button,
  BusyIndicator,
  MessageBox,
  Icon
} from '@ui5/webcomponents-react';
import styles from '../styles/Users.module.css'; // Reusamos los estilos o crea uno nuevo

export default function UserDetail() {
  const { id } = useParams(); // Obtiene el ID de la URL
  const navigate = useNavigate();
  const { dbServer } = useContext(DbContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Llamamos al servicio nuevo
        const userData = await getUserByIdService(id, dbServer);
        setUser(userData);
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setError(err.message || "No se pudo cargar la información del usuario");
      } finally {
        setLoading(false);
      }
    };

    if (id && dbServer) {
      fetchUser();
    }
  }, [id, dbServer]);

  const handleBack = () => {
    navigate(-1); // Regresa a la página anterior
  };

  // Estado y lógica para eliminar roles asignados al usuario (con confirmación)
  const [showConfirmRoleDelete, setShowConfirmRoleDelete] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState(null);

  const openRoleDeleteConfirm = (rol) => {
    setRoleToRemove(rol);
    setShowConfirmRoleDelete(true);
  };

  const handleRoleDelete = async (action) => {
    setShowConfirmRoleDelete(false);
    if (action !== 'Eliminar' || !roleToRemove) {
      setRoleToRemove(null);
      return;
    }

    setLoading(true);
    try {
      // Llamamos al endpoint específico para desasignar rol si existe
      const roleId = roleToRemove?.ROLEID || roleToRemove;
      await unassignRoleService(user.USERID, roleId, dbServer);

      // Actualizamos el estado local para reflejar el cambio
      const updatedRoles = (user.ROLES || []).filter(r => r.ROLEID !== roleId && r !== roleId);
      setUser(prev => ({ ...prev, ROLES: updatedRoles }));
    } catch (err) {
      console.error('Error al eliminar rol del usuario:', err);
      setError(err.message || 'Error al eliminar el rol');
    } finally {
      setLoading(false);
      setRoleToRemove(null);
    }
  };

  // Estilo para las filas de datos
  const rowStyle = {
    marginBottom: '1rem',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '0.5rem'
  };

  const labelStyle = {
    fontWeight: 'bold',
    width: '200px',
    minWidth: '150px'
  };

  return (
    <Page
      className={styles.pageContainer}
      header={
        <Bar
          startContent={
            <Button icon="nav-back" onClick={handleBack} design="Transparent" title="Regresar" />
          }
        >
          <Title>Detalle del Usuario</Title>
        </Bar>
      }
    >
      {loading ? (
        <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '100%' }}>
          <BusyIndicator active size="Large" />
        </FlexBox>
      ) : error ? (
        <MessageBox open type="Error" onClose={handleBack}>
          {error}
        </MessageBox>
      ) : user ? (
        <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
          <Card
            header={
              <CardHeader
                titleText={user.USERNAME || "Usuario sin nombre"}
                subtitleText={`ID: ${user.USERID}`}
                avatar={<Icon name="employee" />}
              />
            }
            style={{ width: '100%', maxWidth: '800px' }}
          >
            <div style={{ padding: '2rem' }}>
              
              {/* ID DE USUARIO */}
              <FlexBox style={rowStyle}>
                <Label style={labelStyle}>User ID:</Label>
                <Text>{user.USERID}</Text>
              </FlexBox>

              {/* NOMBRE */}
              <FlexBox style={rowStyle}>
                <Label style={labelStyle}>Nombre de Usuario:</Label>
                <Text>{user.USERNAME}</Text>
              </FlexBox>

              {/* ALIAS */}
              <FlexBox style={rowStyle}>
                <Label style={labelStyle}>Alias:</Label>
                <Text>{user.ALIAS || '-'}</Text>
              </FlexBox>

              {/* CORREO */}
              <FlexBox style={rowStyle}>
                <Label style={labelStyle}>Correo Electrónico:</Label>
                <Text>{user.EMAIL || '-'}</Text>
              </FlexBox>

              {/* TELEFONO */}
              <FlexBox style={rowStyle}>
                <Label style={labelStyle}>Teléfono:</Label>
                <Text>{user.PHONENUMBER || '-'}</Text>
              </FlexBox>

              {/* EMPRESA */}
              <FlexBox style={rowStyle}>
                <Label style={labelStyle}>ID de Empresa (Company):</Label>
                <Text>{user.COMPANYID || '-'}</Text>
              </FlexBox>

              {/* FECHA DE CUMPLEAÑOS */}
              <FlexBox style={rowStyle}>
                <Label style={labelStyle}>Fecha de Cumpleaños:</Label>
                <Text>{user.BIRTHDATE ? new Date(user.BIRTHDATE).toLocaleDateString() : '-'}</Text>
                </FlexBox>

              {/* ROLES (Es un array en tu modelo) */}
              <FlexBox style={{ ...rowStyle, borderBottom: 'none' }}>
                <Label style={labelStyle}>Roles Asignados:</Label>
                <FlexBox direction="Column" style={{ gap: '6px' }}>
                  <FlexBox>
                    <Button
                      design="Emphasized"
                      icon="add"
                      onClick={() => navigate(`/roles/assign/${user.USERID}`)}
                    >Asignar un rol</Button>
                  </FlexBox>

                  {user.ROLES && user.ROLES.length > 0 ? (
                    user.ROLES.map((rol, index) => (
                      <FlexBox key={index} style={{ alignItems: 'center', gap: '0.5rem' }}>
                        <Text>• {rol.ROLEID}</Text>
                        <Button
                          icon="delete"
                          design="Transparent"
                          title="Eliminar rol"
                          onClick={() => openRoleDeleteConfirm(rol)}
                        />
                      </FlexBox>
                    ))
                  ) : (
                    <Text>Sin roles asignados</Text>
                  )}
                </FlexBox>
              </FlexBox>

            </div>
          </Card>
        </FlexBox>
      ) : (
        <FlexBox justifyContent="Center">
          <Text>No se encontró el usuario.</Text>
        </FlexBox>
      )}
      <MessageBox
        open={showConfirmRoleDelete}
        titleText="Eliminar rol"
        actions={["Eliminar", "Cancelar"]}
        type="Warning"
        onClose={handleRoleDelete}
      >
        ¿Desea eliminar este rol del usuario?
      </MessageBox>
    </Page>
  );
}