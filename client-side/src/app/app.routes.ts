import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PluginComponent } from './plugin/plugin.component';

const routes: Routes = [
    {
        path: `settings/95501678-6687-4fb3-92ab-1155f47f839e/themes`,
        component: PluginComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }