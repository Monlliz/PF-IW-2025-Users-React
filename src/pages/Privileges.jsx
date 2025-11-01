import React, { useState, useRef, useEffect, useContext } from "react";
import AlertModal from "../components/modals/AlertModal";
import ReusableModal from "../components/modals/ReusableModal";
import styles from "../styles/Roles.module.css";
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
} from "@ui5/webcomponents-react";

import { DbContext } from "../contexts/dbContext";

const viewsData = [
  { VIEWID: "V001", Descripcion: "Vista principal" },
  { VIEWID: "V002", Descripcion: "Panel de control" },
  { VIEWID: "V003", Descripcion: "Vista de reportes" }
];

const processesByView = {
  V001: [
    { PROCESSID: "P001", Descripcion: "Gestión de usuarios" },
    { PROCESSID: "P002", Descripcion: "Carga de datos" }
  ],
  V002: [
    { PROCESSID: "P003", Descripcion: "Monitoreo del sistema" },
    { PROCESSID: "P004", Descripcion: "Configuración avanzada" }
  ],
  V003: [{ PROCESSID: "P005", Descripcion: "Generar informes" }]
};

const privilegesByProcess = {
  P001: [
    { PRIVILEGIEID: "PR001", Descripcion: "Lectura de usuarios" },
    { PRIVILEGIEID: "PR002", Descripcion: "Creación de usuarios" }
  ],
  P002: [{ PRIVILEGIEID: "PR003", Descripcion: "Importar datos" }],
  P003: [
    { PRIVILEGIEID: "PR004", Descripcion: "Monitoreo" },
    { PRIVILEGIEID: "PR005", Descripcion: "Reinicio del sistema" }
  ]
};

/* =======================================================
   SPLITTER LAYOUT (reutilizable)
=========================================================*/
function SplitterLayout({
  children,
  initialLeft = "40%",
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
  };

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

  const [left, right] = React.Children.toArray(children);
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
          overflow: "auto",
          transition: "width 0.2s ease"
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
  const [views, setViews] = useState(viewsData);
  const [filteredViews, setFilteredViews] = useState(viewsData);
  const [selectedView, setSelectedView] = useState(null);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [filteredPrivileges, setFilteredPrivileges] = useState([]);

  
  // Maps loaded from single API route (fallback to the simulated constants)
  const [processesMap, setProcessesMap] = useState(processesByView);
  const [privilegesMap, setPrivilegesMap] = useState(privilegesByProcess);

  // API route, loading and error
  const {dbServer} = useContext(DbContext);
  const apiRoute = `http://localhost:3333/api/application/crud?ProcessType=getAplications&LoggedUser=EMorenoD&dbserver=${dbServer}`;
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

  // Modales
  const [modalType, setModalType] = useState(null); 
  const [modalContext, setModalContext] = useState(null); 
  const [modalData, setModalData] = useState(null);

  const closeModal = () => {
    setModalType(null);
    setModalContext(null);
    setModalData(null);
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

  // Cargar todos los datos desde una sola ruta de API
  const fetchAllData = async () => {
    console.log(dbServer);
    setLoadingData(true);
    setLoadError(null);
    try {
      const res = await fetch(apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send an empty body for now; backend may accept filters later
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const payload = data.data[0].dataRes[0]
        || data
        || {};

      const rawViews = payload.VIEWS;
      const rawProcessesList = payload.PROCESS;

      const loadedViews = (Array.isArray(rawViews) ? rawViews : []).map((v) => {
        const id = v.VIEWSID;
        return {
          VIEWSID: id,
          Descripcion: v.description || "Sin descripcion"
        };
      });

      let builtProcessesMap = {};
        (Array.isArray(rawViews) ? rawViews : []).forEach((v) => {
          const viewId = v.VIEWSID;
          const procArray = v.PROCESS || [];
          if (Array.isArray(procArray) && procArray.length > 0) {
            const mapped = procArray.map((p) => {
              const pid = p.PROCESSID;
              let detail = null;
              if (Array.isArray(rawProcessesList)) {
                detail = rawProcessesList.find((rp) => (rp.PROCESSID) === pid);
              }
              return {
                PROCESSID: pid,
                Descripcion: p.description || "Sin descripcion"
              };
            });
            builtProcessesMap[viewId] = mapped;
          } else {
            builtProcessesMap[viewId] = processesByView[viewId] || [];
          }
        });

      setViews(loadedViews);
      setFilteredViews(loadedViews);
      setProcessesMap(builtProcessesMap);
    } catch (err) {
      // fallback: ya están inicializados con datos simulados
      setLoadError(err.message || String(err));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Seleccionar view → cargar procesos
  const handleViewSelect = (e) => {
    const row = e.detail.row.original;
    const viewKey = row?.VIEWSID;
    setSelectedView({ ...row, VIEWSID: viewKey });
    setFilteredProcesses(processesMap[row?.VIEWSID]);
    setSelectedProcess(null);
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

  return (
    <Page className={styles.pageContainer}>
      <Bar>
        <Title>Gestión de Views, Processes y Privilegios</Title>
      </Bar>

      {/* ===== LAYOUT 1: VIEWS / PROCESSES ===== */}
      <SplitterLayout height="calc(100vh - 70px)">
        {/* Panel izquierdo: Views */}
        <div>
          <Toolbar>
            <Input
              icon="search"
              placeholder="Buscar vista..."
              onInput={(e) => handleSearch(e, views, setFilteredViews)}
              style={{ width: "80%" }}
            />
            <ToolbarSpacer />
          </Toolbar>

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
            <Toolbar>
              <Input
                icon="search"
                placeholder="Buscar proceso..."
                onInput={(e) =>
                  handleSearch(
                    e,
                    processesMap[selectedView?.VIEWSID] || [],
                    setFilteredProcesses
                  )
                }
                style={{ width: "80%" }}
              />
              <ToolbarSpacer />
            </Toolbar>

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
                { Header: "PROCESSID", accessor: "PROCESSID" },
                { Header: "Descripción", accessor: "Descripcion" }
              ]}
              onRowClick={handleProcessSelect}
              visibleRows={8}
            />
          </div>

          {/* Panel derecho: Privilegios */}
          <div>
            <Toolbar>
              <Input
                icon="search"
                placeholder="Buscar privilegio..."
                onInput={(e) =>
                  handleSearch(
                    e,
                    privilegesMap[selectedProcess?.PROCESSID] || [],
                    setFilteredPrivileges
                  )
                }
                style={{ width: "80%" }}
              />
              <ToolbarSpacer />
            </Toolbar>

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
              data={filteredPrivileges}
              columns={[
                { Header: "PRIVILEGIEID", accessor: "PRIVILEGIEID" },
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
            { label: "VIEWID", name: "VIEWID" },
            { label: "Descripción", name: "Descripcion" }
          ]}
          onSubmit={closeModal}
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
            { label: "PROCESSID", name: "PROCESSID" },
            { label: "Descripción", name: "Descripcion" }
          ]}
          onSubmit={closeModal}
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
            { label: "PRIVILEGIEID", name: "PRIVILEGIEID" },
            { label: "Descripción", name: "Descripcion" }
          ]}
          onSubmit={closeModal}
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
          fields={[{ label: 'PRIVILEGIEID', name: 'PRIVILEGIEID' }, { label: 'Descripción', name: 'Descripcion' }]}
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
                <Label>PRIVILEGIEID:</Label>
                <Text>{selectedPrivDetails.PRIVILEGIEID}</Text>
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
