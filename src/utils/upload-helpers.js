import { uploadFileToS3 } from 'src/actions/files';

import axiosInstance, { endpoints } from './axios';


/**
 * Upload multiple product images to S3
 * @param {File[]} files - Array of image files to upload
 * @param {string} productId - The product ID for organizing images
 * @returns {Promise<string[]>} Array of storage paths for uploaded images
 */
export async function uploadMultipleProductImages(files, productId) {
  try {
    if (!files || files.length === 0) {
      return [];
    }

    // Step 1: Request presigned URLs for all files in a single batch request
    const fileMetadata = files.map((file) => ({
      file_name: file.name,
      content_type: file.type,
    }));

    const response = await axiosInstance.post(
      `${endpoints.products}/${productId}/generate-presigned-urls`,
      fileMetadata
    );

    // Response format: [{ fileName: presignedUrl }, { fileName: presignedUrl }, ...]
    const presignedUrlMappings = response.data;

    console.log('Presigned URLs response:', presignedUrlMappings);

    // Step 2: Upload all files to S3 concurrently
    const uploadPromises = files.map(async (file, index) => {
      const mapping = presignedUrlMappings[index];
      
      if (!mapping) {
        console.error(`No presigned URL mapping for file at index ${index}:`, file.name);
        throw new Error(`No presigned URL received for file: ${file.name}`);
      }

      const fileName = Object.keys(mapping)[0];
      const presignedUrl = mapping[fileName];

      if (!presignedUrl) {
        console.error(`No presigned URL found in mapping for file ${file.name}:`, mapping);
        throw new Error(`Invalid presigned URL for file: ${file.name}`);
      }

      await uploadFileToS3(file, presignedUrl);
      return fileName;
    });

    const uploadedPaths = await Promise.all(uploadPromises);
    return uploadedPaths;
  } catch (error) {
    console.error('Failed to upload multiple product images:', error);
    throw error;
  }
}

/**
 * Process images for product creation/update
 * Separates existing image paths from new files that need to be uploaded
 * @param {Array} images - Mixed array of File objects and string paths
 * @param {string} productId - The product ID for organizing images
 * @returns {Promise<string[]>} Array of all image paths (existing + newly uploaded)
 */
export async function processProductImages(images, productId) {
  if (!images || images.length === 0) {
    return [];
  }

  const existingPaths = [];
  const newFiles = [];

  // Separate existing paths from new files
  images.forEach((image) => {
    if (typeof image === 'string') {
      existingPaths.push(image);
    } else if (image instanceof File) {
      newFiles.push(image);
    }
  });

  // Upload new files if any
  let newPaths = [];
  if (newFiles.length > 0) {
    newPaths = await uploadMultipleProductImages(newFiles, productId);
  }

  // Combine existing and new paths
  return [...existingPaths, ...newPaths];
}
