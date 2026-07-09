import { createApp } from '../backend/app.js';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  if (!appInstance) {
    appInstance = await createApp();
  }
  appInstance(req, res);
}
