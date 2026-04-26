import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';

import { Order } from '../../../../core/models/order.model';
import { Payment } from '../../../../core/models/payment.model';
import { OrdersService } from '../../../../core/services/orders.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { NotificationService } from '@/app/core/services/notification.service';
import { AdminHeaderService } from '@/app/core/services/adminheader.service';
import { resolveCurrencySymbol } from '@/app/core/utils/tenant-localization';

type PaymentMethod = 'Cash' | 'Card' | 'QR Payment' | 'Split Cash/Card';
type PaymentField = 'cashAmount' | 'cardAmount' | 'qrAmount' | 'tipAmount';
type PaymentTargetField = 'cashAmount' | 'cardAmount' | 'qrAmount';
type InvoiceDelivery = 'none' | 'print' | 'email';
type InvoiceDraft = {
    orderId: number;
    serviceLabel: string;
    orderTotal: number;
    tipAmount: number;
    grandTotal: number;
    paidAt: string;
    items: { menuItemName: string; quantity: number; totalPrice: number; specialInstructions?: string }[];
    breakdownRows: { label: string; amount: number }[];
};

@Component({
    selector: 'app-billing-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, TagModule, InputTextModule],
    templateUrl: './billing-list.html',
    styleUrl: './billing-list.scss'
})
export class BillingList implements OnInit {
    servedOrders: Order[] = [];
    payments: Payment[] = [];
    loading = false;
    pendingOrdersCount = 0;
    pendingRevenue = 0;
    todayPaymentsCount = 0;
    todayTipAmount = 0;
    splitPaymentsCount = 0;

    paymentDialogVisible = false;
    currentOrder: Order | null = null;
    savingPayment = false;
    paymentHelpVisible = false;
    invoiceEmailDialogVisible = false;
    selectedPaymentMethod: PaymentMethod = 'Cash';
    invoiceDelivery: InvoiceDelivery = 'none';
    invoiceEmail = '';
    invoiceSubject = '';
    invoiceBody = '';
    invoiceDraft: InvoiceDraft | null = null;
    activeInputField: PaymentField = 'cashAmount';
    preferredTipPaymentField: PaymentTargetField = 'cashAmount';
    tipPaymentField: PaymentTargetField = 'cashAmount';
    private replaceActiveInput = true;
    paymentInput: Record<PaymentField, string> = {
        cashAmount: '0',
        cardAmount: '0',
        qrAmount: '0',
        tipAmount: '0'
    };

    paymentMethodCards: { label: string; value: PaymentMethod; icon: string }[] = [
        { label: 'Cash', value: 'Cash', icon: 'pi pi-money-bill' },
        { label: 'Card', value: 'Card', icon: 'pi pi-credit-card' },
        { label: 'QR', value: 'QR Payment', icon: 'pi pi-qrcode' },
        { label: 'Split', value: 'Split Cash/Card', icon: 'pi pi-wallet' }
    ];

    quickTipPercents = [0, 5, 10, 15];
    quickAmountButtons = [10, 20, 50];
    currencySymbol = '\u20B9';

    constructor(
        private ordersService: OrdersService,
        private paymentService: PaymentService,
        private refd: ChangeDetectorRef,
        private notificationService: NotificationService,
        private adminHeaderService: AdminHeaderService
    ) {}

    ngOnInit(): void {
        this.loadRestaurantLocalization();
        this.loadBillingData();
    }

    get cashAmount(): number {
        return this.parseInputValue('cashAmount');
    }

    get cardAmount(): number {
        return this.parseInputValue('cardAmount');
    }

    get qrAmount(): number {
        return this.parseInputValue('qrAmount');
    }

    get tipAmount(): number {
        return this.parseInputValue('tipAmount');
    }

    get currentOrderTotal(): number {
        return this.currentOrder?.total || 0;
    }

    get grandTotal(): number {
        return this.currentOrderTotal + this.tipAmount;
    }

    get totalCollected(): number {
        return this.cashAmount + this.cardAmount + this.qrAmount;
    }

    get remainingAmount(): number {
        return Math.max(0, this.grandTotal - this.totalCollected);
    }

    get changeAmount(): number {
        return Math.max(0, this.totalCollected - this.grandTotal);
    }

    get canConfirmPayment(): boolean {
        return !!this.currentOrder && this.grandTotal > 0 && this.totalCollected >= this.grandTotal;
    }

