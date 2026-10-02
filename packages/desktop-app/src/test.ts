// This file is required by karma.conf.js and initializes the Angular testing environment;
// since Angular 15 the karma builder collects the **/*.spec.ts files on its own.
import "zone.js/testing";
import { NgModule, provideZoneChangeDetection } from "@angular/core";
import { getTestBed } from "@angular/core/testing";
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from "@angular/platform-browser-dynamic/testing";

// The app runs with zone-based change detection (see main.ts), which TestBed no longer uses by default
@NgModule({ providers: [provideZoneChangeDetection()] })
class ZoneChangeDetectionModule {}

// Initialize the Angular testing environment
getTestBed().initTestEnvironment([BrowserDynamicTestingModule, ZoneChangeDetectionModule], platformBrowserDynamicTesting());
