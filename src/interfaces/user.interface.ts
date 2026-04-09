export interface UserBody {
  userId?: string;
  country: string;
  lastname: string;
  firstname: string;
  email: string;
  username: string;
  contactnumber: string;
  active: boolean;
  role: {
    id: string;
  };
  password?: string;
}
