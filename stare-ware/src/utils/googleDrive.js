// src/utils/googleDrive.js
// IMPORTANT: Set your credentials in a .env file (never commit secrets)
// REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
// REACT_APP_GOOGLE_API_KEY=your-google-api-key

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export function loadGapi() {
  return new Promise((resolve) => {
    if (window.gapi) return resolve(window.gapi);
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => window.gapi.load('client:auth2', () => resolve(window.gapi));
    document.body.appendChild(script);
  });
}

export async function initGapi() {
  if (!CLIENT_ID || !API_KEY) {
    throw new Error('Google API credentials are missing. Set them in your .env file.');
  }
  await loadGapi();
  await window.gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    scope: SCOPES,
  });
}

export async function signInWithGoogleDrive() {
  await initGapi();
  const GoogleAuth = window.gapi.auth2.getAuthInstance();
  await GoogleAuth.signIn();
  return GoogleAuth.currentUser.get().getBasicProfile();
}

export async function uploadFileToDrive({ name, content, mimeType = 'application/json' }) {
  const boundary = '-------314159265358979323846';
  const delimiter = '\r\n--' + boundary + '\r\n';
  const close_delim = '\r\n--' + boundary + '--';

  const metadata = {
    name,
    mimeType,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + mimeType + '\r\n\r\n' +
    content +
    close_delim;

  const response = await window.gapi.client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: { uploadType: 'multipart' },
    headers: {
      'Content-Type': 'multipart/related; boundary=' + boundary,
    },
    body: multipartRequestBody,
  });
  return response.result;
}

export async function listDriveFiles() {
  await initGapi();
  const response = await window.gapi.client.drive.files.list({
    pageSize: 10,
    fields: 'files(id, name, mimeType, modifiedTime)',
  });
  return response.result.files;
}

export async function downloadFileFromDrive(fileId) {
  await initGapi();
  const response = await window.gapi.client.drive.files.get({
    fileId,
    alt: 'media',
  });
  return response.body;
} 