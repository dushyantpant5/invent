import { createApiClient } from '@/uiRoutes/lib/createApiClient';

const authClient = createApiClient('/auth');

export const signUp = async (email: string, password: string): Promise<void> => {
  const data = { email, password };
  await authClient.post('/signup', data);
};
