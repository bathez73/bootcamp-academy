import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';import { join } from 'node:path';
import { FORMATIONS } from '@/lib/formations';import { getServerClient, getServiceRoleClient } from '@/lib/supabase/server';
export async function GET(request: NextRequest, { params }: {params: Promise<{file:string}>}){
 const {file}=await params;const formation=FORMATIONS.find(f=>f.file===file);if(!formation)return new NextResponse('Introuvable',{status:404});
 const sb=await getServerClient();const service=await getServiceRoleClient();if(!sb||!service)return new NextResponse('Service indisponible',{status:503});
 const {data:{user}}=await sb.auth.getUser();if(!user)return NextResponse.redirect(new URL('/login?redirect='+encodeURIComponent('/pdf/'+file),request.url));
 const {data,error}=await service.from('payments').select('id').eq('user_id',user.id).eq('formation',formation.nom).eq('verified',true).limit(1);
 if(error)return new NextResponse('Vérification temporairement indisponible',{status:503});
 if(!data?.length)return new NextResponse('Cette formation doit être achetée avec ton compte.',{status:403});
 try{const buffer=await readFile(join(process.cwd(),'private','pdf',file));return new NextResponse(buffer,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="'+file+'"','Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});}catch{return new NextResponse('Document temporairement indisponible',{status:503});}
}
