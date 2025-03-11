import { drizzle } from 'drizzle-orm/node-postgres';

// show if dev env
if (process.env.NODE_ENV === 'development') {
  console.log(process.env.DATABASE_URL);
}


export const db = drizzle(process.env.DATABASE_URL!);