import React, { useEffect, useState } from 'react';
import { getClinicalProfile, updateClinicalProfile } from '../../services/m0Service';
import type { ClinicalProfile as IClinicalProfile } from '../../services/m0Service';
import styles from './Profile.module.css';

export const ClinicalProfile: React.FC = () => {
  const [profile, setProfile] = useState<IClinicalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<IClinicalProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getClinicalProfile();
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error("Error fetching clinical profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const updated = await updateClinicalProfile(formData);
      setProfile(updated);
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div className={styles.loader}>Cargando perfil clínico...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Perfil Clínico</h3>
        <button 
          className={styles.editBtn}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.field}>
          <label>Enfermedades Crónicas</label>
          {editing ? (
            <textarea 
              value={formData?.enfermedades_cronicas || ''} 
              onChange={e => setFormData({...formData!, enfermedades_cronicas: e.target.value})}
            />
          ) : (
            <p>{profile?.enfermedades_cronicas || 'Ninguna'}</p>
          )}
        </div>

        <div className={styles.field}>
          <label>Alergias</label>
          {editing ? (
            <textarea 
              value={formData?.alergias || ''} 
              onChange={e => setFormData({...formData!, alergias: e.target.value})}
            />
          ) : (
            <p>{profile?.alergias || 'Ninguna'}</p>
          )}
        </div>

        <div className={styles.field}>
          <label>Hábitos</label>
          {editing ? (
            <textarea 
              value={formData?.habitos || ''} 
              onChange={e => setFormData({...formData!, habitos: e.target.value})}
            />
          ) : (
            <p>{profile?.habitos || 'No especificado'}</p>
          )}
        </div>

        {editing && (
          <button className={styles.saveBtn} onClick={handleUpdate}>
            Guardar Cambios
          </button>
        )}
      </div>
    </div>
  );
};
