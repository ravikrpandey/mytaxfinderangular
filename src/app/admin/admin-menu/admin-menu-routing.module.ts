import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminMainComponent } from '../admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: AdminMainComponent,
    children: [
      {
        path: '',
        component: DashboardComponent,
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'queries',
        loadChildren: () =>
          import('../admin-menu/queries/queries.module').then(
            (m) => m.QueriesModule
          ),
      },
      // Uncomment and modify as needed for additional modules
      // {
      //   path: 'album',
      //   loadChildren: () =>
      //     import('../admin-menu/album/album.module').then((m) => m.AlbumModule),
      // },
      // {
      //   path: 'song',
      //   loadChildren: () =>
      //     import('../admin-menu/songs/songs.module').then((m) => m.SongsModule),
      // },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminMenuRoutingModule {}