    get paymentTotalDisplay(): string {
        return this.grandTotal.toFixed(2);
    }

    get orderAmountDisplay(): string {
        return this.currentOrderTotal.toFixed(2);
    }

    get serviceLabel(): string {
        if (!this.currentOrder) {
            return 'Counter order';
        }

        return this.isTakeawayOrder(this.currentOrder) ? 'Takeaway' : `Table ${this.currentOrder.table}`;
    }

    get tipPaymentLabel(): string {
        switch (this.tipPaymentField) {
            case 'cardAmount':
                return 'Card';
            case 'qrAmount':
                return 'QR Payment';
            default:
                return 'Cash';
        }
    }

    get paymentBreakdownRows(): { label: string; amount: number; field: PaymentField }[] {
        const rows = [
            { label: 'Cash', amount: this.cashAmount, field: 'cashAmount' as const },
            { label: 'Card', amount: this.cardAmount, field: 'cardAmount' as const },
            { label: 'QR Payment', amount: this.qrAmount, field: 'qrAmount' as const }
        ].filter((row) => row.amount > 0);

        if (rows.length > 0) {
            return rows;
        }

        switch (this.selectedPaymentMethod) {
            case 'Card':
                return [{ label: 'Card', amount: 0, field: 'cardAmount' }];
            case 'QR Payment':
                return [{ label: 'QR Payment', amount: 0, field: 'qrAmount' }];
            case 'Split Cash/Card':
                return [
                    { label: 'Cash', amount: 0, field: 'cashAmount' },
                    { label: 'Card', amount: 0, field: 'cardAmount' }
                ];
            default:
                return [{ label: 'Cash', amount: 0, field: 'cashAmount' }];
        }
    }

    loadRestaurantLocalization(): void {
        this.adminHeaderService.getRestaurant().subscribe({
            next: (restaurant) => {
                this.currencySymbol = resolveCurrencySymbol(restaurant?.currencySymbol, restaurant?.country, restaurant?.currencyCode);
                this.refd.markForCheck();
            },
            error: (error) => {
                console.error('Failed to load billing localization', error);
            }
        });
    }

