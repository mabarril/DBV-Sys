import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // FIX: Explicitly type injected dependencies to resolve 'unknown' type error.
  private fb: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['diretor@clube.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(6)]],
  });

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, preencha os campos corretamente.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === 'diretor@clube.com' && password === '123456') {
      this.router.navigate(['/home/dashboard']);
    } else {
      this.errorMessage.set('E-mail ou senha inválidos.');
    }
    
    this.loading.set(false);
  }
}
