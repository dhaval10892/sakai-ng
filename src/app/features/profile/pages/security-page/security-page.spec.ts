import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityPage } from './security-page';

describe('SecurityPage', () => {
    let component: SecurityPage;
    let fixture: ComponentFixture<SecurityPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SecurityPage]
        }).compileComponents();

        fixture = TestBed.createComponent(SecurityPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
