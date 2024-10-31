declare global {
    namespace NodeJS {
      interface ProcessEnv {
        DB_CLOUD: string;
        PASSWORD: string;
        NODE_ENV: 'development' | 'production' | 'test';
        PORT?: string;
        // Add any other environment variables your app uses
      }
    }
  }
  
  // This export is necessary to make this a module file
  export {}