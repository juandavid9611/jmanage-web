import { add, subDays } from 'date-fns';

import { _mock } from './_mock';
import { _addressBooks } from './_others';

export const PAYMENT_REQUEST_CATEGORY_OPTIONS = [
  {
    group: 'Match',
    classify: [
      { value: 'yellow_card', label: 'Yellow Card' },
      { value: 'red_card', label: 'Red Card' },
      { value: 'jeans', label: 'Jeans' },
      { value: 'leather', label: 'Leather' },
      { value: 'accessories', label: 'Accessories' },
    ],
  },
  {
    group: 'Subscription',
    classify: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ],
  },
];

export const PAYMENT_REQUEST_PRICES = [
  { value: 'yellow_card', price: 10000 },
  { value: 'red_card', price: 20000 },
  { value: 'jeans', price: 30000 },
  { value: 'leather', price: 40000 },
  { value: 'accessories', price: 50000 },
  { value: 'monthly', price: 60000 },
  { value: 'yearly', price: 70000 },
];

export const TEAM_GROUPS = [
  { value: 'male', label: 'Male Group' },
  { value: 'female', label: 'Female Group' },
  { value: 'kids', label: 'Kids Group' },
];

export const CALENDAR_EVENT_CATEGORIES = [
  { value: 'training', label: 'Training' },
  { value: 'match', label: 'Match' },
  { value: 'money', label: 'Money' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_REQUEST_SERVICE_OPTIONS = [...Array(8)].map((_, index) => ({
  id: _mock.id(index),
  name: _mock.role(index),
  price: _mock.number.price(index),
}));

export const _payment_requests = [...Array(20)].map((_, index) => {
  const payment_values = [10000, 15000, 96000, 54000];

  const random = Math.floor(Math.random() * payment_values.length);

  const totalAmount = payment_values[random];

  const status =
    (index % 2 && 'paid') || (index % 3 && 'pending') || (index % 4 && 'overdue') || 'draft';

  return {
    id: _mock.id(index),
    status,
    totalAmount,
    paymentRequestNumber: `PR-199${index}`,
    paymentRequestTo: _addressBooks[index + 1],
    sent: _mock.number.nativeS(index),
    createDate: subDays(new Date(), index),
    dueDate: add(new Date(), { days: index + 15, hours: index }),
  };
});

export const USERS = [
  {
    id: 'id_1',
    name: 'Cristian Gomez',
    group: 'male',
  },
  {
    id: 'id_2',
    name: 'Jhonatan Mindiola',
    group: 'male',
  },
  {
    id: 'id_3',
    name: 'Juan Quilagui',
    group: 'male',
  },
  {
    id: 'id_4',
    name: 'Juan David Rodriguez',
    group: 'male',
  },
  {
    id: 'id_5',
    name: 'Jorge Carrasco',
    group: 'male',
  },
  {
    id: 'id_6',
    name: 'Camilo Arango',
    group: 'male',
  },
  {
    id: 'id_7',
    name: 'Felipe Morales',
    group: 'male',
  },
  {
    id: 'id_8',
    name: 'Nicolas Gomez',
    group: 'male',
  },
  {
    id: 'id_9',
    name: 'Carlos Castellanos',
    group: 'male',
  },
  {
    id: 'id_10',
    name: 'Juan Alarcon',
    group: 'male',
  },
  {
    id: 'id_11',
    name: 'Diego Rincon',
    group: 'male',
  },
  {
    id: 'id_12',
    name: 'Alejandro Arcila',
    group: 'male',
  },
  {
    id: 'id_13',
    name: 'Adrian Villalba',
    group: 'male',
  },
  {
    id: 'id_14',
    name: 'Leonardo',
    group: 'male',
  },
  {
    id: 'id_15',
    name: 'Abdulh',
    group: 'male',
  },
  {
    id: 'id_16',
    name: 'Majo',
    group: 'female',
  },
  {
    id: 'id_17',
    name: 'Yorely',
    group: 'female',
  },
  {
    id: 'id_18',
    name: 'Cami Ch',
    group: 'female',
  },
  {
    id: 'id_19',
    name: 'Luu',
    group: 'female',
  },
  {
    id: 'id_20',
    name: 'Valentina G',
    group: 'female',
  },
  {
    id: 'id_21',
    name: 'Vale S',
    group: 'female',
  },
  {
    id: 'id_22',
    name: 'Isafit',
    group: 'female',
  },
  {
    id: 'id_23',
    name: 'Cami T',
    group: 'female',
  },
  {
    id: 'id_24',
    name: 'Moni',
    group: 'female',
  },
  {
    id: 'id_25',
    name: 'Karen',
    group: 'female',
  },
  {
    id: 'id_26',
    name: 'Sofía',
    group: 'female',
  },
  {
    id: 'id_27',
    name: 'Vale Murillo',
    group: 'female',
  },
  {
    id: 'id_28',
    name: 'Tatiana',
    group: 'female',
  },
  {
    id: 'id_29',
    name: 'Sierra',
    group: 'female',
  },
  {
    id: 'id_30',
    name: 'Cristina',
    group: 'female',
  },
  {
    id: 'id_31',
    name: 'Laura',
    group: 'female',
  },
  {
    id: 'id_32',
    name: 'Estefania',
    group: 'female',
  },
  {
    id: 'id_33',
    name: 'Ali',
    group: 'female',
  },
  {
    id: 'id_34',
    name: 'Guerra',
    group: 'female',
  },
  {
    id: 'id_35',
    name: 'Cami A',
    group: 'female',
  },
  {
    id: 'id_36',
    name: 'Juli',
    group: 'female',
  },
];
