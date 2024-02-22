export const environment = {
  production: true,
  baseUrl: import.meta.env.NG_APP_PROD_API,
  socketUrl: import.meta.env.NG_APP_URL_PROD_SOCKET,
  mapbox_token: import.meta.env.NG_APP_MAP_BOX,
  firebase: {
    projectId: import.meta.env.NG_APP_PROJECTID,
    appId: import.meta.env.NG_APP_APPID,
    storageBucket: import.meta.env.NG_APP_STORAGEBUCKET,
    locationId: import.meta.env.NG_APP_LOCATIONID,
    apiKey: import.meta.env.NG_APP_APIKEY,
    authDomain: import.meta.env.NG_APP_AUTHDOMAIN,
    messagingSenderId: import.meta.env.NG_APP_MESSAGINGSENDERID,
  }
};
