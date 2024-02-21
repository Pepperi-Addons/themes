// Old const
export const CSS_VARIABLES_TABLE_NAME = 'CssVariables';
export const DATA_OBJECT_KEY = 'themes';
// Old const ends

export const THEME_TABS_DATA_UUID = "00000000-0000-0000-0000-00000000da7a";

export const THEMES_TABLE_NAME = 'Themes';
export const THEME_TABS_DATA_PROPERTY = 'ThemeTabsData';
export const THEME_TABS_RELATION_NAME = 'ThemeTabs';


export const THEME_FONT_BODY_FIELD_ID = 'fontBodyExternalOptions';
 
export class ThemesMergedData {
    key?: string = '';
    theme: any = null;
    cssVariables?: any = null;
    branding?: any = null;
    header?: any = null;
}

export interface ThemePublishData {
    Theme: any;
    PublishComment: string;
}
