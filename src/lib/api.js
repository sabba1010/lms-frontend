/**
 * Centralized API configuration.
 *
 * LOCAL DEV  → VITE_API_URL=http://104.250.128.20:5000/api
 * PRODUCTION → VITE_API_URL=http://104.250.128.20:5000
 *
 * সব API call এই BASE URL থেকে শুরু হয়।
 * Usage:
 *   import API_BASE from '../lib/api';
 *   const res = await fetch(`${API_BASE}/courses`);
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://104.250.128.20:5000/api';
const BACKEND_URL = API_BASE.replace('/api', '');

export { BACKEND_URL };
export default API_BASE;
