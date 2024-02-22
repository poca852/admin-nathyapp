interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  /**
   * Built-in environment variable.
   * @see Docs https://github.com/chihab/dotenv-run/packages/angular#node_env.
   */
  readonly NODE_ENV: string;
  // Add your environment variables below
  // readonly NG_APP_API_URL: string;
  [key: string]: any;
  NG_APP_PROD_API: string;
  NG_APP_DEV_API: string;
  NG_APP_URL_DEV_SOCKET: string;
  NG_APP_URL_PROD_SOCKET: string;
  NG_APP_PROJECTID: string;
  NG_APP_APPID: string;
  NG_APP_STORAGEBUCKET: string;
  NG_APP_LOCATIONID: string;
  NG_APP_APIKEY: string;
  NG_APP_AUTHDOMAIN: string;
  NG_APP_MESSAGINGSENDERID: string;
  NG_APP_MAP_BOX: string;
}

/*
 * Remove all the deprecated code below if you're using import.meta.env (recommended)
 */

/****************************** DEPREACTED **************************/
/**
 * @deprecated process.env usage
 * prefer using import.meta.env
 * */
// declare var process: {
//   env: {
//     NODE_ENV: string;
//     [key: string]: any;
//   };
// };

// If your project references @types/node directly (in you) or indirectly (as in RxJS < 7.6.0),
// you might need to use the following declaration merging.
// declare namespace NodeJS {
//   export interface ProcessEnv {
//     readonly NODE_ENV: string;
//     // Add your environment variables below
//   }
// }

// If you're using Angular Universal and process.env notation, you'll need to add the following to your tsconfig.server.json:
/* In your tsconfig.server.json */
// {
//   "extends": "./tsconfig.app.json",
//   ...
//   "exclude": [
//     "src/env.d.ts"
//   ]
// }

/*********************************************************************/
