import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent  implements OnInit {

  @Input() placeholder: string = 'Buscar';
  @Input() color: string = 'dark'
  @Output() onEmitQuery = new EventEmitter<string>();
  query = new FormControl('');

  constructor() { }

  ngOnInit() {}

  public onSearchByQuery() {
    this.onEmitQuery.emit(this.query.value);
  }

}
