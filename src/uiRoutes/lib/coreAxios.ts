import axios from 'axios';
import jwt from 'jsonwebtoken';

// For Version 1
const coreAxiosInstance = axios.create({
  baseURL: process.env.CORE_SERVICE_API_BASE_URL,
  timeout: 10000,
});

interface ICoreAccessTokenPayload {
  userId: string;
  inventoryId: string;
  role: string;
}

coreAxiosInstance.interceptors.request.use(
  async (config) => {
    const coreServiceTokenJwt = await getCoreServiceTokenJwt();
    config.headers.Authorization = `Bearer ${coreServiceTokenJwt}`;
    return config;
  },
  (error) => Promise.reject(error)
);

async function getCoreServiceTokenJwt(): Promise<{ coreJwtToken: string }> {
  const tokenPayload: ICoreAccessTokenPayload | null = await buildCoreServiceTokenPayload();
  if (!tokenPayload) throw Error('Error getting core token payload');

  const secretKey: string | undefined = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error('JWT secret key is not defined');
  }
  const tokenJwt = jwt.sign(tokenPayload, secretKey);
  return { coreJwtToken: tokenJwt };
}

async function buildCoreServiceTokenPayload(): Promise<ICoreAccessTokenPayload | null> {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/getCoreToken`);
  if (!data) return null;
  const tokenPayload: ICoreAccessTokenPayload = {
    userId: data.userId,
    inventoryId: data.inventoryId,
    role: data.role,
  };
  return tokenPayload;
}

export default coreAxiosInstance;
