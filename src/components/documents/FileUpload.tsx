import React, { useState } from 'react';
import { FileUploadService, UploadProgress } from '@/lib/services/FileUploadService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  organizationId: string;
  engagementId?: string;
  procedureId?: string;
  category?: 'workpaper' | 'evidence' | 'report' | 'other';
  onUploadComplete?: (documentId: string) => void;
}

export function FileUpload({
  organizationId,
  engagementId,
  procedureId,
  category,
  onUploadComplete,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    setUploading(true);

    for (const file of files) {
      try {
        const { documentId } = await FileUploadService.uploadFile(file, {
          organizationId,
          engagementId,
          procedureId,
          category,
          onProgress: (p) => {
            setProgress((prev) => ({ ...prev, [file.name]: p }));
          },
        });

        setCompleted((prev) => new Set(prev).add(file.name));
        onUploadComplete?.(documentId);

        toast({
          title: 'Success',
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setUploading(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click to select files or drag and drop
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, Excel, Word, Images, CSV (max 50MB each)
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{file.name}</span>
                  {completed.has(file.name) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {progress[file.name] && (
                  <Progress value={progress[file.name].percentage} className="h-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          Upload {files.length} file{files.length > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
}
