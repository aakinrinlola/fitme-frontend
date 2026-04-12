import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { TrainingPlan } from './components/training-plan/training-plan';
import { Feedback } from './components/feedback/feedback';
import { History } from './components/history/history';
import { Profile } from './components/profile/profile';

import { authGuard, guestGuard } from './guards/auth.guard';
import { TrainingPlanCreate } from './components/training-plan-create/training-plan-create';
import { TrainingPlanEdit } from './components/training-plan-edit/training-plan-edit';
import { environment } from '../environments/environment';

const defaultRedirect = environment.auth?.mode === 'auth0' ? 'dashboard' : 'login';

export const routes: Routes = [
  { path: '', redirectTo: defaultRedirect, pathMatch: 'full' },

  // Login/Register —  im Local-Mode relevant
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },

  // Geschützte Routen
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'training-plan/create', component: TrainingPlanCreate, canActivate: [authGuard] },
  { path: 'training-plan/:id/edit', component: TrainingPlanEdit, canActivate: [authGuard] },
  { path: 'training-plan/:id', component: TrainingPlan, canActivate: [authGuard] },
  { path: 'feedback/:planId', component: Feedback, canActivate: [authGuard] },
  { path: 'history', component: History, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },

  { path: '**', redirectTo: defaultRedirect },
];
