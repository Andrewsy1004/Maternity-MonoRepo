import { useState, useEffect } from 'react';
import { HeaderActividad } from '../../components/Headers/HeaderActividad/HeaderActividad';
import styles from '../../components/admin/AdminCargas.module.css';
import {
  uploadExcel,
  getHistorialCargas,
  getDetalleCarga,
  exportGestantes,
  exportIndicators,
  type CargaExcelResponse,
  type CargaExcelDetalleResponse,
} from '../../services/adminService';
import { downloadBlob, buildExportFilename } from '../../utils/exportUtils';

// ─── SVG Icons ───
const SvgDownload = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SvgRefresh = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

export const AdminCargas = () => {
  // ─── Excel Cargas State ───
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cargas, setCargas] = useState<CargaExcelResponse[]>([]);
  const [selectedCarga, setSelectedCarga] = useState<CargaExcelDetalleResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [loadingCargas, setLoadingCargas] = useState(true);

  const handleExportData = async (format: 'xlsx' | 'csv') => {
    setExporting(true);
    try {
      const blob = await exportGestantes(format);
      downloadBlob(blob, buildExportFilename('gestantes', format));
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al exportar datos de gestantes.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportIndicatorsData = async () => {
    setExporting(true);
    try {
      const blob = await exportIndicators('xlsx');
      downloadBlob(blob, buildExportFilename('indicadores', 'xlsx'));
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al exportar indicadores.');
    } finally {
      setExporting(false);
    }
  };

  const fetchCargas = async () => {
    setLoadingCargas(true);
    try {
      const data = await getHistorialCargas();
      setCargas(data);
    } catch (err) {
      console.error('Error fetching historial cargas:', err);
    } finally {
      setLoadingCargas(false);
    }
  };

  useEffect(() => {
    fetchCargas();
  }, []);

  // ─── Excel Cargas Handlers ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await uploadExcel(file);
      setFile(null);
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setSuccessMsg('¡Archivo cargado y procesado exitosamente! Revisa el historial para ver el detalle de cada fila.');
      await fetchCargas();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectCarga = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const detalle = await getDetalleCarga(id);
      setSelectedCarga(detalle);
    } catch (err) {
      console.error('Error fetching detalle carga:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className={styles.root}>
      <HeaderActividad rol="medico" tabActivo="Cargas" />

      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          {/* Panel Izquierdo: Subir Excel e Historial */}
          <div className={`${styles.panel} ${styles.panelLeft}`}>
            {/* Sección: Exportaciones */}
            <div style={{ marginBottom: '20px' }}>
              <h2 className={styles.panelTitle} style={{ marginBottom: '12px' }}>Exportar Datos</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={styles.exportBtn}
                  onClick={() => handleExportData('xlsx')}
                  disabled={exporting}
                  title="Exportar base de datos de gestantes (Excel)"
                >
                  Excel
                </button>
                <button
                  className={styles.exportBtn}
                  onClick={() => handleExportData('csv')}
                  disabled={exporting}
                  title="Exportar base de datos de gestantes (CSV)"
                >
                  CSV
                </button>
                <button
                  className={styles.exportBtn}
                  onClick={handleExportIndicatorsData}
                  disabled={exporting}
                  title="Exportar indicadores del programa (Excel)"
                >
                  Indicadores
                </button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '20px', marginTop: '0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 className={styles.panelTitle} style={{ margin: 0 }}>Carga Masiva</h2>
              <a
                href="/plantilla_carga_masiva.xlsx"
                download="plantilla_carga_masiva.xlsx"
                style={{
                  color: '#CA436E',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <SvgDownload size={16} />
                Descargar Plantilla (.xlsx)
              </a>
            </div>

            <div className={styles.uploadSection}>
              <label htmlFor="excel-upload" className={styles.fileInputLabel}>
                {file ? file.name : 'Haz clic para seleccionar archivo .xlsx'}
              </label>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              {errorMsg && <p className={styles.errorMessage}>{errorMsg}</p>}
              {successMsg && <p className={styles.successMessage}>{successMsg}</p>}
              <button
                className={styles.uploadBtn}
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? 'Procesando archivo...' : 'Cargar Excel'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '10px' }}>
              <h2 className={styles.panelTitle} style={{ margin: 0 }}>Historial</h2>
              <button
                onClick={fetchCargas}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: '1px solid #CA436E',
                  borderRadius: '15px',
                  color: '#CA436E',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600'
                }}
              >
                <SvgRefresh size={14} />
                Refrescar
              </button>
            </div>
            <div style={{ overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCargas ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td><div style={{ height: '12px', background: '#f0f0f0', borderRadius: '6px', width: '80%' }} /></td>
                        <td><div style={{ height: '12px', background: '#f0f0f0', borderRadius: '6px', width: '60%' }} /></td>
                        <td><div style={{ height: '12px', background: '#f0f0f0', borderRadius: '6px', width: '50%' }} /></td>
                      </tr>
                    ))
                  ) : cargas.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div style={{ textAlign: 'center', padding: '30px 16px', color: '#bbb' }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <p style={{ fontSize: '12px', margin: 0 }}>No hay cargas registradas.</p>
                          <p style={{ fontSize: '11px', color: '#ccc', margin: '4px 0 0' }}>Sube un archivo Excel para comenzar.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cargas.map((carga) => (
                      <tr
                        key={carga.id}
                        className={`${styles.row} ${selectedCarga?.id === carga.id ? styles.rowSelected : ''}`}
                        onClick={() => handleSelectCarga(carga.id)}
                      >
                        <td>{carga.archivo_nombre}</td>
                        <td>{carga.created_at ? new Date(carga.created_at).toLocaleDateString() : '-'}</td>
                        <td>
                          <span className={`${styles.badge} ${carga.estado === 'completado' ? styles.completado : styles.error}`}>
                            {carga.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel Derecho: Detalles de la Carga Seleccionada */}
          <div className={`${styles.panel} ${styles.panelRight}`}>
            {isLoadingDetails ? (
              <div className={styles.emptyState}>Cargando detalles...</div>
            ) : selectedCarga ? (
              <>
                <div className={styles.detailHeader}>
                  <h2 className={styles.panelTitle}>Detalle de Carga</h2>
                  <span className={styles.badge}>{selectedCarga.archivo_nombre}</span>
                </div>

                <div className={styles.detailStats}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{selectedCarga.total_gestantes ?? 0}</div>
                    <div className={styles.statLabel}>Total Gestantes</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{selectedCarga.nuevas ?? 0}</div>
                    <div className={styles.statLabel}>Nuevas</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{selectedCarga.actualizadas ?? 0}</div>
                    <div className={styles.statLabel}>Actualizadas</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{selectedCarga.errores ?? 0}</div>
                    <div className={styles.statLabel}>Errores</div>
                  </div>
                </div>

                {selectedCarga.detalles && (() => {
                  const filasConError = selectedCarga.detalles.filter(
                    d => d.estado !== 'ok' && d.mensaje_error
                  );
                  return (
                    <>
                      <h3 className={styles.errorsTitle}>Registro de Problemas</h3>
                      {filasConError.length === 0 ? (
                        <p style={{ color: '#2e7d32', fontWeight: '500', marginTop: '8px' }}>
                          ✅ Todas las filas se procesaron correctamente, sin errores.
                        </p>
                      ) : (
                        <div className={styles.errorList}>
                          {filasConError.map((detalle, idx) => (
                            <div key={idx} className={styles.errorItem}>
                              <div className={styles.errorLocation}>
                                {detalle.hoja} - Fila {detalle.fila_numero}
                              </div>
                              <div className={styles.errorMessage}>
                                {detalle.mensaje_error}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>Selecciona una carga del historial para ver sus detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};