import React, { useState, useRef, useEffect, useContext } from "react";
import AlertModal from "../components/modals/AlertModal";
import ReusableModal from "../components/modals/ReusableModal";
import styles from "../styles/Roles.module.css";
import { fetchPrivilegesData } from "../services/privilegesService";
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
  Option
} from "@ui5/webcomponents-react";

import { DbContext } from "../contexts/dbContext";

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
  // Application state
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  
  // Data states
  const [views, setViews] = useState([]);
  const [filteredViews, setFilteredViews] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [filteredPrivileges, setFilteredPrivileges] = useState([]);

  
  // Maps loaded from single API route (fallback to the simulated constants)
  const [processesMap, setProcessesMap] = useState([]);
  const [privilegesMap, setPrivilegesMap] = useState([]);

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

  // Cargar datos
  const loadAllData = async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const data = await fetchPrivilegesData(dbServer);
      
      setApplications(data.applications || []);
      setViews(data.views || []);
      setProcessesMap(data.processesMap || {});
      setPrivilegesMap(data.privilegesMap || {});
      
      // Si hay una aplicación seleccionada, filtramos las vistas
      if (selectedApp) {
        const appViews = (data.views || []).filter(v => v.APPID === selectedApp.APPID);
        setFilteredViews(appViews);
      } else {
        setFilteredViews([]);
      }
    } catch (err) {
      setLoadError(err.message || String(err));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [dbServer]); // Recargar cuando cambie el servidor

  // Seleccionar view → cargar procesos
  const handleViewSelect = (e) => {
    const row = e.detail.row.original;
    const viewKey = row?.VIEWSID;
    setSelectedView({ ...row, VIEWSID: viewKey });
    setFilteredProcesses(processesMap[viewKey] || []);
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

    const selectedApp = applications.find(app => app.APPID === appId);
    
    if (selectedApp) {
      setSelectedApp(selectedApp);
      
      // Filtrar vistas por aplicación
      const appViews = views.filter(v => v.APPID === appId);
      setFilteredViews(appViews);
      
      // Resetear otras selecciones
      setSelectedView(null);
      setSelectedProcess(null);
      setSelectedPrivilege(null);
      setFilteredProcesses([]);
      setFilteredPrivileges([]);
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
              data={filteredPrivileges.map(priv => ({
                ...priv,
                ViewID: selectedView?.VIEWSID || '',
                ProcessID: selectedProcess?.PROCESSID || ''
              }))}
              columns={[
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
            { label: "PRIVILEGEID", name: "PRIVILEGEID" },
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
