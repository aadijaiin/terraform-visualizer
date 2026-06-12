import { GroupNode } from "../nodes/GroupNode";
import { ResourceNode } from "../nodes/ResourceNode";

export const nodeTypes = {
  group: GroupNode,
  leaf: ResourceNode,
};

export const INITIAL_CODE = `
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

export const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
};
