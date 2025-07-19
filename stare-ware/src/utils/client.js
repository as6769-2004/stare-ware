const googleClientConfig = {
  web: {
    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    project_id: process.env.REACT_APP_GOOGLE_PROJECT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.REACT_APP_GOOGLE_REDIRECT_URI],
    javascript_origins: [process.env.REACT_APP_GOOGLE_ORIGIN]
  }
};

export default googleClientConfig;
