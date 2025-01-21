/// <reference types="node" />

interface NextData {
  props: {
    [key: string]: unknown;
    pageProps: {
      [key: string]: unknown;
    };
  };
  page: string;
  query: {
    [key: string]: string;
  };
  buildId: string;
  assetPrefix: string;
  runtimeConfig: {
    [key: string]: unknown;
  };
  nextExport: boolean;
  autoExport: boolean;
  isFallback: boolean;
  dynamicIds: string[];
  err?: Error;
  gsp?: boolean;
  gssp?: boolean;
  customServer?: boolean;
  gip?: boolean;
  appGip?: boolean;
}

declare global {
  interface Window {
    __NEXT_DATA__: NextData;
  }
}
