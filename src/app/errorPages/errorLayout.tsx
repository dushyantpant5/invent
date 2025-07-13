import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
type errorProps = {
  statusCode: string;
  title: string;
  message: string;
};
export default function errorLayout({ statusCode, title, message }: errorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {statusCode === '401' || statusCode === '403' || statusCode === '429' ? (
        <>
          <AlertTriangle className="w-14 h-14 text-black" />
          <div className="font-bold text-black text-9xl ">{statusCode}</div>
        </>
      ) : (
        <img className="h-50" src={statusCode}></img>
      )}
      <div className="text-1.5xl mb-2 mt-2 font-bold">{title}</div>
      <div className="text-1.5xl">{message}</div>
      <Link href="/">
        <Button className="mt-2">Back to Home</Button>
      </Link>
    </div>
  );
}
