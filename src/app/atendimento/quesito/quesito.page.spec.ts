import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuesitoPage } from './quesito.page';

describe('QuesitoPage', () => {
  let component: QuesitoPage;
  let fixture: ComponentFixture<QuesitoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuesitoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuesitoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
