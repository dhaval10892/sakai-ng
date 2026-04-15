import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { ActivityLog } from '../../../../core/models/activity-log.model';
import { ActivityLogService } from '../../../../core/services/activity-log.service';

@Component({
    selector: 'app-activity-log-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, TagModule],
    templateUrl: './activity-log-list.html',
    styleUrl: './activity-log-list.scss'
})
export class ActivityLogList implements OnInit {
    @ViewChild('logsTable') logsTable!: Table;

    logs: ActivityLog[] = [];
    filteredLogs: ActivityLog[] = [];
    loading = false;

    selectedAction = 'All';
    selectedEntity = 'All';
    searchPerformedBy = '';
    startDate: string = '';
    endDate: string = '';

    actionOptions = [
        { label: 'All', value: 'All' },
        { label: 'Payment Created', value: 'Payment Created' },
        { label: 'Role Updated', value: 'Role Updated' },
        { label: 'User Activated', value: 'User Activated' },
        { label: 'User Deactivated', value: 'User Deactivated' }
    ];

    entityOptions = [
        { label: 'All', value: 'All' },
        { label: 'Payment', value: 'Payment' },
        { label: 'User', value: 'User' },
        { label: 'Order', value: 'Order' }
    ];

totalRecords = 0;
pageNumber = 1;
pageSize = 10;

    constructor(private activityLogService: ActivityLogService) {}

    ngOnInit(): void {
        this.loadLogs();
    }
loadLogs(): void {
    this.loading = true;

    this.activityLogService.getLogs({
        action: this.selectedAction !== 'All' ? this.selectedAction : undefined,
        entityName: this.selectedEntity !== 'All' ? this.selectedEntity : undefined,
        performedBy: this.searchPerformedBy.trim() || undefined,
        startDate: this.startDate || undefined,
        endDate: this.endDate || undefined,
        pageNumber: 1,
        pageSize: 100
    }).subscribe({
        next: (result) => {
            this.logs = result.items;
            this.filteredLogs = result.items;
            this.loading = false;
        },
        error: (error) => {
            console.error('Failed to load activity logs', error);
            this.loading = false;
            alert('Failed to load activity logs.');
        }
    });
}
       exportCsv(): void {
        if (this.logsTable) {
            this.logsTable.exportCSV();
        }
    }


    applyFilters(): void {
        this.pageNumber=1;
        this.loadLogs();
        this.filteredLogs = this.logs.filter((log) => {
            const actionMatch = this.selectedAction === 'All' || log.action === this.selectedAction;

            const entityMatch = this.selectedEntity === 'All' || log.entityName === this.selectedEntity;

            const userMatch = !this.searchPerformedBy.trim() || (log.performedBy ?? '').toLowerCase().includes(this.searchPerformedBy.trim().toLowerCase());

            return actionMatch && entityMatch && userMatch;
        });
    }
clearFilters(): void {
  this.selectedAction = 'All';
  this.selectedEntity = 'All';
  this.searchPerformedBy = '';
  this.startDate = '';
  this.endDate = '';
  this.pageNumber = 1;
  this.loadLogs();
}
onPageChange(event: any): void {
  this.pageNumber = event.page + 1;
  this.pageSize = event.rows;
  this.loadLogs();
}

    getSeverity(entityName: string): 'success' | 'info' | 'warn' | 'secondary' {
        switch (entityName) {
            case 'Payment':
                return 'success';
            case 'User':
                return 'info';
            case 'Order':
                return 'warn';
            default:
                return 'secondary';
        }
    }
}
