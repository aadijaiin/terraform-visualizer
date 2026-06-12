import { useRef } from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';

export const Editor = ({ files, activeFileId, onFilesChange, onActiveFileChange }) => {
  const fileInputRef = useRef(null);

  const handleCodeChange = (e) => {
    const val = e.target.value;
    const newFiles = files.map(f => f.id === activeFileId ? { ...f, content: val } : f);
    onFilesChange(newFiles);
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (!uploadedFiles.length) return;

    const newFiles = [];
    let fileIdCounter = 0;
    for (const file of uploadedFiles) {
      if (file.name.endsWith('.tf')) {
        const text = await file.text();
        newFiles.push({
          id: file.name + '-' + Date.now() + '-' + fileIdCounter++,
          name: file.name,
          content: text
        });
      }
    }

    if (newFiles.length > 0) {
      const merged = [...files, ...newFiles];
      onFilesChange(merged);
      onActiveFileChange(newFiles[0].id);
    }

    // reset input
    if (fileInputRef.current) {
       fileInputRef.current.value = '';
    }
  };

  const addNewFile = () => {
    const newId = `new-${Date.now()}.tf`;
    const newFiles = [...files, { id: newId, name: 'new.tf', content: '' }];
    onFilesChange(newFiles);
    onActiveFileChange(newId);
  };

  const removeFile = (e, idToRemove) => {
    e.stopPropagation();
    if (files.length === 1) return; // keep at least one
    const newFiles = files.filter(f => f.id !== idToRemove);
    onFilesChange(newFiles);
    if (activeFileId === idToRemove) {
      onActiveFileChange(newFiles[0].id);
    }
  };

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  return (
    <div className="editor-pane">
      <div className="editor-header">
        <div className="editor-title">
          <span className="editor-badge" style={{marginRight: '8px'}}>Terraform</span>
        </div>
        <div className="editor-actions">
           <button onClick={() => fileInputRef.current?.click()} className="icon-button" title="Upload folder or files">
             <Upload size={16} />
           </button>
           <button onClick={addNewFile} className="icon-button" title="New file">
             <Plus size={16} />
           </button>
           <input
             type="file"
             multiple
             webkitdirectory="true"
             directory="true"
             ref={fileInputRef}
             style={{display: 'none'}}
             onChange={handleFileUpload}
             accept=".tf"
           />
        </div>
      </div>

      <div className="file-tabs">
        {files.map(f => (
          <div
            key={f.id}
            className={`file-tab ${f.id === activeFileId ? 'active' : ''}`}
            onClick={() => onActiveFileChange(f.id)}
          >
            {f.name}
            {files.length > 1 && (
              <span className="close-tab" onClick={(e) => removeFile(e, f.id)}>
                <Trash2 size={12} />
              </span>
            )}
          </div>
        ))}
      </div>

      <textarea
        className="editor-textarea"
        value={activeFile?.content || ''}
        onChange={handleCodeChange}
        spellCheck="false"
        placeholder="# Paste or type your Terraform code here..."
      />
    </div>
  );
};
