import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser', timeout:45000, expect:{timeout:10000},
  fullyParallel:false, workers:2, retries:0, reporter:'list',
  use:{baseURL:'http://127.0.0.1:3111',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
    {name:'android-chromium',use:{...devices['Pixel 7']}},
    {name:'iphone-webkit',use:{...devices['iPhone 13']}},
  ],
  webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3111',url:'http://127.0.0.1:3111/masterclass',reuseExistingServer:false,timeout:120000},
});
