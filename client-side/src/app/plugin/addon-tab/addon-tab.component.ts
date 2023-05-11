import {Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef, TemplateRef} from '@angular/core';

@Component({
    selector: 'addon-tab',
    templateUrl: './addon-tab.component.html',
    styleUrls: ['./addon-tab.component.scss']
})
export class AddonTabComponent implements OnInit {
    @Input() tabKey: string;
    @Input() remoteOptions: any;
    @Input() theme: any;
    
    @Output() themeChange: EventEmitter<{ tabKey: string, theme: any }> = new EventEmitter<{ tabKey: string, theme: any }>();
    
    onTabHostEventsCallback: (event: CustomEvent) => void;

    constructor(
        
    ) {
        this.onTabHostEventsCallback = (event: CustomEvent) => {
            this.onTabHostEvents(event.detail);
        }
    }

    ngOnInit() {

    }

    onTabLoad(event: any) {
        // TODO:?
    }

    onTabHostEvents(event: any) {
        // Implement editors events.
        debugger;
        switch(event.action) {
            case 'set-theme':
                this.themeChange.emit({ tabKey: this.tabKey, theme: event.theme });
                break;
        }
    }
}
