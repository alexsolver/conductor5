// Domain entities should not depend on infrastructure

export interface Skill {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  skills: Skill[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: User[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  projectId: string;
  assigneeId: string | null;
  completed: boolean;
}