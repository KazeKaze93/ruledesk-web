import { bootEarly } from "./boot/early";
import { applyLayoutBeforePaint } from "./boot/layout";
import { scheduleAfterFirstPaint, whenDomReady } from "./boot/ready";

bootEarly();

whenDomReady(() => {
  applyLayoutBeforePaint();
  scheduleAfterFirstPaint(() => {
    void import("./boot/app").then(({ startApp }) => {
      void startApp();
    });
  });
});
