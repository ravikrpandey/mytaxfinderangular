import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';

registerSwiperElements();

// Add the necessary providers inside the `appConfig` object
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers || [],
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(MatSnackBarModule)
  ]
}).catch((err) => console.error(err));
