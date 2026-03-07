import axios from 'axios';

const coreAxiosInstance = axios.create({
  baseURL: process.env.CORE_SERVICE_API_BASE_URL,
  timeout: 10000,
});

coreAxiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getCoreServiceToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

async function getCoreServiceToken(): Promise<string> {
  const { data } = await axios.get<{ data: { authJwt: string } }>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/getCoreToken`
  );
  if (!data?.data?.authJwt) throw new Error('Core service token unavailable');
  return data.data.authJwt;
}

export default coreAxiosInstance;
