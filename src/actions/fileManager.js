import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const URL = endpoints.files;

// ----------------------------------------------------------------------
// SWR Hooks
// ----------------------------------------------------------------------

export function useGetFiles() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      files: data || [],
      filesLoading: isLoading,
      filesError: error,
      filesValidating: isValidating,
      filesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetFile(id) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${id}`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      file: data,
      fileLoading: isLoading,
      fileError: error,
      fileValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// CRUD Functions
// ----------------------------------------------------------------------

export async function uploadFiles(files) {
  try {
    const { uploadFileToS3 } = await import('src/actions/filesS3');
    
    // Process each file individually
    const uploadPromises = files.map(async (file) => {
      // Extract file extension from filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Step 1: Create file metadata (url = null)
      const createRes = await axiosInstance.post(URL, {
        name: file.name,
        type: fileExtension, // Just the extension: 'jpeg', 'pdf', etc.
        size: file.size,
      });
      const newFile = createRes.data;

      // Step 2: Generate presigned URL for this specific file
      const presignedRes = await axiosInstance.post(
        `${URL}/${newFile.id}/generate-presigned-url`,
        {
          file_name: file.name,
          content_type: file.type, // Full MIME type for S3
        }
      );

      // Step 3: Upload to S3 using presigned URL
      await uploadFileToS3(file, presignedRes.data.url);

      // Step 4: Confirm upload with filename
      await axiosInstance.post(`${URL}/${newFile.id}/add-file`, {
        file_name: file.name,
      });

      return newFile;
    });

    await Promise.all(uploadPromises);
    
    mutate(URL);
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export async function deleteFile(fileName) {
  const res = await axiosInstance.delete(`${URL}/${fileName}`);
  mutate(URL);
  return res.data;
}

export async function deleteFiles(fileNames) {
  const res = await axiosInstance.delete(`${URL}/batch`, { data: { file_names: fileNames } });
  mutate(URL);
  return res.data;
}

export async function downloadFile(fileName) {
  try {
    const response = await axiosInstance.get(`${URL}/${fileName}/download`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}