import React from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel
} from "reactflow";
import "reactflow/dist/style.css";

import { Editor } from "./components/Editor";
import { nodeTypes, defaultEdgeOptions, INITIAL_CODE } from "./constants";
import { useTerraformGraph } from "./hooks/useTerraformGraph";

function Flow() {
  const {
    nodes,
    edges,
    code,
    setCode,
    error,
    loading,
    onNodesChange,
    onEdgesChange
  } = useTerraformGraph(INITIAL_CODE);

  return (
    <div className="app-container">
      <div className="sidebar">
        <Editor initialCode={code} onChange={setCode} />
      </div>
      
      <div className="graph-container" style={{ position: 'relative' }}>
        {error && <div className="error-banner">{error}</div>}
        {loading && (
          <div className="loading-overlay" style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Updating graph...
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'group') return '#e2e8f0';
              return '#94a3b8';
            }} 
          />
          <Panel position="top-right" className="header-panel">
            <h1>Terraform Topology</h1>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
