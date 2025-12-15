import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------

export async function getMyAccounts() {
  try {
    const res = await axiosInstance.get('/accounts/my-accounts');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return [];
  }
}
