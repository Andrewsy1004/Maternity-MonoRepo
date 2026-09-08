import { useNavigate } from 'react-router-dom';
import modalStyles from '../../../pages/adminPages/StaffModal.module.css';
import { useState, useEffect } from 'react';
import { registerGestante } from '../../../services/m0Service';
import type { GestanteRegisterRequest } from '../../../services/m0Service';
import { getCatalogos, getGestantes } from '../../../services/adminService';
import type { Catalogos } from '../../../services/adminService';
import { CatalogField } from './CatalogField';
import { registerPrenatalControl, registerVitals } from '../../../services/clinicalService';

export const FormRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [catalogos, setCatalogos] = useState<Catalogos>({
    nacionalidades: [],
    eapbs: [],
    pertenencias_etnicas: [],
    grupos_poblacionales: [],
  });

  const [formData, setFormData] = useState<GestanteRegisterRequest>({
    fecha_nacimiento: '',
    fecha_ultima_menstruacion: '',
    anio_ingreso: new Date().getFullYear(),
    pregunta_seguridad: '¿Cuál es el nombre de tu primera mascota?',
    respuesta_seguridad: '',
  });

  // Campos para parámetros físicos iniciales (solo visibles en modo staff/admin)
  const [pesoInicial, setPesoInicial] = useState('');
  const [tallaInicial, setTallaInicial] = useState('');
  const [alturaUterinaInicial, setAlturaUterinaInicial] = useState('');
  const isStaffMode = !!localStorage.getItem('token');

  useEffect(() => {
    getCatalogos()
      .then(setCatalogos)
      .catch(() => {
        // Si falla el catálogo, no bloquear el formulario
        console.warn('No se pudieron cargar los catálogos');
      });
  }, []);

  const handleChange = (key: keyof GestanteRegisterRequest, value: string | number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await registerGestante(formData);

      // Si es modo staff y tiene algún dato inicial físico, creamos el control prenatal inicial
      if (isStaffMode && (pesoInicial || tallaInicial || alturaUterinaInicial)) {
        try {
          // 1. Consultamos la lista de gestantes para ubicar el id de la recién creada
          const gestantes = await getGestantes();
          const nuevaGestante = gestantes.find(g => g.codigo_gmi === response.codigo_gmi);

          if (nuevaGestante?.id) {
            // 2. Calcular semanas de gestación iniciales basadas en FUM
            const fumDate = new Date(formData.fecha_ultima_menstruacion);
            const today = new Date();
            const diffDays = Math.ceil(Math.abs(today.getTime() - fumDate.getTime()) / (1000 * 60 * 60 * 24));
            const semanas = Math.floor(diffDays / 7);

            // 3. Registrar el primer control clínico prenatal
            const control = await registerPrenatalControl({
              gestante_id: nuevaGestante.id,
              numero_control: 1,
              fecha_control: today.toISOString().split('T')[0],
              semana_gestacion: semanas,
              observaciones: "Control prenatal inicial creado automáticamente al registrar usuaria.",
            });

            // 4. Registrar los signos vitales iniciales
            await registerVitals({
              control_prenatal_id: control.id,
              peso_kg: pesoInicial ? parseFloat(pesoInicial) : 60,
              talla_cm: tallaInicial ? parseFloat(tallaInicial) : null,
              altura_uterina: alturaUterinaInicial ? parseFloat(alturaUterinaInicial) : null,
            });
          }
        } catch (clinicalError) {
          console.warn("No se pudieron inicializar los signos vitales:", clinicalError);
        }
      }

      setSuccess(true);
      // Guardamos el código GMI para el login posterior
      localStorage.setItem('temp_gmi', response.codigo_gmi);
      setTimeout(() => {
        alert(`${response.mensaje}. Tu código GMI es: ${response.codigo_gmi}`);
        if (!isStaffMode) {
          navigate('/login');
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al registrar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={modalStyles.form} onSubmit={handleSubmit}>
      {success && (
        <div className={modalStyles.successBanner}>
          ✅ Gestante registrada exitosamente
        </div>
      )}

      {error && (
        <p className={modalStyles.error}>{error}</p>
      )}

      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Fecha de Nacimiento *</label>
        <input
          className={modalStyles.input}
          required
          value={formData.fecha_nacimiento}
          type="date"
          onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
          disabled={loading}
        />
      </div>

      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Fecha de Última Menstruación (FUM) *</label>
        <input
          className={modalStyles.input}
          required
          value={formData.fecha_ultima_menstruacion}
          type="date"
          onChange={(e) => handleChange('fecha_ultima_menstruacion', e.target.value)}
          disabled={loading}
        />
      </div>

      {/* ── Catálogos estandarizados ── */}
      <CatalogField
        label="Nacionalidad"
        items={catalogos.nacionalidades}
        selectedId={formData.nacionalidad_id  != null ? String(formData.nacionalidad_id) : undefined}
        onSelectId={(id) => handleChange('nacionalidad_id', id)}
        disabled={loading}
      />

      <CatalogField
        label="EAPB / EPS"
        items={catalogos.eapbs}
        selectedId={formData.eapb_id != null ? String(formData.eapb_id) : undefined}
        onSelectId={(id) => handleChange('eapb_id', id)}
        disabled={loading}
      />

      <CatalogField
        label="Pertenencia Étnica"
        items={catalogos.pertenencias_etnicas}
        selectedId={formData.pertenencia_etnica_id != null ? String(formData.pertenencia_etnica_id) : undefined}
        onSelectId={(id) => handleChange('pertenencia_etnica_id', id)}
        disabled={loading}
      />

      <CatalogField
        label="Grupo Poblacional"
        items={catalogos.grupos_poblacionales}
        selectedId={formData.grupo_poblacional_id != null ? String(formData.grupo_poblacional_id) : undefined}
        onSelectId={(id) => handleChange('grupo_poblacional_id', id)}
        disabled={loading}
      />

      {/* ── Pregunta de seguridad ── */}
      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Pregunta de Seguridad</label>
        <select
          className={modalStyles.select}
          value={formData.pregunta_seguridad}
          onChange={(e) => handleChange('pregunta_seguridad', e.target.value)}
          disabled={loading}
        >
          <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
          <option value="¿Cuál es el nombre de tu ciudad natal?">¿Cuál es el nombre de tu ciudad natal?</option>
          <option value="¿Cuál es tu color favorito?">¿Cuál es tu color favorito?</option>
          <option value="¿Cuál es el nombre de tu mejor amigo de la infancia?">¿Cuál es el nombre de tu mejor amigo de la infancia?</option>
          <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
          <option value="¿Cuál es tu comida favorita?">¿Cuál es tu comida favorita?</option>
          <option value="¿Cuál es el nombre de tu escuela de la infancia?">¿Cuál es el nombre de tu escuela de la infancia?</option>
        </select>
      </div>

      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Respuesta de Seguridad *</label>
        <input
          className={modalStyles.input}
          required
          value={formData.respuesta_seguridad}
          type="text"
          placeholder="Tu respuesta"
          onChange={(e) => handleChange('respuesta_seguridad', e.target.value)}
          disabled={loading}
        />
      </div>

      {/* ── Datos Físicos Iniciales (Solo Staff/Admin) ── */}
      {isStaffMode && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(202, 67, 110, 0.03)', borderRadius: '12px', border: '1px dashed rgba(202, 67, 110, 0.3)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#CA436E', fontWeight: 'bold' }}>Parámetros Físicos Iniciales (Opcional)</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className={modalStyles.field} style={{ flex: 1, marginBottom: 0 }}>
              <label className={modalStyles.label} style={{ fontSize: '11px' }}>Peso Inicial (kg)</label>
              <input
                className={modalStyles.input}
                value={pesoInicial}
                type="number"
                step="any"
                placeholder="Ej. 65"
                onChange={(e) => setPesoInicial(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={modalStyles.field} style={{ flex: 1, marginBottom: 0 }}>
              <label className={modalStyles.label} style={{ fontSize: '11px' }}>Talla Inicial (cm)</label>
              <input
                className={modalStyles.input}
                value={tallaInicial}
                type="number"
                step="any"
                placeholder="Ej. 160"
                onChange={(e) => setTallaInicial(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={modalStyles.field} style={{ flex: 1, marginBottom: 0 }}>
              <label className={modalStyles.label} style={{ fontSize: '11px' }}>Alt. Uterina (cm)</label>
              <input
                className={modalStyles.input}
                value={alturaUterinaInicial}
                type="number"
                step="any"
                placeholder="Ej. 12"
                onChange={(e) => setAlturaUterinaInicial(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      <div className={modalStyles.actions} style={{ marginTop: '20px' }}>
        <button
          type="submit"
          className={modalStyles.submitBtn}
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrar Materna'}
        </button>
      </div>
    </form>
  );
};
