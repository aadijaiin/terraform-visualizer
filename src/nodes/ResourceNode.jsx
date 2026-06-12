import { Handle, Position } from 'reactflow';
import { Server, Database, HardDrive, Network, Shield, Box } from 'lucide-react';

const ICON_MAP = {
  'aws_instance': { icon: Server, color: '#f58536', label: 'EC2' },
  'aws_s3_bucket': { icon: Database, color: '#e7157b', label: 'S3' },
  'aws_db_instance': { icon: HardDrive, color: '#3b48cc', label: 'RDS' },
  'aws_lb': { icon: Network, color: '#8c4fff', label: 'ALB' },
  'aws_security_group': { icon: Shield, color: '#ef4444', label: 'Security Group' },
  'default': { icon: Box, color: '#64748b', label: 'Resource' }
};

export const ResourceNode = ({ data }) => {
  const resourceInfo = ICON_MAP[data.resourceType] || ICON_MAP['default'];
  const Icon = resourceInfo.icon;

  const isMulti = data.instances > 1 || data.instances === '>1';

  return (
    <div className={`resource-node ${isMulti ? 'resource-node-stacked' : ''}`} style={{ borderColor: resourceInfo.color }}>
      <Handle type="target" position={Position.Top} className="handle" />
      
      {isMulti && (
        <div className="instance-badge" style={{ backgroundColor: resourceInfo.color }}>
          {data.instances}
        </div>
      )}

      <div className="resource-icon-container" style={{ backgroundColor: `${resourceInfo.color}15`, color: resourceInfo.color }}>
        <Icon size={20} strokeWidth={2} />
      </div>
      
      <div className="resource-details">
        <div className="resource-type" style={{ color: resourceInfo.color }}>
          {resourceInfo.label}
        </div>
        <div className="resource-name" title={data.label}>
          {data.label}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
};
