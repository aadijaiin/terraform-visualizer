import React, { useState } from 'react';

export const Editor = ({ initialCode, onChange }) => {
  const [code, setCode] = useState(initialCode);

  const handleChange = (e) => {
    const val = e.target.value;
    setCode(val);
    onChange(val);
  };

  return (
    <div className="editor-pane">
      <div className="editor-header">
        <span className="editor-title">main.tf</span>
        <span className="editor-badge">Terraform</span>
      </div>
      <textarea
        className="editor-textarea"
        value={code}
        onChange={handleChange}
        spellCheck="false"
        placeholder="# Paste or type your Terraform code here..."
      />
    </div>
  );
};
