// Roles.jsx

import React, { useState, useRef, useEffect, useContext } from 'react';
import AlertModal from '../components/modals/AlertModal';
import ReusableModal from '../components/modals/ReusableModal';
import styles from '../styles/Roles.module.css';
import { 
  fetchRolesData, 
  addProcessToRole, 
  addPrivilegeToProcess, 
  deleteHardProcessFromRole, 
  deletePrivilegeFromProcess 
} from "../services/rolesServices";

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
  Icon,
  Select,
  Option,
  CheckBox
} from "@ui5/webcomponents-react";

import { DbContext } from "../contexts/dbContext";

const rolesData = [
  { ROLEID: "0001", ROLENAME: "Docente" },
  { ROLEID: "0002", ROLENAME: "Administrador" },
  { ROLEID: "0003", ROLENAME: "Alumno" },
];

const roleColumns = [
  { Header: "ROLEID", accessor: "ROLEID" },
  { Header: "ROLENAME", accessor: "ROLENAME" },
];

const appColumns = [
  { Header: "APPID", accessor: "APPID" },
  { Header: "NAMEAPP", accessor: "NAMEAPP" },
];

const applicationsByRol  = {
  "0001": [
    { APPID: "101", NAMEAPP: "App Docente A" },
    { APPID: "102", NAMEAPP: "App Docente B" }
  ],
  "0002": [
    { APPID: "201", NAMEAPP: "App Admin A" },
    { APPID: "202", NAMEAPP: "App Admin B" }
  ],
  "0003": [
    { APPID: "301", NAMEAPP: "App Alumno A" }
  ]
};

function SplitterLayout({
  children,
  initialLeft = '30%',
  minLeft = '20%',
  maxLeft = '75%',
  hideThreshold = 10,
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
        position: 'relative',
      }}
    >
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
          fontFamily: `'72', '72 Bold', Roboto, Arial, sans-serif`,
          fontSize: '1.2em',
        }}
      >
        Tabla Roles
      </div>
      )}
      <div
        className={styles.splitter}
        onMouseDown={handleMouseDown}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          name="resize-horizontal" 
          style={{
            fontSize: '1.5rem',
            color: '#ffffffff',
            cursor: 'col-resize',
            userSelect: 'none',
          }}
        />
      </div>
      <div
        style={{
          width: isRightCollapsed
            ? `${splitterWidth}px`
            : `calc(${100 - parseFloat(leftWidth)}% - ${splitterWidth}px)`,
          overflow: isRightCollapsed ? 'hidden' : 'auto',
          opacity: isRightCollapsed ? 0 : 1,
          pointerEvents: isRightCollapsed ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}
      >
        {right}
      </div>
    </div>
  );
}

