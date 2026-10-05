import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, ShieldCheck, FileText, Check, AlertTriangle } from 'lucide-react';
import { TrashService, TrashItem } from '../../core/services/trash.service';
import { useToast } from '../../core/context/ToastContext';
import { Button } from '../common/Button';
import './TrashView.css';

export const TrashView: React.FC = () => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const { showToast } = useToast();

  const loadItems = () => {
    setItems(TrashService.getTrashItems());
  };

  useEffect(() => {
    loadItems();
    const handleUpdate = () => loadItems();
    window.addEventListener('toiloki-trash-updated', handleUpdate);
    return () => window.removeEventListener('toiloki-trash-updated', handleUpdate);
  }, []);

  const handleRestore = async (id: string, name: string) => {
    const res = await TrashService.restoreItem(id);
    if (res.success) {
      showToast(`Restored "${name}"`, 'success');
      loadItems();
    } else {
      showToast(res.error || `Failed to restore ${name}`, 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently remove "${name}" from trash? This cannot be undone.`)) {
      TrashService.deleteItem(id);
      showToast(`Removed "${name}" from trash`, 'info');
      loadItems();
    }
  };

  const handlePurgeAll = () => {
    if (items.length === 0) return;
    if (window.confirm(`Empty Toiloki Trash? All ${items.length} quarantined items will be permanently erased.`)) {
      const count = TrashService.purgeTrash();
      showToast(`Purged ${count} items from Toiloki Trash`, 'success');
      loadItems();
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="toiloki-trash-view" role="main" aria-label="Toiloki Trash">
      <div className="trash-header-row">
        <div>
          <h1 className="trash-title">Toiloki Trash & Quarantine</h1>
          <p className="trash-subtitle">
            Safety quarantine for files deleted or overwritten across utilities. Files can be restored to disk at any time.
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handlePurgeAll} style={{ color: 'var(--danger)' }}>
            <Trash2 size={13} style={{ marginRight: '6px' }} />
            Empty Trash ({items.length})
          </Button>
        )}
      </div>

      <div className="trash-table-container">
        {items.length === 0 ? (
          <div className="trash-empty-state">
            <ShieldCheck size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text)' }}>
              Toiloki Trash is Empty
            </h3>
            <p style={{ margin: 0, fontSize: '13px', maxWidth: '420px', lineHeight: 1.5 }}>
              Whenever destructive operations (like secure file shredding, temp cleanup, or batch overwrites) occur, safety backups are quarantined here.
            </p>
          </div>
        ) : (
          <table className="trash-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Original Location</th>
                <th>Origin Utility</th>
                <th>Size</th>
                <th>Quarantined At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontWeight: 600 }}>{item.fileName}</span>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                      {item.originalPath}
                    </code>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--surface)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      {item.sourceUtility}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {formatSize(item.fileSize)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(item.deletedAt).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Button variant="secondary" size="sm" onClick={() => handleRestore(item.id, item.fileName)}>
                        <RotateCcw size={12} style={{ marginRight: '4px' }} />
                        Restore
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.fileName)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
