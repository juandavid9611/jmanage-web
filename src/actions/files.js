import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
const URL = endpoints.files;

export async function uploadFileToS3(file, presignedUrl) {
  return fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
}
export async function deleteFile(file_name) {
  try {
    const res = await axiosInstance.delete(`${URL}/${file_name}`);
    return res.data;
  } catch (error) {
    console.error('Failed to delete:', error);
    throw error;
  }
}
