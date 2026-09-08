import { useState, useEffect } from 'react';
import { HeaderActividad } from '../../components/Headers/HeaderActividad/HeaderActividad';
import { Modal } from '../../components/Modal';
import styles from '../../components/admin/AdminPreguntas.module.css';
import modalStyles from './StaffModal.module.css';
import {
  getFollowUpQuestions,
  createFollowUpQuestion,
  updateFollowUpQuestion,
  updateFollowUpQuestionStatus,
  type FollowUpQuestionUpdate
} from '../../services/adminService';

interface Pregunta {
  id: number;
  texto: string;
  categoria: string; // Módulo clínico descriptivo
  prioridad: 'Alta' | 'Medio' | 'Baja';
  tipo_respuesta: string;
  modulo_id?: number | null;
  frecuencia?: string | null;
  es_signo_alarma: boolean;
  prioridad_alerta_default_id?: number | null;
  orden?: number | null;
}

const MODULOS = [
  { id: 1, nombre: 'M1 - Primer Trimestre' },
  { id: 2, nombre: 'M2 - Segundo Trimestre' },
  { id: 3, nombre: 'M3 - Tercer Trimestre' },
  { id: 4, nombre: 'M4 - Parto y Puerperio' },
];

const PRIORIDADES = [
  { id: 1, nombre: 'Baja (Informativa/Seguimiento)' },
  { id: 2, nombre: 'Media (Alerta moderada)' },
  { id: 3, nombre: 'Alta (Signo de alarma crítico)' },
];

const TIPOS_RESPUESTA = [
  { value: 'si_no', label: 'Sí / No (Check)' },
  { value: 'escala_numerica', label: 'Escala numérica (1 - 10)' },
  { value: 'texto_libre', label: 'Texto libre' },
];

const FRECUENCIAS = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'unica', label: 'Única vez' },
];

const getModuloLabel = (id?: number | null) =>
  MODULOS.find(m => m.id === id)?.nombre ?? 'Sin Módulo';

const getPrioridadLabel = (id?: number | null) =>
  PRIORIDADES.find(p => p.id === id)?.nombre ?? 'Baja';

const getTipoRespuestaLabel = (value?: string | null) =>
  TIPOS_RESPUESTA.find(t => t.value === value)?.label ?? (value || '—');

const getFrecuenciaLabel = (value?: string | null) =>
  FRECUENCIAS.find(f => f.value === value)?.label ?? (value || '—');

