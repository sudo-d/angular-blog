import {Injectable} from '@angular/core';
import {Observable, Subject, throwError} from 'rxjs';
import {FBAuthResponse, User} from '../../../shared/interfaces';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {catchError, tap} from 'rxjs/operators';

@Injectable()
export class AuthService {

  public error$: Subject<string> = new Subject<string>();

  constructor(private http: HttpClient) {
  }

  get token(): string {

    const expDate = new Date(localStorage.getItem('fb-token-exp'));

    if (new Date() > expDate) {

      this.logout();

      return null;
    }

    return localStorage.getItem('fb-token');
  }

  login(user: User): Observable<any> {

    return this.http.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`, user)
      .pipe(tap(this.setToken)
            , catchError(this.handleError.bind(this))
      );
  }

  logout() {

    this.setToken(null);
  }

  isAuthenticated(): boolean {

    return !!this.token;

  }

  private setToken(response: FBAuthResponse | null) {

    if (response == null) {

      localStorage.clear();

    } else {

      const expDate = new Date(new Date().getTime() + +response.expiresIn * 1000);

      localStorage.setItem('fb-token', response.idToken);

      localStorage.setItem('fb-token-exp', expDate.toString());
    }
  }

  private handleError(error: HttpErrorResponse) {

    const {message} = error.error.error;

    switch (message) {

      case 'INVALID_EMAIL':
        this.error$.next('Wrong email');
        break;
      case 'INVALID_PASSWORD':
        this.error$.next('Wrong password');
        break;
      case 'EMAIL_NOT_FOUND':
        this.error$.next('Email not found');
        break;
      default:
        this.error$.next('Error');
    }

    return throwError(error);
  }

}
