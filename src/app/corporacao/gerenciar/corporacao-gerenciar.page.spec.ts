import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CorporacaoGerenciarPage } from './corporacao-gerenciar.page';

describe('CorporacaoGerenciarPage', () => {
  let component: CorporacaoGerenciarPage;
  let fixture: ComponentFixture<CorporacaoGerenciarPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CorporacaoGerenciarPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CorporacaoGerenciarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
