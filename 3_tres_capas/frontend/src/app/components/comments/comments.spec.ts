import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Comments } from './comments';

describe('Comments', () => {
  let component: Comments;
  let fixture: ComponentFixture<Comments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comments],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Comments);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('postId', 1);

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
