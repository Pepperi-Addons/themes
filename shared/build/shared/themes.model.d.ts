export declare const CSS_VARIABLES_TABLE_NAME = "CssVariables";
export declare const DATA_OBJECT_KEY = "themes";
export declare const THEMES_TABLE_NAME = "Themes";
export declare const THEME_TABS_RELATION_NAME = "ThemeTabs";
export declare class ThemesMergedData {
    key?: string;
    theme: any;
    cssVariables?: any;
    branding?: any;
}
export interface ThemePublishData {
    Theme: any;
    PublishComment: string;
}
