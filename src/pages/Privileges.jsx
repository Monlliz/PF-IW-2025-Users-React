// Importaciones necesarias para el componente
import React, { useState, useRef, useEffect, useContext } from "react";
import AlertModal from "../components/modals/AlertModal";
import ReusableModal from "../components/modals/ReusableModal";
import styles from "../styles/Roles.module.css";
import { fetchPrivilegesData, fetchViews, fetchProcesses, fetchPrivileges, addView, deleteHardView, addProcess, deleteHardProcess, addPrivilege, deleteHardPrivilege, createLabel, deleteLabel, updateLabel } from "../services/applicationsService";
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

/* =======================================================
   SPLITTER LAYOUT (reutilizable)
=========================================================*/
function SplitterLayout({
  children,
  initialLeft = "30%",
  minLeft = "10%",
  maxLeft = "85%",
  height = "100%"
}) {
  const containerRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(initialLeft);
  const dragging = useRef(false);
  const splitterWidth = 8;

  /**
   * Inicia el arrastre del splitter.
   */
  const handleMouseDown = () => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    // FORZAR UN RENDER: Para que el estilo se actualice inmediatamente.
    setLeftWidth(prev => prev);
  };
  const [left, right] = React.Children.toArray(children);

  const handleMouseMove = (e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newWidth < parseFloat(minLeft)) newWidth = parseFloat(minLeft);
    if (newWidth > parseFloat(maxLeft)) newWidth = parseFloat(maxLeft);
    setLeftWidth(`${newWidth}%`);
  };

  /**
   * Finaliza el arrastre del splitter.
   */
  const handleMouseUp = () => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        width: "100%",
        height,
        overflow: "hidden",
        position: "relative"
      }}
    >
      <div
        style={{
          width: leftWidth,
          overflow: "hidden",
          transition: "opacity 0.2s ease",
          position: 'relative',
          padding: '1em'
        }}
      >
        {left}
      </div>

      <div
        className={styles.splitter}
        onMouseDown={handleMouseDown}
        style={{
          width: `${splitterWidth}px`,
          background: "#345b77",
          cursor: "col-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icon name="resize-horizontal" style={{ color: "#fff" }} />
      </div>

      <div
        style={{
          width: `calc(${100 - parseFloat(leftWidth)}% - ${splitterWidth}px)`,
          overflow: "auto"
        }}
      >
        {right}
      </div>
    </div>
  );
}

