/**
 * ==================================================================
 * DOCUMENT UPLOADER COMPONENT
 * ==================================================================
 * Reusable document upload component with drag & drop support
 * ==================================================================
 */

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, FileText, Image, Table2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUploadDocument } from '@/hooks/useDocumentStorage';
import { DocumentCategory, validateFile, formatFileSize, ALLOWED_FILE_TYPES } from '@/lib/document-storage';

interface DocumentUploaderProps {
  engagementId: string;
  defaultCategory?: DocumentCategory;
  onUploadComplete?: () => void;
}

export function DocumentUploader({
  engagementId,
  defaultCategory = 'workpaper',
  onUploadComplete,
}: DocumentUploaderProps) {
  const uploadMutation = useUploadDocument();

  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory);
  const [description, setDescription] = useState('');
  const [workpaperReference, setWorkpaperReference] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Handle file selection
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Process selected files
  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join('\n'));
    } else {
      setErrorMessage('');
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  // Remove a file from selection
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-600" />;
    }
    if (file.type.includes('spreadsheet') || file.type === 'text/csv' || file.type.includes('excel')) {
      return <Table2 className="h-5 w-5 text-green-600" />;
    }
    if (file.type === 'application/pdf' || file.type.includes('word')) {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-blue-600" />;
  };

  // Upload files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let completed = 0;

      for (const file of selectedFiles) {
        await uploadMutation.mutateAsync({
          file,
          engagementId,
          category,
          options: {
            description: description || undefined,
            workpaperReference: workpaperReference || undefined,
          },
        });

        completed++;
        setUploadProgress((completed / totalFiles) * 100);
      }

      setUploadStatus('success');
      setTimeout(() => {
        resetForm();
        setIsOpen(false);
        onUploadComplete?.();
      }, 1500);
    } catch (error: any) {
      setUploadStatus('error');
      setErrorMessage(error.message || 'Upload failed');
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFiles([]);
    setCategory(defaultCategory);
    setDescription('');
    setWorkpaperReference('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const categoryLabels: Record<DocumentCategory, string> = {
    workpaper: 'Workpaper',
    supporting_document: 'Supporting Document',
    client_pbc: 'Client PBC Item',
    correspondence: 'Correspondence',
    signed_letter: 'Signed Letter',
    audit_report: 'Audit Report',
    management_letter: 'Management Letter',
    confirmation: 'Confirmation',
    representation_letter: 'Representation Letter',
    engagement_letter: 'Engagement Letter',
    other: 'Other',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload workpapers, supporting documents, or other audit files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PDF, Word, Excel, CSV, Images (Max 50MB each)
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              accept={ALLOWED_FILE_TYPES.join(',')}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>Select Files</span>
              </Button>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploadStatus === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium">
                <AlertCircle className="h-4 w-4" />
                Error
              </div>
              <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{errorMessage}</p>
            </div>
          )}

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 font-medium">
                <CheckCircle className="h-4 w-4" />
                Upload Complete
              </div>
              <p className="text-sm text-green-700 mt-1">
                {selectedFiles.length} file(s) uploaded successfully.
              </p>
            </div>
          )}

          {/* Metadata Fields */}
          {selectedFiles.length > 0 && uploadStatus === 'idle' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Workpaper Reference</Label>
                  <Input
                    value={workpaperReference}
                    onChange={(e) => setWorkpaperReference(e.target.value)}
                    placeholder="e.g., A-1, B-2.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document..."
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadStatus === 'uploading' || uploadStatus === 'success'}
          >
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
