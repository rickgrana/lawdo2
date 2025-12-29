import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdentificacaoPage } from './identificacao.page';

describe('IdentificacaoPage', () => {
  let component: IdentificacaoPage;
  let fixture: ComponentFixture<IdentificacaoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IdentificacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
