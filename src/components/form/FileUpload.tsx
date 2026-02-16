import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Download, Loader2, FileIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  getUploadUrl,
  uploadFileToS3,
  listFiles,
  deleteFile,
  type FileItem,
} from '@/lib/api';

const ACCEPTED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg,.jpeg',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'text/csv': '.csv',
};

const ACCEPT_STRING = Object.values(ACCEPTED_TYPES).join(',');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface FileUploadHandle {
  /** Upload any queued files to the given submission. Returns true if all succeeded. */
  uploadPendingFiles: (submissionId: string) => Promise<boolean>;
  /** Whether there are pending files waiting to be uploaded. */
  hasPendingFiles: () => boolean;
}

interface FileUploadProps {
  submissionId?: string;
}

export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(
  function FileUpload({ submissionId }, ref) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const { data, isLoading } = useQuery({
      queryKey: ['files', submissionId],
      queryFn: () => listFiles(submissionId!),
      enabled: !!submissionId,
    });

    const uploadedFiles = data?.files ?? [];

    const validateFile = useCallback(
      (file: File): boolean => {
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 10 MB limit`,
            variant: 'destructive',
          });
          return false;
        }
        if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
          toast({
            title: 'File type not allowed',
            description: `${file.name} is not a supported file type`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      },
      [toast],
    );

    const doUpload = useCallback(
      async (targetId: string, files: File[]) => {
        for (const file of files) {
          const { uploadUrl } = await getUploadUrl(targetId, file.name, file.type);
          await uploadFileToS3(uploadUrl, file);
        }
        queryClient.invalidateQueries({ queryKey: ['files', targetId] });
      },
      [queryClient],
    );

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      hasPendingFiles: () => pendingFiles.length > 0,
      uploadPendingFiles: async (targetId: string) => {
        if (pendingFiles.length === 0) return true;
        try {
          await doUpload(targetId, pendingFiles);
          setPendingFiles([]);
          return true;
        } catch (err) {
          toast({
            title: 'File upload failed',
            description: (err as Error).message,
            variant: 'destructive',
          });
          return false;
        }
      },
    }), [pendingFiles, doUpload, toast]);

    const handleFileSelect = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const valid = Array.from(selectedFiles).filter(validateFile);
        if (valid.length === 0) return;

        if (submissionId) {
          // Upload immediately
          setUploading(true);
          try {
            await doUpload(submissionId, valid);
            toast({ title: 'Upload complete' });
          } catch (err) {
            toast({
              title: 'Upload failed',
              description: (err as Error).message,
              variant: 'destructive',
            });
          } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        } else {
          // Queue for upload after submission
          setPendingFiles((prev) => {
            const existingNames = new Set(prev.map((f) => f.name));
            const newFiles = valid.filter((f) => !existingNames.has(f.name));
            return [...prev, ...newFiles];
          });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      [submissionId, validateFile, doUpload, toast],
    );

    const handleDelete = useCallback(
      async (file: FileItem) => {
        if (!submissionId) return;
        setDeleting(file.filename);
        try {
          await deleteFile(submissionId, file.filename);
          queryClient.invalidateQueries({ queryKey: ['files', submissionId] });
          toast({ title: 'File deleted' });
        } catch (err) {
          toast({
            title: 'Delete failed',
            description: (err as Error).message,
            variant: 'destructive',
          });
        } finally {
          setDeleting(null);
        }
      },
      [submissionId, toast, queryClient],
    );

    const removePending = useCallback((name: string) => {
      setPendingFiles((prev) => prev.filter((f) => f.name !== name));
    }, []);

    const hasFiles = uploadedFiles.length > 0 || pendingFiles.length > 0;

    return (
      <div className="space-y-3">
        <span className="text-sm font-medium leading-none">Upload Files</span>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_STRING}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose Files
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Images, PDF, Excel, CSV (max 10 MB)
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading files...
          </div>
        )}

        {hasFiles && (
          <div className="space-y-1 rounded-md border p-2">
            {/* Pending files (queued, not yet uploaded) */}
            {pendingFiles.map((file) => (
              <div
                key={`pending-${file.name}`}
                className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground italic">
                    uploads on submit
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removePending(file.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {/* Uploaded files */}
            {uploadedFiles.map((file) => (
              <div
                key={file.key}
                className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.filename}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(file)}
                    disabled={deleting === file.filename}
                  >
                    {deleting === file.filename ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
