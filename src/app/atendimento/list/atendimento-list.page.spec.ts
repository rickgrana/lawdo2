import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAtendimentosPage } from './atendimento-list.page';

describe('AtendimentosPage', () => {
  let component: ListAtendimentosPage;
  let fixture: ComponentFixture<ListAtendimentosPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListAtendimentosPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAtendimentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
