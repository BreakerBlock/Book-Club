/**
 * Open demo mode (default ON): no login screens — every visitor is a club member
 * ("Guest Reader") and has staff access, so the whole site can be shown in a pitch.
 * Turn it off when the shop goes live: Vercel → Settings → Environment Variables → DEMO_MODE = off.
 */
export const DEMO = process.env.DEMO_MODE !== "off";
