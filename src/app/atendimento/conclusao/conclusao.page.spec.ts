import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConclusaoPage } from './conclusao.page';

describe('ConclusaoPage', () => {
  let component: ConclusaoPage;
  let fixture: ComponentFixture<ConclusaoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConclusaoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConclusaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