/* =======================================================
   COMPONENTE PRINCIPAL
=========================================================*/
export default function PrivilegesLayout() {
  // Estados de la aplicación
  // Lista de aplicaciones disponibles cargadas desde la API
  const [applications, setApplications] = useState([]);
  // Aplicación actualmente seleccionada por el usuario
  const [selectedApp, setSelectedApp] = useState(null);
  // Indicador de carga para las aplicaciones (actualmente no usado, pero reservado para futuras implementaciones)
  const [appLoading, setAppLoading] = useState(true);
  
  // Estados de datos
  // Lista de vistas disponibles obtenidas desde la API de catálogo
  const [views, setViews] = useState([]);
  // Vistas existentes asignadas a aplicaciones desde el payload general de la API
  const [existingViews, setExistingViews] = useState([]);
  // Vistas filtradas y ordenadas para mostrar en la tabla
  const [filteredViews, setFilteredViews] = useState([]);
  // Vista actualmente seleccionada por el usuario
  const [selectedView, setSelectedView] = useState(null);
  // Lista de procesos disponibles obtenidos desde la API de catálogo
  const [processes, setProcesses] = useState([]);
  // Procesos existentes asignados desde el payload general
  const [existingProcesses, setExistingProcesses] = useState([]);
  // Procesos filtrados y ordenados para mostrar en la tabla
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  // Proceso actualmente seleccionado por el usuario
  const [selectedProcess, setSelectedProcess] = useState(null);
  // Privilegios filtrados para mostrar en la tabla
  const [filteredPrivileges, setFilteredPrivileges] = useState([]);
  // Lista de privilegios disponibles obtenidos desde la API de catálogo
  const [privileges, setPrivileges] = useState([]);

  // Mapas cargados desde una sola ruta de API (fallback a constantes simuladas)
  // Mapa de procesos asignados por vista (clave: VIEWSID, valor: lista de procesos)
  const [processesMap, setProcessesMap] = useState({});
  // Mapa de privilegios asignados por proceso (clave: PROCESSID, valor: lista de privilegios)
  const [privilegesMap, setPrivilegesMap] = useState({});

  // Estados de carga y error de API
  // Contexto para obtener el servidor de base de datos
  const { dbServer } = useContext(DbContext);
  // Indicador de carga mientras se obtienen datos de la API
  const [loadingData, setLoadingData] = useState(false);
  // Mensaje de error si ocurre un problema al cargar datos
  const [loadError, setLoadError] = useState(null);

  // Estados de hover y modales adicionales para Vistas
  // Estados de hover para botones de acciones en vistas
  const [isHoveredAddView, setHoveredAddView] = useState(false);
  const [isHoveredInfoView, setHoveredInfoView] = useState(false);
  const [isHoveredEditView, setHoveredEditView] = useState(false);
  const [isHoveredDeleteView, setHoveredDeleteView] = useState(false);
  // Estados para mostrar modales de edición y confirmación para vistas
  const [showEditView, setShowEditView] = useState(false);
  const [showConfirmView, setShowConfirmView] = useState(false);
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  // Datos de la vista seleccionada para detalles
  const [selectedViewDetails, setSelectedViewDetails] = useState(null);
  // Vista siendo editada
  const [editingView, setEditingView] = useState(null);
  // Estados de hover y modales para Procesos
  // Estados de hover para botones de acciones en procesos
  const [isHoveredAddProcess, setHoveredAddProcess] = useState(false);
  const [isHoveredInfoProcess, setHoveredInfoProcess] = useState(false);
  const [isHoveredEditProcess, setHoveredEditProcess] = useState(false);
  const [isHoveredDeleteProcess, setHoveredDeleteProcess] = useState(false);
  // Estados para mostrar modales de edición y confirmación para procesos
  const [showEditProcess, setShowEditProcess] = useState(false);
  const [showConfirmProcess, setShowConfirmProcess] = useState(false);
  const [isProcessDetailModalOpen, setIsProcessDetailModalOpen] = useState(false);
  // Datos del proceso seleccionado para detalles
  const [selectedProcessDetails, setSelectedProcessDetails] = useState(null);
  // Proceso siendo editado
  const [editingProcess, setEditingProcess] = useState(null);

  // Privilegio actualmente seleccionado
  const [selectedPrivilege, setSelectedPrivilege] = useState(null);

  // Estados de checkboxes
  // Estados de selección (checked) para vistas asignadas
  const [checkedViews, setCheckedViews] = useState({});
  // Estados de selección (checked) para procesos asignados
  const [checkedProcesses, setCheckedProcesses] = useState({});
  // Estados de selección (checked) para privilegios asignados
  const [checkedPrivileges, setCheckedPrivileges] = useState({});

  // Estados de filtrado y ordenamiento para vistas
  // Tipo de filtro para vistas: 'all' (todas) o 'assigned' (solo asignadas)
  const [viewFilterType, setViewFilterType] = useState('all');
  // Tipo de ordenamiento para vistas: 'name' (por nombre) o 'assigned-first' (asignadas primero)
  const [viewSortType, setViewSortType] = useState('name');

  // Estados de filtrado y ordenamiento para procesos
  // Tipo de filtro para procesos: 'all' (todos) o 'assigned' (solo asignados)
  const [processFilterType, setProcessFilterType] = useState('all');
  // Tipo de ordenamiento para procesos: 'name' (por nombre) o 'assigned-first' (asignados primero)
  const [processSortType, setProcessSortType] = useState('name');

  // Estados de filtrado y ordenamiento para privilegios
  // Tipo de filtro para privilegios: 'all' (todos) o 'assigned' (solo asignados)
  const [privilegeFilterType, setPrivilegeFilterType] = useState('all');
  // Tipo de ordenamiento para privilegios: 'name' (por nombre) o 'assigned-first' (asignados primero)
  const [privilegeSortType, setPrivilegeSortType] = useState('name');

  // Consulta de búsqueda para privilegios (no implementada aún)
  const [privilegeSearchQuery, setPrivilegeSearchQuery] = useState('');
  // Privilegios actuales (no implementada aún)
  const [currentPrivileges, setCurrentPrivileges] = useState([]);
  // Estados para modales genéricos
  // Tipo de modal abierto: 'create', 'edit', 'delete'
  const [modalType, setModalType] = useState(null);
  // Contexto del modal: 'view', 'process', 'privilege'
  const [modalContext, setModalContext] = useState(null);
  // Datos asociados al modal
  const [modalData, setModalData] = useState(null);
  // Confirmación de eliminación: {context, data}
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  //ESTADO INDICADOR PARA VISTAS - NUEVO O EDITADO
  const [viewIndicators, setViewIndicators] = useState({});
  const [processIndicators, setProcessIndicators] = useState({});

  // Función para cerrar modales y resetear estados relacionados
  const closeModal = () => {
    setModalType(null);
    setModalContext(null);
    setModalData(null);
  };

  //FUNCIÓN GLOBAL PARA RESALTAR CELDAS
const highlightCell = (field, selectedValue) => ({ row, value }) => {
  const isHighlighted = row.original[field] === selectedValue;

  return (
    <div
      style={{
        backgroundColor: isHighlighted ? "#d1e7ff" : "transparent",
        height: "100%",
        width: "calc(100% + 16px)", 
        marginLeft: "-8px",
        marginRight: "-8px",
        display: "flex",
        padding: "4px 8px",
        alignItems: "center",
        borderRadius: "4px"
      }}
    >
      {value}
    </div>
  );
};

  // Manejador específico para checkboxes de vistas (con llamada a API)
  const handleViewCheckBoxChange = async (viewId, checked) => {
    // Actualizar estado local inmediatamente
    setCheckedViews((prev) => ({
      ...prev,
      [viewId]: checked
    }));

    // Si no hay app seleccionada, no hacer nada
    if (!selectedApp) return;

    try {
      if (checked) {
        // Agregar vista a la aplicación
        await addView(selectedApp.APPID, { VIEWSID: viewId }, dbServer);
        // Actualizar existingViews local para reflejar el cambio inmediatamente
        setExistingViews((prev) => {
          // Evitar duplicados
          const exists = (prev || []).some(ev => String(ev.APPID) === String(selectedApp.APPID) && String(ev.VIEWSID) === String(viewId));
          if (exists) return prev;
          // Buscar descripción desde la lista global de vistas si está disponible
          const desc = (views || []).find(v => String(v.VIEWSID) === String(viewId))?.Descripcion || '';
          return [...(prev || []), { APPID: selectedApp.APPID, VIEWSID: viewId, Descripcion: desc }];
        });
      } else {
        // Remover vista de la aplicación
        await deleteHardView(selectedApp.APPID, viewId, dbServer);

        // Actualizar existingViews local para reflejar la eliminación
        setExistingViews((prev) => (prev || []).filter(ev => !(String(ev.APPID) === String(selectedApp.APPID) && String(ev.VIEWSID) === String(viewId))));
      }
    } catch (error) {
      console.error('Error al actualizar vista en aplicación:', error);
      // Revertir cambio en caso de error
      setCheckedViews((prev) => ({
        ...prev,
        [viewId]: !checked
      }));
      setLoadError(`Error al actualizar vista: ${error.message}`);
    }
  };

  // Manejador específico para checkboxes de procesos (con llamada a API)
  const handleProcessCheckBoxChange = async (processId, checked) => {
    // Actualizar estado local inmediatamente
    setCheckedProcesses((prev) => ({
      ...prev,
      [processId]: checked
    }));

    // Si no hay view o app seleccionada, no hacer nada
    if (!selectedView || !selectedApp) return;

    try {
      if (checked) {
        // Agregar proceso a la vista
        await addProcess(selectedApp.APPID, selectedView.VIEWSID, { PROCESSID: processId }, dbServer);
        console.log(`Proceso ${processId} agregado a vista ${selectedView.VIEWSID}`);
        // Actualizar processesMap local para reflejar la asignación inmediatamente
        setProcessesMap((prev) => {
          const next = { ...(prev || {}) };
          const list = Array.isArray(next[selectedView.VIEWSID]) ? [...next[selectedView.VIEWSID]] : [];
          // Evitar duplicados
          if (!list.some(p => String(p.PROCESSID) === String(processId))) {
            const desc = (processes || []).find(pr => String(pr.PROCESSID) === String(processId))?.Descripcion || '';
            list.push({ PROCESSID: processId, Descripcion: desc, VIEWID: selectedView.VIEWSID, APPID: selectedApp.APPID });
          }
          next[selectedView.VIEWSID] = list;
          return next;
        });

        // Actualizar existingProcesses local para referencia general
        setExistingProcesses((prev) => {
          const prior = Array.isArray(prev) ? [...prev] : [];
          if (!prior.some(p => String(p.PROCESSID) === String(processId) && String(p.VIEWID) === String(selectedView.VIEWSID))) {
            const desc = (processes || []).find(pr => String(pr.PROCESSID) === String(processId))?.Descripcion || '';
            prior.push({ PROCESSID: processId, Descripcion: desc, VIEWID: selectedView.VIEWSID, APPID: selectedApp.APPID });
          }
          return prior;
        });
      } else {
        // Remover proceso de la vista
        await deleteHardProcess(selectedApp.APPID, selectedView.VIEWSID, processId, dbServer);
        console.log(`Proceso ${processId} removido de vista ${selectedView.VIEWSID}`);
        // Actualizar processesMap local para remover la asignación
        setProcessesMap((prev) => {
          const next = { ...(prev || {}) };
          const list = Array.isArray(next[selectedView.VIEWSID]) ? next[selectedView.VIEWSID].filter(p => String(p.PROCESSID) !== String(processId)) : [];
          next[selectedView.VIEWSID] = list;
          return next;
        });

        // Actualizar existingProcesses local para remover la entrada
        setExistingProcesses((prev) => (prev || []).filter(p => !(String(p.PROCESSID) === String(processId) && String(p.VIEWID) === String(selectedView.VIEWSID) && String(p.APPID) === String(selectedApp.APPID))));
      }
    } catch (error) {
      console.error('Error al actualizar proceso en vista:', error);
      // Revertir cambio en caso de error
      setCheckedProcesses((prev) => ({
        ...prev,
        [processId]: !checked
      }));
      setLoadError(`Error al actualizar proceso: ${error.message}`);
    }
  };

  // Manejador específico para checkboxes de privilegios (con llamada a API)
  const handlePrivilegeCheckBoxChange = async (privilegeId, checked) => {
    // Actualizar estado local inmediatamente
    setCheckedPrivileges((prev) => ({
      ...prev,
      [privilegeId]: checked
    }));

    // Si no hay process, view o app seleccionada, no hacer nada
    if (!selectedProcess || !selectedView || !selectedApp) return;

    try {
      if (checked) {
        // Agregar privilegio al proceso
        await addPrivilege(selectedApp.APPID, selectedView.VIEWSID, selectedProcess.PROCESSID, { PRIVILEGEID: privilegeId }, dbServer);
        console.log(`Privilegio ${privilegeId} agregado a proceso ${selectedProcess.PROCESSID}`);
        // Actualizar privilegesMap local para reflejar la asignación inmediatamente
        setPrivilegesMap((prev) => {
          const next = { ...(prev || {}) };
          const list = Array.isArray(next[selectedProcess.PROCESSID]) ? [...next[selectedProcess.PROCESSID]] : [];
          // Evitar duplicados
          if (!list.some(p => String(p.PRIVILEGEID) === String(privilegeId))) {
            const desc = (privileges || []).find(pr => String(pr.PRIVILEGEID) === String(privilegeId))?.Descripcion || '';
            list.push({ PRIVILEGEID: privilegeId, Descripcion: desc });
          }
          next[selectedProcess.PROCESSID] = list;
          return next;
        });
      } else {
        // Remover privilegio del proceso
        await deleteHardPrivilege(selectedApp.APPID, selectedView.VIEWSID, selectedProcess.PROCESSID, privilegeId, dbServer);
        console.log(`Privilegio ${privilegeId} removido de proceso ${selectedProcess.PROCESSID}`);
        // Actualizar privilegesMap local para remover la asignación
        setPrivilegesMap((prev) => {
          const next = { ...(prev || {}) };
          const list = Array.isArray(next[selectedProcess.PROCESSID]) ? next[selectedProcess.PROCESSID].filter(p => String(p.PRIVILEGEID) !== String(privilegeId)) : [];
          next[selectedProcess.PROCESSID] = list;
          return next;
        });
      }
    } catch (error) {
      console.error('Error al actualizar privilegio en proceso:', error);
      // Revertir cambio en caso de error
      setCheckedPrivileges((prev) => ({
        ...prev,
        [privilegeId]: !checked
      }));
      setLoadError(`Error al actualizar privilegio: ${error.message}`);
    }
  };

  // Buscar
  const handleSearch = (event, data, setFiltered) => {
    const q = event.target.value.toLowerCase();
    if (!q) return setFiltered(data);
    const f = data.filter((d) =>
      Object.values(d).some((v) => String(v).toLowerCase().includes(q))
    );
    setFiltered(f);
  };

  /**
   * Aplica filtrado y ordenamiento a la lista de vistas.
   * Filtra por asignadas si corresponde y ordena según el tipo seleccionado.
   */
  const applyViewFiltersAndSort = () => {
    // Si no hay aplicación seleccionada, no mostrar nada
    if (!selectedApp) {
      setFilteredViews([]);
      return;
    }

    let result = [...(views || [])];

    // Filtrar según la selección
    if (viewFilterType === 'assigned') {
      result = result.filter((v) => checkedViews[v.VIEWSID] === true);
    }

    // Ordenar según la selección
    if (viewSortType === 'assigned-first') {
      result.sort((a, b) => {
        const aAssigned = checkedViews[a.VIEWSID] === true ? 1 : 0;
        const bAssigned = checkedViews[b.VIEWSID] === true ? 1 : 0;
        return bAssigned - aAssigned; // Asignadas primero
      });
    } else if (viewSortType === 'name') {
      result.sort((a, b) => String(a.VIEWSID).localeCompare(String(b.VIEWSID)));
    }

    setFilteredViews(result);
  };

  // Efecto para aplicar filtros y ordenamiento a las vistas cuando cambien los estados relevantes
  useEffect(() => {
    applyViewFiltersAndSort();
  }, [viewFilterType, viewSortType, checkedViews, views, selectedApp]);

  // Búsqueda específica para vistas (respeta filtros y ordenamientos)
  const handleViewSearch = (event) => {
    // Si no hay aplicación seleccionada, no mostrar nada
    if (!selectedApp) {
      setFilteredViews([]);
      return;
    }

    const q = event.target.value.toLowerCase();
    let result = [...(views || [])];

    // Aplicar búsqueda de texto
    if (q) {
      result = result.filter((d) =>
        Object.values(d).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    // Aplicar filtrado
    if (viewFilterType === 'assigned') {
      result = result.filter((v) => checkedViews[v.VIEWSID] === true);
    }

    // Aplicar ordenamiento
    if (viewSortType === 'assigned-first') {
      result.sort((a, b) => {
        const aAssigned = checkedViews[a.VIEWSID] === true ? 1 : 0;
        const bAssigned = checkedViews[b.VIEWSID] === true ? 1 : 0;
        return bAssigned - aAssigned;
      });
    } else if (viewSortType === 'name') {
      result.sort((a, b) => String(a.VIEWSID).localeCompare(String(b.VIEWSID)));
    }

    setFilteredViews(result);
  };

  /**
   * Aplica filtrado y ordenamiento a la lista de procesos.
   * Filtra por asignados si corresponde y ordena según el tipo seleccionado.
   */
  const applyProcessFiltersAndSort = () => {
    // Si no hay vista seleccionada, no mostrar nada
    if (!selectedView) {
      setFilteredProcesses([]);
      return;
    }

    let result = [...(filteredProcesses || [])];

    // Filtrar según la selección
    if (processFilterType === 'assigned') {
      result = result.filter((p) => checkedProcesses[p.PROCESSID] === true);
    }

    // Ordenar según la selección
    if (processSortType === 'assigned-first') {
      result.sort((a, b) => {
        const aAssigned = checkedProcesses[a.PROCESSID] === true ? 1 : 0;
        const bAssigned = checkedProcesses[b.PROCESSID] === true ? 1 : 0;
        return bAssigned - aAssigned; // Asignados primero
      });
    } else if (processSortType === 'name') {
      result.sort((a, b) => String(a.PROCESSID).localeCompare(String(b.PROCESSID)));
    }

    setFilteredProcesses(result);
  };

  // Efecto para cargar y filtrar procesos, y marcar checkboxes cuando cambia la vista seleccionada
  useEffect(() => {
    if (!selectedView || !selectedApp) {
      setFilteredProcesses([]);
      setCheckedProcesses({});
      return;
    }

    const viewKey = selectedView.VIEWSID;
    const appId = selectedApp.APPID;

    // Buscar procesos asignados a esta vista en processesMap
    // processesMap usa viewKey como clave y contiene procesos con VIEWID y APPID
    let assignedForView = (processesMap[viewKey] || []).filter(p => String(p.APPID) === String(appId));

    // Construir mapa de checks para esta vista
    const checkedForThisView = {};
    (assignedForView || []).forEach((p) => {
      const pid = p.PROCESSID || p.IdValor || p.PROCESS || p.PROCID || '';
      if (pid) checkedForThisView[pid] = true;
    });

    // Actualizar estado de checkedProcesses
    setCheckedProcesses(checkedForThisView);

    // Construir listado base: asignados primero, luego el resto
    let baseProcesses = [];
    if (assignedForView && assignedForView.length > 0) {
      const assignedNormalized = assignedForView.map((p) => ({
        PROCESSID: p.PROCESSID || p.IdValor,
        Descripcion: p.Descripcion || p.DESCRIPCION || p.DESCRIPTION || p.description || p.VALOR || ''
      }));
      const others = (processes || []).filter((pr) => !assignedNormalized.some((ap) => String(ap.PROCESSID) === String(pr.PROCESSID)));
      baseProcesses = [...assignedNormalized, ...others];
    } else {
      baseProcesses = [...(processes || [])];
    }

    let result = [...baseProcesses];

    // Aplicar filtrado por asignados si corresponde
    if (processFilterType === 'assigned') {
      result = result.filter((p) => checkedForThisView[p.PROCESSID] === true);
    }

    // Ordenamiento
    if (processSortType === 'assigned-first') {
      result.sort((a, b) => {
        const aAssigned = checkedForThisView[a.PROCESSID] === true ? 1 : 0;
        const bAssigned = checkedForThisView[b.PROCESSID] === true ? 1 : 0;
        return bAssigned - aAssigned;
      });
    } else if (processSortType === 'name') {
      result.sort((a, b) => String(a.PROCESSID).localeCompare(String(b.PROCESSID)));
    }

    setFilteredProcesses(result);
  }, [selectedView, selectedApp, processesMap, processes, processFilterType, processSortType]);

  // Búsqueda específica para procesos (respeta filtros y ordenamientos)
  const handleProcessSearch = (event) => {
    // Si no hay vista seleccionada, no mostrar nada
    if (!selectedView) {
      setFilteredProcesses([]);
      return;
    }

    const q = event.target.value.toLowerCase();
    // Usar todos los procesos de la API
    const baseProcesses = processes || [];
    let result = [...baseProcesses];

    // Aplicar búsqueda de texto
    if (q) {
      result = result.filter((d) =>
        Object.values(d).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    // Aplicar filtrado
    if (processFilterType === 'assigned') {
      result = result.filter((p) => checkedProcesses[p.PROCESSID] === true);
    }

    // Aplicar ordenamiento
    if (processSortType === 'assigned-first') {
      result.sort((a, b) => {
        const aAssigned = checkedProcesses[a.PROCESSID] === true ? 1 : 0;
        const bAssigned = checkedProcesses[b.PROCESSID] === true ? 1 : 0;
        return bAssigned - aAssigned;
      });
    } else if (processSortType === 'name') {
      result.sort((a, b) => String(a.PROCESSID).localeCompare(String(b.PROCESSID)));
    }

    setFilteredProcesses(result);
  };

  /**
   * Carga todos los datos necesarios desde las APIs.
   * Obtiene aplicaciones, vistas, procesos, privilegios y mapas de asignaciones.
   */
  const loadAllData = async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const data = await fetchPrivilegesData(dbServer);

      setApplications(data.applications || []);
      setProcessesMap(data.processesMap || {});
      setPrivilegesMap(data.privilegesMap || {});

      // Guardar las vistas procedentes del payload general para comparar
      const existingViewsData = data.views || [];
      setExistingViews(existingViewsData);

      // Obtener vistas desde la nueva API de catálogo
      try {
        const apiViews = await fetchViews(dbServer);
        const mapped = (Array.isArray(apiViews) ? apiViews : []).map((v) => ({
          VIEWSID: v.IdValor,
          Descripcion: v.VALOR || "Sin descripcion"
        }));
        setViews(mapped);
        setFilteredViews([]);
        setCheckedViews({});
      } catch (errViews) {
        console.warn('No se pudieron obtener vistas desde API:', errViews);
        setViews(existingViewsData);
        setFilteredViews([]);
        setCheckedViews({});
      }

      // Obtener procesos desde el nuevo endpoint de catálogo (lista global, no por vista)
      try {
        const apiProcesses = await fetchProcesses(dbServer);
        const mappedProcesses = (Array.isArray(apiProcesses) ? apiProcesses : []).map((p) => ({
          PROCESSID: p.IdValor,
          Descripcion: p.VALOR || "Sin descripcion"
        }));
        setProcesses(mappedProcesses);
      } catch (errProcesses) {
        console.warn('No se pudieron obtener procesos desde API:', errProcesses);
        setProcesses([]);
      }

      // NO marcar checkboxes aquí - se hace en el efecto cuando se selecciona una vista
      setCheckedProcesses({});
      setFilteredProcesses([]);

      // Obtener privilegios desde el nuevo endpoint de catálogo
      try {
        const apiPrivileges = await fetchPrivileges(dbServer);
        const mappedPrivileges = (Array.isArray(apiPrivileges) ? apiPrivileges : []).map((p) => ({
          PRIVILEGEID: p.IdValor,
          Descripcion: p.VALOR || "Sin descripcion"
        }));
        console.log('Mapped privileges:', mappedPrivileges);
        setPrivileges(mappedPrivileges);
      } catch (errPrivileges) {
        console.warn('No se pudieron obtener privilegios desde API:', errPrivileges);
        setPrivileges([]);
      }
      setCheckedPrivileges({});
      setFilteredPrivileges([]);
    } catch (err) {
      setLoadError(err.message || String(err));
    } finally {
      setLoadingData(false);
    }
  };

  // Efecto para cargar datos iniciales al montar el componente o cambiar el servidor
  useEffect(() => {
    loadAllData();
  }, [dbServer]); // Recargar cuando cambie el servidor

  // Efecto para recalcular los checkboxes de vistas cuando cambia la aplicación seleccionada
  useEffect(() => {
    if (!selectedApp || views.length === 0) {
      setCheckedViews({});
      return;
    }

    // Obtener vistas existentes de la aplicación seleccionada
    const appExistingViews = (existingViews || []).filter(
      (v) => String(v.APPID) === String(selectedApp.APPID)
    );

    // Marcar checkboxes para las vistas de esta aplicación que existan
    const checked = {};
    views.forEach((v) => {
      const exists = appExistingViews.some(
        (av) => String(av.VIEWSID) === String(v.VIEWSID)
      );
      if (exists) checked[v.VIEWSID] = true;
    });
    setCheckedViews(checked);
  }, [selectedApp, views, existingViews]);

  // Seleccionar view → cargar procesos
  const handleViewSelect = (e) => {
    const row = e.detail.row.original;
    const viewKey = row?.VIEWSID;
    const newSelected = { ...row, VIEWSID: viewKey };
    // Solo actualizar la selección aquí; la carga y marcado de procesos
    // se realiza en el efecto que escucha `selectedView` para evitar condiciones de carrera.
    setSelectedView(newSelected);
    setSelectedProcess(null);
    setSelectedPrivilege(null);
    setFilteredPrivileges([]);
  };

  // Seleccionar process → cargar privilegios
  const handleProcessSelect = (e) => {
    const row = e.detail.row.original;
    const procKey = row?.PROCESSID;
    setSelectedProcess({ ...row, PROCESSID: procKey });
    setSelectedPrivilege(null);
    // Mostrar todos los privilegios disponibles, marcados los asignados
    const allPrivs = privileges || [];
    const assignedPrivs = privilegesMap[procKey] || [];
    const checked = {};
    assignedPrivs.forEach(p => checked[p.PRIVILEGEID] = true);
    setCheckedPrivileges(checked);
    setFilteredPrivileges(allPrivs);
  };

  // Seleccionar privilegio (fila)
  const handlePrivilegeSelect = (e) => {
    const row = e.detail?.row?.original;
    if (row) setSelectedPrivilege(row);
  };

  // Manejar selección de aplicación
  const handleAppSelect = (event) => {
    const appId = event.target.value;
 
    if (!appId) {
      setSelectedApp(null);
      setFilteredViews([]);
      setSelectedView(null);
      setFilteredProcesses([]);
      setSelectedProcess(null);
      setFilteredPrivileges([]);
      return;
    }

    const selectedAppObj = applications.find(app => app.APPID === appId);
    
    if (selectedAppObj) {
      setSelectedApp(selectedAppObj);
      
      // Mostrar solo las vistas que pertenecen a la aplicación seleccionada
      // IMPORTANTE: Usar existingViews (que tiene la estructura correcta del payload)
      // NO usar views del catálogo porque sus VIEWSID no coinciden con processesMap
      const appViews = (existingViews || []).filter(v => String(v.APPID) === String(selectedAppObj.APPID));
      setFilteredViews(appViews);
      
      // Resetear otras selecciones
      setSelectedView(null);
      setSelectedProcess(null);
      setSelectedPrivilege(null);
      setFilteredProcesses([]);
      setFilteredPrivileges([]);
    }
  };

  // Handler genérico para submit de los modales de creación (view/process/privilege)
  const handleCreateModalSubmit = async (formData) => {
    try {
      if (!modalContext) return closeModal();

      if (modalContext === 'view') {
        if (!selectedApp) {
          alert('Seleccione una aplicación antes de crear una vista.');
          return;
        }

        // Validar unicidad de VIEWID
        if (views.some(v => String(v.VIEWSID) === String(formData.VIEWID))) {
          alert('El VIEWID ya existe. Por favor, elija uno único.');
          return;
        }

        const label = {
          idetiqueta: 'IdVistas',
          idvalor: formData.VIEWID,
          valor: formData.Descripcion,
          alias: formData.Alias || formData.VIEWID
        };
        await createLabel(label, dbServer);
        
        /** MARCAR COMO NUEVO */
        setViewIndicators(prev => ({
          ...prev,
          [formData.VIEWID]: "created"
        }));
        // Recargar todos los datos desde el backend para mostrar los cambios
        await loadAllData();

        closeModal();
        return;
      }

      if (modalContext === 'process') {
        if (!selectedApp || !selectedView) {
          alert('Seleccione una aplicación y una vista antes de crear un proceso.');
          return;
        }

        // Validar unicidad de PROCESSID
        if (processes.some(p => String(p.PROCESSID) === String(formData.PROCESSID))) {
          alert('El PROCESSID ya existe. Por favor, elija uno único.');
          return;
        }

        const label = {
          idetiqueta: 'IdProcesos',
          idvalor: formData.PROCESSID,
          valor: formData.Descripcion,
          alias: formData.Alias || formData.PROCESSID
        };
        await createLabel(label, dbServer);

        /** MARCAR COMO NUEVO */
        setProcessIndicators(prev => ({
          ...prev,
          [formData.PROCESSID]: "created"
        }));

        // Recargar datos para reflejar los cambios desde el servidor
        await loadAllData();

        closeModal();
        return;
      }

    } catch (error) {
      console.error('Error creando label:', error);
      alert('Error al crear. Ver consola para detalles.');
    }
  };

  /**
   * Manejador genérico para el submit de modales de eliminación.
   * Elimina una vista o proceso mediante la API de etiquetas.
   */
  const handleDeleteModalSubmit = async () => {
    try {
      if (!modalContext || !modalData) return closeModal();

      if (modalContext === 'view') {
        const label = {
          idetiqueta: 'IdVistas',
          idvalor: modalData.VIEWSID
        };
        await deleteLabel(label, dbServer);

        // Recargar todos los datos desde el backend para mostrar los cambios
        await loadAllData();

        closeModal();
        return;
      }

      if (modalContext === 'process') {
        const label = {
          idetiqueta: 'IdProcesos',
          idvalor: modalData.PROCESSID
        };
        await deleteLabel(label, dbServer);

        // Recargar datos para reflejar los cambios desde el servidor
        await loadAllData();

        closeModal();
        return;
      }

    } catch (error) {
      console.error('Error eliminando label:', error);
      alert('Error al eliminar. Ver consola para detalles.');
    }
  };

  return (
    <Page className={styles.pageContainer}>
      <Bar>
        <Title>Gestión de Views, Processes y Privilegios</Title>
      </Bar>

      {/* Selector de Aplicación */}
      <Toolbar style={{ padding: '0.5rem' }}>
        <FlexBox alignItems="Center" style={{ gap: '1rem' }}>
          <Label>Aplicación:</Label>
          <Select
            onChange={(event) => {
              handleAppSelect(event);
            }}
            style={{ width: '300px' }}
            disabled={loadingData}
          >
            <Option value="">Seleccione una aplicación</Option>
            {applications.map(app => (
              <Option key={app.APPID} value={app.APPID}>
                {app.NAME}
              </Option>
            ))}
          </Select>
          <ToolbarButton
            icon="refresh"
            onClick={() => {
              loadAllData();
            }}
            tooltip="Recargar datos"
          />
        </FlexBox>
        {loadError && (
          <Text style={{ color: 'red', marginLeft: '1rem' }}>
            Error: {loadError}
          </Text>
        )}
      </Toolbar>

      {loadError && (
        <AlertModal
          show={true}
          title="Error al cargar datos"
          message={loadError}
          onClose={() => setLoadError(null)}
        />
      )}

      {/* ===== LAYOUT 1: VIEWS / PROCESSES ===== */}
      <SplitterLayout height="calc(100vh - 120px)">
        {/* Panel izquierdo: Views */}
        <div>
          <Title style={{ fontWeight: 500, fontSize: "1.5em" }}>Vistas</Title>
          {/* ============================================
            🔍 BARRA DE BÚSQUEDA Y FILTROS (VISTAS) — RESPONSIVE
          =============================================== */}
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
                placeholder="Buscar vista..."
                onInput={handleViewSearch}
                style={{
                  flex: "1 1 300px",
                  maxWidth: "600px",
                  minWidth: "30px",
                }}
                disabled={!selectedApp}
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
              {/* Filtro */}
              <FlexBox
                direction="Row"
                alignItems="Center"
                style={{
                  gap: "0.5rem",
                  minWidth: "20px",
                  flex: "1 1 220px",opacity: selectedApp ? 1 : 0.5,
                  pointerEvents: selectedApp ? 'auto' : 'none'
                }}
              >
                <Label>Filtrar por:</Label>
                <Select
                  value={viewFilterType}
                  disabled={!selectedApp}
                  onChange={(e) =>
                    setViewFilterType(e.detail.selectedOption.dataset.id)
                  }
                  style={{ width: "100%" }}
                >
                  <Option data-id="all">Todas las vistas</Option>
                  <Option data-id="assigned">Solo vistas asignadas</Option>
                </Select>
              </FlexBox>

              {/* Orden */}
              <FlexBox
                direction="Row"
                alignItems="Center"
                style={{
                  gap: "0.5rem",
                  minWidth: "20px",
                  flex: "1 1 220px",
                  opacity: selectedApp ? 1 : 0.5,
                  pointerEvents: selectedApp ? 'auto' : 'none'
                }}
              >
                <Label>Ordenar por:</Label>
                <Select
                  value={viewSortType}
                  disabled={!selectedApp}
                  onChange={(e) =>
                    setViewSortType(e.detail.selectedOption.dataset.id)
                  }
                  style={{ width: "100%" }}
                >
                  <Option data-id="name">Por nombre</Option>
                  <Option data-id="assigned-first">Asignadas primero</Option>
                </Select>
              </FlexBox>
            </FlexBox>
          </FlexBox>

          

          <Toolbar style={{ paddingTop: 0, background: 'none', boxShadow: 'none' }}>
            <FlexBox>
              <ToolbarButton
                icon="add"
                design={isHoveredAddView ? 'Positive' : 'Transparent'}
                onMouseEnter={() => setHoveredAddView(true)}
                onMouseLeave={() => setHoveredAddView(false)}
                onClick={() => { setModalType('create'); setModalContext('view'); }}
              />
              <ToolbarButton
                icon="hint"
                design={isHoveredInfoView ? 'Emphasized' : 'Transparent'}
                onMouseEnter={() => setHoveredInfoView(true)}
                onMouseLeave={() => setHoveredInfoView(false)}
                disabled={!selectedView}
                onClick={() => { setSelectedViewDetails(selectedView); setIsViewDetailModalOpen(true); }}
              />
              <ToolbarButton
                icon="edit"
                design={isHoveredEditView ? 'Attention' : 'Transparent'}
                onMouseEnter={() => setHoveredEditView(true)}
                onMouseLeave={() => setHoveredEditView(false)}
                disabled={!selectedView}
                onClick={() => { setEditingView(selectedView); setShowEditView(true); }}
              />
              <ToolbarButton
                icon="delete"
                design={isHoveredDeleteView ? 'Negative' : 'Transparent'}
                onMouseEnter={() => setHoveredDeleteView(true)}
                onMouseLeave={() => setHoveredDeleteView(false)}
                disabled={!selectedView}
                onClick={() => { setModalType('delete'); setModalContext('view'); setModalData(selectedView); }}
              />
            </FlexBox>
          </Toolbar>

          <AnalyticalTable
            data={filteredViews}
            columns={[
            {
              Header: "Estado",
              accessor: "estado",
              width: 80,
              Cell: ({ row }) => {
                const id = row.original.VIEWSID;
                const state = viewIndicators[id];
                const isHighlighted =
                  selectedView?.VIEWSID === row.original.VIEWSID;

                return (
                  <div
                    style={{
                      backgroundColor: isHighlighted ? "#d1e7ff" : "transparent",
                      height: "100%",
                      width: "calc(100% + 16px)",
                      marginLeft: "-8px",
                      marginRight: "-8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {state === "created" && (
                      <span
                        style={{
                          background: "#4caf50",
                          padding: "2px 6px",
                          color: "white",
                          borderRadius: "5px",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}
                      >
                        Nueva
                      </span>
                    )}

                    {state === "updated" && (
                      <span
                        style={{
                          background: "#ff9800",
                          padding: "2px 6px",
                          color: "white",
                          borderRadius: "5px",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}
                      >
                        Editada
                      </span>
                    )}
                  </div>
                );
              }
            }, 
            { 
              Header: "Asignado",
              accessor: "asignado",
              width: 80,
              Cell: ({ row }) => {
                const isHighlighted = selectedView?.VIEWSID === row.original.VIEWSID;

                return (
                  <div
                    style={{
                      backgroundColor: isHighlighted ? "#d1e7ff" : "transparent",
                      height: "100%",
                      width: "calc(100% + 16px)",
                      marginLeft: "-8px",
                      marginRight: "-8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckBox
                      checked={checkedViews[row.original.VIEWSID] || false}
                      onChange={(e) =>
                        handleViewCheckBoxChange(row.original.VIEWSID, e.target.checked)
                      }
                    />
                  </div>
                );
              }
            },
            {
              Header: "VIEWID",
              accessor: "VIEWSID",
              Cell: highlightCell("VIEWSID", selectedView?.VIEWSID)

            },

            {
              Header: "Descripción",
              accessor: "Descripcion",
              Cell: highlightCell("VIEWSID", selectedView?.VIEWSID)
            },
          ]}
            onRowClick={handleViewSelect}
            visibleRows={8}
          />
        </div>

        {/* Panel derecho: Processes */}
        <SplitterLayout initialLeft="50%">
          <div>
            <Title style={{ fontWeight: 500, fontSize: "1.5em" }}>Procesos</Title>
            {/* ================================
                🔍 BUSQUEDA DE PROCESOS (RESPONSIVO)
            =================================== */}
            <FlexBox
              direction="Column"
              style={{
                width: "100%",
                gap: "1rem",
                marginBottom: "1rem"
              }}
            >
              {/* Barra de búsqueda */}
              <FlexBox
                direction="Row"
                justifyContent="Center"
                wrap="Wrap"
                style={{ width: "100%", gap: "5.75rem" }}
              >
                <Input
                  icon="search"
                  placeholder="Buscar proceso..."
                  onInput={(e) => handleProcessSearch(e)}
                  disabled={!selectedView}
                  style={{
                    flex: "1 1 300px",
                    maxWidth: "600px",
                    minWidth: "30px"
                  }}
                />
              </FlexBox>

              {/* Filtros y Orden RESPONSIVOS */}
              <FlexBox
                direction="Row"
                wrap="Wrap"
                justifyContent="SpaceBetween"
                alignItems="Center"
                style={{ width: "100%", gap: "0.75rem" }}
              >
                {/* Filtro */}
                <FlexBox
                  direction="Row"
                  alignItems="Center"
                  style={{
                    gap: "0.5rem",
                    minWidth: "20px",
                    flex: "1 1 220px",
                    opacity: selectedView ? 1 : 0.5,
                    pointerEvents: selectedView ? 'auto' : 'none'
                  }}
                >
                  <Label>Filtrar por:</Label>
                  <Select
                    value={processFilterType}
                    disabled={!selectedView}
                    onChange={(e) =>
                      setProcessFilterType(e.detail.selectedOption.dataset.id)
                    }
                    style={{ width: "100%" }}
                  >
                    <Option data-id="all">Todos los procesos</Option>
                    <Option data-id="assigned">Sólo asignados</Option>
                  </Select>
                </FlexBox>

                {/* Orden */}
                <FlexBox
                  direction="Row"
                  alignItems="Center"
                  style={{
                    gap: "0.5rem",
                    minWidth: "20px",
                    flex: "1 1 220px",
                    opacity: selectedView ? 1 : 0.5,
                    pointerEvents: selectedView ? 'auto' : 'none'
                  }}
                >
                  <Label>Ordenar por:</Label>
                  <Select
                    value={processSortType}
                    disabled={!selectedView}
                    onChange={(e) =>
                      setProcessSortType(e.detail.selectedOption.dataset.id)
                    }
                    style={{ width: "100%" }}
                  >
                    <Option data-id="name">Por nombre</Option>
                    <Option data-id="assigned-first">Asignados primero</Option>
                  </Select>
                </FlexBox>
              </FlexBox>
            </FlexBox>


            <Toolbar style={{ paddingTop: 0, background: 'none', boxShadow: 'none' }}>
              <FlexBox>
                <ToolbarButton
                  icon="add"
                  design={isHoveredAddProcess ? 'Positive' : 'Transparent'}
                  onMouseEnter={() => setHoveredAddProcess(true)}
                  onMouseLeave={() => setHoveredAddProcess(false)}
                  disabled={!selectedView}
                  onClick={() => { setModalType('create'); setModalContext('process'); }}
                />
                <ToolbarButton
                  icon="hint"
                  design={isHoveredInfoProcess ? 'Emphasized' : 'Transparent'}
                  onMouseEnter={() => setHoveredInfoProcess(true)}
                  onMouseLeave={() => setHoveredInfoProcess(false)}
                  disabled={!selectedProcess}
                  onClick={() => { setSelectedProcessDetails(selectedProcess); setIsProcessDetailModalOpen(true); }}
                />
                <ToolbarButton
                  icon="edit"
                  design={isHoveredEditProcess ? 'Attention' : 'Transparent'}
                  onMouseEnter={() => setHoveredEditProcess(true)}
                  onMouseLeave={() => setHoveredEditProcess(false)}
                  disabled={!selectedProcess}
                  onClick={() => { setEditingProcess(selectedProcess); setShowEditProcess(true); }}
                />
                <ToolbarButton
                  icon="delete"
                  design={isHoveredDeleteProcess ? 'Negative' : 'Transparent'}
                  onMouseEnter={() => setHoveredDeleteProcess(true)}
                  onMouseLeave={() => setHoveredDeleteProcess(false)}
                  disabled={!selectedProcess}
                  onClick={() => { setModalType('delete'); setModalContext('process'); setModalData(selectedProcess); }}
                />
              </FlexBox>
            </Toolbar>

              <AnalyticalTable
                data={selectedView && checkedViews[selectedView.VIEWSID] ? filteredProcesses : []}
                columns={[
                  // ESTADO
                  {
                    Header: "Estado",
                    accessor: "estado",
                    width: 80,
                    Cell: ({ row }) => {
                      const id = row.original.PROCESSID;
                      const state = processIndicators[id];
                      const isHighlighted = selectedProcess?.PROCESSID === id;

                      return (
                        <div
                          style={{
                            backgroundColor: isHighlighted ? "#d1e7ff" : "transparent",
                            height: "100%",
                            width: "calc(100% + 16px)",
                            marginLeft: "-8px",
                            marginRight: "-8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {state === "created" && (
                            <span
                              style={{
                                background: "#4caf50",
                                padding: "2px 6px",
                                color: "white",
                                borderRadius: "5px",
                                fontSize: "0.75rem",
                                fontWeight: "bold"
                              }}
                            >
                              Nuevo
                            </span>
                          )}

                          {state === "updated" && (
                            <span
                              style={{
                                background: "#ff9800",
                                padding: "2px 6px",
                                color: "white",
                                borderRadius: "5px",
                                fontSize: "0.75rem",
                                fontWeight: "bold"
                              }}
                            >
                              Editado
                            </span>
                          )}
                        </div>
                      );
                    }
                  },

                  // ASIGNADO
                  {
                    Header: "Asignado",
                    accessor: "asignado",
                    width: 80,
                    Cell: ({ row }) => {
                      const isHighlighted = selectedProcess?.PROCESSID === row.original.PROCESSID;

                      return (
                        <div
                          style={{
                            backgroundColor: isHighlighted ? "#d1e7ff" : "transparent",
                            height: "100%",
                            width: "calc(100% + 16px)",
                            marginLeft: "-8px",
                            marginRight: "-8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckBox
                            checked={checkedProcesses[row.original.PROCESSID] || false}
                            onChange={(e) =>
                              handleProcessCheckBoxChange(row.original.PROCESSID, e.target.checked)
                            }
                          />
                        </div>
                      );
                    }
                  },
                  // PROCESSID
                  {
                    Header: "PROCESSID",
                    accessor: "PROCESSID",
                    Cell: highlightCell("PROCESSID", selectedProcess?.PROCESSID)
                  },

                  // DESCRIPCIÓN
                  {
                    Header: "Descripción",
                    accessor: "Descripcion",
                    Cell: highlightCell("PROCESSID", selectedProcess?.PROCESSID)
                  }
                ]}

                onRowClick={handleProcessSelect}
                visibleRows={8}
              />
          </div>

          {/* Panel derecho: Privilegios */}
          <div>
            <AnalyticalTable style={{paddingTop: "50%"}}
              data={selectedProcess && checkedProcesses[selectedProcess.PROCESSID] ? filteredPrivileges.map(priv => ({
                ...priv,
                ViewID: selectedView?.VIEWSID || '',
                ProcessID: selectedProcess?.PROCESSID || ''
              })) : []}
              columns={[
                {
                  Header: "Asignado",
                  accessor: "asignado",
                  width: 80,
                  Cell: ({ row }) => {
                    const isHighlighted = selectedPrivilege?.PRIVILEGEID === row.original.PRIVILEGEID;
                    return (
                      <div
                        style={{
                          backgroundColor: isHighlighted ? "#d1e7ff" : "transparent",
                          height: "100%",
                          width: "calc(100% + 16px)",
                          marginLeft: "-8px",
                          marginRight: "-8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckBox
                          checked={checkedPrivileges[row.original.PRIVILEGEID] || false}
                          onChange={(e) =>
                            handlePrivilegeCheckBoxChange(row.original.PRIVILEGEID, e.target.checked)
                          }
                        />
                      </div>
                    );
                  }
                },

                {
                  Header: "PRIVILEGEID",
                  accessor: "PRIVILEGEID",
                 Cell: highlightCell("PRIVILEGEID", selectedPrivilege?.PRIVILEGEID)

                },

                {
                  Header: "Descripción",
                  accessor: "Descripcion",
                  Cell: highlightCell("PRIVILEGEID", selectedPrivilege?.PRIVILEGEID)
                }
              ]}

              onRowClick={handlePrivilegeSelect}
              visibleRows={8}
            />
          </div>
        </SplitterLayout>
      </SplitterLayout>

      {/* ======= MODALES ======= */}
      {modalType && modalContext === "view" && (
        <ReusableModal
          open={true}
          onClose={closeModal}
          title={
            modalType === "create"
              ? "Crear nueva Vista"
              : modalType === "edit"
              ? "Editar Vista"
              : modalType === "delete"
              ? "Confirmar eliminación"
              : "Detalles de Vista"
          }
          fields={
            modalType === "delete"
              ? []
              : [
                  { label: "VIEWID", name: "VIEWID", type: 'text', required: true, pattern: '^[a-zA-Z][a-zA-Z0-9_]*$', errorMessage: 'Debe empezar con una letra y contener solo letras, números o guiones bajos (_).', placeholder: 'Identificador único (ej. IdPronosticoVentas)' },
                  { label: "Descripción", name: "Descripcion", type: 'text', required: true, placeholder: 'Nombre legible de la vista' },
                  { label: "Alias (opcional)", name: "Alias", type: 'text', required: false, placeholder: 'Alias corto (opcional)'}
                ]
          }
          onSubmit={modalType === "delete" ? handleDeleteModalSubmit : handleCreateModalSubmit}
          submitButtonText={modalType === "delete" ? "Eliminar" : "Guardar"}
        />
      )}

      {modalType && modalContext === "process" && (
        <ReusableModal
          open={true}
          onClose={closeModal}
          title={
            modalType === "create"
              ? "Crear nuevo Proceso"
              : modalType === "edit"
              ? "Editar Proceso"
              : modalType === "delete"
              ? "Confirmar eliminación"
              : ""
          }
          fields={
            modalType === "delete"
              ? []
              : [
                  { label: "PROCESSID", name: "PROCESSID", type: 'text', required: true, pattern: '^[a-zA-Z][a-zA-Z0-9_]*$', errorMessage: 'Debe empezar con una letra y contener solo letras, números o guiones bajos (_).', placeholder: 'Identificador único del proceso' },
                  { label: "Descripción", name: "Descripcion", type: 'text', required: true, placeholder: 'Descripción del proceso' },
                  { label: "Alias (opcional)", name: "Alias", type: 'text', required: false, placeholder: 'Alias corto (opcional)'}
                ]
          }
          onSubmit={modalType === "delete" ? handleDeleteModalSubmit : handleCreateModalSubmit}
          submitButtonText={modalType === "delete" ? "Eliminar" : "Guardar"}
        />
      )}


      {/* ===== Modales adicionales: Views (editar, eliminar, detalles) ===== */}
      {showEditView && (
        <ReusableModal
          open={showEditView}
          onClose={() => setShowEditView(false)}
          title="Editar Vista"
          fields={[
            { label: "VIEWID", name: "VIEWSID", type: 'text', required: true, disable: true },
            { label: "Descripción", name: "Descripcion", type: 'text', required: true },
            { label: "Alias (opcional)", name: "Alias", type: 'text', required: false }
          ]}
          initialData={editingView}
          onSubmit={async (formData) => {
            try {
              const label = {
                idetiqueta: 'IdVistas',
                idvalor: formData.VIEWSID,
                valor: formData.Descripcion,
                alias: formData.Alias || formData.VIEWSID
              };
              await updateLabel(label, dbServer);

              setViewIndicators(prev => ({
                ...prev,
                [selectedView.VIEWSID]: "updated"
              }));


              await loadAllData();
              setShowEditView(false);
            } catch (error) {
              console.error('Error updating view:', error);
              alert('Error al actualizar vista.');
            }
          }}
          submitButtonText="Guardar"
        />
      )}

      {showConfirmView && (
        <AlertModal
          open={showConfirmView}
          onClose={() => setShowConfirmView(false)}
          title="Confirmar eliminación"
          buttonText="Cerrar"
          message={<Text>¿Está seguro de eliminar la vista seleccionada?</Text>}
        />
      )}

      {selectedViewDetails && (
        <AlertModal
          open={isViewDetailModalOpen}
          onClose={() => setIsViewDetailModalOpen(false)}
          title="Detalles de la Vista"
          buttonText="Cerrar"
          message={
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <FlexBox>
                <Label>VIEWID:</Label>
                  <Text>{selectedViewDetails.VIEWID || selectedViewDetails.VIEWSID}</Text>
              </FlexBox>
              <FlexBox>
                <Label>Descripción:</Label>
                <Text>{selectedViewDetails.Descripcion}</Text>
              </FlexBox>
            </FlexBox>
          }
        />
      )}

      {/* ===== Modales adicionales: Processes (editar, eliminar, detalles) ===== */}
      {showEditProcess && (
        <ReusableModal
          open={showEditProcess}
          onClose={() => setShowEditProcess(false)}
          title="Editar Proceso"
          fields={[
            { label: 'PROCESSID', name: 'PROCESSID', type: 'text', required: true, disable: true },
            { label: 'Descripción', name: 'Descripcion', type: 'text', required: true },
            { label: 'Alias (opcional)', name: 'Alias', type: 'text', required: false }
          ]}
          initialData={editingProcess}
          onSubmit={async (formData) => {
            try {
              const label = {
                idetiqueta: 'IdProcesos',
                idvalor: formData.PROCESSID,
                valor: formData.Descripcion,
                alias: formData.Alias || formData.PROCESSID
              };
              await updateLabel(label, dbServer);
                setProcessIndicators(prev => ({
                  ...prev,
                  [selectedProcess.PROCESSID]: "updated"
                }));

              await loadAllData();
              setShowEditProcess(false);
            } catch (error) {
              console.error('Error updating process:', error);
              alert('Error al actualizar proceso.');
            }
          }}
          submitButtonText="Guardar"
        />
      )}

      {showConfirmProcess && (
        <AlertModal
          open={showConfirmProcess}
          onClose={() => setShowConfirmProcess(false)}
          title="Confirmar eliminación"
          buttonText="Cerrar"
          message={<Text>¿Está seguro de eliminar el proceso seleccionado?</Text>}
        />
      )}

      {selectedProcessDetails && (
        <AlertModal
          open={isProcessDetailModalOpen}
          onClose={() => setIsProcessDetailModalOpen(false)}
          title="Detalles del Proceso"
          buttonText="Cerrar"
          message={
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
              <FlexBox>
                <Label>PROCESSID:</Label>
                <Text>{selectedProcessDetails.PROCESSID}</Text>
              </FlexBox>
              <FlexBox>
                <Label>Descripción:</Label>
                <Text>{selectedProcessDetails.Descripcion}</Text>
              </FlexBox>
            </FlexBox>
          }
        />
      )}

      </Page> 
  );
}
