// Roles.jsx
import React, { useState, useRef, useEffect } from 'react';
import AlertModal from '../components/modals/AlertModal';
import ReusableModal from '../components/modals/ReusableModal';
import styles from '../styles/Roles.module.css';
import Split from 'react-split';

import {
  Page,
  Bar,
  Title,
  AnalyticalTable,
  Toolbar,
  ToolbarSpacer,
  Input,
  FlexBox,
  ToolbarButton,
  Text,
  Label,
  Icon
} from '@ui5/webcomponents-react';

/* ---------------------------
  Datos y columnas
----------------------------*/
const initialRoles = [
  { ROLEID: "0001", ROL: "Docente" },
  { ROLEID: "0002", ROL: "Administrador" },
  { ROLEID: "0003", ROL: "Alumno" },
];

const roleColumns = [
  { Header: "ROLEID", accessor: "ROLEID" },
  { Header: "ROL", accessor: "ROL" },
];

const appColumns = [
  { Header: "APPID", accessor: "APPID" },
  { Header: "Aplicación", accessor: "Aplicacion" },
];

const appsByRole = {
  "0001": [
    { APPID: "101", Aplicacion: "App Docente A" },
    { APPID: "102", Aplicacion: "App Docente B" }
  ],
  "0002": [
    { APPID: "201", Aplicacion: "App Admin A" },
    { APPID: "202", Aplicacion: "App Admin B" }
  ],
  "0003": [
    { APPID: "301", Aplicacion: "App Alumno A" }
  ]
};
/* ---------------------------
  Splitter mejorado (oculta panel izquierdo o derecho)
----------------------------*/
function SplitterLayout({
  children,
  initialLeft = '30%',
  minLeft = '5%',
  maxLeft = '85%',
  hideThreshold = 5,
  height = '100%'
}) {
  const containerRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(initialLeft);
  const dragging = useRef(false);
  const splitterWidth = 8;
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const handleMouseDown = () => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    const min = parseFloat(minLeft);
    const max = parseFloat(maxLeft);
    if (newWidth < min) newWidth = min;
    if (newWidth > max) newWidth = max;
    setLeftWidth(`${newWidth}%`);

    setIsLeftCollapsed(newWidth <= hideThreshold);

    // Calcular ancho real del panel derecho
    const splitterPercent = (splitterWidth / rect.width) * 100;
    const rightWidthPercent = 100 - newWidth - splitterPercent;
    setIsRightCollapsed(rightWidthPercent <= hideThreshold);
  };

  const handleMouseUp = () => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const [left, right] = React.Children.toArray(children);

  return (
    <div
  ref={containerRef}
  style={{
    display: 'flex',
    width: '100%',
    height,
    overflow: 'hidden',
    position: 'relative', // <--- necesario para el indicador
  }}
>
  {/* Panel izquierdo */}
  <div
    style={{
      width: leftWidth,
      overflow: isLeftCollapsed ? 'hidden' : 'auto',
      opacity: isLeftCollapsed ? 0 : 1,
      pointerEvents: isLeftCollapsed ? 'none' : 'auto',
      transition: 'opacity 0.2s ease',
      position: 'relative',
    }}
  >
    {left}
  </div>

  {/* Indicador “Roles” */}
  {isLeftCollapsed && (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: `${splitterWidth / 5}px`,
      transform: 'translateY(-50%) rotate(-90deg)',
      fontWeight: 'bold',
      color: '#555',
      cursor: 'pointer',
      zIndex: 10,
      whiteSpace: 'nowrap',
      fontFamily: `'72', '72 Bold', Roboto, Arial, sans-serif`, // <-- aquí la fuente
      fontSize: '1.2em', // opcional, ajustar tamaño
    }}
  >
    Tabla Roles
  </div>
)}


  {/* Splitter */}
{/* Splitter con icono */}
<div
  className={styles.splitter}
  onMouseDown={handleMouseDown}
  style={{
    position: 'relative', // para poder posicionar el icono dentro
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  {/* Icono tipo UI5 */}
  <Icon
    name="resize-horizontal" 
    style={{
      fontSize: '1.5rem',
      color: '#ffffffff',
      cursor: 'col-resize', // mismo comportamiento que el splitter
      userSelect: 'none',
    }}
  />
</div>

  {/* Panel derecho */}
  <div
    style={{
      width: isRightCollapsed
        ? `${splitterWidth}px`
        : `calc(${100 - parseFloat(leftWidth)}% - ${splitterWidth}px)`,
      overflow: isRightCollapsed ? 'hidden' : 'auto',
      opacity: isRightCollapsed ? 0 : 1,
      pointerEvents: isRightCollapsed ? 'none' : 'auto',
      transition: 'opacity 0.2s ease, width 0.2s ease',
    }}
  >
    {right}
  </div>
</div>

  );
}


