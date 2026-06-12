import { Handle, Position } from 'reactflow';
import { Server, Database, HardDrive, Network, Shield, Box, Cpu, FileJson, Mail, MessageSquare, Zap, Key, Globe, LayoutGrid } from 'lucide-react';

const ICON_MAP = {
  'aws_instance': { icon: Server, color: '#f58536', label: 'EC2' },
  'aws_s3_bucket': { icon: Database, color: '#e7157b', label: 'S3' },
  'aws_db_instance': { icon: HardDrive, color: '#3b48cc', label: 'RDS' },
  'aws_dynamodb_table': { icon: Database, color: '#3b48cc', label: 'DynamoDB' },
  'aws_lb': { icon: Network, color: '#8c4fff', label: 'ALB' },
  'aws_security_group': { icon: Shield, color: '#ef4444', label: 'Security Group' },
  'aws_lambda_function': { icon: Cpu, color: '#f58536', label: 'Lambda' },
  'aws_iam_role': { icon: FileJson, color: '#ef4444', label: 'IAM Role' },
  'aws_iam_policy': { icon: FileJson, color: '#ef4444', label: 'IAM Policy' },
  'aws_sqs_queue': { icon: MessageSquare, color: '#e7157b', label: 'SQS' },
  'aws_sns_topic': { icon: Mail, color: '#e7157b', label: 'SNS' },
  'aws_cloudfront_distribution': { icon: Globe, color: '#8c4fff', label: 'CloudFront' },
  'aws_kms_key': { icon: Key, color: '#ef4444', label: 'KMS' },
  'aws_api_gateway_rest_api': { icon: Zap, color: '#8c4fff', label: 'API Gateway' },
  'aws_ecs_service': { icon: LayoutGrid, color: '#f58536', label: 'ECS Service' },
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
