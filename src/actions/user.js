import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

const URL = endpoints.users;

export function useGetUsers() {
  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      users: data?.users || [],
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating,
      usersEmpty: !isLoading && !data?.users.length,
    }),
    [data?.users, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export function useGetUser(userId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${userId}`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      user: data,
      userLoading: isLoading,
      userError: error,
      userValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export async function getUser(userId) {
  return axiosInstance.get(`${URL}/${userId}`).then((res) => res.data);
}

export async function createUser(userData) {
  try {
    const res = await axiosInstance.post(URL, userData);
    mutate(URL);
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateUser(id, userData) {
  userData.id = id;
  const res = await axiosInstance.put(`${URL}/${id}`, userData);
  mutate(URL);
  mutate(`${URL}/${id}`);
  return res.data;
}

export async function updateUserMetrics(id, metricsData) {
  const res = await axiosInstance.put(`${URL}/${id}/metrics`, metricsData);
  mutate(URL);
  return res.data;
}

export async function deleteUser(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate(URL);
  return res.data;
}

export function useGetUserMetrics(userId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${userId}/metrics`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      metrics: data || {},
      metricsLoading: isLoading,
      metricsError: error,
      metricsValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export function useGetLateArrives(userId) {
  const { data, isLoading, error, isValidating } = useSWR(`${URL}/${userId}/late_arrives`, fetcher);

  const memoizedValue = useMemo(
    () => ({
      lateArrives: data ?? [],
      lateArrivesLoading: isLoading,
      lateArrivesError: error,
      lateArrivesValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
  return memoizedValue;
}

export async function generatePresignedUrl(userId, file) {
  try {
    const files = [];
    files.push({ file_name: file.name, content_type: file.type });
    const res = await axiosInstance.post(`${URL}/${userId}/generate-presigned-url`, files);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}

export async function updateAvatarUrl(id, avatarUrl) {
  const data = { avatar_url: avatarUrl };
  const res = await axiosInstance.put(`${URL}/${id}/avatar`, data);
  mutate(`${URL}/${id}`, { ...data }, false);

  // Optionally, revalidate afterward if you want to fetch fresh data
  mutate(`${URL}/${id}`);
  return res.data;
}

export function get_top_goals_and_assists(group) {
  if (group === 'masculino') {
    return masc_goals_and_assits;
  }
  return fem_goals_and_assits;
}

const masc_goals_and_assits = [
  {
    name: 'Santiago Lozano',
    goals: 7,
    assists: 2,
    avatarUrl: '/assets/images/avatar/masc_1.jpg',
  },
  {
    name: 'Cristian Medina',
    goals: 14,
    assists: 4,
    avatarUrl: '/assets/images/avatar/masc_2.jpg',
  },
  {
    name: 'Daniel Rodriguez',
    goals: 8,
    assists: 12,
    avatarUrl: '/assets/images/avatar/masc_3.jpg',
  },
  {
    name: 'Abdulh Daza',
    goals: 4,
    assists: 9,
    avatarUrl: '/assets/images/avatar/masc_4.jpg',
  },
  {
    name: 'Juan David Rodriguez',
    goals: 3,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_9.jpg',
  },
  { name: 'Julio Mejia', goals: 2, assists: 1, avatarUrl: '/assets/images/avatar/masc_5.jpg' },
  {
    name: 'Julio Rodridrugez',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_6.jpg',
  },
  {
    name: 'Alejandro Archila',
    goals: 2,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_3.jpg',
  },
  { name: 'Felipe Morales', goals: 2, assists: 0, avatarUrl: '/assets/images/avatar/masc_6.jpg' },
  {
    name: 'Adrian Villalba',
    goals: 1,
    assists: 1,
    avatarUrl: '/assets/images/avatar/masc_7.jpg',
  },
  {
    name: 'Cristian Gomez',
    goals: 7,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_8.jpg',
  },
  {
    name: 'Diego Herrera',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_9.jpg',
  },
  {
    name: 'Leonardo Triviño',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_10.jpg',
  },
  {
    name: 'Jonathan Mindiola',
    goals: 2,
    assists: 1,
    avatarUrl: '/assets/images/avatar/masc_11.jpg',
  },
  {
    name: 'Cristian Lozano',
    goals: 0,
    assists: 2,
    avatarUrl: '/assets/images/avatar/masc_1.jpg',
  },
  { name: 'Juan Alarcon', goals: 1, assists: 1, avatarUrl: '/assets/images/avatar/masc_2.jpg' },
  {
    name: 'Santiago Motta',
    goals: 0,
    assists: 1,
    avatarUrl: '/assets/images/avatar/masc_3.jpg',
  },
  {
    name: 'Luis Garcia',
    goals: 0,
    assists: 1,
    avatarUrl: '/assets/images/avatar/masc_4.jpg',
  },
  {
    name: 'Gabriel Bohorquez',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_5.jpg',
  },
  {
    name: 'Juan Quilaguy',
    goals: 2,
    assists: 1,
    avatarUrl: '/assets/images/avatar/masc_6.jpg',
  },
  {
    name: 'Wilmis Gonzalez',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_7.jpg',
  },
  {
    name: 'Jorge Carrasco',
    goals: 2,
    assists: 1,
    avatarUrl: '/assets/images/avatar/masc_8.jpg',
  },
  {
    name: 'Santiago Motta',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_10.jpg',
  },
  {
    name: 'Sergio Senestrari',
    goals: 0,
    assists: 1,
    avatarUrl: '/assets/images/avatar/masc_11.jpg',
  },
  {
    name: 'Juan Lozano',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/masc_1.jpg',
  },
];

const fem_goals_and_assits = [
  {
    name: 'Paula Sierra',
    goals: 5,
    assists: 0,
    avatarUrl: '/assets/images/avatar/fem_1.jpg',
  },
  {
    name: 'Luisa Pineda',
    goals: 9,
    assists: 0,
    avatarUrl: '/assets/images/avatar/fem_2.jpg',
  },
  {
    name: 'Estefania Losada',
    goals: 2,
    assists: 0,
    avatarUrl: '/assets/images/avatar/fem_1.jpg',
  },
  {
    name: 'Valentina Bello',
    goals: 2,
    assists: 1,
    avatarUrl: '/assets/images/avatar/fem_2.jpg',
  },
  { name: 'Cristina Perez', goals: 0, assists: 2, avatarUrl: '/assets/images/avatar/fem_3.jpg' },
  {
    name: 'Valentina Murillo',
    goals: 1,
    assists: 0,
    avatarUrl: '/assets/images/avatar/fem_1.jpg',
  },
  {
    name: 'Tatiana Montoya',
    goals: 0,
    assists: 3,
    avatarUrl: '/assets/images/avatar/fem_2.jpg',
  },
  {
    name: 'Valentina Suarez',
    goals: 0,
    assists: 2,
    avatarUrl: '/assets/images/avatar/fem_3.jpg',
  },
  {
    name: 'Valeria Cortez',
    goals: 0,
    assists: 1,
    avatarUrl: '/assets/images/avatar/fem_1.jpg',
  },
  {
    name: 'Alejandra Rojas',
    goals: 0,
    assists: 1,
    avatarUrl: '/assets/images/avatar/fem_2.jpg',
  },
  {
    name: 'Monica Pacheco',
    goals: 1,
    assists: 1,
    avatarUrl: '/assets/images/avatar/fem_3.jpg',
  },
  {
    name: 'Juliana del Castillo',
    goals: 3,
    assists: 0,
    avatarUrl: '/assets/images/avatar/fem_1.jpg',
  },
  {
    name: 'Laura Suarez',
    goals: 0,
    assists: 1,
    avatarUrl: '/assets/images/avatar/fem_1.jpg',
  },
];
