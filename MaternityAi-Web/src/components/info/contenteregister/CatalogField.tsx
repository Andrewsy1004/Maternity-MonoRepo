import type { CatalogoItem } from '../../../services/adminService';
import modalStyles from '../../../pages/adminPages/StaffModal.module.css';

interface CatalogFieldProps {
  label: string;
  items: CatalogoItem[];
  /** Valor en modo selector (ID como string, undefined = sin selección) */
  selectedId: string | undefined;
  onSelectId: (id: string | undefined) => void;
  disabled?: boolean;
  required?: boolean;
}

export const CatalogField = ({
  label,
  items,
  selectedId,
  onSelectId,
  disabled,
  required,
}: CatalogFieldProps) => {
  return (
    <div className={modalStyles.field}>
      <label className={modalStyles.label}>{label}</label>
      <select
        className={modalStyles.select}
        value={selectedId ?? ''}
        onChange={(e) =>
          onSelectId(e.target.value ? e.target.value : undefined)
        }
        disabled={disabled}
        required={required}
      >
        <option value="">Selecciona...</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};
