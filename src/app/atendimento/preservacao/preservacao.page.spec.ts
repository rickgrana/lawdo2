import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreservacaoPage } from './preservacao.page';

describe('PreservacaoPage', () => {
  let component: PreservacaoPage;
  let fixture: ComponentFixture<PreservacaoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreservacaoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreservacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
