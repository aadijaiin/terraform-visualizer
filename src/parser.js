export function parseTerraform(code) {
  const nodes = [];
  const edges = [];
  
  // Clean comments to simplify parsing
  const cleanCode = code.replace(/#.*$/gm, '').replace(/\/\/.*$/gm, '');

  // Regex to extract blocks: resource "type" "name" { ... }
  // Use a regex to find the start of the resource block, then manually balance braces
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
  
  let match;
  const parsedResources = {};

  while ((match = resourceRegex.exec(cleanCode)) !== null) {
    const type = match[1];
    const name = match[2];

    const startIndex = match.index + match[0].length;
    let braceCount = 1;
    let i = startIndex;
    while (i < cleanCode.length && braceCount > 0) {
      if (cleanCode[i] === '{') braceCount++;
      if (cleanCode[i] === '}') braceCount--;
      i++;
    }

    const body = cleanCode.substring(startIndex, i - 1);

    const properties = {};
    
    // Extract properties like vpc_id = aws_vpc.main.id
    const propRegex = /([a-zA-Z0-9_-]+)\s*=\s*([^\n]+)/g;
    let propMatch;
    while ((propMatch = propRegex.exec(body)) !== null) {
      properties[propMatch[1]] = propMatch[2].trim();
    }

    // Also extract arrays like security_groups = [aws_security_group.sg.id]
    const arrayPropRegex = /([a-zA-Z0-9_-]+)\s*=\s*\[([^\]]+)\]/g;
    while ((propMatch = arrayPropRegex.exec(body)) !== null) {
      properties[propMatch[1]] = propMatch[2].split(',').map(s => s.trim());
    }

    let instances = 1;
    if (properties.count) {
      const parsedCount = parseInt(properties.count, 10);
      if (!isNaN(parsedCount)) {
        instances = parsedCount;
      }
    } else if (properties.for_each) {
      instances = '>1'; // we can't easily evaluate for_each length, but it's plural
    }

    parsedResources[`${type}.${name}`] = {
      type,
      name,
      id: `${type}.${name}`,
      properties,
      instances
    };
  }

  // Define supported mapping and grouping rules
  const groupTypes = ['aws_vpc', 'aws_subnet', 'aws_autoscaling_group', 'aws_ecs_cluster', 'aws_eks_cluster'];
  
  // 1. First Pass: Create group and leaf nodes
  for (const [, resource] of Object.entries(parsedResources)) {
    const isGroup = groupTypes.includes(resource.type);
    
    let parentNode = undefined;
    
    // Determine parent container based on properties
    if (resource.properties.vpc_id) {
      const vpcMatch = resource.properties.vpc_id.match(/(aws_vpc\.[a-zA-Z0-9_-]+)/);
      if (vpcMatch) parentNode = vpcMatch[1];
    }
    if (resource.properties.subnet_id) {
      const subnetMatch = resource.properties.subnet_id.match(/(aws_subnet\.[a-zA-Z0-9_-]+)/);
      if (subnetMatch) parentNode = subnetMatch[1];
    }
    if (resource.properties.vpc_zone_identifier) {
       // Just pick the first subnet for ASG parenting logic in this MVP
       const asgMatch = resource.properties.vpc_zone_identifier.match(/(aws_subnet\.[a-zA-Z0-9_-]+)/);
       if (asgMatch) parentNode = asgMatch[1];
    }
    if (resource.properties.cluster) {
       const ecsMatch = resource.properties.cluster.match(/(aws_ecs_cluster\.[a-zA-Z0-9_-]+)/);
       if (ecsMatch) parentNode = ecsMatch[1];
    }

    nodes.push({
      id: resource.id,
      type: isGroup ? 'group' : 'leaf',
      position: { x: 0, y: 0 },
      data: {
        label: resource.name,
        resourceType: resource.type,
        instances: resource.instances,
      },
      parentNode: parentNode,
      // Extent parent helps React Flow, though ELK will handle positioning
      extent: parentNode ? 'parent' : undefined,
    });
  }

  const edgeMap = new Map();

  // 2. Second Pass: Create connection edges
  for (const [id, resource] of Object.entries(parsedResources)) {
    // Look for explicit dependencies like security_groups
    if (resource.properties.security_groups) {
      let sgs = resource.properties.security_groups;
      if (!Array.isArray(sgs)) sgs = [sgs]; // string match case
      sgs.forEach(sg => {
        const sgMatch = sg.match(/(aws_security_group\.[a-zA-Z0-9_-]+)/);
        if (sgMatch) {
          const edgeId = `e-${id}-${sgMatch[1]}`;
          if (!edgeMap.has(edgeId)) {
            edgeMap.set(edgeId, {
              id: edgeId,
              source: id,
              target: sgMatch[1],
              type: 'smoothstep',
              animated: true,
            });
          }
        }
      });
    }

    // Connect ALB to Subnets (for layout aesthetics) or just keep ALB at top level
    // Connect EC2 to RDS as an example if there's a reference. We'll look at generic references.
    // For any property that references another resource type, create an edge, unless it's a structural parent.
    for (const [key, val] of Object.entries(resource.properties)) {
      if (key === 'vpc_id' || key === 'subnet_id' || key === 'vpc_zone_identifier') continue;
      
      const refMatch = String(val).match(/(aws_[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/);
      if (refMatch) {
        const targetId = refMatch[1];
        if (parsedResources[targetId]) {
          const edgeId = `e-${id}-${targetId}`;
          if (!edgeMap.has(edgeId)) {
            edgeMap.set(edgeId, {
              id: edgeId,
              source: id,
              target: targetId,
              type: 'smoothstep',
              animated: true,
            });
          }
        }
      }
    }
  }

  edges.push(...edgeMap.values());

  return { nodes, edges };
}
