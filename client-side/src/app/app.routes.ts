import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PluginComponent } from './plugin/plugin.component';

export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: `settings/95501678-6687-4fb3-92ab-1155f47f839e/themes`,
        loadChildren: () => import('./plugin/plugin.module').then(m => m.PluginModule),
    },
    {
        path: '**',
        component: EmptyRouteComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }