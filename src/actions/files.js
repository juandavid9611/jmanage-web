import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
const URL = endpoints.files;
export async function generatePresignedUrls(files) {
  try {
    files = files.reduce((acc, file) => {
      acc.push({ file_name: file.name, content_type: file.type });
      return acc;
    }, []);
    const res = await axiosInstance.post(`/generate-presigned-urls`, files);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}
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
