import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { FileService } from '../FileService';
import { FileUploadOptions } from '../types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface FileUploadButtonProps {
  options: Omit<FileUploadOptions, 'onProgress'>;
  onUploadComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function FileUploadButton({
  options,
  onUploadComplete,
  variant = 'default',
  size = 'default',
  className,
}: FileUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadOptions: FileUploadOptions = {
          ...options,
          onProgress: (p) => setProgress((i / files.length + p / files.length) * 100),
        };

        const result = await FileService.uploadFile(file, uploadOptions);
        
        if (!result) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      toast({
        title: 'Upload complete',
        description: `Successfully uploaded ${files.length} file(s).`,
      });

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload files.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      <div className="space-y-2">
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
        
        {uploading && (
          <Progress value={progress} className="w-full" />
        )}
      </div>
    </>
  );
}
