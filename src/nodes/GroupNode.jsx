import { Handle, Position } from 'reactflow';
import { Cloud, Network, Layers, LayoutGrid } from 'lucide-react';

const GROUP_STYLES = {
  'aws_vpc': { icon: Cloud, color: '#8b5cf6', label: 'VPC', bg: 'rgba(139, 92, 246, 0.05)', borderStyle: 'solid' },
  'aws_subnet': { icon: Network, color: '#10b981', label: 'Subnet', bg: 'rgba(16, 185, 129, 0.05)', borderStyle: 'dashed' },
  'aws_autoscaling_group': { icon: Layers, color: '#3b82f6', label: 'Auto Scaling Group', bg: 'rgba(59, 130, 246, 0.05)', borderStyle: 'dotted' },
  'aws_ecs_cluster': { icon: LayoutGrid, color: '#f58536', label: 'ECS Cluster', bg: 'rgba(245, 133, 54, 0.05)', borderStyle: 'solid' },
  'aws_eks_cluster': { icon: LayoutGrid, color: '#f58536', label: 'EKS Cluster', bg: 'rgba(245, 133, 54, 0.05)', borderStyle: 'solid' },
  'default': { icon: Cloud, color: '#64748b', label: 'Group', bg: 'rgba(100, 116, 139, 0.05)', borderStyle: 'solid' }
};

export const GroupNode = ({ data }) => {
  const groupInfo = GROUP_STYLES[data.resourceType] || GROUP_STYLES['default'];
  const Icon = groupInfo.icon;

  return (
    <div 
      className="group-node" 
      style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: groupInfo.bg,
        borderColor: groupInfo.color,
        borderStyle: groupInfo.borderStyle
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      
      <div className="group-header" style={{ color: groupInfo.color }}>
        <Icon size={16} className="group-icon" />
        <span className="group-type">{groupInfo.label}</span>
        <span className="group-name">{data.label}</span>
      </div>
    </div>
  );
};
