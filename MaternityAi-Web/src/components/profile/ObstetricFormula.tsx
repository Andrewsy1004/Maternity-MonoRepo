import React, { useEffect, useState } from 'react';
import { getObstetricFormula, updateObstetricFormula } from '../../services/m0Service';
import type { ObstetricFormula as IObstetricFormula } from '../../services/m0Service';
import styles from './Profile.module.css';

const FORMULA_FIELDS: { key: keyof IObstetricFormula; label: string; short: string }[] = [
  { key: 'gestaciones', label: 'Gestaciones', short: 'G' },
  { key: 'partos',      label: 'Partos',      short: 'P' },
  { key: 'cesareas',    label: 'Cesáreas',    short: 'C' },
  { key: 'abortos',     label: 'Abortos',     short: 'A' },
  { key: 'vivos',       label: 'Vivos',       short: 'V' },
  { key: 'mortinatos',  label: 'Mortinatos',  short: 'M' },
];

export const ObstetricFormula: React.FC = () => {
  const [formula, setFormula] = useState<IObstetricFormula | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<IObstetricFormula | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getObstetricFormula()
      .then(data => { setFormula(data); setFormData(data); })
      .catch(err => console.error('Error cargando fórmula obstétrica:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = () => {
    setFormData(formula);
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  const handleChange = (key: keyof IObstetricFormula, value: number) => {
    setFormData(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = async () => {
    if (!formData) return;
    // Validación básica SRS: gestaciones >= partos + cesareas + abortos
    const sum = formData.partos + formData.cesareas + formData.abortos;
    if (formData.gestaciones < sum) {
      setError(`Las gestaciones (${formData.gestaciones}) deben ser ≥ partos + cesáreas + abortos (${sum}).`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateObstetricFormula(formData);
      setFormula(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar. Intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Fórmula Obstétrica</h3>
        {!editing ? (
          <button className={styles.editBtn} onClick={handleEdit}>Editar</button>
        ) : (
          <button className={styles.editBtn} onClick={handleCancel}>Cancelar</button>
        )}
      </div>

      {!editing ? (
        <div className={styles.formulaGrid}>
          {FORMULA_FIELDS.map(f => (
            <div key={f.key} className={styles.formulaItem} title={f.label}>
              <span className={styles.count}>{formula?.[f.key] ?? 0}</span>
              <label>{f.short} — {f.label}</label>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.content} style={{ marginTop: '12px' }}>
          <div className={styles.formulaGrid}>
            {FORMULA_FIELDS.map(f => (
              <div key={f.key} className={styles.formulaItem}>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={formData?.[f.key] ?? 0}
                  onChange={e => handleChange(f.key, parseInt(e.target.value) || 0)}
                  style={{
                    width: '50px',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#df5d86',
                    border: '2px solid #fce4ec',
                    borderRadius: '8px',
                    padding: '4px',
                    fontFamily: 'inherit',
                    background: 'white',
                  }}
                />
                <label>{f.short} — {f.label}</label>
              </div>
            ))}
          </div>
          {error && (
            <p style={{ color: '#c62828', fontSize: '13px', margin: '8px 0 0', lineHeight: 1.4 }}>
              ⚠️ {error}
            </p>
          )}
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Fórmula Obstétrica'}
          </button>
        </div>
      )}
    </div>
  );
};
