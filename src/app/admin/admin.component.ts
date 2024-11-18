// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-admin-main',
//   templateUrl: './admin-main.component.html',
//   styleUrls: ['./admin-main.component.scss']
// })
// export class AdminMainComponent {

// }






import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import { switchMap, timer } from 'rxjs';


// @Component({
//   selector: 'app-admin',
//   templateUrl: './admin.component.html',
//   styleUrls: ['./admin.component.css'],
// })

@Component({
  selector: 'app-admin-main',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class AdminMainComponent implements OnInit, AfterContentChecked, DoCheck {
  showAndProfile: boolean = false;
  showList: boolean = false;
  classList: any;
  isRemarkActive: boolean = true;
  nextElementSibling: any;
  navIndexvalue: any = null;
  progres: any;
  currentRoute: any;
  subscription: any;
  userData: any;
  roles: any;

  isNotificationDropdownOpen = true;
  isProfileDropdownOpen = false;




  constructor(private changeDref: ChangeDetectorRef, private router: Router, private activatedRoute: ActivatedRoute) {

    let i = Number(localStorage.getItem('index'));
    this.navIndexvalue = i;
    let clip: any = document.getElementById('clip');
  }

  toggleaccordian: boolean = false;
  toggleAccordian(event: any, index: any, name: any) {
  }

  navData: any;
  nav1: any[] = [];

  ngOnInit(): void {
    console.log('====================================');
    console.log();
    console.log('====================================');

    this.navData = [
      {
        "moduleName": "Dashboard",
        "route": "dashboard",
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": []
      },
      {
        "moduleName": "Queries",
        "route": null,
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": [
          {
            "moduleName": "Filed Queries",
            "route": "queries/filed",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "Contacted",
            "route": "queries/contacted-queries",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },

        ]
      },

      {
        "moduleName": "Albums",
        "route": null,
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": [
          {
            "moduleName": "All Albums",
            "route": "album/list",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "Add Album",
            "route": "album/create",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },

        ]
      },

      {
        "moduleName": "Songs",
        "route": null,
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": [
          {
            "moduleName": "All Songs",
            "route": "song/list",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "Add Songs",
            "route": "song/create",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
        ]
      },

      {
        "moduleName": "PlayLists",
        "route": null,
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": [
          {
            "moduleName": "All PlayLists",
            "route": "roles-and-access/user",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "Add PlayLists",
            "route": "roles-and-access/assign-roles",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
        ]
      },
      {
        "moduleName": "Reports",
        "route": null,
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": [
          {
            "moduleName": "Songs",
            "route": "roles-and-access/user",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "Visitors",
            "route": "roles-and-access/assign-roles",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "Statics",
            "route": "roles-and-access/dealer",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },

        ]
      },
      {
        "moduleName": "MailBox",
        "route": null,
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": [
          {
            "moduleName": "Inbox",
            "route": "roles-and-access/user",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "Composes",
            "route": "roles-and-access/assign-roles",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },
          {
            "moduleName": "View",
            "route": "roles-and-access/dealer",
            "read": true,
            "write": true,
            "delete": true,
            "access": true
          },

        ]
      },
      {
        "moduleName": "Events",
        "route": null,
        "read": true,
        "write": true,
        "delete": true,
        "access": true,
        "subModules": []
      },
    ];
    // this.userData = this.userService.user;
    window.addEventListener('click', (event) => {
      this.showAndProfile = false;
      event.stopPropagation();
    });
    window.addEventListener('click', (event) => {
      event.stopPropagation();
      this.showList = false;
    });
    this.event();
  }

  checkAccess(subModules:any, route:any) {
    if(this.roles) {
      var userRole = this.userData.role_id;
      var userDataAccess = JSON.parse(this.roles.find((r:any) => r.role_id === userRole).access).map((m:any) => m.replace(/^\.\//, ''));
      if(route == null) {
        return subModules.map((m:any) => m.route.replace(/^\.\//, '')).some((s:any) =>  userDataAccess.includes(s));
      }
      return userDataAccess.includes(route.replace(/^\.\//, ''));
    }
    return false;
  }

  ngDoCheck(): void {

    let url = this.router.url;
    this.currentRoute = url;

  }

  ngAfterContentChecked(): void {
    // this.lodaerService.showHideLoader().subscribe(
    //   (res) => {
    //     this.progres = res;
    //   }
    // );
    // this.changeDref.detectChanges();
  }

  navToggel(index: any, nav: any) {
    console.log("nav", nav);
    if(nav.moduleName === 'Dashboard'){
      localStorage.removeItem('filterType')
    }
    let clip: any = document.getElementById('clip');
    if (this.navIndexvalue == index) {
      this.navIndexvalue = null;
    } else {
      this.navIndexvalue = index;
      localStorage.setItem("index", index);
      localStorage.setItem("navAccess", JSON.stringify(nav));
    }

  }
  toggleProfile(e: any) {
    e.stopPropagation();
    this.showAndProfile = !this.showAndProfile;

  }
  proflieCLick(e: any) {
    e.stopPropagation();
    this.showAndProfile = false;


  }
  logoutCLick(e: any) {
    e.stopPropagation();
    this.showAndProfile = false;

  }

  showDropdown(e: any) {
    e.stopPropagation();
    this.showList = !this.showList;
  }
  profile() {
    // Swal.fire("Coming Soon..");
  }
  logOut() {
    // this._authService.logOut();
    localStorage.removeItem('filterType');
  }

  MyDatadata: any;
  newArr: any;
  event() {
    let data = {
      userType: "Admin"
    };
    this.subscription = timer(0, 10 * 5000).pipe(
      //   switchMap(() => this.battery.postNoti(data))).subscribe((res:any)=>{
      //    this.MyDatadata=res.data
      //    this.newArr=this.MyDatadata.map(i=>i.id)
      //     if(res.data.length>=1){
      //      if (this.dialog.openDialogs.length>0)
      //      {


      //     }else{
      //     const dialogRef = this.dialog.open(BatteryAlertComponent, {
      //       width: '550px',
      //        disableClose: true ,
      //       data:{name:this.MyDatadata}
      //     });
      //     dialogRef.afterClosed().subscribe(result => {
      //       console.log('The dialog was closed');
      //     });
      //   }
      //   }else{
      //     return ;
      //   }
      //   })
      // }



    );
  }

    // Toggle dropdown visibility
    toggleDropdown(type: 'notification' | 'profile'): void {
      if (type === 'notification') {
        this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
        this.isProfileDropdownOpen = false; // Close profile dropdown
      } else if (type === 'profile') {
        this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
        this.isNotificationDropdownOpen = false; // Close notification dropdown
      }
    }

    // Close dropdowns when clicking outside
    @HostListener('document:click', ['$event'])
    onDocumentClick(): void {
      this.isNotificationDropdownOpen = false;
      this.isProfileDropdownOpen = false;
    }
  }



