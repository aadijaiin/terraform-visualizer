import { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel
} from "reactflow";
import "reactflow/dist/style.css";

import { parseTerraform } from "./parser";
import { computeLayout } from "./layout";
import { Editor } from "./components/Editor";
import { Moon, Sun } from "lucide-react";

import { GroupNode } from "./nodes/GroupNode";
import { ResourceNode } from "./nodes/ResourceNode";

const nodeTypes = {
  group: GroupNode,
  leaf: ResourceNode,
};

const INITIAL_CODE = `
# AWS Infrastructure Example
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_subnet" "private" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
}

resource "aws_security_group" "web_sg" {
  vpc_id = aws_vpc.main.id
  name   = "web-sg"
}

resource "aws_instance" "web_server" {
  subnet_id = aws_subnet.public.id
  security_groups = [aws_security_group.web_sg.id]
  instance_type = "t3.micro"
}

resource "aws_db_instance" "database" {
  subnet_id = aws_subnet.private.id
  instance_class = "db.t3.micro"
}

resource "aws_lb" "app_alb" {
  subnets = [aws_subnet.public.id]
  security_groups = [aws_security_group.web_sg.id]
}
`.trim();

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [files, setFiles] = useState([{ id: 'main.tf', name: 'main.tf', content: INITIAL_CODE }]);
  const [activeFileId, setActiveFileId] = useState('main.tf');

  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const { fitView } = useReactFlow();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const updateGraph = useCallback(async (allCode) => {
    try {
      setError(null);
      const { nodes: parsedNodes, edges: parsedEdges } = parseTerraform(allCode);
      const { nodes: layoutedNodes, edges: layoutedEdges } = await computeLayout(parsedNodes, parsedEdges);
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Wait a tick for React Flow to process the new nodes, then fit view
      setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 50);
    } catch (err) {
      console.error(err);
      setError("Failed to parse or layout graph.");
    }
  }, [setNodes, setEdges, fitView]);

  // Combined code
  const combinedCode = files.map(f => f.content).join('\n\n');

  // Debounced code changes (handles initial load and subsequent changes)
  useEffect(() => {
    const handler = setTimeout(() => {
      updateGraph(combinedCode);
    }, 500);
    return () => clearTimeout(handler);
  }, [combinedCode, updateGraph]);

  return (
    <div className="app-container">
      <div className="sidebar">
        <Editor
          files={files}
          activeFileId={activeFileId}
          onFilesChange={setFiles}
          onActiveFileChange={setActiveFileId}
        />
      </div>
      
      <div className="graph-container">
        {error && <div className="error-banner">{error}</div>}
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
          <Background color={theme === 'dark' ? '#334155' : '#cbd5e1'} gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'group') return theme === 'dark' ? '#334155' : '#e2e8f0';
              return '#94a3b8';
            }} 
            maskColor={theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255,255,255,0.8)'}
          />
          <Panel position="top-right" className="header-panel">
            <h1>Terraform Topology</h1>
            <button className="icon-button" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
