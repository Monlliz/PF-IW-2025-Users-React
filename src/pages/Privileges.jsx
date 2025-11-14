import React, { useState, useRef, useEffect, useContext } from "react";
import AlertModal from "../components/modals/AlertModal";
import ReusableModal from "../components/modals/ReusableModal";
import styles from "../styles/Roles.module.css";
import { fetchPrivilegesData, fetchViews, fetchProcesses, addView, deleteHardView, addProcess, deleteHardProcess, createLabel } from "../services/applicationsService";
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
  // Application state
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  
  // Data states
  const [views, setViews] = useState([]);
  const [existingViews, setExistingViews] = useState([]); // Vistas con APPID del payload general
  const [filteredViews, setFilteredViews] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [processes, setProcesses] = useState([]); // Procesos desde API externa
  const [existingProcesses, setExistingProcesses] = useState([]); // Procesos provenientes del payload general
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [filteredPrivileges, setFilteredPrivileges] = useState([]);

  
  // Maps loaded from single API route (fallback to the simulated constants)
  const [processesMap, setProcessesMap] = useState({});
  const [privilegesMap, setPrivilegesMap] = useState({});

  // API data loading states
  const { dbServer } = useContext(DbContext);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Hover states and additional modal states for Views
  const [isHoveredAddView, setHoveredAddView] = useState(false);
  const [isHoveredInfoView, setHoveredInfoView] = useState(false);
  const [isHoveredEditView, setHoveredEditView] = useState(false);
  const [isHoveredDeleteView, setHoveredDeleteView] = useState(false);
  const [showEditView, setShowEditView] = useState(false);
  const [showConfirmView, setShowConfirmView] = useState(false);
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [selectedViewDetails, setSelectedViewDetails] = useState(null);
  const [editingView, setEditingView] = useState(null);
  const [itemToDeleteView, setItemToDeleteView] = useState(null);

  // Hover states and modal states for Processes
  const [isHoveredAddProcess, setHoveredAddProcess] = useState(false);
  const [isHoveredInfoProcess, setHoveredInfoProcess] = useState(false);
  const [isHoveredEditProcess, setHoveredEditProcess] = useState(false);
  const [isHoveredDeleteProcess, setHoveredDeleteProcess] = useState(false);
  const [showEditProcess, setShowEditProcess] = useState(false);
  const [showConfirmProcess, setShowConfirmProcess] = useState(false);
  const [isProcessDetailModalOpen, setIsProcessDetailModalOpen] = useState(false);
  const [selectedProcessDetails, setSelectedProcessDetails] = useState(null);
  const [editingProcess, setEditingProcess] = useState(null);
  const [itemToDeleteProcess, setItemToDeleteProcess] = useState(null);

  // Hover states and modal states for Privileges
  const [isHoveredAddPriv, setHoveredAddPriv] = useState(false);
  const [isHoveredInfoPriv, setHoveredInfoPriv] = useState(false);
  const [isHoveredEditPriv, setHoveredEditPriv] = useState(false);
  const [isHoveredDeletePriv, setHoveredDeletePriv] = useState(false);
  const [showEditPriv, setShowEditPriv] = useState(false);
  const [showConfirmPriv, setShowConfirmPriv] = useState(false);
  const [isPrivDetailModalOpen, setIsPrivDetailModalOpen] = useState(false);
  const [selectedPrivDetails, setSelectedPrivDetails] = useState(null);
  const [editingPriv, setEditingPriv] = useState(null);
  const [itemToDeletePriv, setItemToDeletePriv] = useState(null);
  const [selectedPrivilege, setSelectedPrivilege] = useState(null);

  // Checkbox states
  const [checkedViews, setCheckedViews] = useState({});
  const [checkedProcesses, setCheckedProcesses] = useState({});
  const [checkedPrivileges, setCheckedPrivileges] = useState({});

  // View filtering and sorting states
  const [viewFilterType, setViewFilterType] = useState('all'); // 'all' o 'assigned'
  const [viewSortType, setViewSortType] = useState('name'); // 'name' o 'assigned-first'

  // Process filtering and sorting states
  const [processFilterType, setProcessFilterType] = useState('all'); // 'all' o 'assigned'
  const [processSortType, setProcessSortType] = useState('name'); // 'name' o 'assigned-first'

  // Privilege filtering and sorting states
  const [privilegeFilterType, setPrivilegeFilterType] = useState('all'); // 'all' o 'assigned'
  const [privilegeSortType, setPrivilegeSortType] = useState('name'); // 'name' o 'assigned-first'

  const [privilegeSearchQuery, setPrivilegeSearchQuery] = useState('');
  const [currentPrivileges, setCurrentPrivileges] = useState([]);
  // Modales
  const [modalType, setModalType] = useState(null); 
  const [modalContext, setModalContext] = useState(null); 
  const [modalData, setModalData] = useState(null);

  const closeModal = () => {
    setModalType(null);
    setModalContext(null);
    setModalData(null);
  };

  // Manejadores para checkboxes
  const handleCheckBoxChange = (id, checked, setter) => {
    setter((prev) => ({
      ...prev,
      [id]: checked
    }));
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

  // Buscar
  const handleSearch = (event, data, setFiltered) => {
    const q = event.target.value.toLowerCase();
    if (!q) return setFiltered(data);
    const f = data.filter((d) =>
      Object.values(d).some((v) => String(v).toLowerCase().includes(q))
    );
    setFiltered(f);
  };

  // Aplicar filtrado y ordenamiento a las vistas
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

  // Efecto para aplicar filtros y ordenamiento cuando cambien
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

  // Aplicar filtrado y ordenamiento a los procesos
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

  // Efecto para cargar procesos y marcar checkboxes cuando cambia la vista seleccionada
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

  // Buscar
   // Aplicar filtrado y ordenamiento a los privilegios
  const applyPrivilegeFiltersAndSort = (baseData = privilegesMap[selectedProcess?.PROCESSID] || []) => {
    // Si no hay proceso seleccionado, no mostrar nada
    if (!selectedProcess) {
      setCurrentPrivileges([]);
      return;
    }
    let result = [...(baseData || [])];
    // Aplicar búsqueda de texto
    if (privilegeSearchQuery) {
      const q = privilegeSearchQuery.toLowerCase();
      result = result.filter((d) =>
        Object.values(d).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    // Ordenar según la selección
    if (privilegeSortType === 'name') {
      result.sort((a, b) => String(a.PRIVILEGEID).localeCompare(String(b.PRIVILEGEID)));
    } 
    // No hay 'assigned-first' por la misma razón que el filtro
    setCurrentPrivileges(result);
  };
  // Efecto para aplicar filtros y ordenamiento de Privilegios
  useEffect(() => {
    // Recargar la lista base al cambiar los datos del proceso seleccionado o filtros
    if (selectedProcess) {
      const baseData = privilegesMap[selectedProcess.PROCESSID] || [];
      applyPrivilegeFiltersAndSort(baseData);
    } else {
      setCurrentPrivileges([]);
    }
  }, [selectedProcess, privilegesMap, privilegeFilterType, privilegeSortType, privilegeSearchQuery]);

  // Búsqueda específica para privilegios (respeta filtros y ordenamientos)
  const handlePrivilegeSearch = (event) => {
    // Al cambiar la búsqueda, actualizamos el estado. El useEffect se encargará del resto.
    setPrivilegeSearchQuery(event.target.value);
  };
  
  // Cargar datos
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
    } catch (err) {
      setLoadError(err.message || String(err));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [dbServer]); // Recargar cuando cambie el servidor

  // Recalcular checkboxes cuando cambia la aplicación seleccionada
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
    setFilteredPrivileges(privilegesMap[row?.PROCESSID] || []);
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

        const label = {
          idetiqueta: 'IdVistas',
          idvalor: formData.VIEWID,
          valor: formData.Descripcion,
          alias: formData.Alias || formData.VIEWID
        };
        await createLabel(label, dbServer);

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

        const label = {
          idetiqueta: 'IdProcesos',
          idvalor: formData.PROCESSID,
          valor: formData.Descripcion,
          alias: formData.Alias || formData.PROCESSID
        };
        await createLabel(label, dbServer);

        // Recargar datos para reflejar los cambios desde el servidor
        await loadAllData();

        closeModal();
        return;
      }

      if (modalContext === 'privilege') {
        if (!selectedProcess) {
          alert('Seleccione un proceso antes de crear un privilegio.');
          return;
        }

        const label = {
          idetiqueta: 'IdPrivilegios',
          idvalor: formData.PRIVILEGEID,
          valor: formData.Descripcion,
          alias: formData.PRIVILEGEID
        };
        await createLabel(label, dbServer);

        // Recargar datos para que la UI muestre los privilegios creados
        await loadAllData();

        closeModal();
        return;
      }
    } catch (error) {
      console.error('Error creando label:', error);
      alert('Error al crear. Ver consola para detalles.');
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
                onClick={() => { setItemToDeleteView(selectedView); setShowConfirmView(true); }}
              />
            </FlexBox>
          </Toolbar>

          <AnalyticalTable
            data={filteredViews}
            columns={[
              { 
                Header: "Asignado", 
                accessor: "asignado",
                Cell: (row) => (
                  <CheckBox
                    checked={checkedViews[row.row.original.VIEWSID] || false}
                    onChange={(e) => handleViewCheckBoxChange(row.row.original.VIEWSID, e.target.checked)}
                  />
                )
              },
              { Header: "VIEWID", accessor: "VIEWSID" },
              { Header: "Descripción", accessor: "Descripcion" }
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
                  onClick={() => { setItemToDeleteProcess(selectedProcess); setShowConfirmProcess(true); }}
                />
              </FlexBox>
            </Toolbar>

            <AnalyticalTable
              data={filteredProcesses}
              columns={[
                { 
                  Header: "Asignado", 
                  accessor: "asignado",
                  Cell: (row) => (
                    <CheckBox
                      checked={checkedProcesses[row.row.original.PROCESSID] || false}
                      onChange={(e) => handleProcessCheckBoxChange(row.row.original.PROCESSID, e.target.checked)}
                    />
                  )
                },
                { Header: "PROCESSID", accessor: "PROCESSID" },
                { Header: "Descripción", accessor: "Descripcion" }
              ]}
              onRowClick={handleProcessSelect}
              visibleRows={8}
            />
          </div>

          {/* Panel derecho: Privilegios */}
          <div>
            <Title style={{ fontWeight: 500, fontSize: "1.5em" , paddingTop:"0.7rem"}}>Privilegios</Title>
            <FlexBox
              direction="Column"
              style={{
                width: "100%",
                gap: "1rem",
                marginBottom: "1rem",
                // marginTop: "1rem"
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
                  placeholder="Buscar privilegio..."
                  onInput={handlePrivilegeSearch}
                  value={privilegeSearchQuery}
                  style={{
                    flex: "1 1 300px",
                    maxWidth: "600px",
                    minWidth: "30px",
                  }}
                  disabled={!selectedProcess}
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
                {/* Filtro (Se mantiene por uniformidad, aunque el filtro 'assigned' no aplique) */}
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
                    value={privilegeFilterType}
                    onChange={(e) =>
                      setPrivilegeFilterType(e.detail.selectedOption.dataset.id)
                    }
                    style={{ width: "100%" }}
                    disabled={!selectedProcess}
                  >
                    <Option data-id="all">Todos los privilegios</Option>
                    <Option data-id="assigned" disabled>Asignados (No Aplica)</Option>
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
                  }}
                >
                  <Label>Ordenar por:</Label>
                  <Select
                    value={privilegeSortType}
                    onChange={(e) =>
                      setPrivilegeSortType(e.detail.selectedOption.dataset.id)
                    }
                    style={{ width: "100%" }}
                    disabled={!selectedProcess}
                  >
                    <Option data-id="name">Por nombre</Option>
                    <Option data-id="assigned-first" disabled>Asignados primero (No Aplica)</Option>
                  </Select>
                </FlexBox>
              </FlexBox>
            </FlexBox>

            <Toolbar style={{ paddingTop: 0, background: 'none', boxShadow: 'none' }}>
              <FlexBox>
                <ToolbarButton
                  icon="add"
                  design={isHoveredAddPriv ? 'Positive' : 'Transparent'}
                  onMouseEnter={() => setHoveredAddPriv(true)}
                  onMouseLeave={() => setHoveredAddPriv(false)}
                  disabled={!selectedProcess}
                  onClick={() => { setModalType('create'); setModalContext('privilege'); }}
                />
                <ToolbarButton
                  icon="hint"
                  design={isHoveredInfoPriv ? 'Emphasized' : 'Transparent'}
                  onMouseEnter={() => setHoveredInfoPriv(true)}
                  onMouseLeave={() => setHoveredInfoPriv(false)}
                  disabled={!selectedPrivilege}
                  onClick={() => { setSelectedPrivDetails(selectedPrivilege); setIsPrivDetailModalOpen(true); }}
                />
                <ToolbarButton
                  icon="edit"
                  design={isHoveredEditPriv ? 'Attention' : 'Transparent'}
                  onMouseEnter={() => setHoveredEditPriv(true)}
                  onMouseLeave={() => setHoveredEditPriv(false)}
                  disabled={!selectedPrivilege}
                  onClick={() => { setEditingPriv(selectedPrivilege); setShowEditPriv(true); }}
                />
                <ToolbarButton
                  icon="delete"
                  design={isHoveredDeletePriv ? 'Negative' : 'Transparent'}
                  onMouseEnter={() => setHoveredDeletePriv(true)}
                  onMouseLeave={() => setHoveredDeletePriv(false)}
                  disabled={!selectedPrivilege}
                  onClick={() => { setItemToDeletePriv(selectedPrivilege); setShowConfirmPriv(true); }}
                />
              </FlexBox>
            </Toolbar>

            <AnalyticalTable
              data={filteredPrivileges.map(priv => ({
                ...priv,
                ViewID: selectedView?.VIEWSID || '',
                ProcessID: selectedProcess?.PROCESSID || ''
              }))}
              columns={[
                { 
                  Header: "Asignado", 
                  accessor: "asignado",
                  Cell: (row) => (
                    <CheckBox
                      checked={checkedPrivileges[row.row.original.PRIVILEGEID] || false}
                      onChange={(e) => handleCheckBoxChange(row.row.original.PRIVILEGEID, e.target.checked, setCheckedPrivileges)}
                    />
                  )
                },
                { Header: "PRIVILEGEID", accessor: "PRIVILEGEID" },
                { Header: "Descripción", accessor: "Descripcion" }
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
              : "Detalles de Vista"
          }
          fields={[
            { label: "VIEWID", name: "VIEWID", type: 'text', required: true, placeholder: 'Identificador único (ej. IdPronosticoVentas)' },
            { label: "Descripción", name: "Descripcion", type: 'text', required: true, placeholder: 'Nombre legible de la vista' },
            { label: "Alias (opcional)", name: "Alias", type: 'text', required: false, placeholder: 'Alias corto (opcional)'}
          ]}
          onSubmit={handleCreateModalSubmit}
          submitButtonText="Guardar"
        />
      )}

      {modalType && modalContext === "process" && (
        <ReusableModal
          open={true}
          onClose={closeModal}
          title={
            modalType === "create"
              ? "Crear nuevo Proceso"
              : "Editar Proceso"
          }
          fields={[
            { label: "PROCESSID", name: "PROCESSID", type: 'text', required: true, placeholder: 'Identificador único del proceso' },
            { label: "Descripción", name: "Descripcion", type: 'text', required: true, placeholder: 'Descripción del proceso' },
            { label: "Alias (opcional)", name: "Alias", type: 'text', required: false, placeholder: 'Alias corto (opcional)'}
          ]}
          onSubmit={handleCreateModalSubmit}
          submitButtonText="Guardar"
        />
      )}

      {modalType && modalContext === "privilege" && (
        <ReusableModal
          open={true}
          onClose={closeModal}
          title={
            modalType === "create"
              ? "Crear nuevo Privilegio"
              : "Editar Privilegio"
          }
          fields={[
            { label: "PRIVILEGEID", name: "PRIVILEGEID", type: 'text', required: true, placeholder: 'Identificador del privilegio' },
            { label: "Descripción", name: "Descripcion", type: 'text', required: true, placeholder: 'Descripción del privilegio' }
          ]}
          onSubmit={handleCreateModalSubmit}
          submitButtonText="Guardar"
        />
      )}

      {/* ===== Modales adicionales: Views (editar, eliminar, detalles) ===== */}
      {showEditView && (
        <ReusableModal
          open={showEditView}
          onClose={() => setShowEditView(false)}
          title="Editar Vista"
          fields={[{ label: 'VIEWID', name: 'VIEWID' }, { label: 'Descripción', name: 'Descripcion' }]}
          initialData={editingView}
          onSubmit={() => setShowEditView(false)}
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
          fields={[{ label: 'PROCESSID', name: 'PROCESSID' }, { label: 'Descripción', name: 'Descripcion' }]}
          initialData={editingProcess}
          onSubmit={() => setShowEditProcess(false)}
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

      {/* ===== Modales adicionales: Privilegios (editar, eliminar, detalles) ===== */}
      {showEditPriv && (
        <ReusableModal
          open={showEditPriv}
          onClose={() => setShowEditPriv(false)}
          title="Editar Privilegio"
          fields={[{ label: 'PRIVILEGEID', name: 'PRIVILEGEID' }, { label: 'Descripción', name: 'Descripcion' }]}
          initialData={editingPriv}
          onSubmit={() => setShowEditPriv(false)}
          submitButtonText="Guardar"
        />
      )}

      {showConfirmPriv && (
        <AlertModal
          open={showConfirmPriv}
          onClose={() => setShowConfirmPriv(false)}
          title="Confirmar eliminación"
          buttonText="Cerrar"
          message={<Text>¿Está seguro de eliminar el privilegio seleccionado?</Text>}
        />
      )}

      {selectedPrivDetails && (
        <AlertModal
          open={isPrivDetailModalOpen}
          onClose={() => setIsPrivDetailModalOpen(false)}
          title="Detalles del Privilegio"
          buttonText="Cerrar"
          message={
            <FlexBox direction="Column" style={{ gap: '0.5rem' }}>
                <FlexBox>
                <Label>Vista:</Label>
                <Text>{selectedPrivDetails.ViewID}</Text>
              </FlexBox>
              <FlexBox>
                <Label>Proceso:</Label>
                <Text>{selectedPrivDetails.ProcessID}</Text>
              </FlexBox>
              <FlexBox>
                <Label>PRIVILEGIEID:</Label>
                <Text>{selectedPrivDetails.PRIVILEGEID}</Text>
              </FlexBox>
              <FlexBox>
                <Label>Descripción:</Label>
                <Text>{selectedPrivDetails.Descripcion}</Text>
              </FlexBox>
            </FlexBox>
          }
        />
      )}
    </Page>
  );
}
