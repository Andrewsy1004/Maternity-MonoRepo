import { useState, useEffect } from 'react';
import { HeaderActividad } from '../../components/Headers/HeaderActividad/HeaderActividad';
import { Modal } from '../../components/Modal';
import styles from '../../components/admin/AdminOBA.module.css';
import modalStyles from './StaffModal.module.css';
import {
  getEducationalCategories,
  createEducationalCategory,
  updateEducationalCategory,
  getEducationalContents,
  createEducationalContent,
  updateEducationalContent,
  updateEducationalContentStatus,
  getModulosClinicos,
  type EducationalCategoryResponse,
  type EducationalContentResponse,
  type CatalogoItem,
} from '../../services/adminService';

export const AdminOBA = () => {
  const [categorias, setCategorias] = useState<EducationalCategoryResponse[]>([]);
  const [catActiva, setCatActiva] = useState<EducationalCategoryResponse | null>(null);
  const [contenido, setContenido] = useState<EducationalContentResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modulosClinicos, setModulosClinicos] = useState<CatalogoItem[]>([]);

  // ─── Toast notifications ───────────────────────────────────────────────
  const [obaToasts, setObaToasts] = useState<Array<{ id: number; msg: string; type: 'success' | 'error' }>>([]);
  let _obaToastId = 0;
  const addObaToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++_obaToastId;
    setObaToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setObaToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Modales
  const [modalCatOpen, setModalCatOpen] = useState(false);
  const [modalContOpen, setModalContOpen] = useState(false);
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);

  // Edición / Previsualización
  const [editingCategory, setEditingCategory] = useState<EducationalCategoryResponse | null>(null);
  const [editingContent, setEditingContent] = useState<EducationalContentResponse | null>(null);
  const [previewContent, setPreviewContent] = useState<EducationalContentResponse | null>(null);

  // Form Categoría
  const [catNombre, setCatNombre] = useState('');
  const [catDescripcion, setCatDescripcion] = useState('');
  const [catIcono, setCatIcono] = useState('');
  const [catOrden, setCatOrden] = useState('0');

  // Form Contenido
  const [contTitulo, setContTitulo] = useState('');
  const [contDescripcion, setContDescripcion] = useState('');
  const [contTipo, setContTipo] = useState<'VIDEO' | 'ARTÍCULO'>('ARTÍCULO');
  const [contCuerpo, setContCuerpo] = useState('');
  const [contUrlRecurso, setContUrlRecurso] = useState('');
  const [contUrlImagen, setContUrlImagen] = useState('');
  const [contSemanaInicio, setContSemanaInicio] = useState('1');
  const [contSemanaFin, setContSemanaFin] = useState('40');
  const [contDuracion, setContDuracion] = useState('5');
  const [contOrden, setContOrden] = useState('0');
  const [contCatId, setContCatId] = useState<string>('');
  const [contModuloId, setContModuloId] = useState<string>('');

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await getEducationalCategories();
      setCategorias(cats);

      const conts = await getEducationalContents();
      setContenido(conts);

      if (cats.length > 0) {
        // Mantener seleccionada la categoría previa si existe, o la primera
        setCatActiva(prev => {
          if (prev) {
            const encontrada = cats.find(c => c.id === prev.id);
            if (encontrada) return encontrada;
          }
          return cats[0];
        });
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    getModulosClinicos()
      .then(mods => setModulosClinicos(mods.filter(m => m.activo)))
      .catch(() => {/* Si falla usamos fallback */});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [catActiva]);

  // Abrir Modal de Categoría
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatNombre('');
    setCatDescripcion('');
    setCatIcono('');
    setCatOrden('0');
    setModalCatOpen(true);
  };

  const openEditCategory = (cat: EducationalCategoryResponse) => {
    setEditingCategory(cat);
    setCatNombre(cat.nombre);
    setCatDescripcion(cat.descripcion || '');
    setCatIcono(cat.icono || '');
    setCatOrden(cat.orden?.toString() || '0');
    setModalCatOpen(true);
  };

  // Guardar Categoría
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = {
        nombre: catNombre,
        descripcion: catDescripcion || null,
        icono: catIcono || null,
        orden: parseInt(catOrden) || 0
      };

      if (editingCategory) {
        await updateEducationalCategory(editingCategory.id, data);
        addObaToast('✅ Categoría actualizada correctamente.');
      } else {
        await createEducationalCategory(data);
        addObaToast('✅ Categoría creada correctamente.');
      }
      setModalCatOpen(false);
      cargarDatos();
    } catch (err) {
      console.error(err);
      setError('Error al guardar la categoría.');
      addObaToast('Error al guardar la categoría.', 'error');
    }
  };

  // Abrir Modal de Contenido
  const openCreateContent = () => {
    setEditingContent(null);
    setContTitulo('');
    setContDescripcion('');
    setContTipo('ARTÍCULO');
    setContCuerpo('');
    setContUrlRecurso('');
    setContUrlImagen('');
    setContSemanaInicio('1');
    setContSemanaFin('40');
    setContDuracion('5');
    setContOrden('0');
    setContCatId(catActiva?.id.toString() || '');
    setContModuloId('');
    setModalContOpen(true);
  };

  const openEditContent = (c: EducationalContentResponse) => {
    setEditingContent(c);
    setContTitulo(c.titulo);
    setContDescripcion(c.descripcion || '');
    const t = (c.tipo_contenido ?? '').toUpperCase().trim();
    setContTipo((t === 'VIDEO' || t === 'VIDEO') ? 'VIDEO' : 'ARTÍCULO');
    setContCuerpo(c.cuerpo_texto || '');
    setContUrlRecurso(c.url_recurso || '');
    setContUrlImagen(c.url_imagen || '');
    setContSemanaInicio(c.semana_eg_inicio?.toString() || '1');
    setContSemanaFin(c.semana_eg_fin?.toString() || '40');
    setContDuracion(c.duracion_minutos?.toString() || '5');
    setContOrden(c.orden?.toString() || '0');
    setContCatId(c.categoria_id?.toString() || '');
    setContModuloId(c.modulo_id?.toString() || '');
    setModalContOpen(true);
  };

  // Guardar Contenido
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = {
        categoria_id: parseInt(contCatId) || null,
        titulo: contTitulo,
        descripcion: contDescripcion || null,
        tipo_contenido: contTipo === 'VIDEO' ? 'video' : 'articulo',
        cuerpo_texto: contCuerpo || null,
        url_recurso: contUrlRecurso || null,
        url_imagen: contUrlImagen || null,
        semana_eg_inicio: parseInt(contSemanaInicio) || null,
        semana_eg_fin: parseInt(contSemanaFin) || null,
        duracion_minutos: parseInt(contDuracion) || null,
        orden: parseInt(contOrden) || 0,
        modulo_id: parseInt(contModuloId) || null
      };

      if (editingContent) {
        await updateEducationalContent(editingContent.id, data);
        addObaToast('✅ Contenido actualizado correctamente.');
      } else {
        await createEducationalContent(data);
        addObaToast('✅ Contenido creado correctamente.');
      }
      setModalContOpen(false);
      cargarDatos();
    } catch (err) {
      console.error(err);
      setError('Error al guardar el contenido.');
      addObaToast('Error al guardar el contenido.', 'error');
    }
  };

  // Toggle estado (activo/desactivo)
  const handleToggleStatus = async (c: EducationalContentResponse) => {
    try {
      await updateEducationalContentStatus(c.id, !c.activo);
      addObaToast(c.activo ? 'Contenido desactivado.' : '✅ Contenido activado.');
      cargarDatos();
    } catch (err) {
      console.error(err);
      setError('Error al cambiar el estado del contenido.');
      addObaToast('Error al cambiar el estado.', 'error');
    }
  };

  const filtrado = contenido.filter(c => c.categoria_id === catActiva?.id);

  const totalPages = Math.ceil(filtrado.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFiltrado = filtrado.slice(startIndex, endIndex);

  const getImagenUrl = (c: EducationalContentResponse) => {
    if (c.url_imagen) return c.url_imagen;
    const t = (c.tipo_contenido ?? '').toUpperCase().trim();
    return t === 'VIDEO'
      ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=200&fit=crop'
      : 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop';
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 12) {
      return `https://www.youtube.com/embed/${match[2].substring(0, 11)}`;
    } else if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  return (
    <div className={styles.root}>
      {/* Toast Layer */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        {obaToasts.map(t => (
          <div key={t.id} style={{
            padding: '11px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            background: t.type === 'success' ? '#16a34a' : '#dc2626',
            minWidth: '220px', pointerEvents: 'auto',
            animation: 'slideDownIn 0.3s ease-out'
          }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/*header con tabs*/}
      <HeaderActividad rol="medico" tabActivo="OVA" />

      {/* Mensaje de error general */}
      {error && (
        <div style={{ margin: '14px 28px 0', padding: '10px 14px', background: '#fdeded', border: '1px solid #ef5350', borderRadius: '8px', color: '#d32f2f', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className={styles.grid}>

        {/*categoriass en el panel izquierdo*/}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Categorías OVA</p>
          <div className={styles.catList}>
            {loading && categorias.length === 0 ? (
              <p className={styles.emptyMsg}>Cargando...</p>
            ) : categorias.length === 0 ? (
              <p className={styles.emptyMsg}>No hay categorías.</p>
            ) : (
              categorias.map(cat => (
                <div
                  key={cat.id}
                  className={`${styles.catItem} ${catActiva?.id === cat.id ? styles.catItemSel : ''}`}
                  onClick={() => setCatActiva(cat)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.nombre}
                  </span>
                  <button
                    className={styles.iconBtn}
                    style={{ padding: '2px', marginLeft: '6px' }}
                    title="Editar Categoría"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCategory(cat);
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            className={styles.newBtn}
            style={{ marginTop: '14px', padding: '6px 12px', fontSize: '12px' }}
            onClick={openCreateCategory}
          >
            + Nueva Categoría
          </button>
        </div>

        {/*contenido en el panel derecho*/}
        <div className={`${styles.panel} ${styles.panelScroll}`}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>Contenido: {catActiva?.nombre || 'Seleccione'}</h2>
            <button className={styles.newBtn} onClick={openCreateContent} disabled={!catActiva}>
              + Nuevo Contenido
            </button>
          </div>

          {loading ? (
            <p className={styles.emptyMsg}>Cargando contenidos...</p>
          ) : filtrado.length === 0 ? (
            <p className={styles.emptyMsg}>No hay contenido para esta categoría.</p>
          ) : (
            <>
              <div className={styles.obaGrid}>
                {paginatedFiltrado.map(c => (
                  <div
                    key={c.id}
                    className={styles.obaCard}
                    style={{ opacity: c.activo ? 1 : 0.6, cursor: 'pointer' }}
                    onClick={() => {
                      setPreviewContent(c);
                      setModalPreviewOpen(true);
                    }}
                  >
                    <div className={styles.imgWrap}>
                      <img src={getImagenUrl(c)} alt={c.titulo} className={styles.img} />
                      <span className={styles.badge}>{(c.tipo_contenido ?? '').toUpperCase()}</span>
                      {c.modulo_id && (
                        <span className={styles.badge} style={{ background: '#7C3AED', left: 'auto', right: '10px' }}>
                          {modulosClinicos.find(m => String(m.id) === String(c.modulo_id))?.codigo
                            ? `${modulosClinicos.find(m => String(m.id) === String(c.modulo_id))?.codigo} (${modulosClinicos.find(m => String(m.id) === String(c.modulo_id))?.nombre})`
                            : `Módulo ${c.modulo_id}`}
                        </span>
                      )}
                      {(c.tipo_contenido ?? '').toUpperCase().trim() === 'VIDEO' && (
                        <div className={styles.playBtn}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{c.titulo}</h3>
                      <p className={styles.cardDesc}>{c.descripcion}</p>
                      <p style={{ fontSize: '11px', color: '#888', margin: '0 0 10px' }}>
                        Duración: {c.duracion_minutos} min
                      </p>
                      <div className={styles.cardActions}>
                        {/* Vista Previa */}
                        <button
                          className={styles.iconBtn}
                          title="Vista Previa"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewContent(c);
                            setModalPreviewOpen(true);
                          }}
                          style={{ color: '#0284c7' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* Estado activo/inactivo */}
                        <button
                          className={styles.iconBtn}
                          title={c.activo ? "Desactivar" : "Activar"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(c);
                          }}
                          style={{ color: c.activo ? '#10b981' : '#ef4444' }}
                        >
                          {c.activo ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                          )}
                        </button>

                        {/* Editar */}
                        <button
                          className={styles.iconBtn}
                          title="Editar"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditContent(c);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ← Anterior
                  </button>
                  
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`${styles.pageNumberBtn} ${currentPage === page ? styles.pageNumberBtnActive : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── MODAL CATEGORÍA ── */}
      <Modal
        isOpen={modalCatOpen}
        onClose={() => setModalCatOpen(false)}
        title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
      >
        <form onSubmit={handleSaveCategory} className={modalStyles.form}>
          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Nombre de la Categoría *</label>
            <input
              type="text"
              required
              className={modalStyles.input}
              value={catNombre}
              onChange={e => setCatNombre(e.target.value)}
              placeholder="Ej. Nutrición"
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Descripción</label>
            <input
              type="text"
              className={modalStyles.input}
              value={catDescripcion}
              onChange={e => setCatDescripcion(e.target.value)}
              placeholder="Descripción opcional"
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Icono (Nombre de icono)</label>
            <input
              type="text"
              className={modalStyles.input}
              value={catIcono}
              onChange={e => setCatIcono(e.target.value)}
              placeholder="Ej. heart, activity, book"
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Orden de prioridad</label>
            <input
              type="number"
              className={modalStyles.input}
              value={catOrden}
              onChange={e => setCatOrden(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className={modalStyles.actions}>
            <button type="button" className={modalStyles.cancelBtn} onClick={() => setModalCatOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className={modalStyles.submitBtn}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL CONTENIDO ── */}
      <Modal
        isOpen={modalContOpen}
        onClose={() => setModalContOpen(false)}
        title={editingContent ? "Editar Recurso Educativo" : "Nuevo Recurso Educativo"}
      >
        <form onSubmit={handleSaveContent} className={modalStyles.form}>
          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Categoría *</label>
            <select
              required
              className={modalStyles.select}
              value={contCatId}
              onChange={e => setContCatId(e.target.value)}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Título *</label>
            <input
              type="text"
              required
              className={modalStyles.input}
              value={contTitulo}
              onChange={e => setContTitulo(e.target.value)}
              placeholder="Título del artículo o video"
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Descripción corta</label>
            <input
              type="text"
              className={modalStyles.input}
              value={contDescripcion}
              onChange={e => setContDescripcion(e.target.value)}
              placeholder="Resumen del recurso"
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Tipo de contenido</label>
            <select
              className={modalStyles.select}
              value={contTipo}
              onChange={e => setContTipo(e.target.value as 'VIDEO' | 'ARTÍCULO')}
            >
              <option value="ARTÍCULO">Artículo</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Módulo Clínico (Fase Gestacional BD)</label>
            <select
              className={modalStyles.select}
              value={contModuloId}
              onChange={e => setContModuloId(e.target.value)}
            >
              <option value="">Ninguno / General</option>
              {modulosClinicos.length > 0
                ? modulosClinicos.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.codigo} - {m.nombre}
                      {m.semana_eg_inicio != null && m.semana_eg_fin != null
                        ? ` (Sem. ${m.semana_eg_inicio}-${m.semana_eg_fin})`
                        : m.semana_eg_inicio != null
                        ? ` (Sem. ${m.semana_eg_inicio}+)`
                        : ''}
                    </option>
                  ))
                : (
                  <>
                    <option value="1">M1 - Primer Trimestre (Semanas 0-13)</option>
                    <option value="2">M2 - Segundo Trimestre (Semanas 14-27)</option>
                    <option value="3">M3 - Tercer Trimestre (Semanas 28-42)</option>
                    <option value="4">M4 - Parto y Puerperio</option>
                  </>
                )
              }
            </select>
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Cuerpo / Texto del Artículo</label>
            <textarea
              className={modalStyles.input}
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={contCuerpo}
              onChange={e => setContCuerpo(e.target.value)}
              placeholder="Contenido en texto"
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>
              {contTipo === 'ARTÍCULO' ? 'Enlace Web o Documento del Artículo *' : 'URL del Video (YouTube, etc.) *'}
            </label>
            <input
              type="text"
              className={modalStyles.input}
              value={contUrlRecurso}
              onChange={e => setContUrlRecurso(e.target.value)}
              placeholder={contTipo === 'ARTÍCULO' ? 'https://ejemplo.com/articulo.pdf o enlace' : 'https://www.youtube.com/watch?v=...'}
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>URL de la Imagen</label>
            <input
              type="text"
              className={modalStyles.input}
              value={contUrlImagen}
              onChange={e => setContUrlImagen(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className={modalStyles.field}>
              <label className={modalStyles.label}>Duración (minutos)</label>
              <input
                type="number"
                className={modalStyles.input}
                value={contDuracion}
                onChange={e => setContDuracion(e.target.value)}
              />
            </div>
            <div className={modalStyles.field}>
              <label className={modalStyles.label}>Orden</label>
              <input
                type="number"
                className={modalStyles.input}
                value={contOrden}
                onChange={e => setContOrden(e.target.value)}
              />
            </div>
          </div>

          <div className={modalStyles.actions}>
            <button type="button" className={modalStyles.cancelBtn} onClick={() => setModalContOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className={modalStyles.submitBtn}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>
      {/* ── MODAL VISTA PREVIA ── */}
      <Modal
        isOpen={modalPreviewOpen}
        onClose={() => {
          setModalPreviewOpen(false);
          setPreviewContent(null);
        }}
        title={previewContent ? `Vista Previa: ${previewContent.titulo}` : 'Vista Previa'}
      >
        {previewContent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
              <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, color: '#374151' }}>
                {(previewContent.tipo_contenido ?? '').toUpperCase()}
              </span>
              {previewContent.modulo_id && (
                <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  {modulosClinicos.find(m => String(m.id) === String(previewContent.modulo_id))
                    ? `${modulosClinicos.find(m => String(m.id) === String(previewContent.modulo_id))?.codigo} - ${modulosClinicos.find(m => String(m.id) === String(previewContent.modulo_id))?.nombre}`
                    : `Módulo ${previewContent.modulo_id}`}
                </span>
              )}
              <span>Duración: {previewContent.duracion_minutos} min</span>
            </div>

            {previewContent.descripcion && (
              <p style={{ fontSize: '14.5px', color: '#4b5563', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                {previewContent.descripcion}
              </p>
            )}

            {(previewContent.tipo_contenido ?? '').toUpperCase().trim() === 'VIDEO' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {previewContent.url_recurso ? (
                  previewContent.url_recurso.includes('youtube.com') || previewContent.url_recurso.includes('youtu.be') ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <iframe
                        src={getYoutubeEmbedUrl(previewContent.url_recurso)}
                        title={previewContent.titulo}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      />
                    </div>
                  ) : (
                    <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#4b5563' }}>
                        Este video apunta a un recurso externo:
                      </p>
                      <a
                        href={previewContent.url_recurso}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          background: 'linear-gradient(135deg, #FF4B72 0%, #CA436E 100%)',
                          color: 'white', padding: '8px 20px', borderRadius: '20px',
                          fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                          boxShadow: '0 4px 10px rgba(202,67,110,0.2)'
                        }}
                      >
                        Ver Video Externo
                      </a>
                    </div>
                  )
                ) : (
                  <p style={{ color: '#ef4444', fontSize: '13px', fontStyle: 'italic' }}>No se ha configurado ninguna URL de recurso para este video.</p>
                )}
              </div>
            ) : (
              // Artículo
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {previewContent.url_imagen && (
                  <img
                    src={getImagenUrl(previewContent)}
                    alt={previewContent.titulo}
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  />
                )}
                
                {previewContent.url_recurso && (
                  <a
                    href={previewContent.url_recurso}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: 'white', padding: '8px 18px', borderRadius: '20px',
                      fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                      boxShadow: '0 4px 10px rgba(2,132,199,0.2)',
                      marginTop: '4px', marginBottom: '8px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Leer Documento / Artículo Completo
                  </a>
                )}

                {previewContent.cuerpo_texto ? (
                  <div style={{ fontSize: '14.5px', color: '#1f2937', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {previewContent.cuerpo_texto}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' }}>Este artículo no tiene contenido de texto redactado en el cuerpo.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};