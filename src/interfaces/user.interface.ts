export interface UserBody {
  id?: string;
  userId?: string;
  country: string;
  accountTypeId: string;
  lastname: string;
  firstname: string;
  email: string;
  username: string;
  contactnumber: string;
  active: boolean;
  password?: string;
}