const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'https://karanschool.duckdns.org';
// const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:3000';

// Local backend is used by default so admin and user panel read the same CMS data during development.
export const Base_Url = `${API_ORIGIN.replace(/\/$/, '')}/api`;
export const Image_Url = `${API_ORIGIN.replace(/\/$/, '')}/uploads/`;
