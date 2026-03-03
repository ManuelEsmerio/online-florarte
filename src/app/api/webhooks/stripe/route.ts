import { POST as canonicalPost, runtime } from '@/app/api/stripe/webhook/route';

export { runtime };

export async function POST(req: Request) {
  return canonicalPost(req);
}

