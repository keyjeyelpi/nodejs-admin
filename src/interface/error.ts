
interface ErrorResponseData {
  error_message: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  data: ErrorResponseData;
}
