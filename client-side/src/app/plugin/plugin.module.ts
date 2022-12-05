import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
// import { BrowserModule } from '@angular/platform-browser';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PluginComponent } from './plugin.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';

import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';

import { PepAddonService, PepCustomizationService, PepFileService, PepHttpService} from '@pepperi-addons/ngx-lib';

import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepIconModule, PepIconRegistry, pepIconSystemMenu } from '@pepperi-addons/ngx-lib/icon';

import { PepColorModule } from '@pepperi-addons/ngx-lib/color';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepQuantitySelectorModule } from '@pepperi-addons/ngx-lib/quantity-selector';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { config } from '../addon.config';

export const routes: Routes = [
    {
        path: '',
        component: PluginComponent
    }
];

@NgModule({
    declarations: [PluginComponent],
    imports: [
        CommonModule,
        // BrowserModule,
        // BrowserAnimationsModule,
        HttpClientModule,
        MatDialogModule,
        MatTabsModule,
        MatExpansionModule,
        MatIconModule,
        MatInputModule,
        MatCheckboxModule,
        MatFormFieldModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        PepDialogModule,
        PepIconModule,
        PepCheckboxModule,
        PepColorModule,
        PepMenuModule,
        PepSelectModule,
        PepQuantitySelectorModule,
        PepTopBarModule,
        PepPageLayoutModule
    ],
    exports:[PluginComponent],
    providers: [
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService
    ]
})
export class PluginModule {
    constructor(
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService
    ) {
        this.pepIconRegistry.registerIcons([
            pepIconSystemMenu
        ]);

        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}