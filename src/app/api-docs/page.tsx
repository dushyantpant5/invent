import { notFound } from 'next/navigation';

import ApiDocsClient from './ApiDocsClient';

export default function ApiDocsPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <ApiDocsClient />;
}
