import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonItem, IonGrid, IonSearchbar, IonList, IonCol, IonRow } from "@ionic/angular/standalone";

@Component({
  selector: 'input-autocomplete',
  templateUrl: './input-autocomplete.component.html',
  imports: [IonCol, CommonModule, IonList, IonSearchbar, IonItem]
})
export class AutoCompleteComponent {

  @Input() label!: string;
  @Input() placeholder!: string;
  @Input() options: string[] = [];
  @Input() allowNew = false;

  @Input() control!: FormControl;

  filteredOptions: string[] = [];

  ngOnInit() {
    this.filteredOptions = this.options;
  }

  onSearch(value: string) {
    this.filteredOptions = this.options.filter(opt =>
      opt.toLowerCase().includes(value.toLowerCase())
    );

    if (this.allowNew && !this.filteredOptions.includes(value) && value.trim().length > 0) {
      this.filteredOptions = [value, ...this.filteredOptions];
    }
  }

  onOptionSelected(value: string) {
    this.control.setValue(value);
  }
}
