import { startApp } from "./boot/app";
import { bootEarly } from "./boot/early";
import { whenDomReady } from "./boot/ready";

bootEarly();
whenDomReady(() => {
  startApp();
});
