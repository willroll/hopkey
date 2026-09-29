import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HopkeySelectComponent } from "./hopkey-select.component";
import { mustInjected } from "../../../base-injectables";
import { NgSelectComponent, NgSelectModule } from "@ng-select/ng-select";

describe("HopkeySelectComponent", () => {
  let component: HopkeySelectComponent;
  let fixture: ComponentFixture<HopkeySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HopkeySelectComponent, NgSelectComponent],
      providers: [].concat(mustInjected()),
      imports: [NgSelectModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HopkeySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
