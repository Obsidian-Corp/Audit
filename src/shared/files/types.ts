export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  mime_type: string;
  size: number;
  folder?: string;
  tags?: string[];
  uploaded_by?: string;
  created_at: string;
  project_id?: string;
  task_id?: string;
  deliverable_id?: string;
  workstream_id?: string;
}

export interface FileUploadOptions {
  organizationId: string;
  projectId?: string;
  taskId?: string;
  deliverableId?: string;
  workstreamId?: string;
  folder?: string;
  tags?: string[];
  onProgress?: (progress: number) => void;
}

export interface FileFilter {
  folder?: string;
  projectId?: string;
  taskId?: string;
  deliverableId?: string;
  mimeType?: string;
  searchQuery?: string;
}
