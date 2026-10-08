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

// SWR keys can be strings or [url, config] tuples; only touch the product ones.
const isProductKey = (key) => {
  const url = Array.isArray(key) ? key[0] : key;
  return typeof url === 'string' && url.startsWith(URL);
};

const revalidateProducts = () => mutate(isProductKey, undefined, { revalidate: true });

export function useGetProducts() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      products: Array.isArray(data) ? data : [],
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty: !isLoading && !error && !data?.length,
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

// `query` is either a plain string (name/tag search) or { q, category, minPrice, maxPrice, sortBy }.
export function useSearchProducts(query) {
  const filters = typeof query === 'string' ? { q: query } : query || {};
  const { q, category, minPrice, maxPrice, sortBy } = filters;

  const params = {};
  if (q) params.q = q;
  if (category && category !== 'all') params.category = category;
  if (minPrice != null && minPrice !== '') params.minPrice = minPrice;
  if (maxPrice != null && maxPrice !== '') params.maxPrice = maxPrice;
  if (sortBy) params.sortBy = sortBy;

  const queryUrl = Object.keys(params).length ? [`${URL}_search`, { params }] : null;

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
      searchEmpty: !!queryUrl && !isLoading && !error && !data?.results?.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.results, error, isLoading, isValidating, !!queryUrl]
  );

  return memoizedValue;
}

// Uploads new image files to S3 and registers them on the product.
export async function uploadProductImages(productId, files) {
  const fileObjects = (files || []).filter((img) => img instanceof File);
  if (!fileObjects.length) return;

  const presignedResponse = await generatePresignedUrls(productId, fileObjects);

  // fetch does not reject on HTTP errors, so check each PUT explicitly.
  await Promise.all(
    fileObjects.map(async (file) => {
      const res = await uploadFileToS3(file, presignedResponse.urls[file.name]);
      if (!res.ok) throw new Error(`Image upload failed (${res.status})`);
    })
  );

  await addImages(
    productId,
    fileObjects.map((file) => file.name)
  );
}

// Creation is not atomic: the product is created first and images are uploaded after.
// If the upload fails the product already exists, so the error carries it
// (`error.product`, `error.imageUploadFailed`) and the caller can retry the upload with
// `uploadProductImages` or remove the orphan with `deleteProduct`.
export async function createProduct(productData) {
  const { images, ...rest } = productData;

  const res = await axiosInstance.post(URL, rest);
  const newProduct = res.data;

  try {
    await uploadProductImages(newProduct.id, images);
  } catch (error) {
    error.product = newProduct;
    error.imageUploadFailed = true;
    revalidateProducts();
    throw error;
  }

  revalidateProducts();
  return newProduct;
}

// `images` handling: new File entries are uploaded after the PUT. When the caller passes
// `originalImages` and fewer existing (string) images remain, the remaining list is sent so
// removals persist; otherwise `images` is left out so existing ones are not overwritten.
export async function updateProduct(id, productData, originalImages = []) {
  const { images, ...rest } = productData;
  const list = images || [];

  const newFiles = list.filter((img) => img instanceof File);
  const remaining = list.filter((img) => typeof img === 'string');

  const payload = { ...rest };
  if (remaining.length < originalImages.length) {
    payload.images = remaining;
  }

  const res = await axiosInstance.put(`${URL}/${id}`, payload);

  if (newFiles.length > 0) {
    await uploadProductImages(id, newFiles);
  }

  revalidateProducts();
  return res.data;
}

export async function deleteProduct(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate(isProductKey);
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
  revalidateProducts();
  return res.data;
}
