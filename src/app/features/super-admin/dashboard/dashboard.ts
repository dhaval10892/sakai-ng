import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { RestaurantService } from '@/app/core/services/restaurant.service';
import { Restaurant } from '@/app/core/models/restaurant';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, ChartModule],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
    restaurants: Restaurant[] = [];
    stats = {
        total: 0,
        active: 0,
        inactive: 0,
        countries: 0,
        newest: 'N/A'
    };

    statusChartData: any;
    statusChartOptions: any;
    countryChartData: any;
    countryChartOptions: any;

    constructor(
        private service: RestaurantService,
        private rdf: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.load();
    }

    load() {
        this.service.getAll().subscribe({
            next: (restaurants) => {
                this.restaurants = restaurants;
                this.buildStats();
                this.initCharts();
                this.rdf.markForCheck();
            },
            error: (error) => {
                console.error('Failed to load super admin dashboard', error);
            }
        });
    }

    private buildStats(): void {
        const sortedByNewest = [...this.restaurants].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        const countries = new Set(this.restaurants.map((restaurant) => restaurant.country).filter(Boolean));

        this.stats = {
            total: this.restaurants.length,
            active: this.restaurants.filter((restaurant) => restaurant.isActive).length,
            inactive: this.restaurants.filter((restaurant) => !restaurant.isActive).length,
            countries: countries.size,
            newest: sortedByNewest[0]?.name || 'N/A'
        };
    }

    private initCharts(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#0f172a';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#64748b';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dbe2ea';

        const countryCounts = this.restaurants.reduce<Record<string, number>>((acc, restaurant) => {
            const key = restaurant.country || 'Unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const topCountries = Object.entries(countryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        this.statusChartData = {
            labels: ['Active', 'Inactive'],
            datasets: [
                {
                    data: [this.stats.active, this.stats.inactive],
                    backgroundColor: ['#10b981', '#f97316'],
                    hoverBackgroundColor: ['#059669', '#ea580c']
                }
            ]
        };

        this.statusChartOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true
                    }
                }
            }
        };

        this.countryChartData = {
            labels: topCountries.map(([country]) => country),
            datasets: [
                {
                    label: 'Restaurants',
                    data: topCountries.map(([, count]) => count),
                    backgroundColor: ['#2563eb', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b'],
                    borderRadius: 14
                }
            ]
        };

        this.countryChartOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColorSecondary,
                        precision: 0
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };
    }
}
