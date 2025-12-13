import { useState, useEffect } from 'react';
import { FileService } from '../FileService';
import { FileMetadata, FileFilter } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useFiles(filter: FileFilter = {}) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadFiles = async () => {
    setIsLoading(true);
    const fileList = await FileService.listFiles(filter);
    setFiles(fileList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [JSON.stringify(filter)]);

  const deleteFile = async (fileId: string, filePath: string) => {
    const success = await FileService.deleteFile(fileId, filePath);
    if (success) {
      toast({
        title: 'File deleted',
        description: 'The file has been successfully deleted.',
      });
      loadFiles();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete the file.',
        variant: 'destructive',
      });
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      await FileService.downloadFile(filePath, fileName);
      toast({
        title: 'Download started',
        description: 'Your file download has begun.',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download the file.',
        variant: 'destructive',
      });
    }
  };

  return {
    files,
    isLoading,
    deleteFile,
    downloadFile,
    refresh: loadFiles,
  };
}
