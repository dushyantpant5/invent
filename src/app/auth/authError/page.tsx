import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';

export default function AuthError() {
    return(
        <div className="flex flex-col items-center justify-center min-h-screen">
            <AlertTriangle className="w-14 h-14 text-black" />
           <div className="font-bold text-black text-9xl ">401</div> 
           <div className="text-1.5xl mb-2 mt-2">Oops, you don't have permission to access this page.<br/> Please check your credentials and try again.</div>
           <Link href="/"><Button className="mt-2">Back to Home</Button></Link>
        </div>
    )
}