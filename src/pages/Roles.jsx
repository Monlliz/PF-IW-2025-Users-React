// Roles.jsx

import React, { useState, useRef, useEffect, useContext } from 'react';
import AlertModal from '../components/modals/AlertModal';
import ReusableModal from '../components/modals/ReusableModal';
import styles from '../styles/Roles.module.css';
import {
  fetchRolesData,
  fetchApplicationsFromApi,
  addProcessToRole,
  addPrivilegeToProcess,
  deleteHardProcessFromRole,
  deletePrivilegeFromProcess,
  fetchAllRolesAndApps,
  createRole,
  updateRole,
  deleteHardRole
} from "../services/rolesServices";
import { createApplication, updateApplication, deleteHardApplication } from "../services/applicationsService";

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

// Componente que crea un layout con dos paneles ajustables mediante un splitter vertical
function SplitterLayout({
  children,                 // [panelIzquierdo, panelDerecho]
  initialLeft = '30%',      
  minLeft = '20%',        
  maxLeft = '75%',         
  hideThreshold = 10,       // % para considerar que un panel está "colapsado" visualmente
  height = '100%'         
}) {

  const containerRef = useRef(null); // Contenedor principal del splitter
  const [leftWidth, setLeftWidth] = useState(initialLeft); // Estado del ancho del panel izquierdo
  const dragging = useRef(false); // Bandera para saber si se está arrastrando el splitter
  const splitterWidth = 8;        // Ancho visual del divisor

  // Indican si un panel debe considerarse colapsado
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Evento al presionar el mouse sobre el splitter
  const handleMouseDown = () => {
    dragging.current = true;              // Activar modo arrastre
    document.body.style.cursor = 'col-resize';    // Cambiar cursor a modo "redimensionar"
    document.body.style.userSelect = 'none';      // Evitar selección de texto
  };

  // Evento mientras se mueve el mouse con el splitter presionado
  const handleMouseMove = (e) => {
    if (!dragging.current || !containerRef.current) return;

    // Obtener información del contenedor para calcular porcentajes
    const rect = containerRef.current.getBoundingClientRect();

    // Calcular el nuevo ancho según la posición del mouse
    let newWidth = ((e.clientX - rect.left) / rect.width) * 100;

    // Convertir valores mínimo y máximo a número
    const min = parseFloat(minLeft);
    const max = parseFloat(maxLeft);

    // Respetar límites definidos
    if (newWidth < min) newWidth = min;
    if (newWidth > max) newWidth = max;

    // Actualizar ancho del panel izquierdo
    setLeftWidth(`${newWidth}%`);

    // Verificar si el panel izquierdo debe considerarse colapsado
    setIsLeftCollapsed(newWidth <= hideThreshold);

    // Calcular ancho del panel derecho para revisar si está colapsado
    const splitterPercent = (splitterWidth / rect.width) * 100;
    const rightWidthPercent = 100 - newWidth - splitterPercent;

    setIsRightCollapsed(rightWidthPercent <= hideThreshold);
  };

  // Evento al soltar el mouse (deja de arrastrar)
  const handleMouseUp = () => {
    dragging.current = false;            // Desactivar modo arrastre
    document.body.style.cursor = '';     // Restaurar cursor
    document.body.style.userSelect = ''; // Restaurar selección de texto
  };

  // Agregar y limpiar listeners globales para mousemove y mouseup
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Convertir los children en un array para dividirlos en panel izquierdo y derecho
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
// Servidor de BD seleccionado, obtenido del contexto global
const { dbServer } = useContext(DbContext);

const [roles, setRoles] = useState([]);   // Lista completa de roles obtenidos desde la API
const [filteredRoles, setFilteredRoles] = useState([]); // Lista de roles filtrados según la barra de búsqueda o filtros activos
const [selectedRol, setSelectedRol] = useState(null); // Rol seleccionado actualmente por el usuario

const [filteredApps, setFilteredApps] = useState([]); // Lista de aplicaciones filtradas según búsqueda o filtros de tipo/orden
const [selectedAplicacion, setSelectedAplicacion] = useState(null); // Aplicación seleccionada actualmente
const [appsByRol, setAppsByRol] = useState({}); // Diccionario: { roleId: [aplicaciones] } para cargar apps por rol sin recargar siempre

// Lista global de todas las aplicaciones (sin filtrar)
const [allApps, setAllApps] = useState([]);

const [loadingData, setLoadingData] = useState(false); // Estado para indicar si se están cargando datos desde la API
const [loadError, setLoadError] = useState(null); // Almacena errores de carga de API para mostrar mensajes al usuario


// Estados de botones de Roles
const [isHoveredAddRol, setHoveredAddRol] = useState(false); // Indica si el botón "Agregar Rol" está siendo seleccionado
const [isHoveredInfoRol, setHoveredInfoRol] = useState(false); // Indica si el botón de información del rol está seleccionado
const [isHoveredEditRol, setHoveredEditRol] = useState(false); // Indica si el botón de editar rol está seleccionado
const [isHoveredDeleteRol, setHoveredDeleteRol] = useState(false); // Indica si el botón de eliminar rol está seleccionado

// Modales y estados de edición Roles
const [showEditRol, setShowEditRol] = useState(false); // Controla si el modal para editar un rol está abierto
const [showConfirmRol, setShowConfirmRol] = useState(false); // Controla si el modal de confirmación de eliminación de rol está abierto
const [isRolDetailModalOpen, setIsRolDetailModalOpen] = useState(false); // Controla si se muestra el modal con detalles del rol
const [selectedRolDetails, setSelectedRolDetails] = useState(null); // Datos del rol seleccionado para mostrar detalles
const [editingRol, setEditingRol] = useState(null); // Objeto del rol que se está editando en el modal
const [itemToDeleteRol, setItemToDeleteRol] = useState(null); // Rol seleccionado para eliminación (pero no confirmado aún)

// Estados de selección de Aplicaciones
const [isHoveredAddAplicacion, setHoveredAddAplicacion] = useState(false);
const [isHoveredInfoAplicacion, setHoveredInfoAplicacion] = useState(false);
const [isHoveredEditAplicacion, setHoveredEditAplicacion] = useState(false);
const [isHoveredDeleteAplicacion, setHoveredDeleteAplicacion] = useState(false);

// Modales y estados de edición de Aplicaciones
const [showEditAplicacion, setShowEditAplicacion] = useState(false);
const [showConfirmAplicacion, setShowConfirmAplicacion] = useState(false);
const [isAplicacionDetailModalOpen, setIsAplicacionDetailModalOpen] = useState(false);
const [selectedAplicacionDetails, setSelectedAplicacionDetails] = useState(null);
const [editingAplicacion, setEditingAplicacion] = useState(null);
const [itemToDeleteAplicacion, setItemToDeleteAplicacion] = useState(null);

// Filtro activo: all, active, inactive, etc.
const [appFilterType, setAppFilterType] = useState('all');
const [appSortType, setAppSortType] = useState('name'); // Ordenamiento activo: name, date, asc/desc, etc.
const [appSearchTerm, setAppSearchTerm] = useState(''); // Texto ingresado en la barra de búsqueda de aplicaciones

// Estado que almacena qué aplicaciones están asignadas (checkboxes marcados).
const [checkedApps, setCheckedApps] = useState({}); // Estructura: { APPID: true/false }
const [modalType, setModalType] = useState(null); // Tipo de modal actual (ej: "edit", "delete", "info")
const [modalContext, setModalContext] = useState(null); // Contexto del modal (ej: "rol", "aplicacion")
const [modalData, setModalData] = useState(null); // Datos enviados al modal (ej: objeto seleccionado)

// Cierra cualquier modal y limpia su configuración
const closeModal = () => {
  setModalType(null);
  setModalContext(null);
  setModalData(null);
};

// Carga todos los datos necesarios: roles, aplicaciones y asignaciones.
// Se ejecuta al iniciar la vista.
const fetchAllData = async () => {
  console.log("Servidor:", dbServer);
  setLoadingData(true);     // Activa indicador de carga
  setLoadError(null);       // Limpia errores previos

  try {
    // Llama a una función que obtiene todo lo necesario en una sola petición
    const { 
      roles: loadedRoles, 
      allApps: loadedAllApps, 
      appsByRol: builtAppsMap 
    } = await fetchAllRolesAndApps(dbServer);

    // Guarda los datos obtenidos en estados locales
    setRoles(loadedRoles);
    setFilteredRoles(loadedRoles);    // Inicialmente, sin filtros
    setAllApps(loadedAllApps);
    setAppsByRol(builtAppsMap);       // Diccionario de apps por rol

  } catch (err) {
    console.error("❌ Error al cargar datos:", err);
    setLoadError(err.message || String(err));  // Guarda mensaje de error
  } finally {
    setLoadingData(false);  // Finaliza indicador de carga
  }
};

// Ejecuta la carga inicial de datos cuando el componente se monta
useEffect(() => {
  fetchAllData();
}, []);

// Maneja el evento de marcar o desmarcar un checkbox de una aplicación
const handleAppCheckBoxChange = async (appId, isChecked) => {
  // Validar que existe un rol seleccionado
  if (!selectedRol?.ROLEID) {
    console.warn("⚠️ No hay rol seleccionado, no se puede asignar/desasignar aplicación");
    return;
  }

  console.log(`🟢 Checkbox ${isChecked ? "marcado" : "desmarcado"} para AppID: ${appId}, Rol: ${selectedRol.ROLEID}`);

  // Actualiza el estado local de checkboxes
  setCheckedApps((prev) => ({
    ...prev,
    [appId]: isChecked,
  }));

  try {
    // Buscar la información de la aplicación seleccionada
    const appToAssign = filteredApps.find((a) => a.APPID === appId);

    // Construcción del body requerido por la API
    const body = {
      rol: {
        ROLEID: selectedRol.ROLEID,
        PROCESS: [
          {
            PROCESSID: appId,
            NAMEAPP: appToAssign?.NAMEAPP || '',
          }
        ]
      }
    };

    console.log("📦 Enviando body a API:", body);

    // Según si está marcado, asigna o elimina la aplicación del rol
    if (isChecked) {
      const response = await addProcessToRole(body, "addProcessRol", dbServer);
      console.log("✔️ addProcessToRole ejecutado:", response);
    } else {
      const response = await deleteHardProcessFromRole(body, "removeProcess", dbServer);
      console.log("✔️ deleteHardProcessFromRole ejecutado:", response);
    }

  } catch (error) {
    console.error("❌ Error al actualizar la relación rol-aplicación:", error);
  }

    // 🔹 Actualiza también el estado local (UI)
    setAppsByRol((prev) => {
      const currentApps = prev[selectedRol.ROLEID] || [];

      if (isChecked) {
        // Cuando el checkbox se marca -> agregar la aplicación al rol

        // Buscar objeto completo de la aplicación por su APPID
        const appToAdd = filteredApps.find((a) => a.APPID === appId);

        // Verificar si la aplicación ya estaba asignada previamente
        const exists = currentApps.some((a) => a.APPID === appId);

        return { //Estado anterior
          ...prev, //copia todas las propiedades existentes del estado previo sin modificarlas.

          // Si ya existe, mantener la lista igual; si no, anexarla
          [selectedRol.ROLEID]: exists ? currentApps : [...currentApps, appToAdd],
        };

      } else {
        // Cuando el checkbox se desmarca → eliminar la aplicación del rol

        return {
          ...prev,

          // Filtrar la aplicación desmarcada para removerla de la lista
          [selectedRol.ROLEID]: currentApps.filter((a) => a.APPID !== appId),
        };
      }

    });
  };

  // event: evento del input
  // data: arreglo completo a filtrar
  // setFiltered: setter del estado filtrado
  const handleSearch = (event, data, setFiltered) => {
    const q = event.target.value.toLowerCase(); // Texto buscado en minúsculas
          // event.target -> el input de tu barra de búsqueda.
          // event.target.value -> el texto que el usuario está escribiendo en ese input.

    // Si la búsqueda está vacía, restaurar lista completa
    if (!q) return setFiltered(data);

    // Filtrar si cualquier campo del objeto coincide con la búsqueda
    const f = data.filter(d =>
      Object.values(d).some(v => String(v).toLowerCase().includes(q))
    );

    setFiltered(f);
  };

  // Cuando se selecciona un rol en la tabla
  const handleRolSelect = (e) => {
    const row = e.detail.row.original; // Datos del rol seleccionado
    const rolKey = row?.ROLEID;

    // Guardar el rol seleccionado en el estado
    setSelectedRol({ ...row, ROLEID: rolKey });

    // Mostrar todas las aplicaciones inicialmente
    setFilteredApps(allApps);

    // Actualizar checkboxes según las apps asignadas al rol
    const assignedApps = appsByRol[row?.ROLEID] || []; // ? evitar errores cuando intentas acceder a una propiedad que podría no existir.
    const newChecked = {};

    assignedApps.forEach((app) => {
      newChecked[app.APPID] = true; // Marcar cada app asignada
    });

    setCheckedApps(newChecked);
  };

  // Selección de aplicación en la tabla
  const handleAplicacionSelect = (e) => {
    const row = e.detail?.row?.original;
    if (row) setSelectedAplicacion(row);
  };

  // Crear nueva aplicación y asignarla automáticamente al rol seleccionado
  const handleCreateAplicacion = (appData) => {
    // Crear nuevo ID temporal
    const newAppId = Date.now().toString();

    // Crear objeto de aplicación con el ID asignado
    const newApp = { ...appData, APPID: newAppId };

    // Insertarla al inicio de la lista visible
    setFilteredApps(prev => [newApp, ...prev]);

    // Agregarla a las aplicaciones asignadas del rol actual
    setAppsByRol(prev => ({
      ...prev,
      [selectedRol.ROLEID]: [newApp, ...(prev[selectedRol.ROLEID] || [])]
    }));

    setShowCreateAplicacionModal(false);
  };

  // Guardar cambios al editar una aplicación
  const handleEditAplicacion = (updatedAppData) => {
    if (!editingAplicacion) return;

    const appIdToUpdate = editingAplicacion.APPID;

    // Actualizar lista visible
    setFilteredApps(prev =>
      prev.map(app =>
        app.APPID === appIdToUpdate ? { ...app, ...updatedAppData } : app
      )
    );

    // Actualizar la lista asignada al rol seleccionado
    setAppsByRol(prev => {
      const updatedRolApps = (prev[selectedRol.ROLEID] || []).map(app =>
        app.APPID === appIdToUpdate ? { ...app, ...updatedAppData } : app
      );

      return { ...prev, [selectedRol.ROLEID]: updatedRolApps };
    });

    setShowEditAplicacionModal(false);
    setEditingAplicacion(null);
  };

  // Cuando se hace clic en "editar" una aplicación
  const handleEditAplicacionClick = (appToEdit) => {
    if (!appToEdit) return;
    setEditingAplicacion(appToEdit);
    setShowEditAplicacion(true);
  };

  // Aplica filtros y ordenamientos a la tabla de aplicaciones
  const applyAppFiltersAndSort = () => {
    if (!selectedRol) {
      setFilteredApps([]);
      return;
    }

    let result = [...allApps]; // Copia base de todas las apps

    // Filtro por texto de búsqueda
    if (appSearchTerm) {
      const q = appSearchTerm.toLowerCase();
      result = result.filter(app =>
        Object.values(app).some(v => String(v).toLowerCase().includes(q))
      );
    }

    // Filtro → mostrar solo apps asignadas
    if (appFilterType === 'assigned') {
      const assignedApps = appsByRol[selectedRol?.ROLEID] || [];
      const assignedIds = assignedApps.map(a => a.APPID);
      result = result.filter(app => assignedIds.includes(app.APPID));
    }

    // Ordenar: asignadas primero
    if (appSortType === 'assigned-first') {
      const assignedApps = appsByRol[selectedRol?.ROLEID] || [];
      const assignedIds = new Set(assignedApps.map(a => a.APPID));

      result.sort((a, b) => {
        const aAssigned = assignedIds.has(a.APPID);
        const bAssigned = assignedIds.has(b.APPID);

        if (aAssigned && !bAssigned) return -1;
        if (!aAssigned && bAssigned) return 1;

        // Si ambos están asignados o ambos no, ordenar por nombre
        return a.NAMEAPP.localeCompare(b.NAMEAPP);
      });

    // Ordenar por nombre
    } else if (appSortType === 'name') {
      result.sort((a, b) => a.NAMEAPP.localeCompare(b.NAMEAPP));
    }

    // Evita setState innecesario si el resultado es idéntico
    setFilteredApps(prev =>
      JSON.stringify(prev) !== JSON.stringify(result) ? result : prev
    );
  };

  // Ejecutar filtros y ordenamientos cuando cambian estas dependencias
  useEffect(() => {
    applyAppFiltersAndSort();
  }, [appsByRol, selectedRol, appFilterType, appSortType, appSearchTerm]);

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
            onInput={(e) => setAppSearchTerm(e.target.value)}
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
              disabled={!selectedRol}
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
                onClick={() => { setModalType('create'); setModalContext('aplicacion'); }}
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
                    checked={checkedApps[row.row.original.APPID] || false}
                    onChange={(e) =>
                      handleAppCheckBoxChange(row.row.original.APPID, e.target.checked)
                    }
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
          { label: 'ID de Rol', name: 'ROLEID', type: 'text', required: true },
          { label: 'Nombre de Rol', name: 'ROLENAME', type: 'text', required: true },
          { label: 'Descripción', name: 'DESCRIPTION', type: 'text', required: false }
        ]}
        onSubmit={async (rolData) => {
          try {
            await createRole(rolData, dbServer);
            await fetchAllData(); // Refresh the data
            closeModal();
          } catch (error) {
            console.error('Error creating role:', error);
            // Optionally show an error message to the user
          }
        }}
        submitButtonText="Crear Rol"
      />
      <ReusableModal
        open={showEditRol}
        onClose={() => setShowEditRol(false)}
        title="Editar Rol"
        fields={[
          { label: 'ID de Rol', name: 'ROLEID', type: 'text', required: true, disable: true },
          { label: 'Nombre de Rol', name: 'ROLENAME', type: 'text', required: true },
          { label: 'Descripción', name: 'DESCRIPTION', type: 'text', required: false }
        ]}
        initialData={editingRol}
        onSubmit={async (rolData) => {
          try {
            await updateRole(editingRol.ROLEID, rolData, dbServer);
            await fetchAllData(); // Refresh the data
            setShowEditRol(false);
            setEditingRol(null);
          } catch (error) {
            console.error('Error updating role:', error);
            // Optionally show an error message to the user
          }
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
                <Text>{selectedRolDetails.DESCRIPTION || "S/D"}</Text>
              </FlexBox>
            </FlexBox>
          }
        />
      )}
      <AlertModal
        open={showConfirmRol}
        onClose={() => setShowConfirmRol(false)}
        title="Confirmar eliminación"
        buttonText="Eliminar"
        design="Negative"
        showCloseButton={true}
        onButtonClick={async () => {
          try {
            await deleteHardRole(itemToDeleteRol.ROLEID, dbServer);
            await fetchAllData(); // Refresh the data
            setShowConfirmRol(false);
            setItemToDeleteRol(null);
          } catch (error) {
            console.error('Error deleting role:', error);
            // Optionally show an error message to the user
          }
        }}
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
          { label: 'ID de Aplicación', name: 'APPID', type: 'text', required: true },
          { label: 'Nombre de Aplicación', name: 'NAMEAPP', type: 'text', required: true }
        ]}
        onSubmit={async (appData) => {
          try {
            const transformedData = {
              APPID: appData.APPID,
              NAME: appData.NAMEAPP,
              DESCRIPTION: appData.DESCRIPTION || ''
            };
            await createApplication(transformedData, dbServer);
            await fetchAllData(); // Refresh the data
            closeModal();
          } catch (error) {
            console.error('Error creating application:', error);
            // Optionally show an error message to the user
          }
        }}
        submitButtonText="Crear Aplicación"
      />
      <ReusableModal
        open={showEditAplicacion}
        onClose={() => setShowEditAplicacion(false)}
        title="Editar Aplicación"
        fields={[
          { label: 'ID de Aplicación', name: 'APPID', type: 'text', required: true, disable: true },
          { label: 'Nombre de Aplicación', name: 'NAMEAPP', type: 'text', required: true }
        ]}
        initialData={editingAplicacion}
        onSubmit={async (appData) => {
          try {
            const transformedData = {
              NAME: appData.NAMEAPP,
              DESCRIPTION: appData.DESCRIPTION || ''
            };
            await updateApplication(editingAplicacion.APPID, transformedData, dbServer);
            await fetchAllData(); // Refresh the data
            setShowEditAplicacion(false);
            setEditingAplicacion(null);
          } catch (error) {
            console.error('Error updating application:', error);
            // Optionally show an error message to the user
          }
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
          </FlexBox>
          }
        />
      )}
      <AlertModal
        open={showConfirmAplicacion}
        onClose={() => setShowConfirmAplicacion(false)}
        title="Confirmar eliminación"
        buttonText="Eliminar"
        design="Negative"
        showCloseButton={true}
        onButtonClick={async () => {
          try {
            await deleteHardApplication(itemToDeleteAplicacion.APPID, dbServer);
            await fetchAllData(); // Refresh the data
            setShowConfirmAplicacion(false);
            setItemToDeleteAplicacion(null);
          } catch (error) {
            console.error('Error deleting application:', error);
            // Optionally show an error message to the user
          }
        }}
        message={
          <Text>¿Está seguro de eliminar la aplicación seleccionada?</Text>
        }
      />
    </Page>
  );
}
