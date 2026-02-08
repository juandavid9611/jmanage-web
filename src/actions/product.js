import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { uploadFileToS3 } from 'src/actions/filesS3';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------
const URL = endpoints.products;

export function useGetProducts() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      products: data || [],
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetProduct(productId) {
  const { data, isLoading, error, isValidating } = useSWR(
    `${URL}/${productId}`,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      product: data,
      productLoading: isLoading,
      productError: error,
      productValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useSearchProducts(query) {
  const queryUrl = query ? [`${URL}_search`, { params: { query } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(queryUrl, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && !data?.results.length,
    }),
    [data?.results, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export async function createProduct(productData) {
  // Step 1: Create product without images first
  const productDataWithoutImages = { ...productData, images: [] };
  const res = await axiosInstance.post(URL, productDataWithoutImages);
  const newProduct = res.data;

  // Step 2: If there are images to upload, handle them separately
  if (productData.images && productData.images.length > 0) {
    const fileObjects = productData.images.filter((img) => img instanceof File);

    if (fileObjects.length > 0) {
      // Step 3: Generate presigned URLs
      const presignedResponse = await generatePresignedUrls(newProduct.id, fileObjects);

      // Step 4: Upload files to S3
      const uploadPromises = fileObjects.map((file) => {
        const presignedUrl = presignedResponse.urls[file.name];
        return uploadFileToS3(file, presignedUrl);
      });
      await Promise.all(uploadPromises);

      // Step 5: Call add_images endpoint to update product
      const file_names = fileObjects.map((file) => file.name);
      await addImages(newProduct.id, file_names);
    }
  }

  mutate((key) => key.startsWith(URL), undefined, { revalidate: true });
  return newProduct;
}

export async function updateProduct(id, productData) {
  // Separate new files from existing image paths
  const newFiles = productData.images?.filter((img) => img instanceof File) || [];

  // Step 1: Update product WITHOUT images field (to avoid overwriting existing images)
  const { images, ...productDataWithoutImages } = productData;
  const res = await axiosInstance.put(`${URL}/${id}`, productDataWithoutImages);

  // Step 2: If there are new files to upload, handle them separately
  if (newFiles.length > 0) {
    // Step 3: Generate presigned URLs
    const presignedResponse = await generatePresignedUrls(id, newFiles);

    // Step 4: Upload files to S3
    const uploadPromises = newFiles.map((file) => {
      const presignedUrl = presignedResponse.urls[file.name];
      return uploadFileToS3(file, presignedUrl);
    });
    await Promise.all(uploadPromises);

    // Step 5: Call add_images endpoint to add new images to product
    const file_names = newFiles.map((file) => file.name);
    await addImages(id, file_names);
  }

  mutate((key) => key.startsWith(URL), undefined, { revalidate: true });
  return res.data;
}

export async function deleteProduct(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate((key) => key.startsWith(URL));
  return res;
}

export async function generatePresignedUrls(productId, files) {
  try {
    const fileMetadata = files.reduce((acc, file) => {
      acc.push({ file_name: file.name, content_type: file.type });
      return acc;
    }, []);
    const res = await axiosInstance.post(
      `${URL}/${productId}/generate-presigned-urls`,
      fileMetadata
    );
    return res.data;
  } catch (error) {
    console.error('Failed to generate presigned URLs:', error);
    throw error;
  }
}

export async function addImages(productId, file_names) {
  const res = await axiosInstance.post(`${URL}/${productId}/add_images`, file_names);
  mutate((key) => key.startsWith(URL), undefined, { revalidate: true });
  return res.data;
}
