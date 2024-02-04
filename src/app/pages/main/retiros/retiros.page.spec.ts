import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RetirosPage } from './retiros.page';

describe('RetirosPage', () => {
  let component: RetirosPage;
  let fixture: ComponentFixture<RetirosPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(RetirosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