    loadBillingData(): void {
        this.loading = true;

        forkJoin({
            orders: this.ordersService.getAllOrders(),
            payments: this.paymentService.getPayments()
        })
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.refd.markForCheck();
                })
            )
            .subscribe({
                next: ({ orders, payments }) => {
                    this.payments = payments;
                    this.servedOrders = orders.filter((order) => {
                        const existingPayment = payments.find((payment) => payment.orderId === order.id);
                        return !existingPayment && (order.status === 'Served' || this.isTakeawayOrder(order));
                    });
                    this.pendingOrdersCount = this.servedOrders.length;
                    this.pendingRevenue = this.servedOrders.reduce((sum, order) => sum + order.total, 0);

                    const today = new Date().toDateString();
                    const paidPaymentsToday = payments.filter(
                        (payment) => payment.paidAt && new Date(payment.paidAt).toDateString() === today
                    );

                    this.todayPaymentsCount = paidPaymentsToday.length;
                    this.todayTipAmount = paidPaymentsToday.reduce((sum, payment) => sum + (payment.tipAmount || 0), 0);
                    this.splitPaymentsCount = payments.filter((payment) => this.isSplitPayment(payment)).length;
                    this.refd.markForCheck();
                },
                error: (error) => {
                    console.error('Failed to load billing data', error);
                    this.notificationService.showApiError(error, 'Failed to load billing data.');
                }
            });
    }

    openPaymentDialog(order: Order): void {
        this.currentOrder = order;
        this.paymentDialogVisible = true;
        this.invoiceEmailDialogVisible = false;
        this.resetPaymentDraft();
    }

    selectPaymentMethod(method: PaymentMethod): void {
        this.selectedPaymentMethod = method;
        this.paymentHelpVisible = false;
        this.syncTipPaymentFieldForMethod(method);
        this.applySuggestedDistribution();
    }

    setInvoiceDelivery(mode: InvoiceDelivery): void {
        this.invoiceDelivery = mode;
    }

    setActiveField(field: PaymentField, replace = true): void {
        this.activeInputField = field;
        this.replaceActiveInput = replace;
        if (this.isPaymentTargetField(field)) {
            this.preferredTipPaymentField = field;
        }
    }

    applyTipPercent(percent: number): void {
        const amount = percent === 0 ? 0 : this.roundCurrency(this.currentOrderTotal * (percent / 100));
        this.setTipAmount(amount);
        this.activeInputField = 'tipAmount';
        this.replaceActiveInput = true;
    }

    togglePaymentHelp(): void {
        this.paymentHelpVisible = !this.paymentHelpVisible;
    }

    appendDigit(value: string): void {
        const previousTip = this.tipAmount;
        const currentValue = this.replaceActiveInput ? '' : this.paymentInput[this.activeInputField];
        const normalizedValue = currentValue === '0' ? '' : currentValue;

        if (normalizedValue.includes('.')) {
            const [whole, fraction = ''] = normalizedValue.split('.');
            if (fraction.length >= 2) {
                return;
            }

            this.paymentInput[this.activeInputField] = `${whole}.${fraction}${value}`;
        } else {
            this.paymentInput[this.activeInputField] = `${normalizedValue}${value}` || '0';
        }

        this.replaceActiveInput = false;
        this.syncPaymentDraftAfterEdit(previousTip);
    }

    appendDecimal(): void {
        const previousTip = this.tipAmount;
        const currentValue = this.replaceActiveInput ? '0' : this.paymentInput[this.activeInputField];
        if (!currentValue.includes('.')) {
            this.paymentInput[this.activeInputField] = `${currentValue}.`;
        }
        this.replaceActiveInput = false;
        this.syncPaymentDraftAfterEdit(previousTip);
    }

    backspace(): void {
        const previousTip = this.tipAmount;
        const currentValue = this.paymentInput[this.activeInputField];
        const trimmedValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
        this.paymentInput[this.activeInputField] = trimmedValue === '-' ? '0' : trimmedValue;
        this.replaceActiveInput = false;
        this.syncPaymentDraftAfterEdit(previousTip);
    }

    clearActiveField(): void {
        const previousTip = this.tipAmount;
        this.paymentInput[this.activeInputField] = '0';
        this.replaceActiveInput = true;
        this.syncPaymentDraftAfterEdit(previousTip);
    }

    addQuickAmount(amount: number): void {
        const previousTip = this.tipAmount;
        const baseAmount = this.replaceActiveInput ? 0 : this.parseInputValue(this.activeInputField);
        const updatedValue = baseAmount + amount;

        if (this.activeInputField === 'tipAmount') {
            this.setTipAmount(updatedValue);
        } else {
            this.setInputValue(this.activeInputField, updatedValue);
            this.syncPaymentDraftAfterEdit(previousTip);
        }

        this.replaceActiveInput = false;
    }

    removePaymentField(field: PaymentField): void {
        if (field === 'tipAmount') {
            this.setTipAmount(0);
            this.activeInputField = this.resolveTipTargetField();
            this.replaceActiveInput = true;
            return;
        }

        this.setInputValue(field, 0);
        this.syncPaymentDraftAfterEdit(this.tipAmount);
        if (this.activeInputField === field) {
            this.replaceActiveInput = true;
        }
    }

    markPaid(): void {
        if (!this.currentOrder) {
            return;
        }

        if (!this.canConfirmPayment) {
            this.notificationService.warn('Payment incomplete', 'Collected amount must cover the order total and tip.');
            return;
        }

        const invoiceDraft = this.buildInvoiceDraft();
        if (!invoiceDraft) {
            this.notificationService.warn('Invoice unavailable', 'The invoice could not be prepared for this order.');
            return;
        }

        let printWindow: Window | null = null;
        if (this.invoiceDelivery === 'print') {
            printWindow = window.open('', '_blank', 'width=920,height=760');
            if (!printWindow) {
                this.notificationService.warn('Popup blocked', 'Allow pop-ups to print the invoice.');
                return;
            }

            printWindow.document.write(
                '<!doctype html><html><head><title>Preparing invoice</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#111827;">Preparing invoice...</body></html>'
            );
            printWindow.document.close();
        }

        const payment: Payment = {
            id: 0,
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
            amount: this.currentOrder.total,
            tipAmount: this.tipAmount,
            cashAmount: this.cashAmount,
            cardAmount: this.cardAmount,
            qrAmount: this.qrAmount,
            paymentMethod: this.selectedPaymentMethod,
            paymentStatus: 'Paid',
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString()
        };

        this.savingPayment = true;
        this.paymentService
            .addPayment(payment)
            .subscribe({
                next: (createdPayment) => {
                    this.savingPayment = false;
                    this.invoiceDraft = {
                        ...invoiceDraft,
                        paidAt: createdPayment.paidAt || createdPayment.createdAt
                    };
                    this.invoiceSubject = `Invoice for order #${invoiceDraft.orderId}`;
                    this.invoiceBody = this.composeInvoiceMessage(this.invoiceDraft);

                    if (this.invoiceDelivery === 'print') {
                        this.openPrintInvoice(this.invoiceDraft, printWindow);
                    } else if (this.invoiceDelivery === 'email') {
                        this.invoiceEmailDialogVisible = true;
                    }

                    this.notificationService.success(
                        'Payment saved',
                        `Payment recorded for order #${this.currentOrder!.id}${this.tipAmount > 0 ? ` with ${this.currencySymbol}${this.tipAmount.toFixed(2)} tip.` : '.'}`
                    );
                    this.paymentDialogVisible = false;
                    this.currentOrder = null;
                    this.loadBillingData();
                },
                error: (error) => {
                    this.savingPayment = false;
                    if (printWindow && !printWindow.closed) {
                        printWindow.close();
                    }
                    console.error('Failed to save payment', error);
                    this.notificationService.showApiError(error, 'Failed to save payment.');
                }
            });
    }

    getSeverity(status: string): 'success' | 'info' | 'warn' | 'secondary' {
        switch (status) {
            case 'Served':
                return 'info';
            case 'Paid':
                return 'success';
            case 'Pending':
                return 'warn';
            default:
                return 'secondary';
        }
    }

    isTakeawayOrder(order: Order): boolean {
        const tableLabel = (order.table || '').trim().toLowerCase();
        return tableLabel === 'takeaway' && order.status !== 'Paid';
    }

    getOrderChannel(order: Order): string {
        return this.isTakeawayOrder(order) ? 'Takeaway' : order.table;
    }

    private resetPaymentDraft(): void {
        this.paymentInput = {
            cashAmount: '0',
            cardAmount: '0',
            qrAmount: '0',
            tipAmount: '0'
        };
        this.preferredTipPaymentField = 'cashAmount';
        this.tipPaymentField = 'cashAmount';
        this.invoiceDelivery = 'none';
        this.invoiceSubject = '';
        this.invoiceBody = '';
        this.invoiceDraft = null;
        this.selectedPaymentMethod = 'Cash';
        this.activeInputField = 'cashAmount';
        this.replaceActiveInput = true;
        this.savingPayment = false;
        this.paymentHelpVisible = false;
        this.applySuggestedDistribution();
    }

    private applySuggestedDistribution(): void {
        const orderTotal = this.currentOrderTotal;
        const tipAmount = this.tipAmount;

        if (orderTotal <= 0) {
            return;
        }

        switch (this.selectedPaymentMethod) {
            case 'Cash':
                this.tipPaymentField = 'cashAmount';
                this.setInputValue('cashAmount', orderTotal + tipAmount);
                this.setInputValue('cardAmount', 0);
                this.setInputValue('qrAmount', 0);
                this.activeInputField = 'cashAmount';
                break;
            case 'Card':
                this.tipPaymentField = 'cardAmount';
                this.setInputValue('cashAmount', 0);
                this.setInputValue('cardAmount', orderTotal + tipAmount);
                this.setInputValue('qrAmount', 0);
                this.activeInputField = 'cardAmount';
                break;
            case 'QR Payment':
                this.tipPaymentField = 'qrAmount';
                this.setInputValue('cashAmount', 0);
                this.setInputValue('cardAmount', 0);
                this.setInputValue('qrAmount', orderTotal + tipAmount);
                this.activeInputField = 'qrAmount';
                break;
            case 'Split Cash/Card': {
                const half = this.roundCurrency(orderTotal / 2);
                if (this.tipPaymentField === 'qrAmount') {
                    this.tipPaymentField = 'cashAmount';
                }

                this.setInputValue('cashAmount', half + (this.tipPaymentField === 'cashAmount' ? tipAmount : 0));
                this.setInputValue('cardAmount', this.roundCurrency(orderTotal - half) + (this.tipPaymentField === 'cardAmount' ? tipAmount : 0));
                this.setInputValue('qrAmount', 0);
                this.activeInputField = 'cashAmount';
                break;
            }
        }

        this.replaceActiveInput = true;
    }

    private setInputValue(field: PaymentField, value: number): void {
        this.paymentInput[field] = this.roundCurrency(value).toFixed(2);
    }

    private parseInputValue(field: PaymentField): number {
        const parsed = Number.parseFloat(this.paymentInput[field]);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private roundCurrency(value: number): number {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    private isSplitPayment(payment: Payment): boolean {
        const activeMethodCount = [payment.cashAmount || 0, payment.cardAmount || 0, payment.qrAmount || 0].filter((amount) => amount > 0).length;
        return activeMethodCount > 1 || payment.paymentMethod === 'Split Payment' || payment.paymentMethod === 'Split Cash/Card';
    }

    private setTipAmount(value: number): void {
        const previousTip = this.tipAmount;
        const nextTip = Math.max(0, this.roundCurrency(value));
        const targetField = this.resolveTipTargetField();

        if (targetField !== this.tipPaymentField) {
            this.moveTipAllocation(targetField, previousTip);
        }

        this.paymentInput.tipAmount = nextTip.toFixed(2);
        this.applyTipDelta(previousTip, nextTip);
    }

    private syncPaymentDraftAfterEdit(previousTip: number): void {
        if (this.activeInputField === 'tipAmount') {
            const nextTip = Math.max(0, this.roundCurrency(this.parseInputValue('tipAmount')));
            const targetField = this.resolveTipTargetField();

            if (targetField !== this.tipPaymentField) {
                this.moveTipAllocation(targetField, previousTip);
            }

            this.applyTipDelta(previousTip, nextTip);
            return;
        }

        if (this.selectedPaymentMethod === 'Split Cash/Card' && this.isSplitCardField(this.activeInputField)) {
            this.rebalanceSplitFields(this.activeInputField);
        }
    }

    private applyTipDelta(previousTip: number, nextTip: number): void {
        const delta = this.roundCurrency(nextTip - previousTip);
        if (delta === 0) {
            return;
        }

        const currentAmount = this.parseInputValue(this.tipPaymentField);
        this.setInputValue(this.tipPaymentField, Math.max(0, currentAmount + delta));
    }

    private moveTipAllocation(nextField: PaymentTargetField, tipAmountToMove: number): void {
        const currentField = this.tipPaymentField;
        if (currentField === nextField) {
            return;
        }

        if (tipAmountToMove > 0) {
            this.setInputValue(currentField, Math.max(0, this.parseInputValue(currentField) - tipAmountToMove));
            this.setInputValue(nextField, this.parseInputValue(nextField) + tipAmountToMove);
        }

        this.tipPaymentField = nextField;
    }

    private rebalanceSplitFields(sourceField: 'cashAmount' | 'cardAmount'): void {
        const targetField = sourceField === 'cashAmount' ? 'cardAmount' : 'cashAmount';
        const sourceTip = this.tipPaymentField === sourceField ? this.tipAmount : 0;
        const targetTip = this.tipPaymentField === targetField ? this.tipAmount : 0;
        const sourceAmount = Math.max(0, this.parseInputValue(sourceField));
        const normalizedSourceBase = Math.min(this.currentOrderTotal, Math.max(0, this.roundCurrency(sourceAmount - sourceTip)));
        const normalizedSourceAmount = this.roundCurrency(normalizedSourceBase + sourceTip);
        const targetBase = this.roundCurrency(Math.max(0, this.currentOrderTotal - normalizedSourceBase));
        const targetAmount = this.roundCurrency(targetBase + targetTip);

        if (Math.abs(sourceAmount - normalizedSourceAmount) > 0.009) {
            this.setInputValue(sourceField, normalizedSourceAmount);
        }

        this.setInputValue(targetField, targetAmount);
    }

    private syncTipPaymentFieldForMethod(method: PaymentMethod): void {
        switch (method) {
            case 'Cash':
                this.preferredTipPaymentField = 'cashAmount';
                this.tipPaymentField = 'cashAmount';
                break;
            case 'Card':
                this.preferredTipPaymentField = 'cardAmount';
                this.tipPaymentField = 'cardAmount';
                break;
            case 'QR Payment':
                this.preferredTipPaymentField = 'qrAmount';
                this.tipPaymentField = 'qrAmount';
                break;
            case 'Split Cash/Card':
                if (!this.isSplitCardField(this.tipPaymentField)) {
                    this.tipPaymentField = 'cashAmount';
                }
                if (!this.isSplitCardField(this.preferredTipPaymentField)) {
                    this.preferredTipPaymentField = this.tipPaymentField;
                }
                break;
        }
    }

    private resolveTipTargetField(preferredField?: PaymentField): PaymentTargetField {
        switch (this.selectedPaymentMethod) {
            case 'Card':
                return 'cardAmount';
            case 'QR Payment':
                return 'qrAmount';
            case 'Split Cash/Card':
                if (preferredField && this.isSplitCardField(preferredField)) {
                    return preferredField;
                }

                if (this.isSplitCardField(this.preferredTipPaymentField)) {
                    return this.preferredTipPaymentField;
                }

                return this.isSplitCardField(this.tipPaymentField) ? this.tipPaymentField : 'cashAmount';
            default:
                return 'cashAmount';
        }
    }

    private isPaymentTargetField(field: PaymentField): field is PaymentTargetField {
        return field === 'cashAmount' || field === 'cardAmount' || field === 'qrAmount';
    }

    private isSplitCardField(field: PaymentField): field is 'cashAmount' | 'cardAmount' {
        return field === 'cashAmount' || field === 'cardAmount';
    }

    closeInvoiceEmailDialog(): void {
        this.invoiceEmailDialogVisible = false;
    }

    printInvoiceFromDialog(): void {
        if (!this.invoiceDraft) {
            return;
        }

        this.openPrintInvoice(this.invoiceDraft);
    }

    private buildInvoiceDraft(): InvoiceDraft | null {
        if (!this.currentOrder) {
            return null;
        }

        return {
            orderId: this.currentOrder.id,
            serviceLabel: this.serviceLabel,
            orderTotal: this.currentOrderTotal,
            tipAmount: this.tipAmount,
            grandTotal: this.grandTotal,
            paidAt: new Date().toISOString(),
            items: this.currentOrder.items.map((item) => ({
                menuItemName: item.menuItemName,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                specialInstructions: item.specialInstructions
            })),
            breakdownRows: this.getInvoiceBreakdownRowsFromValues(this.cashAmount, this.cardAmount, this.qrAmount, this.selectedPaymentMethod)
        };
    }

    private composeInvoiceMessage(invoiceDraft: InvoiceDraft): string {
        const items = invoiceDraft.items
            .map((item) => `- ${item.menuItemName} x${item.quantity}${item.specialInstructions ? ` (${item.specialInstructions})` : ''} = ${this.currencySymbol}${item.totalPrice.toFixed(2)}`)
            .join('\n');
        const breakdown = invoiceDraft.breakdownRows
            .map((row) => `- ${row.label}: ${this.currencySymbol}${row.amount.toFixed(2)}`)
            .join('\n');

        return [
            `Hello,`,
            ``,
            `Here is your invoice for order #${invoiceDraft.orderId}.`,
            `Service: ${invoiceDraft.serviceLabel}`,
            ``,
            `Items:`,
            items || '- No items listed',
            ``,
            `Order total: ${this.currencySymbol}${invoiceDraft.orderTotal.toFixed(2)}`,
            `Tip: ${this.currencySymbol}${invoiceDraft.tipAmount.toFixed(2)}`,
            `Grand total: ${this.currencySymbol}${invoiceDraft.grandTotal.toFixed(2)}`,
            ``,
            `Payment breakdown:`,
            breakdown,
            ``,
            `Thank you.`
        ].join('\n');
    }

    private openPrintInvoice(invoiceDraft: InvoiceDraft, printWindow: Window | null = null): void {
        const targetWindow = printWindow || window.open('', '_blank', 'width=920,height=760');
        if (!targetWindow) {
            this.notificationService.warn('Popup blocked', 'Allow pop-ups to print or save the invoice as PDF.');
            return;
        }

        const itemRows = invoiceDraft.items
            .map(
                (item) => `
                    <tr>
                        <td>
                            ${this.escapeHtml(item.menuItemName)}
                            ${item.specialInstructions ? `<div class="muted">${this.escapeHtml(item.specialInstructions)}</div>` : ''}
                        </td>
                        <td style="text-align:center;">${item.quantity}</td>
                        <td style="text-align:right;">${this.currencySymbol}${item.totalPrice.toFixed(2)}</td>
                    </tr>`
            )
            .join('');

        const paymentRows = invoiceDraft.breakdownRows
            .map(
                (row) => `
                    <tr>
                        <td>${this.escapeHtml(row.label)}</td>
                        <td style="text-align:right;">${this.currencySymbol}${row.amount.toFixed(2)}</td>
                    </tr>`
            )
            .join('');

        targetWindow.document.open();
        targetWindow.document.write(`
            <!doctype html>
            <html>
                <head>
                    <title>Invoice #${invoiceDraft.orderId}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 28px;
                            color: #111827;
                        }

                        h1, h2, p {
                            margin: 0;
                        }

                        .invoice-head {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            gap: 24px;
                            margin-bottom: 24px;
                        }

                        .invoice-chip {
                            display: inline-block;
                            padding: 8px 14px;
                            border-radius: 999px;
                            background: #ffe6e1;
                            color: #ff6f61;
                            font-weight: 700;
                            margin-bottom: 12px;
                        }

                        .muted {
                            color: #6b7280;
                            margin-top: 4px;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }

                        th, td {
                            padding: 12px 10px;
                            border-bottom: 1px solid #e5e7eb;
                        }

                        th {
                            text-align: left;
                            color: #6b7280;
                            font-size: 12px;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                        }

                        .summary {
                            margin-top: 24px;
                            display: grid;
                            gap: 10px;
                            max-width: 320px;
                            margin-left: auto;
                        }

                        .summary-row {
                            display: flex;
                            justify-content: space-between;
                            gap: 16px;
                        }

                        .summary-row.total {
                            font-weight: 700;
                            font-size: 18px;
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-head">
                        <div>
                            <div class="invoice-chip">Invoice</div>
                            <h1>Order #${invoiceDraft.orderId}</h1>
                            <p class="muted">${this.escapeHtml(invoiceDraft.serviceLabel)}</p>
                            <p class="muted">Paid ${new Date(invoiceDraft.paidAt).toLocaleString()}</p>
                        </div>
                        <div style="text-align:right;">
                            <h2>${this.currencySymbol}${invoiceDraft.grandTotal.toFixed(2)}</h2>
                            <p class="muted">Collected total</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align:center;">Qty</th>
                                <th style="text-align:right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows || '<tr><td colspan="3">No items</td></tr>'}
                        </tbody>
                    </table>

                    <table>
                        <thead>
                            <tr>
                                <th>Payment</th>
                                <th style="text-align:right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paymentRows}
                        </tbody>
                    </table>

                    <div class="summary">
                        <div class="summary-row">
                            <span>Order total</span>
                            <strong>${this.currencySymbol}${invoiceDraft.orderTotal.toFixed(2)}</strong>
                        </div>
                        <div class="summary-row">
                            <span>Tip</span>
                            <strong>${this.currencySymbol}${invoiceDraft.tipAmount.toFixed(2)}</strong>
                        </div>
                        <div class="summary-row total">
                            <span>Grand total</span>
                            <strong>${this.currencySymbol}${invoiceDraft.grandTotal.toFixed(2)}</strong>
                        </div>
                    </div>
                </body>
            </html>
        `);
        targetWindow.document.close();
        targetWindow.focus();
        targetWindow.print();
    }

    private getInvoiceBreakdownRows(payment: Payment): { label: string; amount: number }[] {
        return this.getInvoiceBreakdownRowsFromValues(payment.cashAmount || 0, payment.cardAmount || 0, payment.qrAmount || 0, payment.paymentMethod);
    }

    private getInvoiceBreakdownRowsFromValues(cashAmount: number, cardAmount: number, qrAmount: number, paymentMethod: string): { label: string; amount: number }[] {
        const rows = [
            { label: 'Cash', amount: cashAmount || 0 },
            { label: 'Card', amount: cardAmount || 0 },
            { label: 'QR Payment', amount: qrAmount || 0 }
        ].filter((row) => row.amount > 0);

        if (rows.length > 0) {
            return rows;
        }

        return [{ label: paymentMethod, amount: this.totalCollected }];
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

}
