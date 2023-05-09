import {Injectable} from '@angular/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { Observable } from 'rxjs';
import { ThemesMergedData } from './plugin.model';

@Injectable()
export class PluginService {
    addonUUID;

    constructor(public addonService: PepAddonService) {}
    
    getPepperiTheme(publishedObject: boolean): Observable<any> {
        return this.addonService.getAddonApiCall(this.addonUUID, 'themes', `get_pepperi_theme?published=${publishedObject}`);
    }

    getAddonsThemes(publishedObject: boolean): Observable<any> {
        return this.addonService.getAddonApiCall(this.addonUUID, 'themes', `get_addons_themes?published=${publishedObject}`);
    }

    savePepperiTheme(themeObj: any): Observable<any> {
        return this.addonService.postAddonApiCall(this.addonUUID, 'themes', 'save_pepperi_theme', themeObj);
    }

    saveAddonTheme(key: string, themeObj: any): Observable<any> {
        return this.addonService.postAddonApiCall(this.addonUUID, 'themes', 'save_addon_theme', {key: key, theme: themeObj});
    }

    publishThemes(mergedData: Array<ThemesMergedData>, comment: string = ''): Observable<any> {
        return this.addonService.postAddonApiCall(this.addonUUID, 'themes', 'publish_themes', { Message: comment, Themes: mergedData });
    }
}
