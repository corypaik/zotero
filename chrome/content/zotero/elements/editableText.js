/*
	***** BEGIN LICENSE BLOCK *****
	
	Copyright © 2020 Corporation for Digital Scholarship
					 Vienna, Virginia, USA
					 https://www.zotero.org
	
	This file is part of Zotero.
	
	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.
	
	You should have received a copy of the GNU Affero General Public License
	along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
	
	***** END LICENSE BLOCK *****
*/

"use strict";

{
	class EditableText extends XULElementBase {
		_input;
		
		static observedAttributes = ['multiline', 'readonly', 'placeholder', 'label', 'aria-label', 'value'];
		
		get multiline() {
			return this.hasAttribute('multiline');
		}
		
		set multiline(multiline) {
			this.toggleAttribute('multiline', multiline);
		}
		
		get readOnly() {
			return this.hasAttribute('readonly');
		}
		
		set readOnly(readOnly) {
			this.toggleAttribute('readonly', readOnly);
		}

		// Fluent won't set placeholder on an editable-text for some reason, so we use the label property to store
		// the placeholder that will be set on the child <textarea> or <input>
		get placeholder() {
			return this.label;
		}
		
		set placeholder(placeholder) {
			this.label = placeholder;
		}
		
		get label() {
			return this.getAttribute('label') || '';
		}
		
		set label(label) {
			this.setAttribute('label', label || '');
		}
		
		get ariaLabel() {
			return this.getAttribute('aria-label') || '';
		}
		
		set ariaLabel(ariaLabel) {
			this.setAttribute('aria-label', ariaLabel);
		}
		
		get value() {
			return this.getAttribute('value') || '';
		}
		
		set value(value) {
			this.setAttribute('value', value || '');
		}
		
		get initialValue() {
			return this._input?.dataset.initialValue || '';
		}
		
		set initialValue(initialValue) {
			this._input.dataset.initialValue = initialValue || '';
		}
		
		get autocomplete() {
			let val = this.getAttribute('autocomplete');
			try {
				let props = JSON.parse(val);
				if (typeof props === 'object') {
					return props;
				}
			}
			catch (e) {
				// Ignore
			}
			return null;
		}
		
		set autocomplete(val) {
			if (val) {
				this.setAttribute('autocomplete', JSON.stringify(val));
			}
			else {
				this.removeAttribute('autocomplete');
			}
		}
		
		get ref() {
			return this._input;
		}
		
		attributeChangedCallback() {
			this.render();
		}

		init() {
			this.render();
		}

		render() {
			let autocompleteParams = this.autocomplete;
			let autocompleteEnabled = !this.multiline && !!autocompleteParams;
			if (!this._input || autocompleteEnabled !== (this._input.constructor.name === 'AutocompleteInput')) {
				let input;
				if (autocompleteEnabled) {
					input = document.createElement('input', { is: 'autocomplete-input' });
					input.type = 'autocomplete';
				}
				else {
					input = document.createElement('textarea');
					input.rows = 1;
				}
				input.classList.add('input');
				let handleInput = () => {
					if (!this.multiline) {
						this._input.value = this._input.value.replace(/\n/g, ' ');
					}
					this.value = this._input.value;
				};
				let handleChange = () => {
					this.value = this._input.value;
				};
				input.addEventListener('input', handleInput);
				input.addEventListener('change', handleChange);
				input.addEventListener('focus', () => {
					this.dispatchEvent(new CustomEvent('focus'));
					this._input.dataset.initialValue = this._input.value;
				});
				input.addEventListener('blur', () => {
					this.dispatchEvent(new CustomEvent('blur'));
					delete this._input.dataset.initialValue;
				});
				input.addEventListener('keydown', (event) => {
					if (event.key === 'Enter') {
						if (this.multiline === event.shiftKey) {
							event.preventDefault();
							this._input.blur();
						}
					}
					else if (event.key === 'Escape') {
						this._input.value = this._input.dataset.initialValue;
						this._input.blur();
					}
				});
				
				let focused = false;
				let selectionStart = this._input?.selectionStart;
				let selectionEnd = this._input?.selectionEnd;
				let selectionDirection = this._input?.selectionDirection;
				if (this._input && document.activeElement === this._input) {
					focused = true;
					input.dataset.initialValue = this._input?.dataset.initialValue;
				}
				if (this._input) {
					this._input.replaceWith(input);
				}
				else {
					this.append(input);
				}
				this._input = input;
				
				if (focused) {
					this._input.focus();
				}
				if (selectionStart !== undefined && selectionEnd !== undefined) {
					this._input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
				}
			}
			this._input.readOnly = this.readOnly;
			this._input.placeholder = this.label;
			this._input.setAttribute('aria-label', this.ariaLabel);
			this._input.value = this.value;
			
			if (autocompleteEnabled) {
				this._input.setAttribute('autocomplete', 'on');
				this._input.setAttribute('autocompletepopup', autocompleteParams.popup || '');
				this._input.setAttribute('autocompletesearch', autocompleteParams.search || '');
				delete autocompleteParams.popup;
				delete autocompleteParams.search;
				Object.assign(this._input, autocompleteParams);
			}
		}
		
		focus(options) {
			this._input?.focus(options);
		}
		
		blur() {
			this._input?.blur();
		}
	}
	customElements.define("editable-text", EditableText);
}
