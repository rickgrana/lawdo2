import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonItem, IonList, IonCol, IonSearchbar } from '@ionic/angular/standalone';

@Component({
  selector: 'input-autocomplete',
  templateUrl: './input-autocomplete.component.html',
  imports: [IonItem, IonList, IonSearchbar, IonCol, CommonModule]
})
export class InputAutoCompleteComponent {

  @Input() label: string = '';
  @Input() options: string[] = [];
  @Input() placeholder = 'Pesquisar...';

  @Output() selected = new EventEmitter<string>();

  searchText = '';
  filteredOptions: string[] = [];

  onSearch(event: any) {
    const value = event.target.value?.toLowerCase() || '';
    this.searchText = value;

    if (!value) {
      this.filteredOptions = [];
      return;
    }

    this.filteredOptions = this.options.filter(option =>
      option.toLowerCase().includes(value)
    );
  }

  onOptionSelected(option: string) {
    this.searchText = option;
    this.filteredOptions = [];
    this.selected.emit(option);
  }

  clear() {
    this.searchText = '';
    this.filteredOptions = [];
  }
}
