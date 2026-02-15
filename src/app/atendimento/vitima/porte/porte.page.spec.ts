import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PortePage } from './porte.page';

describe('PortePage', () => {
  let component: PortePage;
  let fixture: ComponentFixture<PortePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PortePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
