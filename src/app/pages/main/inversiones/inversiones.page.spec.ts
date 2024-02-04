import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InversionesPage } from './inversiones.page';

describe('InversionesPage', () => {
  let component: InversionesPage;
  let fixture: ComponentFixture<InversionesPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(InversionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
