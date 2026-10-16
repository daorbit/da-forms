import { useState } from 'react';
import { uploadBackgroundImage } from '@/lib/api';
import { notify } from '@/lib/notify';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function useImageUpload() {
  const workspaceId = useWorkspaceId();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | null): Promise<string | null> => {
    if (!file) return null;
    if (!file.type.startsWith('image/')) {
      notify.error('Choose an image file');
      return null;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      notify.error('Images must be under 15MB');
      return null;
    }
    setUploading(true);
    try {
      const { url } = await uploadBackgroundImage(file, workspaceId);
      return url;
    } catch {
      notify.error('Could not upload the image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
