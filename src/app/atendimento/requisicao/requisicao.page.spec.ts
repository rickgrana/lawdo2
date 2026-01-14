import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequisicaoPage } from './requisicao.page';

describe('RequisicaoPage', () => {
  let component: RequisicaoPage;
  let fixture: ComponentFixture<RequisicaoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequisicaoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequisicaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
