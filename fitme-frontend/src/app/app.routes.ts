import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { TrainingPlan } from './components/training-plan/training-plan';
import { TrainingPlanCreate } from './components/training-plan-create/training-plan-create';
import { Feedback } from './components/feedback/feedback';
import { History } from './components/history/history';
import { Profile } from './components/profile/profile';

import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },

  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'training-plan/create', component: TrainingPlanCreate, canActivate: [authGuard] },
  { path: 'training-plan/:id', component: TrainingPlan, canActivate: [authGuard] },
  { path: 'feedback/:planId', component: Feedback, canActivate: [authGuard] },
  { path: 'history', component: History, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' },
];
