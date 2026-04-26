import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    constructor(private messageService: MessageService) {}

    success(summary: string, detail: string): void {
        this.messageService.add({
            severity: 'success',
            summary,
            detail
        });
    }

    error(summary: string, detail: string): void {
        this.messageService.add({
            severity: 'error',
            summary,
            detail,
            life: 5000
        });
    }

    warn(summary: string, detail: string): void {
        this.messageService.add({
            severity: 'warn',
            summary,
            detail
        });
    }

    showApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): void {
        this.error('Error', this.getErrorMessage(error, fallback));
    }

    getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
        if (error instanceof HttpErrorResponse) {
            const responseError = error.error;

            if (typeof responseError === 'string' && responseError.trim()) {
                return responseError;
            }

            if (responseError && typeof responseError === 'object') {
                if ('details' in responseError && typeof responseError.details === 'string' && responseError.details.trim()) {
                    const details = responseError.details.trim();

                    if (details.includes('UserNameIndex') || details.toLowerCase().includes('duplicate key')) {
                        return 'Username already exists.';
                    }

                    return details;
                }

                if ('message' in responseError && typeof responseError.message === 'string' && responseError.message.trim()) {
                    return responseError.message;
                }

                if ('title' in responseError && typeof responseError.title === 'string' && responseError.title.trim()) {
                    return responseError.title;
                }

                if ('errors' in responseError && responseError.errors && typeof responseError.errors === 'object') {
                    const validationMessage = Object.values(responseError.errors as Record<string, string[]>)
                        .flat()
                        .find((value) => typeof value === 'string' && value.trim());

                    if (validationMessage) {
                        return validationMessage;
                    }
                }
            }

            if (error.message?.trim()) {
                return error.message;
            }
        }

        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }

        return fallback;
    }
}
