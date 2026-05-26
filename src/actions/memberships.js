import { mutate } from 'swr';

import axiosInstance, { endpoints } from 'src/utils/axios';

const URL = endpoints.memberships;

export async function updateMembershipRole(userId, workspaceId, role) {
  const res = await axiosInstance.patch(
    `${URL}/${userId}`,
    { role },
    { params: { workspace_id: workspaceId } }
  );
  mutate((key) => typeof key === 'string' && key.startsWith(endpoints.users));
  return res.data;
}
