import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { PluginModule } from './plugin/plugin.module';
import { AppRoutingModule } from './app.routes';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        PluginModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}




