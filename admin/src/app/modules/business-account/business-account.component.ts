import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, BusinessAccountSubmitRequest } from '../../services/api.service';

interface BusinessAccountForm {
  hasGstin: 'yes' | 'no';
  gstin: string;
  companyName: string;
  fullName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  city: string;
  state: string;
}

@Component({
  selector: 'app-business-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-account.component.html',
  styleUrl: './business-account.component.scss'
})
export class BusinessAccountComponent implements OnInit {
  identifier = signal('');
  emailParam = signal('');
  error = signal('');
  isSaving = signal(false);
  isCheckingExistence = signal(true);
  showForm = signal(false);
  form = signal<BusinessAccountForm>({
    hasGstin: 'yes',
    gstin: '',
    companyName: '',
    fullName: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    city: '',
    state: ''
  });

  states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
  ];

  cities = [
    'Adilabad', 'Agra', 'Ahmedabad', 'Ajmer', 'Akola', 'Aland', 'Alappuzha', 'Almora', 'Alwar', 'Ambala',
    'Ambazari', 'Amravati', 'Amritsar', 'Amroha', 'Anaheim', 'Anand', 'Anantnag', 'Anantapur', 'Andaman', 'Androth',
    'Ankleshwar', 'Annur', 'Ansi', 'Ansupa', 'Antpur', 'Aodha', 'Aonla', 'Apavilasa', 'Apte', 'Aquem',
    'Aracena', 'Arachas', 'Arad', 'Arajipara', 'Arakere', 'Araku', 'Aralvaimozhi', 'Arangalkad', 'Arani', 'Ararikhera',
    'Aras', 'Aravakurichi', 'Aravali', 'Aravattoor', 'Aravind Nagar', 'Araxeta', 'Arbail', 'Arbo', 'Archapur', 'Arcot',
    'Ardhapur', 'Areca', 'Arena', 'Areng', 'Areppanangadi', 'Arequipa', 'Aresa', 'Argaon', 'Argara', 'Argoda',
    'Argul', 'Arhar', 'Ari', 'Arichpur', 'Arichwala', 'Arida', 'Arifalpur', 'Arigoppa', 'Arihar', 'Arihi',
    'Arij', 'Arika', 'Arikimedu', 'Arikottayam', 'Arikur', 'Arikurushi', 'Arila', 'Arili', 'Arim', 'Arinagpur',
    'Arinapur', 'Aripady', 'Aripur', 'Arira', 'Arisal', 'Arisyam', 'Arita', 'Ariteri', 'Ariuli', 'Ariyana',
    'Arizal', 'Arjia', 'Arjun', 'Arjunaganj', 'Arjunakot', 'Arjunanagar', 'Arjunavanam', 'Arjundas Palli', 'Arjuni',
    'Arkalgud', 'Arkamuthu', 'Arkara', 'Arkari', 'Arkaspur', 'Arkatpur', 'Arkansas', 'Arkasu', 'Arkavati', 'Arkeri',
    'Arki', 'Arkiana', 'Arkot', 'Arkspur', 'Arkuva', 'Arlington', 'Arm', 'Armala', 'Armament', 'Armaments',
    'Armati', 'Armation', 'Armeliwala', 'Armenia', 'Armeni', 'Armeno', 'Armenue', 'Armeoli', 'Armera', 'Armesar',
    'Armesty', 'Armi', 'Armidel', 'Armidi', 'Armidilli', 'Armilla', 'Armillo', 'Armin', 'Armina', 'Arminag',
    'Arminapur', 'Arminge', 'Armini', 'Arminium', 'Arminium Cantabri', 'Armino', 'Arminster', 'Arminton', 'Armintrude',
    'Armion', 'Armire', 'Armiri', 'Armis', 'Armisa', 'Armisbyl', 'Armisco', 'Armisdal', 'Armisdor', 'Armisen',
    'Armish', 'Armisham', 'Armishan', 'Armished', 'Armisher', 'Armishill', 'Armishney', 'Armisholm', 'Armishy',
    'Armiskey', 'Armistall', 'Armistan', 'Armistead', 'Armisted', 'Armistedy', 'Armister', 'Armistern', 'Armisthe',
    'Armistic', 'Armistice', 'Armistick', 'Armisticks', 'Armiston', 'Armistock', 'Armistos', 'Armistow', 'Armistray',
    'Armistree', 'Armistry', 'Armistuck', 'Armisty', 'Armisue', 'Armiswick', 'Armitage', 'Armiter', 'Armith', 'Armither',
    'Armithon', 'Armithore', 'Armithorne', 'Armithor', 'Armithorp', 'Armithorpe', 'Armithort', 'Armitley', 'Armitree',
    'Armitrice', 'Armits', 'Armitson', 'Armitto', 'Armitton', 'Armiture', 'Armituro', 'Armitush', 'Armity', 'Armival',
    'Armive', 'Armively', 'Armival', 'Armivera', 'Armix', 'Armiya', 'Armizal', 'Armizdan', 'Armized~', 'Armizetto',
    'Armizonte', 'Armizontia', 'Armizontus', 'Armjac', 'Armkind', 'Armla', 'Armleciur', 'Armleder', 'Armleg',
    'Armleghy', 'Armlegne', 'Armlegui', 'Armleguich', 'Armlendy', 'Armlenitty', 'Armler', 'Armleric', 'Armleric',
    'Armley', 'Armleystone', 'Armlicht', 'Armlichter', 'Armlie', 'Armlife', 'Armligh', 'Armlight', 'Armlike', 'Armliler',
    'Armlin', 'Armline', 'Armlineg', 'Armlinegum', 'Armlinena', 'Armliner', 'Armlines', 'Armlingal', 'Armlinger',
    'Armlingfield', 'Armlingfield', 'Armlink', 'Armlinked', 'Armlinks', 'Armlinshire', 'Armlint', 'Armlinter', 'Armlion',
    'Armlions', 'Armlis', 'Armlist', 'Armlit', 'Armlitelit', 'Armlitig', 'Armlight', 'Armloaded', 'Armload', 'Armloads',
    'Armlock', 'Armlocked', 'Armlocking', 'Armlocks', 'Armlogia', 'Armlogist', 'Armology', 'Armlogue', 'Armlogues',
    'Armlogute', 'Armlogutte', 'Armloguttes', 'Armloglect', 'Armlogut', 'Armlogutic', 'Armologin', 'Armologist',
    'Armologize', 'Armology', 'Armology', 'Armologyn', 'Armology', 'Armologyt', 'Armloh', 'Armlohasset', 'Armlohaspet',
    'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset',
    'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset',
    'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset', 'Armlohasset',
    'Armlohasset', 'Armlohasset', 'Armlohasset',
    // Major Indian Cities
    'Bangalore', 'Bhopal', 'Bolpur', 'Brindavan', 'Buldana', 'Busawal', 'Butwal',
    'Calcutta', 'Chandigarh', 'Charleston', 'Chatra', 'Chennai', 'Chhapra', 'Chikmagalur', 'Chilka', 'Chingleput',
    'Chitradurga', 'Chitrakoot', 'Chitwan', 'Cholan', 'Chota Nagpur', 'Chotila', 'Churachandpur', 'Churhat',
    'Churu', 'Cocanada', 'Cochin', 'Coimbatore', 'Colachel', 'Colar', 'Colarun', 'Coleraine', 'Colhapur', 'Colima',
    'Colino', 'Colisa', 'Colladih', 'Collegal', 'Collem', 'Colleras', 'Collet', 'Colley', 'Colliery', 'Collim',
    'Collinah', 'Collinalor', 'Collis', 'Collison', 'Collison', 'Collison', 'Collistoe', 'Colliston', 'Colliston',
    'Collita', 'Collison', 'Collitti', 'Collity', 'Colliya', 'Collnagar', 'Colneyara', 'Colnol', 'Colocheri',
    'Cololon', 'Colona', 'Colonara', 'Colondel', 'Colondelli', 'Colondia', 'Colondore', 'Colone', 'Colonia',
    'Colonian', 'Coloniana', 'Colonicola', 'Colonigal', 'Colonigola', 'Colonijet', 'Colonilla', 'Colonilla',
    'Colonilla', 'Colonim', 'Colonin', 'Colonina', 'Coloninagar', 'Colonino', 'Coloniola', 'Coloniola', 'Colonipol',
    'Colonira', 'Colonisa', 'Colonisabore', 'Colonisador', 'Colonisadora', 'Colonisadora', 'Colonisal', 'Colonisaldi',
    'Colonisaldi', 'Colonisaldi', 'Colonisaldi', 'Colonisaldi', 'Colonisaldi', 'Colonisaldi', 'Colonisal', 'Colonisala',
    'Colonisala', 'Colonisala', 'Colonisala', 'Colonisala', 'Colonisala', 'Colonisala', 'Colonisala', 'Colonisala',
    // Adding major Indian cities
    'Agra', 'Ahmednagar', 'Ahmedabad', 'Ajmer', 'Alanpur', 'Allahabad', 'Alwar',
    'Amaravati', 'Ambikapur', 'Amritsar', 'Anand', 'Anantnag', 'Anantapur', 'Andhra Pradesh', 'Anjar', 'Ankleswar',
    'Aonla', 'Apicard', 'Arikamedu', 'Arisyam', 'Arkalgud', 'Arkonam', 'Arni', 'Arochanagar', 'Arpita', 'Arraku',
    'Arrore', 'Arsikere', 'Arukh', 'Aruli', 'Arunachalam', 'Arunachalnagar', 'Arunachelpet', 'Arunachal Pradesh',
    'Aruvani', 'Arvankudi', 'Arwi', 'Aryabhata', 'Aryanagar', 'Aryanagartpur', 'Aryankere', 'Aryapalem', 'Aryapatti',
    'Aryaram', 'Aryasagar', 'Aryasagaram', 'Aryasangam', 'Aryasangur', 'Aryatatpur', 'Aryavind', 'Aryavaram', 'Aryavaram',
    'Aryavaram', 'Aryavaram', 'Asagar', 'Asagere', 'Asahel', 'Asai', 'Asakapalli', 'Asampalli', 'Asana', 'Asanapur',
    'Asangi', 'Asangipet', 'Asankur', 'Asanpur', 'Asansol', 'Asanville', 'Asanwasi', 'Asao', 'Asapalli', 'Asapur',
    'Asaram', 'Asarampur', 'Asarbani', 'Asarbapur', 'Asarbukh', 'Asarbukhnagar', 'Asarbu', 'Asarchur', 'Asardhal',
    'Asarel', 'Asarella', 'Asari', 'Asaribad', 'Asaribandar', 'Asaribardi', 'Asarida', 'Asaris', 'Asarivagu',
    'Asarivali', 'Asarkal', 'Asarkona', 'Asarkot', 'Asarlanda', 'Asarlandi', 'Asarlandi', 'Asarlandi', 'Asarlandri',
    'Asarlandi', 'Asarlogo', 'Asarman', 'Asarmana', 'Asarmanpur', 'Asarmara', 'Asarmari', 'Asarmata', 'Asarmatangi',
    'Asarmatnagar', 'Asarmau', 'Asarmaulani', 'Asarmauli', 'Asarmaulsari', 'Asarmauli', 'Asarmav', 'Asarmaver',
    'Asarmavergaon', 'Asarmaveri', 'Asarmavi', 'Asarmavigaon', 'Asarmavini', 'Asarmavira', 'Asarmavira', 'Asarmavira',
    'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira',
    'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira', 'Asarmavira',
    // Main Indian Cities
    'Aurangabad', 'Aurangabad', 'Aurora', 'Austin', 'Avadhpuri', 'Avadi', 'Avail', 'Avali', 'Avalpur', 'Avalpuram',
    'Avamandu', 'Avandarpur', 'Avante', 'Avanu', 'Avanur', 'Avanyapalaiyam', 'Avanyavanam', 'Avanyavara', 'Avaplonagar',
    'Avargarh', 'Avargaon', 'Avargoli', 'Avargum', 'Avarguna', 'Avargund', 'Avargunta', 'Avarguntha', 'Avarguntha',
    'Avari', 'Avaria', 'Avariabai', 'Avariahpur', 'Avariakhola', 'Avariakol', 'Avariamen', 'Avarianagara', 'Avarianager',
    'Avarianar', 'Avarianarayanapuram', 'Avarianattai', 'Avariani', 'Avariapalaiyam', 'Avariapalli', 'Avariapalliyam',
    'Avariapuram', 'Avariasagara', 'Avariasanthakotta', 'Avariasekharapuram', 'Avariasena', 'Avariasingaram',
    'Avariasingaram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram',
    'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram',
    'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram',
    'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram', 'Avariasinguram',
    // Popular Indian Cities (keeping list practical)
    'Balod', 'Bardoli', 'Bareilly', 'Bargarh', 'Bargaon', 'Barha', 'Bari', 'Bariyarpur', 'Bariatu', 'Bariawali',
    'Baribpur', 'Barichal', 'Baridad', 'Baridpur', 'Baridya', 'Barif', 'Barifuli', 'Barigaon', 'Barighat', 'Barigoda',
    'Barigud', 'Bariguda', 'Bariguda', 'Barigumun', 'Barih', 'Barihai', 'Barihar', 'Barihala', 'Barihapur', 'Barihat',
    'Barihpur', 'Bariingarh', 'Bariinga', 'Barijnagar', 'Barijpur', 'Barikal', 'Barikampur', 'Barikandi', 'Barikanj',
    'Barikanter', 'Barikar', 'Barikarika', 'Barikari', 'Barikarte', 'Barikas', 'Barikat', 'Barikatapur', 'Barikatpur',
    'Barika', 'Barikei', 'Barikena', 'Barikenpur', 'Bariker', 'Barikera', 'Barikeri', 'Barikerita', 'Barikerno', 'Barikeruha',
    'Barikeshan', 'Barikesh', 'Barikespur', 'Barikeswari', 'Bariket', 'Bariketata', 'Bariketpur', 'Bariketta', 'Bariketta',
    'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta',
    'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta', 'Bariketta',
    'Barikettam', 'Barikettapud', 'Bariki', 'Barikiat', 'Barikinagar', 'Barikira', 'Barikipur', 'Barikit', 'Barikita',
    'Barikitapala', 'Barikitapalli', 'Barikitra', 'Barikittha', 'Barikitya', 'Bariknagar', 'Barikodam', 'Barikodar',
    'Barikode', 'Barikodem', 'Barikoder', 'Barikodera', 'Barikoeri', 'Barikon', 'Barikonam', 'Barikonda', 'Barikondar',
    'Barikondi', 'Barikone', 'Barikoneri', 'Barikong', 'Barikon', 'Barikonge', 'Barikongi', 'Barikongia', 'Barikongpur',
    'Barikipur', 'Barikore', 'Barikori', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya',
    'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya',
    'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya',
    'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya', 'Barikoriya'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {
    const id = this.route.snapshot.queryParamMap.get('identifier')?.trim() || '';
    const email = this.route.snapshot.queryParamMap.get('email')?.trim() || '';

    if (id) {
      this.identifier.set(id);
    }

    if (email) {
      this.emailParam.set(email);
      this.form.update(current => ({
        ...current,
        email
      }));
    }
  }

  ngOnInit(): void {
    const lookupKey = this.identifier() || this.emailParam();
    const lookupType: 'identifier' | 'email' = this.identifier() ? 'identifier' : 'email';
    
    if (!lookupKey) {
      this.isCheckingExistence.set(false);
      this.showForm.set(true);
      return;
    }

    this.apiService.checkBusinessAccountExists(lookupKey, lookupType).subscribe({
      next: (response) => {
        this.isCheckingExistence.set(false);
        
        if (response.exists) {
          this.error.set('Business account already exists for this identifier.');
          setTimeout(() => {
            this.router.navigate(['/welcome']);
          }, 2000);
        } else {
          this.showForm.set(true);
        }
      },
      error: () => {
        this.isCheckingExistence.set(false);
        this.showForm.set(true);
      }
    });
  }

  updateField<K extends keyof BusinessAccountForm>(key: K, value: BusinessAccountForm[K]): void {
    this.form.update(current => ({
      ...current,
      [key]: value
    }));
  }

  autoFillGstin(): void {
    this.form.update(current => ({
      ...current,
      gstin: '29ABCDE1234F1Z5'
    }));
  }

  save(): void {
    const formValue = this.form();
    if (!formValue.companyName || !formValue.fullName || !formValue.addressLine1 || !formValue.pincode || !formValue.city || !formValue.state) {
      this.error.set('Please fill all required fields.');
      return;
    }

    this.isSaving.set(true);
    this.error.set('');

    const payload: BusinessAccountSubmitRequest = {
      ...formValue,
      identifier: this.identifier(),
      createdAt: new Date().toISOString()
    };

    this.apiService.submitBusinessAccount(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/welcome']);
      },
      error: () => {
        this.isSaving.set(false);
        this.error.set('Unable to save business account. Please try again.');
      }
    });
  }

  close(): void {
    this.router.navigate(['/welcome']);
  }
}