/* ---------------------------
  Componente principal
----------------------------*/
export default function Roles() {
  const [allRoles] = useState(initialRoles);
  const [filteredRoles, setFilteredRoles] = useState(initialRoles);
  const [selectedRow, setSelectedRow] = useState(null);
  const [filteredApps, setFilteredApps] = useState([]);

  const [isHoveredAdd, setHoveredAdd] = useState(false);
  const [isHoveredInfo, setHoveredInfo] = useState(false);
  const [isHoveredEdit, setHoveredEdit] = useState(false);
  const [isHoveredDelete, setHoveredDelete] = useState(false);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRoleDetails, setSelectedRoleDetails] = useState(null);

  // Búsqueda
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    if (query === '') {
      setFilteredRoles(allRoles);
      return;
    }
    const filtered = allRoles.filter(role =>
      Object.values(role).some(value => String(value).toLowerCase().includes(query))
    );
    setFilteredRoles(filtered);
  };

  // Selección de fila
  const handleRowClick = (event) => {
    const rowData = event.detail?.row?.original;
    if (rowData) {
      setSelectedRow(rowData);
      setFilteredApps(appsByRole[rowData.ROLEID] || []);
    }
  };

  return (
    <Page className={styles.pageContainer}>
      <Bar>
        <Title>Roles</Title>
      </Bar>

      <SplitterLayout
        initialLeft="30%"
        minLeft="5%"
        maxLeft="85%"
        hideThreshold={5}
        height="calc(100vh - 70px)"
      >

        {/* Panel izquierdo */}
        <div>
          <AnalyticalTable
            data={filteredRoles}
            columns={roleColumns}
            onRowClick={handleRowClick}
            visibleRows={10}
            header={
              <div>
                <Toolbar style={{ paddingBottom: 0, background: "none", boxShadow: "none" }}>
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className={styles.searchInput}
                    icon="search"
                    onInput={handleSearch}
                    style={{ width: "80%" }}
                  />
                </Toolbar>
                <Toolbar className={styles.barTable}>
                  <FlexBox className={styles.buttonGroupContainer}>
                    <ToolbarButton
                      icon="add"
                      design={isHoveredAdd ? "Positive" : "Transparent"}
                      onMouseEnter={() => setHoveredAdd(true)}
                      onMouseLeave={() => setHoveredAdd(false)}
                      onClick={() => setShowCreateModal(true)}
                    />
                    <ToolbarButton
                      icon="hint"
                      design={isHoveredInfo ? "Emphasized" : "Transparent"}
                      onMouseEnter={() => setHoveredInfo(true)}
                      onMouseLeave={() => setHoveredInfo(false)}
                      disabled={!selectedRow}
                      onClick={() => {
                        setSelectedRoleDetails(selectedRow);
                        setIsDetailModalOpen(true);
                      }}
                    />
                    <ToolbarButton
                      icon="edit"
                      design={isHoveredEdit ? "Attention" : "Transparent"}
                      onMouseEnter={() => setHoveredEdit(true)}
                      onMouseLeave={() => setHoveredEdit(false)}
                      disabled={!selectedRow}
                      onClick={() => {
                        setEditingRole(selectedRow);
                        setShowEditModal(true);
                      }}
                    />
                    <ToolbarButton
                      icon="delete"
                      design={isHoveredDelete ? "Negative" : "Transparent"}
                      onMouseEnter={() => setHoveredDelete(true)}
                      onMouseLeave={() => setHoveredDelete(false)}
                      disabled={!selectedRow}
                      onClick={() => {
                        setItemToDelete(selectedRow);
                        setShowConfirmModal(true);
                      }}
                    />
                  </FlexBox>
                </Toolbar>
              </div>
            }
          />
        </div>

        {/* Panel derecho */}
        <div style={{ background: "#f5f5f5", padding: "1em" }}>
          <Title style={{ fontWeight: 700, fontSize: "1.8em" }}>Aplicaciones</Title>
          <Toolbar style={{ background: "none", boxShadow: "none", justifyContent: "flex-end" }}>
            <ToolbarSpacer />
            <ToolbarButton icon="add" />
            <ToolbarButton icon="edit" />
            <ToolbarButton icon="delete" />
          </Toolbar>
          <AnalyticalTable
            data={filteredApps}
            columns={appColumns}
            selectionMode="SingleSelect"
            visibleRows={10}
            style={{
              background: "#345b77",
              borderRadius: "0.4em",
              marginTop: "0.5em",
            }}
            header={null}
          />
        </div>
      </SplitterLayout>

      {/* Modales */}
      {showConfirmModal && (
        <AlertModal
          open={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar eliminación"
          buttonText="Cerrar"
          message={<Text>¿Está seguro de eliminar el rol seleccionado?</Text>}
        />
      )}
      {showCreateModal && (
        <ReusableModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear nuevo rol"
          fields={[]}
          onSubmit={() => setShowCreateModal(false)}
          submitButtonText="Crear"
        />
      )}
      {showEditModal && (
        <ReusableModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Editar rol"
          fields={[]}
          initialData={editingRole}
          onSubmit={() => setShowEditModal(false)}
          submitButtonText="Guardar"
        />
      )}
      {selectedRoleDetails && (
        <AlertModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detalles del Rol"
          buttonText="Cerrar"
          message={
            <FlexBox direction="Column" className={styles.AlertContent}>
              <FlexBox className={styles.AlertRow}>
                <Label>ID Rol:</Label>
                <Text>{selectedRoleDetails.ROLEID}</Text>
              </FlexBox>
              <FlexBox className={styles.AlertRow}>
                <Label>Nombre del Rol:</Label>
                <Text>{selectedRoleDetails.ROL}</Text>
              </FlexBox>
            </FlexBox>
          }
        />
      )}
    </Page>
  );
}
