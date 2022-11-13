import { DoBootstrap, Injector, NgModule, Type } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PepAddonService } from '@pepperi-addons/ngx-lib';

import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';
import { PluginModule } from './plugin/plugin.module';
import { AppRoutingModule } from './app.routes';

import { AppComponent } from './app.component';
import { config } from './addon.config';

import { PluginComponent } from './plugin/plugin.component';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,

        PluginModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        })
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ],
    bootstrap: [
        // AppComponent
    ]
})
export class AppModule implements DoBootstrap {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }

    ngDoBootstrap() {
        //this.pepAddonService.defineCustomElement(`assets-element-${config.AddonUUID}`, PluginComponent, this.injector);
        this.pepAddonService.defineCustomElement(`settings-element-${config.AddonUUID}`, PluginComponent, this.injector);
    }
}
// import { BrowserModule } from '@angular/platform-browser';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { PepAddonService } from '@pepperi-addons/ngx-lib';
// import { NgModule } from '@angular/core';
// import { AppComponent } from './app.component';
// import { PluginModule } from './plugin/plugin.module';
// import { AppRoutingModule } from './app.routes';
// import { config } from './addon.config';

// @NgModule({
//     declarations: [
//         AppComponent,
//     ],
//     imports: [
//         BrowserModule,
//         BrowserAnimationsModule,
//         AppRoutingModule,
//         PluginModule,
//         TranslateModule.forRoot({
//             loader: {
//                 provide: TranslateLoader,
//                 useFactory: (addonService: PepAddonService) => 
//                     PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
//                 deps: [PepAddonService]
//             }
//         })
//     ],
//     providers: [],
//     bootstrap: [AppComponent]
// })
// export class AppModule {
// }