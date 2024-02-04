// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: import.meta.env.NG_APP_DEV_API,
  socketUrl: import.meta.env.NG_APP_URL_DEV_SOCKET,
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
