import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { ActionPossibleEnum } from "src/app/core/model/document.model";

export class ActionConfig {
    public static readonly ACTION_CONFIG: { [key: string]: { svg: string, style?: string } } = {
        [ActionPossibleEnum.Teletransmission_TDT]: { svg: 'M5.027 10.9a8.729 8.729 0 0 1 6.422-3.62v-1.2A2.061 2.061 0 0 1 12.61 4.2a1.986 1.986 0 0 1 2.104.23l5.491 4.308a2.11 2.11 0 0 1 .588 2.566 2.109 2.109 0 0 1-.588.734l-5.489 4.308a1.983 1.983 0 0 1-2.104.228 2.065 2.065 0 0 1-1.16-1.876v-.942c-5.33 1.284-6.212 5.251-6.25 5.441a1 1 0 0 1-.923.806h-.06a1.003 1.003 0 0 1-.955-.7A10.221 10.221 0 0 1 5.027 10.9Z' },
        [ActionPossibleEnum.Suppression]: {
            style: 'text-red-500 hover:text-red-800 hover:cursor-pointer',
            svg: 'M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z'
        },
        [ActionPossibleEnum.Modification]: {
            style: 'text-blue hover:text-blue-hover hover:cursor-pointer',
            svg: 'M10.779 17.779 4.36 19.918 6.5 13.5m4.279 4.279 8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14 6.213-6.504M12.75 7.04 17 11.28'
        }
    };
}
@Component({
    selector: 'meg-action-document',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './action-document.component.html',
})
export class ActionDocumentComponent {

    action = input.required<string>();
    message = input.required<string>();
    modeIcon = input<boolean>(true);
    action$ = output();

    isEnable(): boolean {
        return Object.keys(ActionConfig.ACTION_CONFIG).includes(this.action() as ActionPossibleEnum);
    }

    getSvg() {
        return ActionConfig.ACTION_CONFIG[this.action()].svg ?? '';
    }

    getStyle() {
        return ActionConfig.ACTION_CONFIG[this.action()].style ?? 'text hover:cursor-pointer';
    }

    runAction() {
        this.action$.emit();
    }
}
