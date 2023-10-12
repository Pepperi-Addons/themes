import {Injectable} from '@angular/core';
import { PepAddonService, PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';
import { Observable } from 'rxjs';
import { config } from '../addon.config';
import { ThemesMergedData } from 'shared';

@Injectable()
export class PluginService {
    
    private _addonUUID = '';
    get addonUUID(): string {
        return this._addonUUID;
    }

    private _devServer = false;
    get devServer(): boolean {
        return this._devServer;
    }

    private _devTabs: Map<string, string>; // Map<Component name, Host name>
    get devTabs(): Map<string, string> {
        return this._devTabs;
    }

    constructor(
        private addonService: PepAddonService, 
        private httpService: PepHttpService,
        private sessionService: PepSessionService
    ) {
        // Get the addonUUID from the root config.
        this._addonUUID = config.AddonUUID;
        const urlParams = this.getQueryParamsAsObject();
        this._devServer = urlParams['devServer'] === 'true';
        
        this.loadDevTabs();
    }
        
    private paramsToObject(entries) {
        const result = {}
        for(const [key, value] of entries) { // each 'entry' is a [key, value] tupple
          result[key] = value;
        }
        return result;
    }

    private getQueryParamsAsObject(): any {
        const queryParamsAsObject = this.paramsToObject(new URLSearchParams(location.search));
        return queryParamsAsObject;
    }
    
    private loadDevTabs() {
        try {
            const urlParams = this.getQueryParamsAsObject();
            const devTabsAsJSON = JSON.parse(urlParams['devTabs']);
            this._devTabs = new Map(devTabsAsJSON);
        } catch(err) {
            this._devTabs = new Map<string, string>();
        }
    }
    
    private getBaseUrl(): string {
        // if (this.isOffline){
        //     return "http://localhost:8088/addon/api/50062e0c-9967-4ed4-9102-f2bc50602d41/addon-cpi";
        // } else {
             // For devServer run server on localhost.
            if(this.devServer) {
                return `http://localhost:4500/themes`;
            } else {
                const baseUrl = this.sessionService.getPapiBaseUrl();
                return `${baseUrl}/addons/api/${this.addonUUID}/themes`;
            }
        // }
    }

    getPepperiTheme(publishedObject: boolean): Observable<any> {
        const baseUrl = this.getBaseUrl();
        return this.httpService.getHttpCall(`${baseUrl}/get_pepperi_theme?published=${publishedObject}`);
    }

    getAddonsThemes(publishedObject: boolean): Observable<any> {
        const baseUrl = this.getBaseUrl();
        return this.httpService.getHttpCall(`${baseUrl}/get_addons_themes?published=${publishedObject}`);
    }

    savePepperiTheme(themeObj: any): Observable<any> {
        const baseUrl = this.getBaseUrl();
        return this.httpService.postHttpCall(`${baseUrl}/save_pepperi_theme`, themeObj);
    }

    saveAddonTheme(key: string, themeObj: any): Observable<any> {
        const baseUrl = this.getBaseUrl();
        return this.httpService.postHttpCall(`${baseUrl}/save_addon_theme`, {key: key, theme: themeObj});
    }

    publishThemes(mergedData: Array<ThemesMergedData>, comment: string = ''): Observable<any> {
        const baseUrl = this.getBaseUrl();
        return this.httpService.postHttpCall(`${baseUrl}/publish_themes`, { Message: comment, Themes: mergedData });
    }

    getPepperiThemeVariables(): Observable<any> {
        const baseUrl = this.getBaseUrl();
        return this.httpService.getHttpCall(`${baseUrl}/get_pepperi_theme_variables`);
    }
}
