import { Routes } from '@angular/router';

// Existing components
import { Homepage } from './components/homepage/homepage';
import { AboutUs } from './components/about-us/about-us';
import { Contact } from './components/contact/contact';
import { Pricelist } from './components/pricelist/pricelist';
import { TpchatComponent } from './components/tpchat/tpchat';

// New components
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { TrainingPlan } from './components/training-plan/training-plan';
import { TrainingPlanCreate } from './components/training-plan-create/training-plan-create';
import { Feedback } from './components/feedback/feedback';
import { History } from './components/history/history';
import { Profile } from './components/profile/profile';

// Guards
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ── Redirects ───────────────────────────────────────────────────
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Public / Guest routes ────────────────────────────────────────
  { path: 'login',    component: Login,    canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },

  // ── Public info pages (no auth required) ────────────────────────
  { path: 'homepage', component: Homepage },
  { path: 'aboutUs',  component: AboutUs  },
  { path: 'contact',  component: Contact  },
  { path: 'pricelist', component: Pricelist },

  // ── Protected routes (JWT required) ─────────────────────────────
  { path: 'dashboard',              component: Dashboard,         canActivate: [authGuard] },
  { path: 'training-plan/create',   component: TrainingPlanCreate, canActivate: [authGuard] },
  { path: 'training-plan/:id',      component: TrainingPlan,      canActivate: [authGuard] },
  { path: 'feedback/:planId',       component: Feedback,          canActivate: [authGuard] },
  { path: 'history',                component: History,            canActivate: [authGuard] },
  { path: 'profile',                component: Profile,            canActivate: [authGuard] },
  { path: 'tpchat',                 component: TpchatComponent,    canActivate: [authGuard] },

  // ── Fallback ─────────────────────────────────────────────────────
  { path: '**', redirectTo: 'dashboard' },
];
