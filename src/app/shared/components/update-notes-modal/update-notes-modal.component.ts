import { Component } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-update-notes-modal',
    templateUrl: './update-notes-modal.component.html',
    styleUrls: ['./update-notes-modal.component.scss'],
})
export class UpdateNotesModalComponent {
    version = environment.version;
    notes = environment.updateNotes;

    constructor(private utilsSvc: UtilsService) { }

    dismiss(): void {
        this.utilsSvc.dismissModal();
    }
}
