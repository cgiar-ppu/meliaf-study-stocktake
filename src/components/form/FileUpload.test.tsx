import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileUpload, type FileUploadHandle } from './FileUpload';

const { mockGetUploadUrl, mockUploadFileToS3, mockListFiles, mockDeleteFile, mockToast } =
  vi.hoisted(() => ({
    mockGetUploadUrl: vi.fn(),
    mockUploadFileToS3: vi.fn(),
    mockListFiles: vi.fn(),
    mockDeleteFile: vi.fn(),
    mockToast: vi.fn(),
  }));

vi.mock('@/lib/api', () => ({
  getUploadUrl: mockGetUploadUrl,
  uploadFileToS3: mockUploadFileToS3,
  listFiles: mockListFiles,
  deleteFile: mockDeleteFile,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

function createFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

function renderFileUpload(
  props: Partial<React.ComponentProps<typeof FileUpload>> = {},
  ref?: React.Ref<FileUploadHandle>
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <FileUpload ref={ref} {...props} />
    </QueryClientProvider>
  );
}

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListFiles.mockResolvedValue({ files: [] });
  });

  it('renders upload button', () => {
    renderFileUpload();
    expect(screen.getByText('Choose Files')).toBeInTheDocument();
  });

  it('has correct accept attribute on hidden file input', () => {
    renderFileUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.accept).toContain('.png');
    expect(input.accept).toContain('.pdf');
    expect(input.accept).toContain('.xlsx');
    expect(input.accept).toContain('.csv');
  });

  it('rejects files > 10MB with toast', async () => {
    renderFileUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = createFile('big.pdf', 11 * 1024 * 1024, 'application/pdf');

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'File too large' })
      );
    });
  });

  it('rejects unsupported file types with toast', async () => {
    renderFileUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = createFile('test.exe', 100, 'application/x-msdownload');

    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'File type not allowed' })
      );
    });
  });

  it('queues file to pending state without submissionId', async () => {
    renderFileUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFile('doc.pdf', 1000, 'application/pdf');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText('uploads on submit')).toBeInTheDocument();
  });

  it('calls upload APIs with submissionId', async () => {
    mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/upload' });
    mockUploadFileToS3.mockResolvedValue(undefined);
    renderFileUpload({ submissionId: 'sub-1' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFile('report.pdf', 500, 'application/pdf');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockGetUploadUrl).toHaveBeenCalledWith('sub-1', 'report.pdf', 'application/pdf');
      expect(mockUploadFileToS3).toHaveBeenCalled();
    });
  });

  it('shows pending files list', async () => {
    renderFileUpload();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFile('data.csv', 200, 'text/csv');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('data.csv')).toBeInTheDocument();
    });
  });

  it('ref.hasPendingFiles returns correct boolean', async () => {
    const ref = createRef<FileUploadHandle>();
    renderFileUpload({}, ref);

    expect(ref.current!.hasPendingFiles()).toBe(false);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFile('test.png', 100, 'image/png');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(ref.current!.hasPendingFiles()).toBe(true);
    });
  });

  it('shows existing files from listFiles query', async () => {
    mockListFiles.mockResolvedValue({
      files: [
        { key: 'files/sub-1/report.pdf', filename: 'report.pdf', size: 1024, downloadUrl: 'https://example.com/dl' },
      ],
    });

    renderFileUpload({ submissionId: 'sub-1' });

    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });
  });

  it('calls deleteFile API when delete button clicked', async () => {
    const user = userEvent.setup();
    mockListFiles.mockResolvedValue({
      files: [
        { key: 'files/sub-1/report.pdf', filename: 'report.pdf', size: 1024, downloadUrl: 'https://example.com/dl' },
      ],
    });
    mockDeleteFile.mockResolvedValue(undefined);

    renderFileUpload({ submissionId: 'sub-1' });

    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    // Find the delete button (the Trash2 icon button in the uploaded files section)
    const deleteButtons = document.querySelectorAll('button.text-destructive');
    expect(deleteButtons.length).toBeGreaterThan(0);
    await user.click(deleteButtons[0] as HTMLElement);

    await waitFor(() => {
      expect(mockDeleteFile).toHaveBeenCalledWith('sub-1', 'report.pdf');
    });
  });
});
