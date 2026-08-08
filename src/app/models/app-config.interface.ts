export type AppConfig = {
  platform: string;
  minVersionCode: number;
  latestVersionCode: number;
  forceUpdate: boolean;
  storeUrl: string;
  message: string;
};

export type UpdateAppConfigPayload = Partial<
  Pick<
    AppConfig,
    | 'minVersionCode'
    | 'latestVersionCode'
    | 'forceUpdate'
    | 'storeUrl'
    | 'message'
  >
>;
