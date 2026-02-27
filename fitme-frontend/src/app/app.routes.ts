import { Routes } from '@angular/router';
import {Homepage} from './components/homepage/homepage';
import {AboutUs} from './components/about-us/about-us';
import {Contact} from './components/contact/contact';
import {Pricelist} from './components/pricelist/pricelist';
import {Tpchat} from './components/tpchat/tpchat';

export const routes: Routes = [
  {path: '', redirectTo: 'homepage', pathMatch: "full"},
  {path: 'homepage', component: Homepage},
  {path: 'aboutUs', component: AboutUs},
  {path: 'contact', component: Contact},
  {path: 'pricelist', component: Pricelist},
  {path: 'tpchat', component: Tpchat},
  {path: '**', redirectTo: 'homepage'},
];
