import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [code, setCode] = useState(INITIAL_CODE);
  const [error, setError] = useState(null);
  const { fitView } = useReactFlow();

  const updateGraph = useCallback(async (terraformCode) => {
    try {
      setError(null);
      const { nodes: parsedNodes, edges: parsedEdges } = parseTerraform(terraformCode);
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

  // Initial load
  useEffect(() => {
    updateGraph(code);
  }, []); // eslint-disable-line

  // Debounced code changes
  useEffect(() => {
    const handler = setTimeout(() => {
      updateGraph(code);
    }, 500);
    return () => clearTimeout(handler);
  }, [code, updateGraph]);

  return (
    <div className="app-container">
      <div className="sidebar">
        <Editor initialCode={code} onChange={setCode} />
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