export default function Roles() {
  const [roles, setRoles] = useState(rolesData);
  const [filteredRoles, setFilteredRoles] = useState(rolesData);
  const [selectedRol, setSelectedRol] = useState(null);
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedAplicacion, setSelectedAplicacion] = useState(null);

  const [appsByRol, setAppsByRol] = useState(applicationsByRol);

  const {dbServer} = useContext(DbContext);
  const apiRoute = `http://localhost:3333/api/roles/crud?ProcessType=getAll&DBServer=${dbServer}&LoggedUser=AGUIZARE`;
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [isHoveredAddRol, setHoveredAddRol] = useState(false);
  const [isHoveredInfoRol, setHoveredInfoRol] = useState(false);
  const [isHoveredEditRol, setHoveredEditRol] = useState(false);
  const [isHoveredDeleteRol, setHoveredDeleteRol] = useState(false);
  const [showEditRol, setShowEditRol] = useState(false);
  const [showConfirmRol, setShowConfirmRol] = useState(false);
  const [isRolDetailModalOpen, setIsRolDetailModalOpen] = useState(false);
  const [selectedRolDetails, setSelectedRolDetails] = useState(null);
  const [editingRol, setEditingRol] = useState(null);
  const [itemToDeleteRol, setItemToDeleteRol] = useState(null);

  const [isHoveredAddAplicacion, setHoveredAddAplicacion] = useState(false);
  const [isHoveredInfoAplicacion, setHoveredInfoAplicacion] = useState(false);
  const [isHoveredEditAplicacion, setHoveredEditAplicacion] = useState(false);
  const [isHoveredDeleteAplicacion, setHoveredDeleteAplicacion] = useState(false);
  const [showCreateAplicacionModal, setShowCreateAplicacionModal] = useState(false);
  const [showEditAplicacion, setShowEditAplicacion] = useState(false);
  const [showConfirmAplicacion, setShowConfirmAplicacion] = useState(false);
  const [isAplicacionDetailModalOpen, setIsAplicacionDetailModalOpen] = useState(false);
  const [selectedAplicacionDetails, setSelectedAplicacionDetails] = useState(null);
  const [editingAplicacion, setEditingAplicacion] = useState(null);
  const [itemToDeleteAplicacion, setItemToDeleteAplicacion] = useState(null);

  //Usa estados para controlar el tipo de filtro y orden:
  const [viewFilterType, setViewFilterType] = useState('all'); // filtro activo, asignado, etc.
  const [viewSortType, setViewSortType] = useState('name');   // orden por nombre, asignados primero, etc.

  const [roleFilterType, setRoleFilterType] = useState('all'); // 'all' o 'assigned' o similar
  const [roleSortType, setRoleSortType] = useState('name'); // 'name' o 'assigned-first'

  const [appFilterType, setAppFilterType] = useState('all');
  const [appSortType, setAppSortType] = useState('name');

  //Define un estado en React que mantenga qué aplicaciones están asignadas.
  const [checkedApps, setCheckedApps] = useState({});

  const [modalType, setModalType] = useState(null); 
  const [modalContext, setModalContext] = useState(null); 
  const [modalData, setModalData] = useState(null);

  const closeModal = () => {
    setModalType(null);
    setModalContext(null);
    setModalData(null);
  };

  const fetchAllData = async () => {
    console.log("Servidor:", dbServer);
    setLoadingData(true);
    setLoadError(null);
    try {
      const res = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("Respuesta de API (Roles.jsx):", data);

      const payload = data?.data?.[0]?.dataRes || data?.data?.[0] || data?.data || {};
      console.log("Payload extraído:", payload);

      const rolesArray = Array.isArray(payload) ? payload : [payload];

      const loadedRoles = rolesArray.map((r) => ({
        ROLEID: r.ROLEID,
        ROLENAME: r.ROLENAME || "Sin NOMBRE",
        DESCRIPTION: r.DESCRIPTION || "",
        ACTIVED: r.ACTIVED,
      }));

      const builtAppsMap = {};
      rolesArray.forEach((r) => {
        builtAppsMap[r.ROLEID] = (r.PROCESS || []).map((p) => ({
          APPID: p.PROCESSID,
          NAMEAPP: p.NAMEAPP || "Sin nombre",
          DESCRIPTION: p.DESCRIPTION || "",
        }));
      });

      setRoles(loadedRoles);
      setFilteredRoles(loadedRoles);
      setAppsByRol(builtAppsMap);

    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
      setLoadError(err.message || String(err));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  
  const handleAppCheckBoxChange = async (appId, isChecked) => {
    if (!selectedRol?.ROLEID) {
    console.warn("⚠️ No hay rol seleccionado, no se puede asignar/desasignar aplicación");
    return;
  }

  console.log(`🟢 Checkbox ${isChecked ? "marcado" : "desmarcado"} para AppID: ${appId}, Rol: ${selectedRol.ROLEID}`);

  setCheckedApps((prev) => ({
    ...prev,
    [appId]: isChecked,
  }));

  try {
    const body = {
      ROLEID: selectedRol.ROLEID,
      PROCESS: [{ PROCESSID: appId }]   // ✅ Cambiado PROCESSID → APPID
    };

    console.log("📦 Enviando body a API:", body);

    if (isChecked) {
      const response = await addProcessToRole(body, "addProcessRol", dbServer);
      console.log("✅ addProcessToRole ejecutado:", response);
    } else {
      const response = await deleteHardProcessFromRole(body, "removeProcess", dbServer);
      console.log("🗑️ deleteHardProcessFromRole ejecutado:", response);
    }

    const verifyRes = await fetch(
      `http://localhost:3333/api/roles/crud?ProcessType=getByRole&ROLEID=${selectedRol.ROLEID}&DBServer=${dbServer}&LoggedUser=AGUIZARE`
    );
    const verifyData = await verifyRes.json();
    console.log("📦 Datos actualizados desde BD:", verifyData);
  } catch (error) {
    console.error("❌ Error al actualizar la relación rol-aplicación:", error);
  }

    // 🔹 Actualiza también el estado local (UI)
    setAppsByRol((prev) => {
      const currentApps = prev[selectedRol.ROLEID] || [];

      if (isChecked) {
        const appToAdd = filteredApps.find((a) => a.APPID === appId);
        const exists = currentApps.some((a) => a.APPID === appId);
        return {
          ...prev,
          [selectedRol.ROLEID]: exists ? currentApps : [...currentApps, appToAdd],
        };
      } else {
        return {
          ...prev,
          [selectedRol.ROLEID]: currentApps.filter((a) => a.APPID !== appId),
        };
      }
    });
  };


  const handleSearch = (event, data, setFiltered) => {
    const q = event.target.value.toLowerCase();
    if (!q) return setFiltered(data);
    const f = data.filter(d =>
      Object.values(d).some(v => String(v).toLowerCase().includes(q))
    );
    setFiltered(f);
  };

  const handleRolSelect = (e) => {
    const row = e.detail.row.original;
    const rolKey = row?.ROLEID;
    setSelectedRol({ ...row, ROLEID: rolKey });
    setFilteredApps(appsByRol[row?.ROLEID] || []);

    // Actualiza los checkboxes al seleccionar un nuevo rol
    const assignedApps = appsByRol[row?.ROLEID] || [];
    const newChecked = {};
    assignedApps.forEach((app) => {
      newChecked[app.APPID] = true;
    });
    setCheckedApps(newChecked);

  };

  const handleAplicacionSelect = (e) => {
    const row = e.detail?.row?.original;
    if (row) setSelectedAplicacion(row);
  };

  const handleCreateAplicacion = (appData) => {
  // Ejemplo simple para agregar una nueva aplicación a filteredApps y appsByRol
  const newAppId = Date.now().toString();
  const newApp = { ...appData, APPID: newAppId };

  setFilteredApps(prev => [newApp, ...prev]);

  // Actualiza appsByRol para el rol seleccionado
  setAppsByRol(prev => ({
    ...prev,
    [selectedRol.ROLEID]: [newApp, ...(prev[selectedRol.ROLEID] || [])]
  }));

  setShowCreateAplicacionModal(false);
};

const handleEditAplicacion = (updatedAppData) => {
  if (!editingAplicacion) return;

  const appIdToUpdate = editingAplicacion.APPID;

  setFilteredApps(prev =>
    prev.map(app => (app.APPID === appIdToUpdate ? { ...app, ...updatedAppData } : app))
  );

  setAppsByRol(prev => {
    const updatedRolApps = (prev[selectedRol.ROLEID] || []).map(app =>
      app.APPID === appIdToUpdate ? { ...app, ...updatedAppData } : app
    );
    return { ...prev, [selectedRol.ROLEID]: updatedRolApps };
  });

  setShowEditAplicacionModal(false);
  setEditingAplicacion(null);
};

const handleEditAplicacionClick = (appToEdit) => {
  if (!appToEdit) return;
  setEditingAplicacion(appToEdit);
  setShowEditAplicacionModal(true);
};


const applyRoleFiltersAndSort = () => {
  let result = [...roles];
  if (roleFilterType === 'assigned') {
    // Aplicar filtro de asignados (definir condición real)
    result = result.filter(r => true); // modificar según lógica real
  }
  if (roleSortType === 'assigned-first') {
    // Ordenar 'asignados primero' (definir lógica)
    result.sort((a,b) => 0); // modificar según lógica real
  } else if (roleSortType === 'name') {
    result.sort((a,b) => {
      const nameA = a.ROLENAME || "";
      const nameB = b.ROLENAME || "";
      return nameA.localeCompare(nameB);
    });
  }
  setFilteredRoles(result);
};

const applyAppFiltersAndSort = () => {
  let result = [...(appsByRol[selectedRol?.ROLEID] || [])];

  if (appFilterType === 'assigned') {
    result = result.filter(app => /* condición real */ true);
  }
  if (appSortType === 'assigned-first') {
    result.sort((a, b) => 0); // lógica real
  } else if (appSortType === 'name') {
    result.sort((a, b) => a.NAMEAPP.localeCompare(b.NAMEAPP));
  }

  // Evita actualizar si el resultado no cambia
  setFilteredApps(prev =>
    JSON.stringify(prev) !== JSON.stringify(result) ? result : prev
  );
};

useEffect(() => {
  applyRoleFiltersAndSort();
}, [roles, roleFilterType, roleSortType]);

useEffect(() => {
  applyAppFiltersAndSort();
}, [filteredApps, appFilterType, appSortType]);

  return (
    <Page className={styles.pageContainer}>
      <Bar>
        <Title>Gestor de Roles y sus Aplicaciones</Title>
      </Bar>

      <SplitterLayout
        initialLeft="30%"
        minLeft="5%"
        maxLeft="85%"
        hideThreshold={5}
        height="calc(100vh - 70px)"
      >
        <div style={{ background: "#f5f5f5", padding: "1em" }}>
            <Title style={{ fontWeight: 700, fontSize: "1.8em" }}>Roles</Title>

      <FlexBox
        direction="Column"
        style={{
          width: "100%",
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        {/* 🔍 Barra de búsqueda responsiva */}
        <FlexBox
          direction="Row"
          justifyContent="Center"
          wrap="Wrap"
          style={{ width: "100%", gap: "5.75rem" }}
        >
          <Input
            icon="search"
            placeholder="Buscar rol..."
            onInput={(e) => handleSearch(e, roles, setFilteredRoles)}
            style={{
              flex: "1 1 300px", // se adapta con tamaño mínimo
              maxWidth: "600px",
              minWidth: "30px",
            }}
          />
        </FlexBox>

        {/* 🎛️ Controles de filtro y orden responsivos */}
        <FlexBox
          direction="Row"
          wrap="Wrap"
          justifyContent="SpaceBetween"
          alignItems="Center"
          style={{ width: "100%", gap: "0.75rem" }}
        >
          <FlexBox
            direction="Row"
            alignItems="Center"
            style={{
              gap: "0.5rem",
              minWidth: "20px",
              flex: "1 1 220px",
            }}
          >
            <Label>Filtrar por:</Label>
            <Select
              value={roleFilterType}
              onChange={(e) => setRoleFilterType(e.detail.selectedOption.dataset.id)}
              style={{ width: "100%" }}
            >
              <Option data-id="all">Todos los roles</Option>
              <Option data-id="assigned">Solo roles asignados</Option>
            </Select>
          </FlexBox>

          <FlexBox
            direction="Row"
            alignItems="Center"
            style={{
              gap: "0.5rem",
              minWidth: "20px",
              flex: "1 1 220px",
            }}
          >
            <Label>Ordenar por:</Label>
            <Select
              value={roleSortType}
              onChange={(e) => setRoleSortType(e.detail.selectedOption.dataset.id)}
              style={{ width: "100%" }}
            >
              <Option data-id="name">Por nombre</Option>
              <Option data-id="assigned-first">Asignados primero</Option>
            </Select>
          </FlexBox>
        </FlexBox>
      </FlexBox>


          <Toolbar className={styles.barTable}>
            <FlexBox className={styles.buttonGroupContainer}>
              <ToolbarButton
                icon="add"
                design={isHoveredAddRol ? "Positive" : "Transparent"}
                onMouseEnter={() => setHoveredAddRol(true)}
                onMouseLeave={() => setHoveredAddRol(false)}
                onClick={() => { setModalType('create'); setModalContext('rol'); }}
              />
              <ToolbarButton
                icon="hint"
                design={isHoveredInfoRol ? "Emphasized" : "Transparent"}
                onMouseEnter={() => setHoveredInfoRol(true)}
                onMouseLeave={() => setHoveredInfoRol(false)}
                disabled={!selectedRol}
                onClick={() => { setSelectedRolDetails(selectedRol); setIsRolDetailModalOpen(true); }}
              />
              <ToolbarButton
                icon="edit"
                design={isHoveredEditRol ? "Attention" : "Transparent"}
                onMouseEnter={() => setHoveredEditRol(true)}
                onMouseLeave={() => setHoveredEditRol(false)}
                disabled={!selectedRol}
                onClick={() => { setEditingRol(selectedRol); setShowEditRol(true); console.log('Edit modal should open', selectedRol);}}
              />
              <ToolbarButton
                icon="delete"
                design={isHoveredDeleteRol ? "Negative" : "Transparent"}
                onMouseEnter={() => setHoveredDeleteRol(true)}
                onMouseLeave={() => setHoveredDeleteRol(false)}
                disabled={!selectedRol}
                onClick={() => { setItemToDeleteRol(selectedRol); setShowConfirmRol(true); }}
              />
            </FlexBox>
          </Toolbar>

          <AnalyticalTable
            data={filteredRoles}
            columns={[
              {
                Header: "Asignado",
                accessor: "asignado",
                Cell: (row) => (
                  <CheckBox
                    // checked={checkedApps[row.row.original.APPID] || false}
                    // onChange={(e) =>
                    //   handleAppCheckBoxChange(row.row.original.APPID, e.target.checked)
                    // }
                  />
                )
              },  
              { Header: "ROLEID", accessor: "ROLEID" },
              { Header: "ROLENAME", accessor: "ROLENAME" }
            ]}
            onRowClick={handleRolSelect}
            visibleRows={10}
          />

        </div>

        <div style={{ background: "#f5f5f5", padding: "1em" }}>
          <Title style={{ fontWeight: 700, fontSize: "1.8em" }}>Aplicaciones</Title>

      <FlexBox
        direction="Column"
        style={{
          width: "100%",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* 🔍 Barra de búsqueda responsiva */}
        <FlexBox
          direction="Row"
          justifyContent="Center"
          wrap="Wrap"
          style={{ width: "100%", gap: "0.75rem" }}
        >
          <Input
            icon="search"
            placeholder="Buscar aplicación..."
            onInput={(e) => handleSearch(e, appsByRol[selectedRol?.ROLEID] || [], setFilteredApps)}
            style={{
              flex: "1 1 300px", // tamaño mínimo adaptable
              maxWidth: "600px",
              minWidth: "220px",
            }}
            disabled={!selectedRol}
          />
        </FlexBox>

        {/* 🎛️ Controles de filtro y orden responsivos */}
        <FlexBox
          direction="Row"
          wrap="Wrap"
          justifyContent="SpaceBetween"
          alignItems="Center"
          style={{ width: "100%", gap: "0.75rem", opacity: selectedRol ? 1 : 0.5, 
                    pointerEvents: selectedRol ? 'auto' : 'none' }}
        >
          {/* Filtro */}
          <FlexBox
            direction="Row"
            alignItems="Center"
            style={{
              gap: "0.5rem",
              minWidth: "220px",
              flex: "1 1 220px",
            }}
          >
            <Label>Filtrar por:</Label>
            <Select
              value={appFilterType}
              onChange={(e) =>
                setAppFilterType(e.detail.selectedOption.dataset.id)
              }
              style={{ width: "100%" }}
              disabled={!selectedRol}
            >
              <Option data-id="all">Todas las aplicaciones</Option>
              <Option data-id="assigned">Solo aplicaciones asignadas</Option>
            </Select>
          </FlexBox>

          {/* Orden */}
          <FlexBox
            direction="Row"
            alignItems="Center"
            style={{
              gap: "0.5rem",
              minWidth: "220px",
              flex: "1 1 220px",
            }}
          >
            <Label>Ordenar por:</Label>
            <Select
              value={appSortType}
              onChange={(e) =>
                setAppSortType(e.detail.selectedOption.dataset.id)
              }
              style={{ width: "100%" }}
            >
              <Option data-id="name">Por nombre</Option>
              <Option data-id="assigned-first">Asignadas primero</Option>
            </Select>
          </FlexBox>
        </FlexBox>
      </FlexBox>

          <Toolbar  className={styles.barTable}>
            <FlexBox className={styles.buttonGroupContainer}>
              <ToolbarButton
                icon="add"
                design={isHoveredAddAplicacion ? "Positive" : "Transparent"}
                onMouseEnter={() => setHoveredAddAplicacion(true)}
                onMouseLeave={() => setHoveredAddAplicacion(false)}
                disabled={!selectedRol}
                onClick={() => setShowCreateAplicacionModal(true)}
              />
              <ToolbarButton
                icon="hint"
                design={isHoveredInfoAplicacion ? "Emphasized" : "Transparent"}
                onMouseEnter={() => setHoveredInfoAplicacion(true)}
                onMouseLeave={() => setHoveredInfoAplicacion(false)}
                disabled={!selectedAplicacion}
                onClick={() => { setSelectedAplicacionDetails(selectedAplicacion); setIsAplicacionDetailModalOpen(true); }}
              />
              <ToolbarButton
                icon="edit"
                design={isHoveredEditAplicacion ? "Attention" : "Transparent"}
                onMouseEnter={() => setHoveredEditAplicacion(true)}
                onMouseLeave={() => setHoveredEditAplicacion(false)}
                disabled={!selectedAplicacion}
                onClick={() => handleEditAplicacionClick(selectedAplicacion)}
              />
              <ToolbarButton
                icon="delete"
                design={isHoveredDeleteAplicacion ? "Negative" : "Transparent"}
                onMouseEnter={() => setHoveredDeleteAplicacion(true)}
                onMouseLeave={() => setHoveredDeleteAplicacion(false)}
                disabled={!selectedAplicacion}
                onClick={() => { setItemToDeleteAplicacion(selectedAplicacion); setShowConfirmAplicacion(true); }}
              />
            </FlexBox>
          </Toolbar>

          <AnalyticalTable
            data={filteredApps}
            columns={[
              {
                Header: "Asignado",
                accessor: "asignado",
                Cell: (row) => (
                  <CheckBox
                    // checked={checkedApps[row.row.original.APPID] || false}
                    // onChange={(e) =>
                    //   handleAppCheckBoxChange(row.row.original.APPID, e.target.checked)
                    // }
                  />
                )
              },  
              { Header: "APPID", accessor: "APPID" },
              { Header: "NAMEAPP", accessor: "NAMEAPP" },
            ]}
            onRowClick={handleAplicacionSelect}
            visibleRows={10}
          />
        </div>
      </SplitterLayout>

      {/* MODALES CRUD PARA ROLES */}
      <ReusableModal
        open={modalType === "create" && modalContext === "rol"}
        onClose={closeModal}
        title="Crear Nuevo Rol"
        fields={[
          { label: 'ID de Rol', name: 'ROLEID', required: true },
          { label: 'Nombre de Rol', name: 'ROLENAME', required: true },
          { label: 'Descripción', name: 'DESCRIPTION', required: false }
        ]}
        onSubmit={(rolData) => {
          closeModal();
        }}
        submitButtonText="Crear Rol"
      />
      <ReusableModal
        open={showEditRol}
        onClose={() => setShowEditRol(false)}
        title="Editar Rol"
        fields={[
          { label: 'ID de Rol', name: 'ROLEID', required: true },
          { label: 'Nombre de Rol', name: 'ROLENAME', required: true },
          { label: 'Descripción', name: 'DESCRIPTION', required: false }
        ]}
        initialData={editingRol}
        onSubmit={(rolData) => {
          setShowEditRol(false);
          setEditingRol(null);
        }}
        submitButtonText="Guardar Cambios"
      />
      {isRolDetailModalOpen && selectedRolDetails && (
        <AlertModal
          open={isRolDetailModalOpen}
          onClose={() => setIsRolDetailModalOpen(false)}
          title="Detalles del Rol"
          buttonText="Cerrar"
          message={
            <FlexBox direction="Column">
              <FlexBox>
                <Label>ID de Rol:</Label>
                <Text>{selectedRolDetails.ROLEID}</Text>
              </FlexBox>
              <FlexBox>
                <Label>Nombre:</Label>
                <Text>{selectedRolDetails.ROLENAME}</Text>
              </FlexBox>
              <FlexBox>
                <Label>Descripción:</Label>
                <Text>{selectedRolDetails.DESCRIPTION || "N/A"}</Text>
              </FlexBox>
            </FlexBox>
          }
        />
      )}
      <AlertModal
        open={showConfirmRol}
        onClose={() => setShowConfirmRol(false)}
        title="Confirmar eliminación"
        buttonText="Cerrar"
        message={
          <Text>¿Está seguro de eliminar el rol seleccionado?</Text>
        }
      />

      {/* MODALES CRUD PARA APLICACIONES */}
      <ReusableModal
        open={modalType === "create" && modalContext === "aplicacion"}
        onClose={closeModal}
        title="Crear Nueva Aplicación"
        fields={[
          { label: 'ID de Aplicación', name: 'APPID', required: true },
          { label: 'Nombre de Aplicación', name: 'Aplicacion', required: true }
        ]}
        onSubmit={(appData) => {
          closeModal();
        }}
        submitButtonText="Crear Aplicación"
      />
      <ReusableModal
        open={showEditAplicacion}
        onClose={() => setShowEditAplicacion(false)}
        title="Editar Aplicación"
        fields={[
          { label: 'ID de Aplicación', name: 'APPID', required: true },
          { label: 'Nombre de Aplicación', name: 'Aplicacion', required: true }
        ]}
        initialData={editingAplicacion}
        onSubmit={(appData) => {
          setShowEditAplicacion(false);
          setEditingAplicacion(null);
        }}
        submitButtonText="Guardar Cambios"
      />
      {isAplicacionDetailModalOpen && selectedAplicacionDetails && (
        <AlertModal
          open={isAplicacionDetailModalOpen}
          onClose={() => setIsAplicacionDetailModalOpen(false)}
          title="Detalles de la Aplicación"
          buttonText="Cerrar"
          message={
            <FlexBox direction="Column">
            <FlexBox>
              <Label>ID Aplicación:</Label>
              <Text>{selectedAplicacionDetails.APPID}</Text>
            </FlexBox>
            <FlexBox>
              <Label>Nombre:</Label>
              <Text>{selectedAplicacionDetails.NAMEAPP }</Text>
            </FlexBox>
            <FlexBox>
              <Label>Descripción:</Label>
              <Text>{selectedAplicacionDetails.DESCRIPTION  || "N/A"}</Text>
            </FlexBox>
          </FlexBox>
          }
        />
      )}
      <AlertModal
        open={showConfirmAplicacion}
        onClose={() => setShowConfirmAplicacion(false)}
        title="Confirmar eliminación"
        buttonText="Cerrar"
        message={
          <Text>¿Está seguro de eliminar la aplicación seleccionada?</Text>
        }
      />
    </Page>
  );
}
