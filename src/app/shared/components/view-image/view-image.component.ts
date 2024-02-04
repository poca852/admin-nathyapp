import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'view-image',
  templateUrl: './view-image.component.html',
  styleUrls: ['./view-image.component.scss'],
})
export class ViewImageComponent  implements OnInit {

  @Input()
  url: string;

  constructor() { }

  ngOnInit() {}

}
