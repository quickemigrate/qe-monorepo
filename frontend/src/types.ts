export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  isPopular?: boolean;
}

export interface Faq {
  question: string;
  answer: string;
}