export const AdminPreguntas = () => {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para el nuevo formulario de creación
  const [form, setForm] = useState({
    descripcion: '',
    moduloId: 1, // M1 por defecto
    frecuencia: 'diaria',
    tipoRespuesta: 'si_no',
    esSignoAlarma: false,
    prioridadAlerta: 1, // Baja
  });

  // Modal de detalle / edición
  const [selected, setSelected] = useState<Pregunta | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<FollowUpQuestionUpdate>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchPreguntas = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getFollowUpQuestions({ page: 1, size: 100 });
      const mapped = data.filter(q => q.activo).map((q) => {
        let prioridad: 'Alta' | 'Medio' | 'Baja' = 'Baja';
        if (q.prioridad_alerta_default_id === 3) prioridad = 'Alta';
        else if (q.prioridad_alerta_default_id === 2) prioridad = 'Medio';

        const categoria = getModuloLabel(q.modulo_id);

        return {
          id: q.id,
          texto: q.texto_pregunta,
          categoria,
          prioridad,
          tipo_respuesta: q.tipo_respuesta,
          modulo_id: q.modulo_id,
          frecuencia: q.frecuencia,
          es_signo_alarma: q.es_signo_alarma,
          prioridad_alerta_default_id: q.prioridad_alerta_default_id,
          orden: q.orden,
        };
      });
      setPreguntas(mapped);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al cargar preguntas del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreguntas();
  }, []);

  const guardar = async () => {
    if (!form.descripcion) return;
    setErrorMsg(null);

    try {
      await createFollowUpQuestion({
        texto_pregunta: form.descripcion,
        tipo_respuesta: form.tipoRespuesta,
        modulo_id: Number(form.moduloId),
        frecuencia: form.frecuencia,
        es_signo_alarma: form.esSignoAlarma,
        prioridad_alerta_default_id: Number(form.prioridadAlerta),
        orden: 0
      });
      // Reset form
      setForm({
        descripcion: '',
        moduloId: 1,
        frecuencia: 'diaria',
        tipoRespuesta: 'si_no',
        esSignoAlarma: false,
        prioridadAlerta: 2,
      });
      await fetchPreguntas();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al guardar la pregunta en el servidor.');
    }
  };

  const eliminar = async (id: number) => {
    setErrorMsg(null);
    try {
      await updateFollowUpQuestionStatus(id, false);
      await fetchPreguntas();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al eliminar la pregunta en el servidor.');
    }
  };

  const verDetalle = (p: Pregunta) => {
    setSelected(p);
    setIsEditing(false);
    setSaveError(null);
  };

  const cerrarModal = () => {
    setSelected(null);
    setIsEditing(false);
    setSaveError(null);
  };

  const iniciarEdicion = () => {
    if (!selected) return;
    setEditForm({
      texto_pregunta: selected.texto,
      tipo_respuesta: selected.tipo_respuesta,
      modulo_id: selected.modulo_id,
      frecuencia: selected.frecuencia,
      es_signo_alarma: selected.es_signo_alarma,
      prioridad_alerta_default_id: selected.prioridad_alerta_default_id,
      orden: selected.orden,
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const guardarEdicion = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateFollowUpQuestion(selected.id, editForm);
      await fetchPreguntas();
      cerrarModal();
    } catch (err: any) {
      console.error(err);
      setSaveError('Error al actualizar la pregunta en el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const colorPrioridad = (p: string): React.CSSProperties => {
    if (p === 'Alta')  return { background: '#e53935', color: 'white' };
    if (p === 'Medio') return { background: '#fb8c00', color: 'white' };
    return { background: '#43a047', color: 'white' };
  };

  const alta  = preguntas.filter(p => p.prioridad === 'Alta').length;
  const medio = preguntas.filter(p => p.prioridad === 'Medio').length;
  const baja  = preguntas.filter(p => p.prioridad === 'Baja').length;
  const cats  = [...new Set(preguntas.map(p => p.categoria))];

  return (
    <div className={styles.root}>
      <HeaderActividad rol="medico" tabActivo="Preguntas" />

      <div className={styles.grid}>
        {/* Columna Izquierda: Formulario de Registro */}
        <div className={styles.leftCol}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Formular Preguntas de Seguimiento</h2>
            <p className={styles.secDesc}>
              Registra preguntas de control diario/semanal que las gestantes responderán para el monitoreo clínico.
            </p>
            {errorMsg && <p style={{ color: '#dc2626', fontSize: '13px', margin: '8px 0', fontWeight: '500' }}>⚠️ {errorMsg}</p>}
            {loading && <p style={{ color: '#666', fontSize: '12px', margin: '8px 0' }}>Cargando preguntas...</p>}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Pregunta</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Ej: ¿Has tenido dolor de cabeza constante hoy?"
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  style={{ height: '110px' }}
                />
              </div>

              <div className={styles.formRightGroup}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Módulo de la Gestante</label>
                  <select
                    className={styles.select}
                    value={form.moduloId}
                    onChange={e => setForm({ ...form, moduloId: Number(e.target.value) })}
                  >
                    {MODULOS.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Frecuencia de Pregunta</label>
                  <select
                    className={styles.select}
                    value={form.frecuencia}
                    onChange={e => setForm({ ...form, frecuencia: e.target.value })}
                  >
                    {FRECUENCIAS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.formRow} style={{ marginTop: '10px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo de Respuesta</label>
                <select
                  className={styles.select}
                  value={form.tipoRespuesta}
                  onChange={e => setForm({ ...form, tipoRespuesta: e.target.value })}
                >
                  {TIPOS_RESPUESTA.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Prioridad de Alerta</label>
                <select
                  className={styles.select}
                  value={form.prioridadAlerta}
                  onChange={e => setForm({ ...form, prioridadAlerta: Number(e.target.value) })}
                >
                  {PRIORIDADES.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '15px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="esSignoAlarma"
                checked={form.esSignoAlarma}
                onChange={e => setForm({
                  ...form,
                  esSignoAlarma: e.target.checked,
                  // Si es signo de alarma, sube automáticamente la prioridad a Moderada/Alta
                  prioridadAlerta: e.target.checked ? (form.prioridadAlerta === 2 ? 3 : form.prioridadAlerta) : form.prioridadAlerta
                })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="esSignoAlarma" className={styles.label} style={{ cursor: 'pointer', userSelect: 'none' }}>
                ¿Es un signo de alarma crítico? (Generará alerta para el equipo médico si responde afirmativo)
              </label>
            </div>

            <div className={styles.formFooter}>
              <button className={styles.guardarBtn} onClick={guardar} disabled={!form.descripcion}>
                Registrar Pregunta
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Resumen de Preguntas Activas</h2>
            <p className={styles.secDesc}>Visualización del catálogo actual por prioridad y módulo clínico.</p>

            <div className={styles.resumenGrid}>
              <div>
                <div className={styles.totalBox}>
                  <span className={styles.totalLabel}>Total registradas</span>
                  <span className={styles.totalNum}>{preguntas.length}</span>
                </div>
                <p className={styles.label}>Por Prioridad</p>
                <table className={styles.resumenTable}>
                  <tbody>
                    <tr>
                      <td className={styles.resumenLabel}>Alta Prioridad</td>
                      <td className={styles.resumenVal}>{alta}</td>
                    </tr>
                    <tr>
                      <td className={styles.resumenLabel}>Media Prioridad</td>
                      <td className={styles.resumenVal}>{medio}</td>
                    </tr>
                    <tr>
                      <td className={styles.resumenLabel}>Baja Prioridad</td>
                      <td className={styles.resumenVal}>{baja}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <p className={styles.label}>Por Módulo Clínico</p>
                <table className={styles.resumenTable}>
                  <tbody>
                    {cats.map(cat => (
                      <tr key={cat}>
                        <td className={styles.resumenLabel}>{cat}</td>
                        <td className={styles.resumenVal}>
                          {preguntas.filter(p => p.categoria === cat).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Preguntas Registradas */}
        <div className={`${styles.panel} ${styles.panelScroll}`}>
          <h2 className={styles.panelTitle}>Catálogo de Preguntas</h2>
          <p className={styles.secDesc}>Administra las preguntas clínicas asignadas a cada etapa.</p>

          {/* Aviso: solo se muestran preguntas activas */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '10px 12px', background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: '8px', marginBottom: '12px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '1px', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ margin: 0, fontSize: '11px', color: '#0369a1', lineHeight: '1.5' }}>
              Mostrando <strong>{preguntas.length} preguntas activas</strong>. Las preguntas desactivadas no se listan aquí, pero siguen en el sistema. Puedes desactivar una pregunta desde el modal de edición.
            </p>
          </div>

          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Módulo</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {preguntas.map(p => (
                <tr
                  key={p.id}
                  onClick={() => verDetalle(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.pregTexto}>{p.texto}</td>
                  <td className={styles.pregCat}>{p.categoria.split(' - ')[0]}</td>
                  <td>
                    <span className={styles.badge} style={colorPrioridad(p.prioridad)}>
                      {p.prioridad}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.accionBtn}
                      onClick={(e) => { e.stopPropagation(); eliminar(p.id); }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalle / edición */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={cerrarModal}
          title={isEditing ? 'Editar Pregunta' : 'Detalle de la Pregunta'}
        >
          {!isEditing ? (
            <div className={modalStyles.form}>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Texto de la pregunta</span>
                <span>{selected.texto}</span>
              </div>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Tipo de respuesta</span>
                <span>{getTipoRespuestaLabel(selected.tipo_respuesta)}</span>
              </div>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Módulo</span>
                <span>{getModuloLabel(selected.modulo_id)}</span>
              </div>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Frecuencia</span>
                <span>{getFrecuenciaLabel(selected.frecuencia)}</span>
              </div>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>¿Es signo de alarma?</span>
                <span>{selected.es_signo_alarma ? 'Sí' : 'No'}</span>
              </div>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Prioridad de alerta</span>
                <span>{getPrioridadLabel(selected.prioridad_alerta_default_id)}</span>
              </div>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Orden</span>
                <span>{selected.orden ?? '—'}</span>
              </div>

              {saveError && <p className={modalStyles.error}>{saveError}</p>}

              <div className={modalStyles.actions}>
                <button type="button" className={modalStyles.cancelBtn} onClick={cerrarModal}>
                  Cerrar
                </button>
                <button type="button" className={modalStyles.submitBtn} onClick={iniciarEdicion}>
                  Editar
                </button>
              </div>
            </div>
          ) : (
            <form
              className={modalStyles.form}
              onSubmit={(e) => { e.preventDefault(); guardarEdicion(); }}
            >
              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Texto de la pregunta</label>
                <textarea
                  className={modalStyles.input}
                  value={editForm.texto_pregunta ?? ''}
                  onChange={e => setEditForm({ ...editForm, texto_pregunta: e.target.value })}
                />
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Tipo de respuesta</label>
                <select
                  className={modalStyles.select}
                  value={editForm.tipo_respuesta ?? ''}
                  onChange={e => setEditForm({ ...editForm, tipo_respuesta: e.target.value })}
                >
                  {TIPOS_RESPUESTA.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Módulo</label>
                <select
                  className={modalStyles.select}
                  value={editForm.modulo_id ?? ''}
                  onChange={e => setEditForm({ ...editForm, modulo_id: Number(e.target.value) })}
                >
                  {MODULOS.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Frecuencia</label>
                <select
                  className={modalStyles.select}
                  value={editForm.frecuencia ?? ''}
                  onChange={e => setEditForm({ ...editForm, frecuencia: e.target.value })}
                >
                  {FRECUENCIAS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>
                  <input
                    type="checkbox"
                    checked={!!editForm.es_signo_alarma}
                    onChange={e => setEditForm({ ...editForm, es_signo_alarma: e.target.checked })}
                  />{' '}
                  ¿Es signo de alarma?
                </label>
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Prioridad de alerta</label>
                <select
                  className={modalStyles.select}
                  value={editForm.prioridad_alerta_default_id ?? ''}
                  onChange={e => setEditForm({ ...editForm, prioridad_alerta_default_id: Number(e.target.value) })}
                >
                  {PRIORIDADES.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Orden</label>
                <input
                  type="number"
                  className={modalStyles.input}
                  value={editForm.orden ?? 0}
                  onChange={e => setEditForm({ ...editForm, orden: Number(e.target.value) })}
                />
              </div>

              {saveError && <p className={modalStyles.error}>{saveError}</p>}

              <div className={modalStyles.actions}>
                <button type="button" className={modalStyles.cancelBtn} onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className={modalStyles.submitBtn} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};