import { RestaurantService } from '@/app/core/services/restaurant.service';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountryPreset } from '@/app/core/utils/tenant-localization';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { NotificationService } from '@/app/core/services/notification.service';

@Component({
    selector: 'app-create-restaurant',
    imports: [ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, SelectModule, InputNumberModule],
    standalone: true,
    templateUrl: './create-restaurant.html',
    styleUrl: './create-restaurant.scss'
})
export class CreateRestaurant {
    countryOptions = COUNTRY_OPTIONS;
    stateOptions = (getCountryPreset(DEFAULT_COUNTRY)?.states || [DEFAULT_COUNTRY]).map((state) => ({ label: state, value: state }));

    formData;

    constructor(
        private fb: FormBuilder,
        private service: RestaurantService,
        private notificationService: NotificationService
    ) {
        const defaultPreset = getCountryPreset(DEFAULT_COUNTRY);

        this.formData = this.fb.group({
            name: ['', Validators.required],
            logoUrl: [''],
            country: [DEFAULT_COUNTRY, Validators.required],
            state: [defaultPreset?.states[0] || DEFAULT_COUNTRY, Validators.required],
            currencyCode: [defaultPreset?.currencyCode || 'USD', Validators.required],
            currencySymbol: [defaultPreset?.currencySymbol || '\u20B9', Validators.required],
            taxName: [defaultPreset?.taxName || 'Tax', Validators.required],
            taxRate: [defaultPreset?.taxRate || 0, Validators.required],
            adminUsername: ['', Validators.required],
            adminName: ['', Validators.required],
            password: ['', Validators.required],
            isActive: [true]
        });
    }

    onCountryChange(country: string): void {
        const preset = getCountryPreset(country);
        if (!preset) {
            return;
        }

        this.stateOptions = preset.states.map((state) => ({ label: state, value: state }));
        this.formData.patchValue({
            state: preset.states[0] || '',
            currencyCode: preset.currencyCode,
            currencySymbol: preset.currencySymbol,
            taxName: preset.taxName,
            taxRate: preset.taxRate
        });
    }

    submit(): void {
        if (this.formData.invalid) {
            this.formData.markAllAsTouched();
            return;
        }

        const formValue = this.formData.getRawValue();

        this.service.create({
            name: formValue.name || '',
            logoUrl: formValue.logoUrl || '',
            country: formValue.country || 'India',
            state: formValue.state || '',
            currencyCode: formValue.currencyCode || 'INR',
            currencySymbol: formValue.currencySymbol || '\u20B9',
            taxName: formValue.taxName || 'GST',
            taxRate: formValue.taxRate ?? 0.18,
            adminUsername: formValue.adminUsername || '',
            adminName: formValue.adminName || '',
            password: formValue.password || '',
            isActive: formValue.isActive ?? true
        }).subscribe({
            next: () => {
                const defaultPreset = getCountryPreset(DEFAULT_COUNTRY);

                this.notificationService.success('Restaurant created', 'The restaurant was created successfully.');
                this.formData.reset({
                    name: '',
                    logoUrl: '',
                    country: DEFAULT_COUNTRY,
                    state: defaultPreset?.states[0] || DEFAULT_COUNTRY,
                    currencyCode: defaultPreset?.currencyCode || 'USD',
                    currencySymbol: defaultPreset?.currencySymbol || '\u20B9',
                    taxName: defaultPreset?.taxName || 'Tax',
                    taxRate: defaultPreset?.taxRate || 0,
                    adminUsername: '',
                    adminName: '',
                    password: '',
                    isActive: true
                });
                this.onCountryChange(DEFAULT_COUNTRY);
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to create restaurant.');
            }
        });
    }
}
