import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Edit2, Check } from 'lucide-react';

interface RenameDialogProps {
  isOpen: boolean;
  currentName: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  currentName,
  onSave,
  onCancel,
}) => {
  const [val, setVal] = useState(currentName);

  useEffect(() => {
    setVal(currentName);
  }, [currentName, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onSave(val.trim());
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title="Rename Output File"
      icon={<Edit2 size={16} />}
      width="380px"
      footer={
        <>
          <button className="tool-btn secondary" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="tool-btn primary" onClick={handleSubmit} type="submit">
            <Check size={13} />
            <span>Rename</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
          File name
        </label>
        <input
          type="text"
          className="control-input"
          style={{ width: '100%' }}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
        />
      </form>
    </Dialog>
  );
};
